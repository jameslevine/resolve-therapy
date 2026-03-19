# TogetherTherapy - API Schema

## Base URL

```
https://{api-id}.execute-api.eu-west-2.amazonaws.com/prod
```

## Authentication

Currently unauthenticated at API Gateway level. Frontend includes Cognito JWT in `Authorization: Bearer {token}` header, but Lambda handlers don't verify it.

## Endpoints

### Sessions

#### POST /sessions/start

Create a new therapy session.

**Request:**

```json
{
  "therapistId": "dr-sarah-chen",
  "userId": "cognito-sub-id",
  "prompt": "We want to work on communication",
  "participants": {
    "names": ["Alice", "Bob"],
    "relationship": "Romantic partners",
    "context": "Together for 3 years"
  }
}
```

**Response (200):**

```json
{
  "sessionId": "uuid",
  "balance": 57
}
```

**Errors:** `400` missing fields, `403` insufficient minutes

---

#### POST /sessions/respond

Get AI therapist response for participant input.

**Request:**

```json
{
  "sessionId": "uuid",
  "therapistId": "dr-sarah-chen",
  "prompt": "Session focus text",
  "participants": { "names": ["Alice", "Bob"], "relationship": "Romantic partners", "context": "" },
  "transcript": [
    { "content": "We keep arguing about finances", "isTherapist": false },
    { "content": "I hear that finances are a source of tension...", "isTherapist": true }
  ]
}
```

**Response (200):**

```json
{
  "text": "Thank you for sharing that, Alice. It sounds like..."
}
```

---

#### POST /sessions/{id}/end

End a session, save transcript, generate summary, deduct minutes.

**Request:**

```json
{
  "transcript": [
    { "content": "Hello", "isTherapist": false },
    { "content": "Welcome to our session", "isTherapist": true }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "summary": "The session focused on communication patterns..."
}
```

---

#### GET /sessions/{id}

Retrieve session metadata.

**Response (200):**

```json
{
  "PK": "SESSION#uuid",
  "SK": "META",
  "id": "uuid",
  "userId": "cognito-sub",
  "therapistId": "dr-sarah-chen",
  "prompt": "Communication issues",
  "participants": { "names": ["Alice", "Bob"], "relationship": "Romantic partners", "context": "" },
  "status": "completed",
  "createdAt": "2026-03-19T10:00:00.000Z",
  "endedAt": "2026-03-19T10:45:00.000Z",
  "summary": "...",
  "minutesUsed": 45
}
```

---

#### GET /sessions/{id}/transcript

Retrieve session transcript.

**Response (200):**

```json
{
  "entries": [
    { "content": "Hello", "isTherapist": false },
    { "content": "Welcome", "isTherapist": true }
  ]
}
```

---

#### GET /sessions?userId={userId}

List all sessions for a user (newest first, limit 50).

**Response (200):**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "therapistId": "dr-sarah-chen",
      "status": "completed",
      "createdAt": "...",
      "summary": "..."
    }
  ]
}
```

---

### Voice

#### POST /voice/speak

Convert text to speech via ElevenLabs.

**Request:**

```json
{
  "therapistId": "dr-sarah-chen",
  "text": "Hello, welcome to our session."
}
```

**Response (200):**

```json
{
  "text": "Hello, welcome to our session.",
  "audioUrl": "data:audio/mpeg;base64,..."
}
```

---

#### POST /voice/transcribe

Transcribe audio with speaker diarization via AWS Transcribe.

**Request:**

```json
{
  "audio": "base64-encoded-webm-audio"
}
```

**Response (200):**

```json
{
  "segments": [
    { "speaker": 0, "text": "I feel like we never talk anymore" },
    { "speaker": 1, "text": "That's not true, I try to talk every day" }
  ]
}
```

---

### Checkout

#### POST /checkout/credits

Create a Stripe checkout session for credit purchase.

**Request:**

```json
{
  "packageId": "1",
  "userId": "cognito-sub-id"
}
```

Packages: `"1"` = 60min/29GBP, `"3"` = 180min/69GBP, `"10"` = 600min/179GBP

**Response (200):**

```json
{
  "url": "https://checkout.stripe.com/...",
  "orderId": "uuid"
}
```

---

#### GET /checkout/verify?session_id={stripe_session_id}

Verify Stripe payment and fulfill credits.

**Response (200):**

```json
{
  "balance": 60,
  "fulfilled": true
}
```

---

#### POST /checkout/webhook

Stripe webhook endpoint for `checkout.session.completed` events.

**Response (200):**

```json
{
  "received": true
}
```

---

#### GET /checkout/balance?userId={userId}

Get user's current credit balance.

**Response (200):**

```json
{
  "balance": 120
}
```

## Error Response Format

```json
{
  "message": "Error description"
}
```

Standard HTTP status codes: `400` (bad request), `403` (forbidden), `404` (not found), `500` (internal error), `502` (upstream service error)

## CORS

All endpoints return:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, ...`
