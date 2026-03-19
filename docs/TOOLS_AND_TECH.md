# TogetherTherapy - Tools & Technology

## Frontend

| Technology                       | Version | Purpose                             |
| -------------------------------- | ------- | ----------------------------------- |
| React                            | 19.2.4  | UI framework                        |
| TypeScript                       | 5.9.3   | Type safety                         |
| Vite                             | 8.0.0   | Build tool and dev server           |
| Tailwind CSS                     | 4.2.1   | Utility-first styling               |
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
| IAM            | Least-privilege access control            |

## Dev Tools

| Tool                        | Version | Purpose                          |
| --------------------------- | ------- | -------------------------------- |
| ESLint                      | 9.39.4  | Code linting                     |
| typescript-eslint           | 8.56.1  | TypeScript ESLint rules          |
| eslint-plugin-react-hooks   | 7.0.1   | React hooks linting              |
| eslint-plugin-react-refresh | 0.5.2   | Fast refresh support             |
| @vitejs/plugin-react        | 6.0.0   | React Vite plugin (Oxc compiler) |

## Missing Dev Tools (To Be Added)

- Prettier (code formatting)
- Husky (git hooks)
- commitlint (conventional commit enforcement)
- lint-staged (pre-commit linting)
- Jest + React Testing Library (unit tests)
- cfn-lint / cfn_nag (CloudFormation linting)

## Environment Setup

### Prerequisites

- Node.js 22.x
- AWS CLI configured with appropriate credentials
- Stripe account with test keys

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to AWS
./deploy.sh
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
- `FRONTEND_URL` - CloudFront distribution URL
- `BEDROCK_MODEL_ID` - Bedrock model identifier
- `TRANSCRIBE_BUCKET` - S3 bucket for audio files
