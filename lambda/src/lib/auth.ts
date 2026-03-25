import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Extract the authenticated user's Cognito sub (userId) from the API Gateway
 * Cognito authorizer claims. Returns null if no authorizer context is present
 * (e.g. for unauthenticated routes like webhooks).
 */
export function getAuthUserId(event: APIGatewayProxyEvent): string | null {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) return null;
  return (claims.sub as string) || null;
}
