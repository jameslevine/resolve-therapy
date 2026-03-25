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

## ADR-004: MediaRecorder + AWS Transcribe for STT

- **Date**: 2026-03
- **Status**: Accepted (supersedes original Web Speech API approach)
- **Context**: Web Speech API had inconsistent browser support. Needed cross-browser STT.
- **Decision**: Use MediaRecorder to capture audio, send to Lambda, transcribe via AWS Transcribe with speaker diarization.
- **Alternatives considered**: Web Speech API (original, Chrome-only), Deepgram, Whisper
- **Consequences**: Cross-browser support, speaker identification. Trade-off: 25s polling timeout tight against API Gateway 29s limit. Cost per transcription job.

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
- **Context**: Need global state for auth, credits, and theme.
- **Decision**: Use Zustand with three stores (auth, credits, theme).
- **Alternatives considered**: Redux Toolkit, React Context, Jotai
- **Consequences**: Minimal boilerplate, simple API, small bundle size. Three small focused stores.

## ADR-009: Lambda TypeScript Migration

- **Date**: 2026-03-19
- **Status**: Accepted (supersedes original plain JS approach)
- **Context**: Plain JS Lambda handlers lacked type safety, making refactoring risky.
- **Decision**: Migrated all Lambda handlers and lib files to TypeScript with strict mode. Build step via tsc to dist/.
- **Alternatives considered**: Keep plain JS with JSDoc types, gradual migration
- **Consequences**: Full type safety, better IDE support, catch errors at compile time. Trade-off: build step required before deployment, slightly slower cold starts.

## ADR-010: GitHub Actions CI/CD with Environment Separation

- **Date**: 2026-03-20
- **Status**: Accepted
- **Context**: Need automated testing and deployment with separate dev and prod environments.
- **Decision**: Three workflow files: ci.yml (reusable), deploy-dev.yml (auto on push to main), deploy-prod.yml (manual trigger). AWS access keys per environment.
- **Alternatives considered**: AWS CodePipeline, OIDC role-based auth, single workflow with matrix
- **Consequences**: Full CI (lint, typecheck, test, build) before deploy. Separate CloudFormation stacks, DynamoDB tables, S3 buckets per environment. API Gateway stage name parameterized via Environment.

## ADR-011: Dark Mode via Tailwind Class Strategy

- **Date**: 2026-03-20
- **Status**: Accepted
- **Context**: Users requested dark mode support.
- **Decision**: Use Tailwind v4 `@custom-variant dark` with class-based toggling on `document.documentElement`. Zustand theme store persists to localStorage and respects system preference.
- **Alternatives considered**: CSS media query only (no manual toggle), separate stylesheet, CSS variables only
- **Consequences**: Users can choose light/dark/system. CSS overrides in index.css for backgrounds, borders, inputs. All component dark classes use Tailwind utilities.
