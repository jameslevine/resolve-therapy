# TogetherTherapy - Architecture Decision Records

## ADR-001: Migrate from Next.js to Vite + React SPA

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Project was initially scaffolded with Create Next App but required a simpler SPA architecture for S3+CloudFront hosting.
- **Decision**: Migrated to Vite 8 with React 19 as a pure SPA.
- **Alternatives considered**: Keep Next.js with SSR on Lambda@Edge; Remix; Astro
- **Consequences**: Simpler deployment (static files to S3), no SSR/SSG capabilities, all routing is client-side. SEO handled via meta tags in index.html.

## ADR-002: DynamoDB Single-Table Design

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Need a flexible, serverless database for sessions, users, orders, and memories.
- **Decision**: Use DynamoDB with single-table design (PK/SK + GSI1) and on-demand billing.
- **Alternatives considered**: RDS PostgreSQL (referenced in early .env.example), multi-table DynamoDB
- **Consequences**: Cost-effective at low scale, complex access patterns via GSI, no relational joins. All entities share one table with PK/SK patterns.

## ADR-003: Three Separate Lambda Functions

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Backend needs to handle sessions/AI, payments, and voice separately with different timeout requirements.
- **Decision**: Three Lambda functions (sessions, checkout, voice) behind API Gateway proxy routes.
- **Alternatives considered**: Monolith Lambda with Express, separate API per function
- **Consequences**: Voice function gets 120s timeout while others get 60s. Each function only includes relevant dependencies. Trade-off: code duplication in response/dynamo libs.

## ADR-004: Web Speech API for Frontend STT

- **Date**: 2026-03
- **Status**: Accepted (needs review)
- **Context**: Need real-time speech-to-text during therapy sessions.
- **Decision**: Use browser's Web Speech API for real-time STT, with AWS Transcribe available as Lambda endpoint.
- **Alternatives considered**: AWS Transcribe only, Deepgram, Whisper
- **Consequences**: Zero latency and no API cost for STT, but browser support is inconsistent (best in Chrome). May need to fall back to AWS Transcribe for cross-browser support.

## ADR-005: ElevenLabs for Text-to-Speech

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: AI therapist responses need natural-sounding voice output.
- **Decision**: Use ElevenLabs eleven_multilingual_v2 model with 5 unique voice IDs distributed across 30 therapist profiles.
- **Alternatives considered**: Amazon Polly, Google Cloud TTS, browser SpeechSynthesis API
- **Consequences**: High quality voices with multilingual support. Cost per character. Only 5 distinct voices shared across 30 therapists.

## ADR-006: Two-Tier AI Memory System

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Therapy requires continuity - remembering past sessions and current session context.
- **Decision**: Store memories at both session level (SESSION#/MEMORY#) and user level (USER#/MEMORY#) in DynamoDB. Extract via regex from Bedrock responses.
- **Alternatives considered**: Single memory store, vector database (Pinecone), conversation history only
- **Consequences**: Categorized memories (conflict patterns, triggers, goals) provide structured context. Cross-session memories enable therapist continuity. Regex extraction is simple but fragile.

## ADR-007: Tailwind CSS v4 with Inline Theme

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Need a consistent, responsive design system.
- **Decision**: Use Tailwind CSS v4 with @theme inline configuration defining rose (primary) and stone (neutral) palettes.
- **Alternatives considered**: MUI (Material UI), styled-components, CSS modules
- **Consequences**: Utility-first approach, fast development, no runtime CSS-in-JS overhead. Custom theme defined in index.css.

## ADR-008: Zustand for State Management

- **Date**: 2026-03
- **Status**: Accepted
- **Context**: Need global state for auth and credits.
- **Decision**: Use Zustand with two stores (auth, credits).
- **Alternatives considered**: Redux Toolkit, React Context, Jotai
- **Consequences**: Minimal boilerplate, simple API, small bundle size. Two small stores vs one large store.

## ADR-009: Plain JavaScript Lambda Functions

- **Date**: 2026-03
- **Status**: Accepted (needs review)
- **Context**: Rapid MVP development needed for backend.
- **Decision**: Write Lambda handlers in plain JavaScript (CommonJS) for fast iteration.
- **Alternatives considered**: TypeScript with build step, Express monolith Lambda
- **Consequences**: No type safety on backend, no build step needed, faster cold starts. Should migrate to TypeScript for maintainability.
