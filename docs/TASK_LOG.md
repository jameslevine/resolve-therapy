# TogetherTherapy - Task Log

## Current Task

- **Task**: CI/CD setup with GitHub Actions
- **Started**: 2026-03-20
- **Context**: Full CI/CD pipeline with separate dev and prod environments
- **Progress**: Complete

## Completed Tasks

| Date       | Task                                            | Notes                                                                       |
| ---------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| 2026-03-20 | CI/CD with GitHub Actions                       | ci.yml, deploy-dev.yml, deploy-prod.yml; SSH remote; env-based CFN naming   |
| 2026-03-20 | Dark mode                                       | Class-based Tailwind toggle, theme store, CSS overrides, navbar toggle      |
| 2026-03-20 | Progress tracking dashboard                     | /progress page with stats, score chart, session history, backend endpoint   |
| 2026-03-20 | Therapist continuity                            | Past sessions on therapist profile, "Book Again" on session detail          |
| 2026-03-20 | Post-session AI insights                        | Patterns, strengths, action items, communication score via Bedrock          |
| 2026-03-19 | Loading/error states + Stripe webhook           | Dashboard error+retry, session error toast, webhook signature enforcement   |
| 2026-03-19 | Lambda TypeScript migration                     | 3 handlers + 4 lib files migrated, strict types, 62 tests passing           |
| 2026-03-19 | Structured JSON logging + CloudWatch monitoring | Logger lib, Log Groups, Metric Filters, Alarms, Dashboard in CloudFormation |
| 2026-03-19 | Replace Web Speech API with AWS Transcribe      | MediaRecorder + AnalyserNode VAD, cross-browser                             |
| 2026-03-19 | Unit tests (86 total)                           | 24 frontend + 62 Lambda tests across 11 suites                              |
| 2026-03-19 | Phase 2 foundation & quality                    | Docs, .env.example, README, Husky, commitlint, Prettier, lint-staged        |
| 2026-03-19 | Full MVP implementation                         | Frontend, Backend (3 Lambda), Infra (CloudFormation), deploy.sh             |

## Blocked / Pending

- None

## Next Up

1. Couple accounts (linked user accounts)
2. Email notifications via SES
3. Mobile app (React Native / Expo)
