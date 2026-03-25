import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { randomUUID } from "crypto";

import { ddb, TABLE, PutCommand, GetCommand, QueryCommand, UpdateCommand } from "./lib/dynamo";
import { getTherapistResponse, bedrock, MODEL_ID } from "./lib/bedrock";
import { ok, error, options } from "./lib/response";
import { loggerFromEvent, Logger } from "./lib/logger";
import { getAuthUserId } from "./lib/auth";
import { THERAPISTS } from "./lib/therapists";
import { Keys } from "./lib/keys";

interface TranscriptEntry {
  isTherapist: boolean;
  content: string;
}

interface SessionMemory {
  category: string;
  value: string;
}

interface Participants {
  names?: string[];
  [key: string]: unknown;
}

interface SessionItem {
  PK: string;
  SK: string;
  id: string;
  userId: string;
  therapistId: string;
  prompt: string;
  participants: Participants | null;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

interface StartSessionBody {
  therapistId?: string;
  prompt?: string;
  userId?: string;
  participants?: Participants;
}

interface RespondBody {
  sessionId?: string;
  therapistId?: string;
  prompt?: string;
  participants?: Participants | null;
  transcript?: TranscriptEntry[];
}

interface EndSessionBody {
  transcript?: TranscriptEntry[];
}

interface SessionInsight {
  patterns: string[];
  strengths: string[];
  actionItems: string[];
  emotionalThemes: string[];
  communicationScore: number;
}

let log: Logger;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") return options();

  log = loggerFromEvent(event, "sessions");
  const path = event.path || "";
  const method = event.httpMethod;

  const authUserId = getAuthUserId(event);
  if (!authUserId) return error(401, "Unauthorized");

  try {
    // POST /sessions/respond
    if (path.endsWith("/respond") && method === "POST") {
      return await handleRespond(event);
    }

    // POST /sessions/start - Create session using credit
    if (path.endsWith("/start") && method === "POST") {
      return await handleStartSession(event);
    }

    // POST /sessions/{id}/end
    if (path.includes("/end") && method === "POST") {
      return await handleEndSession(event);
    }

    // POST /sessions/{id}/verify-payment (legacy, kept for compatibility)
    if (path.includes("/verify-payment") && method === "POST") {
      return ok({ verified: true });
    }

    // GET /sessions/{id}/transcript
    if (path.includes("/transcript") && method === "GET") {
      const parts = path.split("/");
      const sessionIdx = parts.indexOf("sessions");
      const sessionId = parts[sessionIdx + 1];
      return await handleGetTranscript(sessionId, authUserId);
    }

    // GET /sessions/{id}/insights
    if (path.includes("/insights") && method === "GET") {
      const parts = path.split("/");
      const sessionIdx = parts.indexOf("sessions");
      const sessionId = parts[sessionIdx + 1];
      return await handleGetInsights(sessionId, authUserId);
    }

    // GET /sessions/progress?userId=xxx
    if (path.endsWith("/progress") && method === "GET") {
      return await handleGetProgress(event);
    }

    // GET /sessions/{id}
    const idMatch = path.match(/\/sessions\/([^/]+)$/);
    if (idMatch && method === "GET") {
      return await handleGetSession(idMatch[1], authUserId);
    }

    // GET /sessions?userId=xxx
    if (method === "GET") {
      return await handleListSessions(event);
    }

    return error(404, "Not found");
  } catch (err) {
    log.error("Session handler error", { error: (err as Error).message });
    return error(500, "Internal server error");
  }
};

function extractSessionId(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 2];
}

async function handleStartSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getAuthUserId(event)!;
  const { therapistId, prompt, participants } = JSON.parse(event.body || "{}") as StartSessionBody;
  if (!therapistId) return error(400, "therapistId is required");

  // Check credit balance (balance is in minutes)
  const creditResult = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.user(userId), SK: Keys.CREDITS },
    }),
  );
  const balance: number = creditResult.Item?.balance || 0;
  if (balance < 1) return error(403, "Insufficient minutes");

  const sessionId = randomUUID();

  // Create session record
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: Keys.session(sessionId),
        SK: Keys.META,
        GSI1PK: Keys.gsi1UserSessions(userId),
        GSI1SK: Keys.gsi1SessionTimestamp(new Date().toISOString()),
        id: sessionId,
        userId,
        therapistId,
        prompt: prompt || "",
        participants: participants || null,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    }),
  );

  return ok({ sessionId, balance });
}

async function handleGetInsights(id: string, authUserId: string): Promise<APIGatewayProxyResult> {
  const session = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { PK: Keys.session(id), SK: Keys.META } }),
  );
  if (!session.Item) return error(404, "Session not found");
  if (session.Item.userId !== authUserId) return error(403, "Forbidden");

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(id), SK: Keys.INSIGHTS },
    }),
  );
  if (!result.Item) return ok({ insights: null });
  const insights = Object.fromEntries(
    Object.entries(result.Item).filter(([k]) => k !== "PK" && k !== "SK"),
  );
  return ok({ insights });
}

async function handleGetTranscript(id: string, authUserId: string): Promise<APIGatewayProxyResult> {
  const session = await ddb.send(
    new GetCommand({ TableName: TABLE, Key: { PK: Keys.session(id), SK: Keys.META } }),
  );
  if (!session.Item) return error(404, "Session not found");
  if (session.Item.userId !== authUserId) return error(403, "Forbidden");

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(id), SK: Keys.TRANSCRIPT },
    }),
  );
  if (!result.Item) return ok({ entries: [] });
  return ok({ entries: result.Item.entries || [] });
}

async function handleGetSession(id: string, authUserId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(id), SK: Keys.META },
    }),
  );
  if (!result.Item) return error(404, "Session not found");
  if (result.Item.userId !== authUserId) return error(403, "Forbidden");
  return ok(result.Item);
}

async function handleListSessions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getAuthUserId(event)!;

  if (userId) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": Keys.gsi1UserSessions(userId),
          ":sk": "SESSION#",
        },
        ScanIndexForward: false,
        Limit: 50,
      }),
    );
    return ok({ sessions: result.Items || [] });
  }

  return ok({ sessions: [] });
}

async function handleGetProgress(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getAuthUserId(event)!;

  // Get all completed sessions
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND begins_with(GSI1SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": Keys.gsi1UserSessions(userId),
        ":sk": "SESSION#",
      },
      ScanIndexForward: true,
    }),
  );

  const sessions = (result.Items || []).filter((s) => s.status === "completed");

  // Fetch insights for each completed session (up to last 20)
  const recentSessions = sessions.slice(-20);
  const insightsPromises = recentSessions.map((s) =>
    ddb
      .send(
        new GetCommand({
          TableName: TABLE,
          Key: { PK: Keys.session(s.id as string), SK: Keys.INSIGHTS },
        }),
      )
      .then((r) => ({ sessionId: s.id as string, insights: r.Item || null }))
      .catch(() => ({ sessionId: s.id as string, insights: null })),
  );

  const insightsResults = await Promise.all(insightsPromises);

  // Build progress data
  const sessionHistory = recentSessions.map((s) => {
    const insightData = insightsResults.find((i) => i.sessionId === s.id);
    return {
      id: s.id,
      date: s.createdAt,
      therapistId: s.therapistId,
      minutesUsed: s.minutesUsed || 0,
      communicationScore: insightData?.insights?.communicationScore || null,
    };
  });

  // Aggregate stats
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + ((s.minutesUsed as number) || 0), 0);
  const scores = sessionHistory
    .map((s) => s.communicationScore)
    .filter((s): s is number => s !== null);
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

  // Therapist frequency
  const therapistCounts: Record<string, number> = {};
  for (const s of sessions) {
    const tid = s.therapistId as string;
    therapistCounts[tid] = (therapistCounts[tid] || 0) + 1;
  }
  const favoriteTherapist =
    Object.entries(therapistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return ok({
    totalSessions,
    totalMinutes,
    averageScore: avgScore,
    favoriteTherapist,
    sessionHistory,
  });
}

async function handleRespond(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { sessionId, therapistId, prompt, participants, transcript } = JSON.parse(
    event.body || "{}",
  ) as RespondBody;
  if (!sessionId || !therapistId) return error(400, "sessionId and therapistId required");

  const therapist = THERAPISTS[therapistId];
  if (!therapist) return error(400, "Unknown therapist");

  // Get session to find userId for cross-session memory
  const sessionResult = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(sessionId), SK: Keys.META },
    }),
  );
  const userId: string | undefined = sessionResult.Item?.userId;

  // Fetch session-level memories
  const sessionMemResult = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": Keys.session(sessionId),
        ":sk": "MEMORY#",
      },
    }),
  );
  const sessionMemories: SessionMemory[] = (sessionMemResult.Items || []).map((m) => ({
    category: m.category as string,
    value: m.value as string,
  }));

  // Fetch user-level cross-session memories
  let userMemories: SessionMemory[] = [];
  if (userId) {
    const userMemResult = await ddb.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": Keys.user(userId),
          ":sk": "MEMORY#",
        },
        Limit: 50,
      }),
    );
    userMemories = (userMemResult.Items || []).map((m) => ({
      category: m.category as string,
      value: m.value as string,
    }));
  }

  const allMemories: SessionMemory[] = [...userMemories, ...sessionMemories];

  const result = await getTherapistResponse(
    therapist.personalityPrompt,
    prompt || "",
    allMemories,
    transcript || [],
    participants || undefined,
  );

  // Store new memories at both session and user level
  if (result.memories && result.memories.length > 0) {
    for (const mem of result.memories) {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Session-level memory
      await ddb.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            PK: Keys.session(sessionId),
            SK: Keys.memory(key),
            category: mem.category,
            value: mem.value,
            createdAt: new Date().toISOString(),
          },
        }),
      );
      // User-level cross-session memory
      if (userId) {
        await ddb.send(
          new PutCommand({
            TableName: TABLE,
            Item: {
              PK: Keys.user(userId),
              SK: Keys.memory(key),
              sessionId,
              therapistId,
              category: mem.category,
              value: mem.value,
              createdAt: new Date().toISOString(),
            },
          }),
        );
      }
    }
  }

  return ok({ text: result.text });
}

async function handleEndSession(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const log = loggerFromEvent(event, "sessions");
  const path = event.path || "";
  const id = extractSessionId(path);
  const body = JSON.parse(event.body || "{}") as EndSessionBody;
  const { transcript } = body;

  // Get session to find userId
  const sessionResult = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(id), SK: Keys.META },
    }),
  );
  if (!sessionResult.Item) return error(404, "Session not found");

  const session = sessionResult.Item as SessionItem;

  // Calculate and deduct minutes used
  const endedAt = new Date().toISOString();
  const durationMs = new Date(endedAt).getTime() - new Date(session.createdAt).getTime();
  const minutesUsed = Math.max(1, Math.ceil(durationMs / 60000));

  if (session.userId) {
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: Keys.user(session.userId), SK: Keys.CREDITS },
          UpdateExpression: "SET balance = balance - :mins, updatedAt = :now",
          ConditionExpression: "balance >= :mins",
          ExpressionAttributeValues: { ":mins": minutesUsed, ":now": endedAt },
        }),
      );
    } catch {
      // If not enough balance, deduct whatever is left
      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: Keys.user(session.userId), SK: Keys.CREDITS },
          UpdateExpression: "SET balance = :zero, updatedAt = :now",
          ExpressionAttributeValues: { ":zero": 0, ":now": endedAt },
        }),
      );
    }
  }

  // Save transcript if provided
  if (transcript && transcript.length > 0) {
    // Store transcript as a single item (compressed)
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          PK: Keys.session(id),
          SK: Keys.TRANSCRIPT,
          entries: transcript,
          createdAt: new Date().toISOString(),
        },
      }),
    );

    // Generate summary and insights using Bedrock
    try {
      const [summary, insights] = await Promise.all([
        generateSessionSummary(session, transcript),
        generateSessionInsights(session, transcript),
      ]);

      // Store insights as separate DynamoDB item
      if (insights) {
        await ddb.send(
          new PutCommand({
            TableName: TABLE,
            Item: {
              PK: Keys.session(id),
              SK: Keys.INSIGHTS,
              ...insights,
              createdAt: new Date().toISOString(),
            },
          }),
        );
      }

      await ddb.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: Keys.session(id), SK: Keys.META },
          UpdateExpression:
            "SET #status = :status, endedAt = :endedAt, summary = :summary, minutesUsed = :mins, hasInsights = :hi",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":status": "completed",
            ":endedAt": endedAt,
            ":summary": summary,
            ":mins": minutesUsed,
            ":hi": !!insights,
          },
        }),
      );
      return ok({ success: true, summary, insights });
    } catch (err) {
      log.error("Summary generation failed", { error: (err as Error).message, sessionId: id });
    }
  }

  // Fallback: just mark completed without summary
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: Keys.session(id), SK: Keys.META },
      UpdateExpression: "SET #status = :status, endedAt = :endedAt, minutesUsed = :mins",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "completed",
        ":endedAt": endedAt,
        ":mins": minutesUsed,
      },
    }),
  );
  return ok({ success: true });
}

async function generateSessionSummary(
  session: SessionItem,
  transcript: TranscriptEntry[],
): Promise<string> {
  const conversationText = transcript
    .map((e) => `${e.isTherapist ? "Therapist" : "Participant"}: ${e.content}`)
    .join("\n");

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [
      {
        text: "You are a clinical note assistant. Generate a concise therapy session summary (3-5 sentences). Include: key topics discussed, emotional themes, any breakthroughs or insights, and suggested follow-up areas. Write in third person. Do not use markdown or special formatting.",
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            text: `Therapist: ${session.therapistId}\nParticipants: ${session.participants?.names?.join(", ") || "Unknown"}\nSession focus: ${session.prompt || "General"}\n\nTranscript:\n${conversationText}\n\nPlease provide a brief session summary.`,
          },
        ],
      },
    ],
    inferenceConfig: { maxTokens: 300, temperature: 0.3 },
  });

  const response = await bedrock.send(command);
  return response.output?.message?.content?.[0]?.text || "";
}

async function generateSessionInsights(
  session: SessionItem,
  transcript: TranscriptEntry[],
): Promise<SessionInsight | null> {
  const conversationText = transcript
    .map((e) => `${e.isTherapist ? "Therapist" : "Participant"}: ${e.content}`)
    .join("\n");

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: [
      {
        text: `You are a relationship analytics assistant. Analyze a therapy session transcript and return structured insights as valid JSON only, with no other text.

Return this exact JSON structure:
{
  "patterns": ["array of 2-4 recurring interaction patterns observed"],
  "strengths": ["array of 2-3 relationship strengths identified"],
  "actionItems": ["array of 2-4 specific homework or action items for the couple"],
  "emotionalThemes": ["array of 2-4 key emotional themes (single words or short phrases)"],
  "communicationScore": <number 1-10 rating their communication quality in this session>
}

Be specific and personalized based on the transcript content. Use plain language accessible to non-therapists.`,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            text: `Participants: ${session.participants?.names?.join(", ") || "Unknown"}\nRelationship: ${(session.participants as Record<string, unknown>)?.relationship || "Unknown"}\nSession focus: ${session.prompt || "General"}\n\nTranscript:\n${conversationText}`,
          },
        ],
      },
    ],
    inferenceConfig: { maxTokens: 600, temperature: 0.3 },
  });

  const response = await bedrock.send(command);
  const text = response.output?.message?.content?.[0]?.text || "";

  try {
    const parsed = JSON.parse(text) as SessionInsight;
    // Validate shape
    if (
      Array.isArray(parsed.patterns) &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.actionItems) &&
      Array.isArray(parsed.emotionalThemes) &&
      typeof parsed.communicationScore === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    log.warn("Failed to parse insights JSON", { text: text.substring(0, 200) });
    return null;
  }
}
