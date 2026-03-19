import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import crypto from "crypto";
import { ddb, TABLE, PutCommand, GetCommand, UpdateCommand } from "./lib/dynamo";
import { ok, error, options } from "./lib/response";
import { loggerFromEvent, Logger } from "./lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CreditPackage {
  credits: number;
  priceGBP: number;
  name: string;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  "1": { credits: 60, priceGBP: 2900, name: "1 Hour (60 minutes)" },
  "3": { credits: 180, priceGBP: 6900, name: "3 Hours (180 minutes)" },
  "10": { credits: 600, priceGBP: 17900, name: "10 Hours (600 minutes)" },
};

let log: Logger;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  log = loggerFromEvent(event, "checkout");
  if (event.httpMethod === "OPTIONS") return options();
  const path = event.path || "";
  const method = event.httpMethod;

  try {
    if (path.endsWith("/credits") && method === "POST") {
      return await handleBuyCredits(event);
    }
    if (path.endsWith("/webhook") && method === "POST") {
      return await handleWebhook(event);
    }
    if (path.endsWith("/verify") && method === "GET") {
      return await handleVerifySession(event);
    }
    if (path.endsWith("/balance") && method === "GET") {
      return await handleGetBalance(event);
    }
    return error(404, "Not found");
  } catch (err) {
    log.error("Checkout error", { error: (err as Error).message });
    return error(500, "Failed to process request");
  }
};

async function handleBuyCredits(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { packageId, userId } = JSON.parse(event.body || "{}");
  if (!packageId || !userId) return error(400, "packageId and userId are required");

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) return error(400, "Invalid package");

  const orderId = crypto.randomUUID();

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `ORDER#${orderId}`,
        SK: "META",
        id: orderId,
        userId,
        packageId,
        credits: pkg.credits,
        amount: pkg.priceGBP,
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
          currency: "gbp",
          product_data: {
            name: pkg.name,
            description: `${pkg.credits} AI therapy session credit${pkg.credits > 1 ? "s" : ""}`,
          },
          unit_amount: pkg.priceGBP,
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
  const sig = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];
  let stripeEvent: Stripe.Event;

  if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body!,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      log.error("Webhook signature verification failed", { error: (err as Error).message });
      return error(400, "Webhook signature verification failed");
    }
  } else {
    stripeEvent = JSON.parse(event.body!) as Stripe.Event;
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
  const { orderId, userId, credits } = metadata;
  const creditCount = parseInt(credits);

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `ORDER#${orderId}`, SK: "META" },
      UpdateExpression: "SET #status = :status, fulfilledAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "fulfilled", ":now": new Date().toISOString() },
    }),
  );

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: "CREDITS" },
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
}

async function handleVerifySession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) return error(400, "session_id is required");

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid" && session.metadata?.orderId) {
    const order = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: `ORDER#${session.metadata.orderId}`, SK: "META" },
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
        Key: { PK: `USER#${userId}`, SK: "CREDITS" },
      }),
    );
    return ok({ balance: result.Item?.balance || 0, fulfilled: true });
  }

  return ok({ fulfilled: false });
}

async function handleGetBalance(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.queryStringParameters?.userId;
  if (!userId) return error(400, "userId is required");

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: "CREDITS" },
    }),
  );

  return ok({ balance: result.Item?.balance || 0 });
}
