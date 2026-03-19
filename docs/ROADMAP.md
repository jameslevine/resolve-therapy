# TogetherTherapy - Project Roadmap

## Project Overview

TogetherTherapy is an AI-powered couples therapy platform providing 24/7 accessible virtual therapy sessions. Couples select from 30 AI therapist personalities, engage in real-time voice-based therapy sessions powered by AWS Bedrock (Claude), and receive post-session summaries with cross-session memory for continuity.

## Goals & Success Criteria

- Deliver a functional MVP where couples can complete an AI therapy session end-to-end
- Support 20 languages with RTL support
- Maintain session memory across conversations for relationship continuity
- Monetize via credit/minutes system through Stripe
- Deploy as fully serverless on AWS for cost efficiency and scalability

## Phase 1: MVP (Core Platform)

| Feature                                                            | Priority | Status   |
| ------------------------------------------------------------------ | -------- | -------- |
| User registration & authentication (Cognito)                       | P0       | Complete |
| Email verification & password reset                                | P0       | Complete |
| Therapist catalog (30 profiles with voice previews)                | P0       | Complete |
| Session creation wizard (4-step flow)                              | P0       | Complete |
| Real-time voice therapy sessions (Web Speech API + ElevenLabs TTS) | P0       | Complete |
| AI therapy responses via Bedrock (Claude Sonnet)                   | P0       | Complete |
| Session transcript storage & review                                | P0       | Complete |
| Credit purchase via Stripe (3 packages)                            | P0       | Complete |
| User dashboard with session history                                | P0       | Complete |
| Account management (profile, password, deletion)                   | P0       | Complete |
| Internationalization (20 languages, RTL)                           | P0       | Complete |
| Landing page with marketing content                                | P0       | Complete |
| AWS infrastructure (CloudFormation)                                | P0       | Complete |
| Deployment automation (deploy.sh)                                  | P0       | Complete |

## Phase 2: Foundation & Quality

| Feature                                                    | Priority | Status      |
| ---------------------------------------------------------- | -------- | ----------- |
| Project documentation (docs/ folder)                       | P0       | In Progress |
| Fix .env.example and README.md                             | P0       | Not Started |
| Set up Husky + commitlint + Prettier + lint-staged         | P1       | Not Started |
| Sync backend therapist data (30 therapists in sessions.js) | P1       | Not Started |
| Initial git commit of all work                             | P0       | Not Started |
| Add unit tests for Lambda handlers                         | P1       | Not Started |
| Add unit tests for React components                        | P1       | Not Started |

## Phase 3: Reliability & Polish

| Feature                                                    | Priority | Status      |
| ---------------------------------------------------------- | -------- | ----------- |
| Replace Web Speech API with consistent AWS Transcribe flow | P1       | Not Started |
| Structured error handling and CloudWatch monitoring        | P1       | Not Started |
| Migrate Lambda to TypeScript with Express + Joi            | P2       | Not Started |
| Loading/error states and edge case handling                | P2       | Not Started |
| Stripe webhook signature verification (enforce)            | P2       | Not Started |

## Phase 4: Features & Growth

| Feature                                          | Priority | Status      |
| ------------------------------------------------ | -------- | ----------- |
| Post-session AI-generated relationship insights  | P1       | Not Started |
| Therapist continuity (past sessions, re-booking) | P1       | Not Started |
| Progress tracking dashboard with visualizations  | P2       | Not Started |
| Couple accounts (linked user accounts)           | P2       | Not Started |
| Dark mode                                        | P2       | Not Started |
| Email notifications via SES                      | P3       | Not Started |
| Mobile app (React Native / Expo)                 | P3       | Not Started |

## Completed Tasks

| Date    | Task                                                          |
| ------- | ------------------------------------------------------------- |
| 2026-03 | Full MVP built: frontend, backend, infrastructure, deployment |
