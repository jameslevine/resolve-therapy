// DynamoDB key patterns — single source of truth for all PK/SK construction

export const Keys = {
  // Entity prefixes
  session: (id: string) => `SESSION#${id}`,
  user: (id: string) => `USER#${id}`,
  order: (id: string) => `ORDER#${id}`,

  feedback: (id: string) => `FEEDBACK#${id}`,
  referral: (code: string) => `REFERRAL#${code}`,

  // Sort key constants
  META: "META",
  CREDITS: "CREDITS",
  INSIGHTS: "INSIGHTS",
  TRANSCRIPT: "TRANSCRIPT",
  AFFILIATE: "AFFILIATE",

  // Dynamic sort keys
  memory: (key: string) => `MEMORY#${key}`,
  signup: (userId: string) => `SIGNUP#${userId}`,

  // GSI1 patterns
  gsi1UserSessions: (userId: string) => `USER#${userId}`,
  gsi1SessionTimestamp: (timestamp: string) => `SESSION#${timestamp}`,
  gsi1UserFeedback: (userId: string) => `USERFEEDBACK#${userId}`,
  gsi1FeedbackTimestamp: (timestamp: string) => `FEEDBACK#${timestamp}`,
} as const;
