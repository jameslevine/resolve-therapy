# TogetherTherapy

AI-powered couples therapy platform available 24/7. Couples select from 30 AI therapist personalities, engage in real-time voice-based therapy sessions powered by AWS Bedrock (Claude), and receive post-session summaries with cross-session memory for continuity.

## Features

- **30 AI Therapists** with unique specialties, personalities, and voice profiles
- **Real-time voice sessions** using Web Speech API and ElevenLabs TTS
- **Two-tier AI memory** for session and cross-session continuity
- **20 languages** with RTL support (Arabic, Hebrew)
- **Credit-based pricing** via Stripe (60min/180min/600min packages)
- **Session transcripts and AI-generated summaries**
- **Full auth flow** via AWS Cognito (register, verify, login, password reset)

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, Zustand |
| Auth     | AWS Cognito User Pools                                 |
| Backend  | 3 Lambda functions (Node.js 22.x)                      |
| AI       | AWS Bedrock (Claude Sonnet 4.6)                        |
| Voice    | ElevenLabs TTS, AWS Transcribe STT                     |
| Payments | Stripe                                                 |
| Database | DynamoDB (single-table design)                         |
| Hosting  | S3 + CloudFront (OAC)                                  |
| IaC      | CloudFormation                                         |

## Getting Started

### Prerequisites

- Node.js 22.x
- AWS CLI configured with credentials
- Stripe account (test keys)
- ElevenLabs API key

### Local Development

```bash
# Install frontend dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values

# Start dev server
npm run dev
```

### Deploy to AWS

```bash
./deploy.sh
```

This deploys the full stack: CloudFormation infrastructure, Lambda functions, frontend to S3, and invalidates CloudFront cache.

## Project Structure

```
src/                    # React frontend
  components/           # Reusable UI components
  pages/                # Route-level page components
  store/                # Zustand state (auth, credits)
  lib/                  # API client, Cognito, config, therapist data
  i18n/                 # 20 language translation files
  types/                # TypeScript interfaces

lambda/                 # Backend Lambda functions
  sessions.js           # Session CRUD + AI responses
  checkout.js           # Stripe payment processing
  voice.js              # TTS (ElevenLabs) + STT (Transcribe)
  lib/                  # Shared utilities (DynamoDB, Bedrock, responses)

infrastructure/         # CloudFormation templates
  template.yaml         # Full stack definition

docs/                   # Project documentation
  ROADMAP.md            # Features and milestones
  ARCHITECTURE.md       # System design
  API_SCHEMA.md         # API endpoint contracts
  TOOLS_AND_TECH.md     # Technology decisions
  TASK_LOG.md           # Progress tracking
  DECISIONS.md          # Architecture decision records
```

## Documentation

See the [docs/](docs/) folder for detailed project documentation.
