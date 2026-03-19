import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "eu-west-2" });
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-sonnet-4-6";

interface Participants {
  names?: string[];
  relationship?: string;
  context?: string;
}

interface Memory {
  category: string;
  value: string;
}

interface TranscriptMessage {
  content: string;
  isTherapist: boolean;
}

interface TherapistResponse {
  text: string;
  memories: Memory[];
}

const SYSTEM_PROMPT = `You are an AI therapist specializing in group conflict resolution and couples therapy.

Core principles:
- NEUTRALITY: Never take sides. Validate all perspectives equally.
- ACTIVE LISTENING: Reflect back what you hear. Use phrases like "What I'm hearing is..." and "It sounds like..."
- DE-ESCALATION: When tension rises, slow the conversation down. Acknowledge emotions before addressing content.
- PATTERN RECOGNITION: Identify recurring dynamics and name them gently.
- EVIDENCE-BASED: Draw from CBT, EFT, Gottman Method, and other proven frameworks as appropriate.
- SAFETY: If anyone expresses suicidal ideation or describes abuse, provide crisis resources immediately.
- MEMORY: Reference relevant insights from past sessions when applicable.
- BOUNDARIES: You are an AI tool, not a licensed therapist. Remind participants of this when appropriate.

When you identify important patterns, triggers, progress, or insights, include them in <memories> tags at the end of your response:
<memories>
<memory category="CONFLICT_PATTERN">Description of the pattern</memory>
<memory category="COMMUNICATION_STYLE">Description of communication style</memory>
</memories>

Valid categories: CONFLICT_PATTERN, COMMUNICATION_STYLE, TRIGGER, PROGRESS, GOAL, RELATIONSHIP_DYNAMIC, KEY_INSIGHT

Keep responses concise (2-4 sentences) to maintain conversational flow. Speak directly to participants by name when possible.

IMPORTANT: Your responses will be spoken aloud via text-to-speech. Do NOT use emojis, markdown, bullet points, or any special formatting. Write in natural spoken language only.

The conversation is captured via a shared microphone. All non-therapist messages come from the participants in the room. Use the participant details provided to understand who is speaking and address them by name. If only one person seems to be talking, gently invite the others to share their perspective.`;

export async function getTherapistResponse(
  therapistPrompt: string,
  sessionPrompt: string,
  memories: Memory[],
  messages: TranscriptMessage[],
  participants?: Participants,
): Promise<TherapistResponse> {
  const systemContent: Array<{ text: string }> = [
    { text: SYSTEM_PROMPT },
    { text: `\n\nTherapist personality:\n${therapistPrompt}` },
  ];

  if (sessionPrompt) {
    systemContent.push({ text: `\n\nSession focus:\n${sessionPrompt}` });
  }

  if (participants) {
    const parts: string[] = [];
    if (participants.names && participants.names.length > 0) {
      parts.push(`Participants: ${participants.names.join(", ")}`);
    }
    if (participants.relationship) {
      parts.push(`Relationship: ${participants.relationship}`);
    }
    if (participants.context) {
      parts.push(`Additional context: ${participants.context}`);
    }
    if (parts.length > 0) {
      systemContent.push({ text: `\n\nSession participants:\n${parts.join("\n")}` });
    }
  }

  if (memories && memories.length > 0) {
    const memText = memories.map((m) => `[${m.category}] ${m.value}`).join("\n");
    systemContent.push({ text: `\n\nRelevant memories from past sessions:\n${memText}` });
  }

  // Ensure messages alternate user/assistant
  const formatted: Array<{ role: "user" | "assistant"; content: Array<{ text: string }> }> = [];
  for (const msg of messages) {
    const role = msg.isTherapist ? "assistant" : "user";
    const content = msg.content;
    if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
      formatted[formatted.length - 1].content[0].text += "\n" + content;
    } else {
      formatted.push({ role, content: [{ text: content }] });
    }
  }

  // Must start with user
  if (formatted.length > 0 && formatted[0].role === "assistant") {
    formatted.shift();
  }
  if (formatted.length === 0) {
    formatted.push({ role: "user", content: [{ text: "Hello, we're ready to begin." }] });
  }

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: systemContent,
    messages: formatted,
    inferenceConfig: { maxTokens: 512, temperature: 0.7 },
  });

  const response = await bedrock.send(command);
  const text = response.output?.message?.content?.[0]?.text || "";

  // Extract memories
  const memoryMatches: Memory[] = [];
  const memRegex = /<memory category="([^"]+)">([^<]+)<\/memory>/g;
  let match;
  while ((match = memRegex.exec(text)) !== null) {
    memoryMatches.push({ category: match[1], value: match[2].trim() });
  }

  // Clean response text (remove memory tags)
  const cleanText = text.replace(/<memories>[\s\S]*?<\/memories>/g, "").trim();

  return { text: cleanText, memories: memoryMatches };
}
