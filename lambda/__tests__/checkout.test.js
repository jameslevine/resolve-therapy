const mockSend = jest.fn();
const mockSessionsCreate = jest.fn();
const mockSessionsRetrieve = jest.fn();

jest.mock("../dist/lib/dynamo", () => ({
  ddb: { send: mockSend },
  TABLE: "test-table",
  PutCommand: jest.fn((params) => ({ type: "Put", ...params })),
  GetCommand: jest.fn((params) => ({ type: "Get", ...params })),
  UpdateCommand: jest.fn((params) => ({ type: "Update", ...params })),
}));

jest.mock("stripe", () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
        retrieve: mockSessionsRetrieve,
      },
    },
    webhooks: {
      constructEvent: jest.fn((body, sig, secret) => JSON.parse(body)),
    },
  }));
});

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

const { handler } = require("../dist/checkout");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkout handler", () => {
  describe("OPTIONS", () => {
    it("returns CORS preflight response", async () => {
      const result = await handler({ httpMethod: "OPTIONS" });
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });
  });

  describe("POST /checkout/credits", () => {
    it("creates a Stripe checkout session for valid package", async () => {
      mockSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/test" });
      mockSend.mockResolvedValue({});

      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/credits",
        body: JSON.stringify({ packageId: "1", userId: "user-123" }),
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.url).toBe("https://checkout.stripe.com/test");
      expect(body.orderId).toBeDefined();
      expect(mockSend).toHaveBeenCalled();
      expect(mockSessionsCreate).toHaveBeenCalled();
    });

    it("returns 400 for missing packageId", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/credits",
        body: JSON.stringify({ userId: "user-123" }),
      });
      expect(result.statusCode).toBe(400);
    });

    it("returns 400 for missing userId", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/credits",
        body: JSON.stringify({ packageId: "1" }),
      });
      expect(result.statusCode).toBe(400);
    });

    it("returns 400 for invalid package", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/credits",
        body: JSON.stringify({ packageId: "99", userId: "user-123" }),
      });
      expect(result.statusCode).toBe(400);
    });
  });

  describe("GET /checkout/balance", () => {
    it("returns user credit balance", async () => {
      mockSend.mockResolvedValue({ Item: { balance: 120 } });

      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/balance",
        queryStringParameters: { userId: "user-123" },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ balance: 120 });
    });

    it("returns 0 balance for new user", async () => {
      mockSend.mockResolvedValue({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/balance",
        queryStringParameters: { userId: "new-user" },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ balance: 0 });
    });

    it("returns 400 without userId", async () => {
      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/balance",
        queryStringParameters: {},
      });
      expect(result.statusCode).toBe(400);
    });
  });

  describe("GET /checkout/verify", () => {
    it("verifies paid session and fulfills credits", async () => {
      mockSessionsRetrieve.mockResolvedValue({
        payment_status: "paid",
        metadata: { orderId: "order-1", userId: "user-123", credits: "60" },
      });
      mockSend
        .mockResolvedValueOnce({ Item: { status: "pending" } }) // get order
        .mockResolvedValueOnce({}) // update order
        .mockResolvedValueOnce({}) // add credits
        .mockResolvedValueOnce({ Item: { balance: 60 } }); // get balance

      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/verify",
        queryStringParameters: { session_id: "cs_test_123" },
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.fulfilled).toBe(true);
      expect(body.balance).toBe(60);
    });

    it("returns 400 without session_id", async () => {
      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/verify",
        queryStringParameters: {},
      });
      expect(result.statusCode).toBe(400);
    });
  });

  describe("POST /checkout/webhook", () => {
    it("processes checkout.session.completed event", async () => {
      mockSend.mockResolvedValue({});

      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/webhook",
        headers: { "Stripe-Signature": "t=123,v1=abc" },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              payment_status: "paid",
              metadata: { orderId: "order-1", userId: "user-123", credits: "60" },
            },
          },
        }),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ received: true });
    });

    it("returns 400 when Stripe-Signature header is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/checkout/webhook",
        headers: {},
        body: JSON.stringify({ type: "checkout.session.completed" }),
      });
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain("Missing signature");
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for unknown path", async () => {
      const result = await handler({
        httpMethod: "GET",
        path: "/checkout/unknown",
        queryStringParameters: {},
      });
      expect(result.statusCode).toBe(404);
    });
  });
});
