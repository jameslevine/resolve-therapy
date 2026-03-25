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

const authContext = (userId = "user-123") => ({
  requestContext: { authorizer: { claims: { sub: userId } } },
});

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

  describe("authentication", () => {
    it("returns 401 when no auth context is provided", async () => {
      const result = await handler({
        httpMethod: "GET",
        path: "/sessions",
      });
      expect(result.statusCode).toBe(401);
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
          prompt: "Communication issues",
          participants: {
            names: ["Alice", "Bob"],
            relationship: "Partners",
            context: "",
          },
        }),
        ...authContext(),
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
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
        ...authContext(),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns 403 when user has no credit record", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
        ...authContext(),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns 400 when therapistId is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/start",
        body: JSON.stringify({}),
        ...authContext(),
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
        memories: [
          {
            category: "CONFLICT_PATTERN",
            value: "Avoidance when discussing finances",
          },
        ],
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
        ...authContext(),
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
        ...authContext(),
      });

      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when sessionId is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/sessions/respond",
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
        ...authContext(),
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
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      // Only 3 sends: get session + 2 queries for memories (no puts)
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe("GET /sessions/{id}", () => {
    it("returns session metadata", async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          id: "session-1",
          therapistId: "dr-sarah-chen",
          status: "active",
          userId: "user-123",
        },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1",
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).id).toBe("session-1");
    });

    it("returns 404 for non-existent session", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/non-existent",
        ...authContext(),
      });

      expect(result.statusCode).toBe(404);
    });

    it("returns 403 when session belongs to another user", async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          id: "session-1",
          therapistId: "dr-sarah-chen",
          status: "active",
          userId: "other-user",
        },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1",
        ...authContext(),
      });

      expect(result.statusCode).toBe(403);
    });
  });

  describe("GET /sessions/{id}/transcript", () => {
    it("returns transcript entries", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } }) // session META ownership check
        .mockResolvedValueOnce({
          Item: { entries: [{ content: "Hello", isTherapist: false }] },
        }); // transcript

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).entries).toHaveLength(1);
    });

    it("returns empty entries when no transcript exists", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } }) // session META
        .mockResolvedValueOnce({ Item: null }); // transcript

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).entries).toEqual([]);
    });

    it("returns 403 when transcript belongs to another user", async () => {
      mockSend.mockResolvedValueOnce({
        Item: { userId: "other-user" },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
        ...authContext(),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns 404 when session does not exist for transcript", async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/transcript",
        ...authContext(),
      });

      expect(result.statusCode).toBe(404);
    });
  });

  describe("GET /sessions/{id}/insights", () => {
    it("returns insights for owned session", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } }) // session META
        .mockResolvedValueOnce({
          Item: {
            PK: "SESSION#session-1",
            SK: "INSIGHTS",
            communicationScore: 7,
            patterns: ["avoidance"],
          },
        });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/insights",
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.insights.communicationScore).toBe(7);
      // PK and SK should be stripped from response
      expect(body.insights.PK).toBeUndefined();
      expect(body.insights.SK).toBeUndefined();
    });

    it("returns 403 when insights belong to another user", async () => {
      mockSend.mockResolvedValueOnce({
        Item: { userId: "other-user" },
      });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/insights",
        ...authContext(),
      });

      expect(result.statusCode).toBe(403);
    });

    it("returns null insights when none exist", async () => {
      mockSend
        .mockResolvedValueOnce({ Item: { userId: "user-123" } })
        .mockResolvedValueOnce({ Item: null });

      const result = await handler({
        httpMethod: "GET",
        path: "/sessions/session-1/insights",
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).insights).toBeNull();
    });
  });

  describe("GET /sessions (list)", () => {
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
        ...authContext(),
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).sessions).toHaveLength(2);
    });
  });

  describe("POST /sessions/{id}/end", () => {
    it("ends session, saves transcript, and deducts minutes", async () => {
      const createdAt = new Date(Date.now() - 15 * 60000).toISOString(); // 15 mins ago
      mockSend
        .mockResolvedValueOnce({
          Item: {
            userId: "user-123",
            createdAt,
            therapistId: "dr-sarah-chen",
          },
        }) // get session
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
        ...authContext(),
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
        ...authContext(),
      });

      expect(result.statusCode).toBe(404);
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for POST to unknown path", async () => {
      const result = await handler({
        httpMethod: "DELETE",
        path: "/sessions/unknown-action",
        ...authContext(),
      });

      expect(result.statusCode).toBe(404);
    });
  });
});
