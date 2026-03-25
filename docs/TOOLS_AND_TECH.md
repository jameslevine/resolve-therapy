# TogetherTherapy - Tools & Technology

## Frontend

| Technology                       | Version | Purpose                             |
| -------------------------------- | ------- | ----------------------------------- |
| React                            | 19.2.4  | UI framework                        |
| TypeScript                       | 5.9.3   | Type safety                         |
| Vite                             | 8.0.0   | Build tool and dev server           |
| Tailwind CSS                     | 4.2.1   | Utility-first styling + dark mode   |
| Zustand                          | 5.0.12  | Lightweight state management        |
| react-router-dom                 | 7.13.1  | Client-side routing                 |
| i18next                          | 25.8.18 | Internationalization (20 languages) |
| react-i18next                    | 16.5.8  | React i18n bindings                 |
| i18next-browser-languagedetector | 8.2.1   | Auto language detection             |
| amazon-cognito-identity-js       | 6.3.16  | Cognito auth SDK                    |
| @stripe/stripe-js                | 8.10.0  | Stripe client SDK                   |
| lucide-react                     | 0.577.0 | Icon library                        |

## Backend (Lambda)

| Technology                      | Version | Purpose                  |
| ------------------------------- | ------- | ------------------------ |
| Node.js                         | 22.x    | Lambda runtime           |
| TypeScript                      | 5.9.3   | Type safety (compiled)   |
| @aws-sdk/client-bedrock-runtime | 3.700.0 | AI therapy responses     |
| @aws-sdk/client-dynamodb        | 3.700.0 | Database operations      |
| @aws-sdk/lib-dynamodb           | 3.700.0 | DynamoDB document client |
| @aws-sdk/client-s3              | 3.700.0 | Audio file storage       |
| @aws-sdk/client-transcribe      | 3.700.0 | Speech-to-text           |
| stripe                          | 17.0.0  | Payment processing       |

## External Services

| Service                             | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| AWS Bedrock (Claude Sonnet 4.6)     | AI therapy response generation          |
| ElevenLabs (eleven_multilingual_v2) | Text-to-speech voice synthesis          |
| AWS Transcribe                      | Speech-to-text with speaker diarization |
| Stripe                              | Credit purchase and payment processing  |
| AWS Cognito                         | User authentication and management      |

## Infrastructure

| Service        | Purpose                                   |
| -------------- | ----------------------------------------- |
| CloudFormation | Infrastructure as Code                    |
| S3             | Frontend hosting, temporary audio storage |
| CloudFront     | CDN with OAC                              |
| API Gateway    | REST API                                  |
| Lambda         | Serverless compute (3 functions)          |
| DynamoDB       | NoSQL database (single-table)             |
| CloudWatch     | Logging, metrics, alarms, dashboard       |
| IAM            | Access control                            |

## Dev Tools

| Tool                        | Version | Purpose                             |
| --------------------------- | ------- | ----------------------------------- |
| ESLint                      | 9.39.4  | Code linting (flat config)          |
| typescript-eslint           | 8.56.1  | TypeScript ESLint rules             |
| eslint-plugin-react-hooks   | 7.0.1   | React hooks linting                 |
| eslint-plugin-react-refresh | 0.5.2   | Fast refresh support                |
| Prettier                    | 3.8.1   | Code formatting                     |
| Husky                       | 9.1.7   | Git hooks (pre-commit, commit-msg)  |
| commitlint                  | 19.8.1  | Conventional commit enforcement     |
| lint-staged                 | 16.1.0  | Pre-commit linting on staged files  |
| Jest                        | 30.3.0  | Testing framework (frontend+Lambda) |
| ts-jest                     | 30.0.0  | TypeScript Jest transformer         |
| @testing-library/react      | 16.3.0  | React component testing             |
| @vitejs/plugin-react        | 6.0.0   | React Vite plugin (Oxc compiler)    |

## CI/CD

| Component      | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| GitHub Actions | CI/CD pipeline                                            |
| ci.yml         | Reusable workflow: lint, typecheck, test, build           |
| deploy-dev     | Auto-deploy on push to main (dev environment)             |
| deploy-prod    | Manual trigger with confirmation (production environment) |

## Still Needed

- cfn-lint / cfn_nag (CloudFormation linting and security scanning)
- Test coverage reporting (--coverage flags in CI)
- npm audit in CI (dependency vulnerability scanning)

## Environment Setup

### Prerequisites

- Node.js 22.x
- AWS CLI configured with appropriate credentials
- Stripe account with test keys
- ElevenLabs API key

### Local Development

```bash
# Install dependencies
npm install
cd lambda && npm install && cd ..

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:all

# Deploy to dev
./deploy.sh dev

# Deploy to prod
./deploy.sh prod
```

### Environment Variables (Frontend - VITE\_\* prefix)

- `VITE_API_URL` - API Gateway endpoint URL
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `VITE_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` - Cognito App Client ID

### Environment Variables (Backend - via CloudFormation)

- `TABLE_NAME` - DynamoDB table name
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `FRONTEND_URL` - CloudFront distribution URL
- `BEDROCK_MODEL_ID` - Bedrock model identifier
- `TRANSCRIBE_BUCKET` - S3 bucket for audio files

### GitHub Environments

- **dev**: Auto-deployed on push to main
- **production**: Manual deployment with confirmation
- Both have: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- Repo-level variables: `SESSION_PRICE_CENTS`, `BEDROCK_MODEL_ID`
