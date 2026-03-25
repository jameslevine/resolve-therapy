import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ok, error, options } from "./lib/response";
import { loggerFromEvent } from "./lib/logger";
import type { Logger } from "./lib/logger";
import { getVoiceId } from "./lib/therapists";

const REGION: string = process.env.AWS_REGION || "eu-west-2";
const BUCKET: string =
  process.env.TRANSCRIBE_BUCKET || process.env.FRONTEND_BUCKET_NAME || "resolve-therapy-transcribe";
const s3 = new S3Client({ region: REGION });
const transcribe = new TranscribeClient({ region: REGION });

let log: Logger;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") return options();

  const path: string = event.path || "";
  log = loggerFromEvent(event, "voice");

  try {
    if (path.endsWith("/speak")) return await handleSpeak(event);
    if (path.endsWith("/transcribe")) return await handleTranscribe(event);
    return error(404, "Not found");
  } catch (err) {
    log.error("Voice handler error", { error: (err as Error).message });
    return error(500, "Internal server error");
  }
};

async function handleSpeak(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { therapistId, text } = JSON.parse(event.body || "{}") as {
    therapistId?: string;
    text?: string;
  };
  if (!text) return error(400, "text is required");

  const voiceId: string = getVoiceId(therapistId || "");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
    }),
  });

  if (!res.ok) {
    log.error("ElevenLabs TTS failed", {
      status: res.status,
      therapistId: therapistId as unknown as string,
    });
    return error(502, "TTS service error");
  }

  const audioBuffer = await res.arrayBuffer();
  const base64: string = Buffer.from(audioBuffer).toString("base64");

  return ok({ text, audioUrl: `data:audio/mpeg;base64,${base64}` });
}

async function handleTranscribe(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  let audioBuffer: Buffer;
  let audioFormat: string = "webm";

  try {
    const body = (
      event.isBase64Encoded
        ? JSON.parse(Buffer.from(event.body || "", "base64").toString())
        : JSON.parse(event.body || "{}")
    ) as { audio?: string; format?: string };

    if (!body.audio) {
      return error(400, "audio field is required (base64-encoded)");
    }
    audioBuffer = Buffer.from(body.audio, "base64");
    if (body.format) {
      const allowed: string[] = ["webm", "ogg", "mp4", "mp3", "flac", "wav"];
      audioFormat = allowed.includes(body.format) ? body.format : "webm";
    }
  } catch (e) {
    log.error("Request parse error", { error: (e as Error).message });
    return error(400, "Invalid request body");
  }

  if (audioBuffer.length === 0) {
    return error(400, "Empty audio data");
  }

  const CONTENT_TYPES: Record<string, string> = {
    webm: "audio/webm",
    ogg: "audio/ogg",
    mp4: "audio/mp4",
    mp3: "audio/mpeg",
    flac: "audio/flac",
    wav: "audio/wav",
  };

  const jobId: string = `transcribe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const s3Key: string = `transcribe-audio/${jobId}.${audioFormat}`;

  try {
    // Upload audio to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: CONTENT_TYPES[audioFormat] || "audio/webm",
      }),
    );

    // Start Transcribe job with speaker identification
    await transcribe.send(
      new StartTranscriptionJobCommand({
        TranscriptionJobName: jobId,
        LanguageCode: "en-GB",
        MediaFormat: audioFormat as "webm" | "ogg" | "mp4" | "mp3" | "flac" | "wav",
        Media: {
          MediaFileUri: `s3://${BUCKET}/${s3Key}`,
        },
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 5,
        },
      }),
    );

    // Poll for completion (must complete within API Gateway's 29s limit)
    let result: Record<string, unknown> | undefined;
    for (let i = 0; i < 25; i++) {
      await new Promise<void>((r) => setTimeout(r, 1000));

      const jobResult = await transcribe.send(
        new GetTranscriptionJobCommand({
          TranscriptionJobName: jobId,
        }),
      );

      const status: string | undefined = jobResult.TranscriptionJob?.TranscriptionJobStatus;
      if (status === "COMPLETED") {
        const transcriptUri: string | undefined =
          jobResult.TranscriptionJob?.Transcript?.TranscriptFileUri;
        const transcriptRes = await fetch(transcriptUri || "");
        result = (await transcriptRes.json()) as Record<string, unknown>;
        break;
      } else if (status === "FAILED") {
        log.error("Transcribe job failed", {
          reason: jobResult.TranscriptionJob?.FailureReason as string,
        });
        return ok({ segments: [] });
      }
    }

    if (!result) {
      log.error("Transcribe job timed out", { jobId });
      return ok({ segments: [] });
    }

    // Parse speaker labels from Transcribe result
    const results = result.results as Record<string, unknown> | undefined;
    const speakerLabels = results?.speaker_labels as
      | {
          speakers: number;
          segments: Array<{
            speaker_label: string;
            items: Array<{ start_time: string; end_time: string }>;
          }>;
        }
      | undefined;
    const items =
      (results?.items as Array<{
        start_time?: string;
        end_time?: string;
        alternatives?: Array<{ content: string }>;
      }>) || [];
    const transcript: string =
      (results?.transcripts as Array<{ transcript: string }> | undefined)?.[0]?.transcript || "";

    log.info("Transcribe completed", {
      transcript: transcript.substring(0, 200),
      itemCount: items.length,
      speakerCount: speakerLabels?.speakers || 0,
      segments: speakerLabels?.segments?.length || 0,
    });

    if (!speakerLabels || !speakerLabels.segments) {
      // No speaker labels, return as single speaker
      if (transcript.trim()) {
        return ok({
          transcript: transcript.trim(),
          segments: [{ speaker: 0, text: transcript.trim() }],
        });
      }
      return ok({ transcript: "", segments: [] });
    }

    // Group by speaker segments from Transcribe
    const segments: Array<{ speaker: number; text: string }> = [];
    for (const seg of speakerLabels.segments) {
      const speakerNum: number = parseInt(seg.speaker_label.replace("spk_", ""), 10);
      // Collect words for this segment
      const segWords: string[] = (seg.items || [])
        .map((item) => {
          const matched = items.find(
            (i) => i.start_time === item.start_time && i.end_time === item.end_time,
          );
          return matched?.alternatives?.[0]?.content || "";
        })
        .filter(Boolean);

      if (segWords.length > 0) {
        // Join words, handling punctuation
        let text = "";
        for (const w of segWords) {
          if (/^[.,!?;:]$/.test(w)) {
            text += w;
          } else {
            text += (text ? " " : "") + w;
          }
        }
        segments.push({ speaker: speakerNum, text: text.trim() });
      }
    }

    // Merge consecutive segments from the same speaker
    const merged: Array<{ speaker: number; text: string }> = [];
    for (const seg of segments) {
      if (merged.length > 0 && merged[merged.length - 1].speaker === seg.speaker) {
        merged[merged.length - 1].text += " " + seg.text;
      } else {
        merged.push({ ...seg });
      }
    }

    const filteredSegments = merged.filter((s) => s.text.length > 0);
    return ok({
      transcript,
      segments: filteredSegments,
    });
  } finally {
    // Cleanup S3 audio file
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
    } catch {
      // ignore cleanup errors
    }
  }
}
