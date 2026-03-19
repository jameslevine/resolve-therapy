const Stripe = require("stripe");
const { ddb, TABLE, PutCommand, GetCommand, UpdateCommand } = require("./lib/dynamo");
const { ok, error, options } = require("./lib/response");
const { loggerFromEvent } = require("./lib/logger");
const crypto = require("crypto");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CREDIT_PACKAGES = {
  "1": { credits: 60, priceGBP: 2900, name: "1 Hour (60 minutes)" },
  "3": { credits: 180, priceGBP: 6900, name: "3 Hours (180 minutes)" },
  "10": { credits: 600, priceGBP: 17900, name: "10 Hours (600 minutes)" },
};

exports.handler = async (event) => {
  const log = loggerFromEvent(event, "checkout");
  if (event.httpMethod === "OPTIONS") return options();
  const path = event.path || "";
  const method = event.httpMethod;

  try {
    // POST /checkout/credits - Buy credit package
    if (path.endsWith("/credits") && method === "POST") {
      return await handleBuyCredits(event);
    }

    // POST /checkout/webhook - Stripe webhook
    if (path.endsWith("/webhook") && method === "POST") {
      return await handleWebhook(event);
    }

    // GET /checkout/verify - Verify Stripe session and fulfill credits
    if (path.endsWith("/verify") && method === "GET") {
      return await handleVerifySession(event);
    }

    // GET /checkout/balance - Get user credit balance
    if (path.endsWith("/balance") && method === "GET") {
      return await handleGetBalance(event);
    }

    return error(404, "Not found");
  } catch (err) {
    log.error("Checkout error", { error: err.message });
    return error(500, "Failed to process request");
  }
};

async function handleBuyCredits(event) {
  const { packageId, userId } = JSON.parse(event.body || "{}");
  if (!packageId || !userId) return error(400, "packageId and userId are required");

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) return error(400, "Invalid package");

  const orderId = crypto.randomUUID();

  // Store pending order
  await ddb.send(new PutCommand({
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
  }));

  // Create Stripe checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "gbp",
        product_data: {
          name: pkg.name,
          description: `${pkg.credits} AI therapy session credit${pkg.credits > 1 ? "s" : ""}`,
        },
        unit_amount: pkg.priceGBP,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/credits`,
    metadata: { orderId, userId, packageId, credits: String(pkg.credits) },
  });

  return ok({ url: checkoutSession.url, orderId });
}

async function handleWebhook(event) {
  const sig = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];
  let stripeEvent;

  // If we have a webhook secret, verify the signature
  if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      log.error("Webhook signature verification failed", { error: err.message });
      return error(400, "Webhook signature verification failed");
    }
  } else {
    stripeEvent = JSON.parse(event.body);
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    if (session.payment_status === "paid" && session.metadata?.orderId) {
      await fulfillCredits(session.metadata);
    }
  }

  return ok({ received: true });
}

async function fulfillCredits(metadata) {
  const { orderId, userId, credits } = metadata;
  const creditCount = parseInt(credits);

  // Update order status
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `ORDER#${orderId}`, SK: "META" },
    UpdateExpression: "SET #status = :status, fulfilledAt = :now",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": "fulfilled", ":now": new Date().toISOString() },
  }));

  // Add credits to user (upsert)
  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: "CREDITS" },
      UpdateExpression: "SET balance = if_not_exists(balance, :zero) + :credits, updatedAt = :now",
      ExpressionAttributeValues: {
        ":credits": creditCount,
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    }));
  } catch (err) {
    log.error("Failed to add credits", { error: err.message });
    throw err;
  }
}

async function handleVerifySession(event) {
  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) return error(400, "session_id is required");

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid" && session.metadata?.orderId) {
    // Check if order already fulfilled
    const order = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `ORDER#${session.metadata.orderId}`, SK: "META" },
    }));
    if (order.Item && order.Item.status !== "fulfilled") {
      await fulfillCredits(session.metadata);
    }
  }

  // Return current balance
  const userId = session.metadata?.userId;
  if (userId) {
    const result = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${userId}`, SK: "CREDITS" },
    }));
    return ok({ balance: result.Item?.balance || 0, fulfilled: true });
  }

  return ok({ fulfilled: false });
}

async function handleGetBalance(event) {
  const userId = event.queryStringParameters?.userId;
  if (!userId) return error(400, "userId is required");

  const result = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: "CREDITS" },
  }));

  return ok({ balance: result.Item?.balance || 0 });
}
