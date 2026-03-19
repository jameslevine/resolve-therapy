const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
const { ok, error, options } = require("./lib/response");

const REGION = process.env.AWS_REGION || "eu-west-2";
const BUCKET = process.env.TRANSCRIBE_BUCKET || process.env.FRONTEND_BUCKET_NAME || "resolve-therapy-transcribe";
const s3 = new S3Client({ region: REGION });
const transcribe = new TranscribeClient({ region: REGION });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();

  const path = event.path || "";

  try {
    if (path.endsWith("/speak")) return await handleSpeak(event);
    if (path.endsWith("/transcribe")) return await handleTranscribe(event);
    return error(404, "Not found");
  } catch (err) {
    console.error("Voice error:", err);
    return error(500, "Internal server error");
  }
};

async function handleSpeak(event) {
  const { therapistId, text } = JSON.parse(event.body || "{}");
  if (!text) return error(400, "text is required");

  const VOICE_MAP = {
    "dr-sarah-chen": "EXAVITQu4vr4xnSDxMaL",
    "dr-marcus-wright": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-elena-vasquez": "XB0fDUnXU5powFXDhCwa",
    "dr-james-okonkwo": "pNInz6obpgDQGcFmaJgB",
    "dr-mei-tanaka": "jBpfuIE2acCO8z3wKNLl",
    "dr-rachel-abrams": "EXAVITQu4vr4xnSDxMaL",
    "dr-david-kim": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-amara-osei": "XB0fDUnXU5powFXDhCwa",
    "dr-thomas-brennan": "pNInz6obpgDQGcFmaJgB",
    "dr-sofia-petrov": "jBpfuIE2acCO8z3wKNLl",
    "dr-nathan-cole": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-aisha-rahman": "EXAVITQu4vr4xnSDxMaL",
    "dr-carlos-mendoza": "pNInz6obpgDQGcFmaJgB",
    "dr-hannah-liu": "XB0fDUnXU5powFXDhCwa",
    "dr-omar-hassan": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-lily-chen-wu": "jBpfuIE2acCO8z3wKNLl",
    "dr-ryan-murphy": "pNInz6obpgDQGcFmaJgB",
    "dr-priya-sharma": "EXAVITQu4vr4xnSDxMaL",
    "dr-michael-torres": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-emma-williams": "XB0fDUnXU5powFXDhCwa",
    "dr-alex-novak": "pNInz6obpgDQGcFmaJgB",
    "dr-grace-adeyemi": "jBpfuIE2acCO8z3wKNLl",
    "dr-daniel-park": "TX3LPaxmHKxFdv7VOQHJ",
    "dr-nina-kowalski": "EXAVITQu4vr4xnSDxMaL",
    "dr-jay-robinson": "pNInz6obpgDQGcFmaJgB",
    "dr-fatima-al-rashid": "XB0fDUnXU5powFXDhCwa",
  };

  const voiceId = VOICE_MAP[therapistId] || "EXAVITQu4vr4xnSDxMaL";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
    }),
  });

  if (!res.ok) {
    console.error("ElevenLabs error:", res.status);
    return error(502, "TTS service error");
  }

  const audioBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString("base64");

  return ok({ text, audioUrl: `data:audio/mpeg;base64,${base64}` });
}

async function handleTranscribe(event) {
  let audioBuffer;

  try {
    const body = event.isBase64Encoded
      ? JSON.parse(Buffer.from(event.body, "base64").toString())
      : JSON.parse(event.body || "{}");

    if (!body.audio) {
      return error(400, "audio field is required (base64-encoded)");
    }
    audioBuffer = Buffer.from(body.audio, "base64");
  } catch (e) {
    console.error("Parse error:", e);
    return error(400, "Invalid request body");
  }

  if (audioBuffer.length === 0) {
    return error(400, "Empty audio data");
  }

  const jobId = `transcribe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const s3Key = `transcribe-audio/${jobId}.webm`;

  try {
    // Upload audio to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: "audio/webm",
    }));

    // Start Transcribe job with speaker identification
    await transcribe.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobId,
      LanguageCode: "en-GB",
      MediaFormat: "webm",
      Media: {
        MediaFileUri: `s3://${BUCKET}/${s3Key}`,
      },
      Settings: {
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: 5,
      },
    }));

    // Poll for completion (must complete within API Gateway's 29s limit)
    let result;
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      const jobResult = await transcribe.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobId,
      }));

      const status = jobResult.TranscriptionJob?.TranscriptionJobStatus;
      if (status === "COMPLETED") {
        const transcriptUri = jobResult.TranscriptionJob?.Transcript?.TranscriptFileUri;
        const transcriptRes = await fetch(transcriptUri);
        result = await transcriptRes.json();
        break;
      } else if (status === "FAILED") {
        console.error("Transcribe failed:", jobResult.TranscriptionJob?.FailureReason);
        return ok({ segments: [] });
      }
    }

    if (!result) {
      console.error("Transcribe timed out");
      return ok({ segments: [] });
    }

    // Parse speaker labels from Transcribe result
    const speakerLabels = result.results?.speaker_labels;
    const items = result.results?.items || [];
    const transcript = result.results?.transcripts?.[0]?.transcript || "";

    console.log("Transcribe result:", JSON.stringify({
      transcript: transcript.substring(0, 200),
      itemCount: items.length,
      speakerCount: speakerLabels?.speakers || 0,
      segments: speakerLabels?.segments?.length || 0,
    }));

    if (!speakerLabels || !speakerLabels.segments) {
      // No speaker labels, return as single speaker
      if (transcript.trim()) {
        return ok({ segments: [{ speaker: 0, text: transcript.trim() }] });
      }
      return ok({ segments: [] });
    }

    // Group by speaker segments from Transcribe
    const segments = [];
    for (const seg of speakerLabels.segments) {
      const speakerNum = parseInt(seg.speaker_label.replace("spk_", ""), 10);
      // Collect words for this segment
      const segWords = (seg.items || [])
        .map((item) => {
          const matched = items.find(
            (i) => i.start_time === item.start_time && i.end_time === item.end_time
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
    const merged = [];
    for (const seg of segments) {
      if (merged.length > 0 && merged[merged.length - 1].speaker === seg.speaker) {
        merged[merged.length - 1].text += " " + seg.text;
      } else {
        merged.push({ ...seg });
      }
    }

    return ok({ segments: merged.filter((s) => s.text.length > 0) });
  } finally {
    // Cleanup S3 audio file
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
    } catch (e) {
      // ignore cleanup errors
    }
  }
}
