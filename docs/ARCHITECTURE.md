# TogetherTherapy - Architecture

## System Overview

```
[Browser SPA] --> [CloudFront] --> [S3 Bucket]
      |
      +--> [API Gateway REST] --> [Lambda: sessions] --> [Bedrock Claude]
      |                      +--> [Lambda: checkout] --> [Stripe]
      |                      +--> [Lambda: voice]    --> [ElevenLabs TTS]
      |                                              --> [AWS Transcribe]
      |
      +--> [Cognito User Pool] (auth)

[DynamoDB] <-- all Lambdas (single-table design)
```

## Component Breakdown

### Frontend (React SPA)

- **Framework**: React 19 + TypeScript, built with Vite 8
- **Styling**: Tailwind CSS v4 with rose/stone color palette
- **State**: Zustand (auth store, credits store)
- **Routing**: react-router-dom v7 (18 routes, 7 protected)
- **i18n**: i18next with 20 languages, RTL support for Arabic/Hebrew
- **Auth**: amazon-cognito-identity-js (direct Cognito integration)
- **Voice**: Web Speech API for STT, Web Audio API for TTS playback

### Backend (3 Lambda Functions)

- **sessions**: Session CRUD, AI therapy responses via Bedrock, memory management
- **checkout**: Stripe payment processing, credit balance management
- **voice**: ElevenLabs TTS, AWS Transcribe STT with speaker diarization

### Infrastructure

- **Hosting**: S3 + CloudFront with Origin Access Control (OAC)
- **API**: API Gateway REST with proxy integration to Lambda
- **Database**: DynamoDB single-table design (on-demand billing)
- **Auth**: Cognito User Pool with email-based auth
- **Region**: eu-west-2

## Data Flow

### Session Flow

1. User creates session via 4-step wizard (therapist, participants, focus, review)
2. `POST /sessions/start` validates credits, creates session record in DynamoDB
3. User speaks -> Web Speech API captures text -> `POST /sessions/respond`
4. Lambda fetches session + user memories from DynamoDB
5. Bedrock generates therapist response with memory extraction
6. New memories stored at session and user level in DynamoDB
7. Response text sent to `POST /voice/speak` -> ElevenLabs TTS -> audio played
8. On session end, `POST /sessions/{id}/end` saves transcript, generates summary, deducts minutes

### Payment Flow

1. User selects credit package on `/credits` page
2. `POST /checkout/credits` creates Stripe checkout session + pending order in DynamoDB
3. User redirected to Stripe checkout
4. On success, redirected to `/credits?purchase=success&session_id=...`
5. `GET /checkout/verify` verifies payment and fulfills credits (idempotent)
6. Stripe webhook (`POST /checkout/webhook`) as backup fulfillment

## DynamoDB Schema (Single Table)

| Entity             | PK                | SK             | GSI1PK          | GSI1SK                |
| ------------------ | ----------------- | -------------- | --------------- | --------------------- |
| Session Meta       | `SESSION#{id}`    | `META`         | `USER#{userId}` | `SESSION#{createdAt}` |
| Session Transcript | `SESSION#{id}`    | `TRANSCRIPT`   | -               | -                     |
| Session Memory     | `SESSION#{id}`    | `MEMORY#{key}` | -               | -                     |
| User Credits       | `USER#{userId}`   | `CREDITS`      | -               | -                     |
| User Memory        | `USER#{userId}`   | `MEMORY#{key}` | -               | -                     |
| Order              | `ORDER#{orderId}` | `META`         | -               | -                     |

## AI Memory System

Two-tier memory architecture:

- **Session memories**: Stored under `SESSION#{id}/MEMORY#` - context for current session
- **User memories**: Stored under `USER#{userId}/MEMORY#` - cross-session continuity

Categories: `CONFLICT_PATTERN`, `COMMUNICATION_STYLE`, `TRIGGER`, `PROGRESS`, `GOAL`, `RELATIONSHIP_DYNAMIC`, `KEY_INSIGHT`

Extracted from Bedrock responses via `<memory category="...">value</memory>` tags.

## Security

- Cognito JWT tokens for API authentication (frontend-side only currently)
- API Gateway endpoints are unauthenticated (no Cognito authorizer configured)
- S3 bucket fully private (OAC only)
- Stripe webhook signature verification (optional, falls back to unsigned)
- HTTPS enforced via CloudFront
- Secrets passed as CloudFormation parameters (NoEcho)

## Scalability

- DynamoDB on-demand: auto-scales with traffic
- Lambda: auto-scales per request (256MB, 60-120s timeout)
- CloudFront: global CDN for frontend assets
- Stateless architecture: no server-side sessions

## Additional Documentation

- [API_SCHEMA.md](API_SCHEMA.md) - API endpoint contracts
- [TOOLS_AND_TECH.md](TOOLS_AND_TECH.md) - Technology decisions
- [DECISIONS.md](DECISIONS.md) - Architecture decision records
