import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import crypto from "crypto";
import { ddb, TABLE, PutCommand, GetCommand, UpdateCommand, QueryCommand } from "./lib/dynamo";
import { ok, error, options } from "./lib/response";
import { loggerFromEvent, Logger } from "./lib/logger";
import { getAuthUserId } from "./lib/auth";
import { Keys } from "./lib/keys";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CreditPackage {
  credits: number;
  priceUSD: number;
  name: string;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  "1": { credits: 60, priceUSD: 2900, name: "1 Hour (60 minutes)" },
  "3": { credits: 180, priceUSD: 6900, name: "3 Hours (180 minutes)" },
  "10": { credits: 600, priceUSD: 17900, name: "10 Hours (600 minutes)" },
};

let log: Logger;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  log = loggerFromEvent(event, "checkout");
  if (event.httpMethod === "OPTIONS") return options();
  const path = event.path || "";
  const method = event.httpMethod;

  try {
    // Webhook is unauthenticated (called by Stripe)
    if (path.endsWith("/webhook") && method === "POST") {
      return await handleWebhook(event);
    }

    // All other routes require authentication
    const authUserId = getAuthUserId(event);
    if (!authUserId) return error(401, "Unauthorized");

    if (path.endsWith("/credits") && method === "POST") {
      return await handleBuyCredits(event, authUserId);
    }
    if (path.endsWith("/verify") && method === "GET") {
      return await handleVerifySession(event);
    }
    if (path.endsWith("/balance") && method === "GET") {
      return await handleGetBalance(authUserId);
    }

    // Affiliate routes
    if (path.endsWith("/affiliate") && method === "GET") {
      return await handleGetAffiliate(authUserId);
    }
    if (path.endsWith("/affiliate") && method === "POST") {
      return await handleCreateAffiliate(authUserId);
    }
    if (path.endsWith("/affiliate/payout") && method === "POST") {
      return await handleRequestPayout(authUserId);
    }
    if (path.endsWith("/affiliate/apply") && method === "POST") {
      return await handleApplyReferral(event, authUserId);
    }

    return error(404, "Not found");
  } catch (err) {
    log.error("Checkout error", { error: (err as Error).message });
    return error(500, "Failed to process request");
  }
};

async function handleBuyCredits(
  event: APIGatewayProxyEvent,
  userId: string,
): Promise<APIGatewayProxyResult> {
  const { packageId } = JSON.parse(event.body || "{}");
  if (!packageId) return error(400, "packageId is required");

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) return error(400, "Invalid package");

  const orderId = crypto.randomUUID();

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: Keys.order(orderId),
        SK: Keys.META,
        id: orderId,
        userId,
        packageId,
        credits: pkg.credits,
        amount: pkg.priceUSD,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    }),
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: pkg.name,
            description: `${pkg.credits} AI therapy session credit${pkg.credits > 1 ? "s" : ""}`,
          },
          unit_amount: pkg.priceUSD,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/credits`,
    metadata: { orderId, userId, packageId, credits: String(pkg.credits) },
  });

  return ok({ url: checkoutSession.url, orderId });
}

async function handleWebhook(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("STRIPE_WEBHOOK_SECRET not configured");
    return error(500, "Webhook not configured");
  }

  const sig = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];
  if (!sig) {
    log.warn("Webhook request missing Stripe-Signature header");
    return error(400, "Missing signature");
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
  } catch (err) {
    log.error("Webhook signature verification failed", { error: (err as Error).message });
    return error(400, "Webhook signature verification failed");
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" && session.metadata?.orderId) {
      await fulfillCredits(session.metadata);
    }
  }

  return ok({ received: true });
}

async function fulfillCredits(metadata: Record<string, string>): Promise<void> {
  const { orderId, userId, credits, packageId } = metadata;
  const creditCount = parseInt(credits);

  // Idempotency: only fulfill if order is not already fulfilled
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: Keys.order(orderId), SK: Keys.META },
        UpdateExpression: "SET #status = :status, fulfilledAt = :now",
        ConditionExpression: "#status <> :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": "fulfilled", ":now": new Date().toISOString() },
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name === "ConditionalCheckFailedException") {
      log.info("Order already fulfilled, skipping", { orderId });
      return;
    }
    throw err;
  }

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
        UpdateExpression:
          "SET balance = if_not_exists(balance, :zero) + :credits, updatedAt = :now",
        ExpressionAttributeValues: {
          ":credits": creditCount,
          ":zero": 0,
          ":now": new Date().toISOString(),
        },
      }),
    );
  } catch (err) {
    log.error("Failed to add credits", { error: (err as Error).message });
    throw err;
  }

  // Credit affiliate commission if user was referred
  await creditAffiliateCommission(userId, packageId);
}

async function creditAffiliateCommission(userId: string, packageId: string): Promise<void> {
  try {
    const userCredits = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
      }),
    );

    const referredBy = userCredits.Item?.referredBy as string | undefined;
    if (!referredBy) return;

    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) return;

    const commission = Math.floor(pkg.priceUSD * COMMISSION_RATE);
    if (commission <= 0) return;

    // Get affiliate's referral code to update signup record
    const affiliate = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: Keys.user(referredBy), SK: Keys.AFFILIATE },
      }),
    );

    if (!affiliate.Item) return;

    const referralCode = affiliate.Item.referralCode as string;

    // Update affiliate totals
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: Keys.user(referredBy), SK: Keys.AFFILIATE },
        UpdateExpression:
          "SET totalEarnings = if_not_exists(totalEarnings, :zero) + :commission, pendingPayout = if_not_exists(pendingPayout, :zero) + :commission",
        ExpressionAttributeValues: { ":commission": commission, ":zero": 0 },
      }),
    );

    // Update signup record earnings
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: Keys.referral(referralCode), SK: Keys.signup(userId) },
        UpdateExpression: "SET earnings = if_not_exists(earnings, :zero) + :commission",
        ExpressionAttributeValues: { ":commission": commission, ":zero": 0 },
      }),
    );

    log.info("Affiliate commission credited", { affiliateUserId: referredBy, commission });
  } catch (err) {
    log.error("Failed to credit affiliate commission", { error: (err as Error).message });
    // Don't throw — affiliate commission failure shouldn't block credit fulfillment
  }
}

async function handleVerifySession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) return error(400, "session_id is required");

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid" && session.metadata?.orderId) {
    const order = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: Keys.order(session.metadata.orderId), SK: Keys.META },
      }),
    );
    if (order.Item && order.Item.status !== "fulfilled") {
      await fulfillCredits(session.metadata as Record<string, string>);
    }
  }

  const userId = session.metadata?.userId;
  if (userId) {
    const result = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
      }),
    );
    return ok({ balance: result.Item?.balance || 0, fulfilled: true });
  }

  return ok({ fulfilled: false });
}

async function handleGetBalance(userId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
    }),
  );

  return ok({ balance: result.Item?.balance || 0 });
}

const COMMISSION_RATE = 0.2; // 20%
const MIN_PAYOUT_CENTS = 1000; // $10

function generateReferralCode(): string {
  return crypto.randomBytes(6).toString("hex");
}

async function handleGetAffiliate(userId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.AFFILIATE },
    }),
  );

  if (!result.Item) {
    return ok({ enrolled: false });
  }

  // Fetch signup records (no PII — just dates and earnings)
  const signups = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": Keys.referral(result.Item.referralCode as string),
        ":sk": "SIGNUP#",
      },
      ScanIndexForward: false,
    }),
  );

  const referrals = (signups.Items || []).map((item) => ({
    joinedAt: item.createdAt,
    earnings: item.earnings || 0,
  }));

  return ok({
    enrolled: true,
    referralCode: result.Item.referralCode,
    totalEarnings: result.Item.totalEarnings || 0,
    pendingPayout: result.Item.pendingPayout || 0,
    totalReferrals: result.Item.totalReferrals || 0,
    referrals,
  });
}

async function handleCreateAffiliate(userId: string): Promise<APIGatewayProxyResult> {
  // Check if already enrolled
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.AFFILIATE },
    }),
  );

  if (existing.Item) {
    return ok({ referralCode: existing.Item.referralCode });
  }

  const referralCode = generateReferralCode();
  const now = new Date().toISOString();

  // Create affiliate profile
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: Keys.user(userId),
        SK: Keys.AFFILIATE,
        referralCode,
        totalEarnings: 0,
        pendingPayout: 0,
        totalReferrals: 0,
        createdAt: now,
      },
    }),
  );

  // Create referral code lookup
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: Keys.referral(referralCode),
        SK: Keys.META,
        userId,
        createdAt: now,
      },
    }),
  );

  return ok({ referralCode });
}

async function handleApplyReferral(
  event: APIGatewayProxyEvent,
  userId: string,
): Promise<APIGatewayProxyResult> {
  const { referralCode } = JSON.parse(event.body || "{}");
  if (!referralCode) return error(400, "referralCode is required");

  // Look up referral code
  const ref = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.referral(referralCode), SK: Keys.META },
    }),
  );

  if (!ref.Item) return error(404, "Invalid referral code");

  const affiliateUserId = ref.Item.userId as string;
  if (affiliateUserId === userId) return error(400, "Cannot refer yourself");

  // Check if user already has a referrer
  const credits = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
    }),
  );

  if (credits.Item?.referredBy) {
    return ok({ applied: false, reason: "already_referred" });
  }

  // Mark user as referred
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
      UpdateExpression:
        "SET referredBy = :ref, balance = if_not_exists(balance, :zero), updatedAt = :now",
      ExpressionAttributeValues: {
        ":ref": affiliateUserId,
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    }),
  );

  // Record the signup under the referral code
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: Keys.referral(referralCode),
        SK: Keys.signup(userId),
        earnings: 0,
        createdAt: new Date().toISOString(),
      },
    }),
  );

  // Increment referral count
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(affiliateUserId), SK: Keys.AFFILIATE },
      UpdateExpression: "SET totalReferrals = if_not_exists(totalReferrals, :zero) + :one",
      ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
    }),
  );

  return ok({ applied: true });
}

async function handleRequestPayout(userId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.AFFILIATE },
    }),
  );

  if (!result.Item) return error(404, "Not enrolled in affiliate programme");

  const pending = (result.Item.pendingPayout as number) || 0;
  if (pending < MIN_PAYOUT_CENTS) {
    return error(400, `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`);
  }

  // Reset pending payout and log payout request
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.AFFILIATE },
      UpdateExpression: "SET pendingPayout = :zero, lastPayoutRequestedAt = :now",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    }),
  );

  log.info("Payout requested", { userId, amount: pending });
  return ok({ requested: true, amount: pending });
}
