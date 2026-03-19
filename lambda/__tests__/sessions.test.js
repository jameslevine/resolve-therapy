const mockSend = jest.fn();
const mockGetTherapistResponse = jest.fn();

jest.mock("../dist/lib/dynamo", () => ({
  ddb: { send: mockSend },
  TABLE: "test-table",
  PutCommand: jest.fn((params) => ({ type: "Put", ...params })),
  GetCommand: jest.fn((params) => ({ type: "Get", ...params })),
  QueryCommand: jest.fn((params) => ({ type: "Query", ...params })),
  UpdateCommand: jest.fn((params) => ({ type: "Update", ...params })),
}));

jest.mock("../dist/lib/bedrock", () => ({
  getTherapistResponse: mockGetTherapistResponse,
}));

const { handler } = require("../dist/sessions");

beforeEach(() => {
  mockSend.mockReset();
  mockGetTherapistResponse.mockReset();
});

describe("sessions handler", () => {
  describe("OPTIONS", () => {
    it("returns CORS preflight response", async () => {
      const result = await handler({ httpMethod: "OPTIONS" });
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });
  });

  describe("POST /sessions/start", () => {
    it("creates a session when user has credits", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { balance: 60 } }) // credit check
        .mockResolvedValueOnce({}); // put session

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({
          therapistId: "dr-sarah-chen",
          userId: "user-123",
          prompt: "Communication issues",
          participants: { names: ["Alice", "Bob"], relationship: "Partners", context: "" },
        }),
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.sessionId).toBeDefined();
      expect(body.balance).toBe(60);
    });

    it("returns 403 when user has no credits", async () => {
      mockSend.mockResolvedValueOnce({ Item: { balance: 0 } });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({ therapistId: "dr-sarah-chen", userId: "user-123" }),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns 403 when user has no credit record", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({ therapistId: "dr-sarah-chen", userId: "user-123" }),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns 400 when therapistId is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({ userId: "user-123" }),
      });

      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when userId is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
      });

      expect(result.statusCode).toBe(400);
    });
  });

  describe("POST /sessions/respond", () => {
    it("returns AI therapist response and stores memories", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } }) // get session
        .mockResolvedValueOnce({ Items: [] }) // session memories
        .mockResolvedValueOnce({ Items: [] }) // user memories
        .mockResolvedValue({}); // put memories

      mockGetTherapistResponse.mockResolvedValue({
        text: "Thank you for sharing that.",
        memories: [{ category: "CONFLICT_PATTERN", value: "Avoidance when discussing finances" }],
      });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/respond",
        body: JSON.stringify({
          sessionId: "session-1",
          therapistId: "dr-sarah-chen",
          prompt: "Communication",
          transcript: [{ content: "We argue about money", isTherapist: false }],
        }),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).text).toBe("Thank you for sharing that.");
      expect(mockGetTherapistResponse).toHaveBeenCalledTimes(1);
      // 2 puts for memory (session + user level)
      expect(mockSend).toHaveBeenCalledTimes(5);
    });

    it("returns 400 for unknown therapist", async () => {
      mockSend.mockResolvedValueOnce({ Item: { userId: "user-123" } });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/respond",
        body: JSON.stringify({
          sessionId: "session-1",
          therapistId: "dr-unknown",
          transcript: [],
        }),
      });

      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when sessionId is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/respond",
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
      });

      expect(result.statusCode).toBe(400);
    });

    it("works when no memories are returned", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } })
        .mockResolvedValueOnce({ Items: [] })
        .mockResolvedValueOnce({ Items: [] });

      mockGetTherapistResponse.mockResolvedValue({
        text: "Tell me more.",
        memories: [],
      });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/respond",
        body: JSON.stringify({
          sessionId: "session-1",
          therapistId: "dr-sarah-chen",
          transcript: [{ content: "Hello", isTherapist: false }],
        }),
      });

      expect(result.statusCode).toBe(200);
      // Only 3 sends: get session + 2 queries for memories (no puts)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe("GET /sessions/{id}", () => {
    it("returns session metadata", async () => {
      mockSend.mockResolvedValueOnce({
        Item: { id: "session-1", therapistId: "dr-sarah-chen", status: "active" },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1",
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).id).toBe("session-1");
    });

    it("returns 404 for non-existent session", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/non-existent",
      });

      expect(result.statusCode).toBe(404);
    });
  });

  describe("GET /sessions/{id}/transcript", () => {
    it("returns transcript entries", async () => {
      mockSend.mockResolvedValueOnce({
        Item: { entries: [{ content: "Hello", isTherapist: false }] },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).entries).toHaveLength(1);
    });

    it("returns empty entries when no transcript exists", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).entries).toEqual([]);
    });
  });

  describe("GET /sessions?userId=xxx", () => {
    it("returns user sessions", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [
          { id: "session-1", status: "completed" },
          { id: "session-2", status: "active" },
        ],
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions",
        queryStringParameters: { userId: "user-123" },
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).sessions).toHaveLength(2);
    });

    it("returns empty array when no userId provided", async () => {
      const result = await handler({
        httpMethod: "GET",
        path: "/sessions",
        queryStringParameters: {},
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).sessions).toEqual([]);
    });
  });

  describe("POST /sessions/{id}/end", () => {
    it("ends session, saves transcript, and deducts minutes", async () => {
      const createdAt = new Date(Date.now() - 15 * 60000).toISOString(); // 15 mins ago
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123", createdAt, therapistId: "dr-sarah-chen" } }) // get session
        .mockResolvedValueOnce({}) // update credits
        .mockResolvedValueOnce({}) // put transcript
        .mockResolvedValueOnce({}) // update session (summary generation will fail since bedrock isn't mocked at module level)
        .mockResolvedValue({}); // fallback update

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/session-1/end",
        body: JSON.stringify({
          transcript: [
            { content: "Hello", isTherapist: false },
            { content: "Welcome", isTherapist: true },
          ],
        }),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).success).toBe(true);
    });

    it("returns 404 for non-existent session", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/non-existent/end",
        body: JSON.stringify({ transcript: [] }),
      });

      expect(result.statusCode).toBe(404);
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for POST to unknown path", async () => {
      const result = await handler({
        httpMethod: "DELETE",
        path: "/sessions/unknown-action",
      });

      expect(result.statusCode).toBe(404);
    });
  });
});
