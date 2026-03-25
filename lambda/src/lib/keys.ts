// DynamoDB key patterns — single source of truth for all PK/SK construction

export const Keys = {
  // Entity prefixes
  session: (id: string) => `SESSION#${id}`,
  user: (id: string) => `USER#${id}`,
  order: (id: string) => `ORDER#${id}`,

  // Sort key constants
  META: "META",
  CREDITS: "CREDITS",
  INSIGHTS: "INSIGHTS",
  TRANSCRIPT: "TRANSCRIPT",

  // Dynamic sort keys
  memory: (key: string) => `MEMORY#${key}`,

  // GSI1 patterns
  gsi1UserSessions: (userId: string) => `USER#${userId}`,
  gsi1SessionTimestamp: (timestamp: string) => `SESSION#${timestamp}`,
} as const;
