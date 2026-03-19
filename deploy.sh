#!/bin/bash
set -euo pipefail

REGION="eu-west-2"
STACK_NAME="resolve-therapy"
TEMPLATE_FILE="infrastructure/template.yaml"
LAMBDA_DIR="lambda"
FRONTEND_BUCKET=""
DISTRIBUTION_ID=""
API_URL=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
command -v aws >/dev/null 2>&1 || err "AWS CLI not found. Install it first."
command -v npm >/dev/null 2>&1 || err "npm not found."

# Load environment variables
if [ -f .env ]; then
  log "Loading .env file..."
  set -a
  source .env
  set +a
fi

# Step 1: Deploy CloudFormation stack
log "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ElevenLabsApiKey="${ELEVENLABS_API_KEY}" \
    StripeSecretKey="${STRIPE_SECRET_KEY}" \
    SessionPriceCents="${SESSION_PRICE_CENTS:-4900}" \
    BedrockModelId="${BEDROCK_MODEL_ID:-anthropic.claude-sonnet-4-6}" \
    TranscribeBucket="${TRANSCRIBE_BUCKET:-resolve-therapy-frontend}" \
  --no-fail-on-empty-changeset

# Step 2: Get stack outputs
log "Fetching stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output json)

FRONTEND_BUCKET=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='FrontendBucketName'))")
DISTRIBUTION_ID=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='DistributionId'))")
API_URL=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='ApiUrl'))")
CF_DOMAIN=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='CloudFrontUrl'))")

log "Frontend Bucket: $FRONTEND_BUCKET"
log "Distribution ID: $DISTRIBUTION_ID"
log "API URL: $API_URL"
log "CloudFront: $CF_DOMAIN"

# Step 3: Update Lambda FRONTEND_URL with CloudFront domain
log "Updating Lambda FRONTEND_URL..."
for FUNC_NAME in "${STACK_NAME}-checkout" "${STACK_NAME}-sessions" "${STACK_NAME}-voice"; do
  CURRENT_ENV=$(aws lambda get-function-configuration \
    --region "$REGION" \
    --function-name "$FUNC_NAME" \
    --query "Environment.Variables" \
    --output json 2>/dev/null || echo "{}")
  
  UPDATED_ENV=$(echo "$CURRENT_ENV" | python3 -c "
import sys, json
env = json.load(sys.stdin)
url = '${CF_DOMAIN}'
if not url.startswith('https://'):
    url = 'https://' + url
env['FRONTEND_URL'] = url
print(json.dumps({'Variables': env}))
")
  
  aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNC_NAME" \
    --environment "$UPDATED_ENV" \
    --no-cli-pager > /dev/null 2>&1 || warn "Could not update $FUNC_NAME env"
done

# Step 4: Build TypeScript & package Lambda
log "Building Lambda TypeScript..."
cd "$LAMBDA_DIR"
npm install
npm run build
cd ..

log "Packaging Lambda functions..."
LAMBDA_ZIP="/tmp/resolve-therapy-lambda.zip"
rm -f "$LAMBDA_ZIP"
cd "$LAMBDA_DIR"
# Package compiled JS from dist/ + node_modules (exclude dev files)
cd dist
zip -r "$LAMBDA_ZIP" . > /dev/null
cd ..
zip -r "$LAMBDA_ZIP" node_modules -x "node_modules/.package-lock.json" > /dev/null
cd ..

# Step 5: Deploy Lambda code
log "Deploying Lambda code..."
for FUNC_NAME in "${STACK_NAME}-checkout" "${STACK_NAME}-sessions" "${STACK_NAME}-voice"; do
  aws lambda update-function-code \
    --region "$REGION" \
    --function-name "$FUNC_NAME" \
    --zip-file "fileb://$LAMBDA_ZIP" \
    --no-cli-pager > /dev/null
  log "  Updated $FUNC_NAME"
done

# Step 6: Build frontend
# Fetch Cognito outputs for frontend build
USER_POOL_ID=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='UserPoolId'))")
USER_POOL_CLIENT_ID=$(echo "$OUTPUTS" | python3 -c "import sys,json; print(next(o['OutputValue'] for o in json.load(sys.stdin) if o['OutputKey']=='UserPoolClientId'))")

log "Building frontend with API URL: $API_URL"
VITE_API_URL="$API_URL" \
VITE_STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY}" \
VITE_COGNITO_USER_POOL_ID="$USER_POOL_ID" \
VITE_COGNITO_CLIENT_ID="$USER_POOL_CLIENT_ID" \
npm run build

# Step 7: Deploy frontend to S3
log "Uploading frontend to S3..."
aws s3 sync dist/ "s3://${FRONTEND_BUCKET}/" \
  --region "$REGION" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://${FRONTEND_BUCKET}/index.html" \
  --region "$REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Step 8: Invalidate CloudFront cache
log "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --region "$REGION" \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --no-cli-pager > /dev/null

echo ""
log "Deployment complete!"
echo ""
echo -e "  ${GREEN}Frontend:${NC} $CF_DOMAIN"
echo -e "  ${GREEN}API:${NC}      $API_URL"
echo ""
