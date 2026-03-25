const mockS3Send = jest.fn();
const mockTranscribeSend = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn((params) => ({ type: "PutObject", ...params })),
  GetObjectCommand: jest.fn((params) => ({ type: "GetObject", ...params })),
  DeleteObjectCommand: jest.fn((params) => ({ type: "DeleteObject", ...params })),
}));

jest.mock("@aws-sdk/client-transcribe", () => ({
  TranscribeClient: jest.fn(() => ({ send: mockTranscribeSend })),
  StartTranscriptionJobCommand: jest.fn((params) => ({ type: "StartTranscription", ...params })),
  GetTranscriptionJobCommand: jest.fn((params) => ({ type: "GetTranscription", ...params })),
}));

// Mock global fetch for ElevenLabs API
const mockFetch = jest.fn();
global.fetch = mockFetch;

const { handler } = require("../dist/voice");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("voice handler", () => {
  describe("OPTIONS", () => {
    it("returns CORS preflight response", async () => {
      const result = await handler({ httpMethod: "OPTIONS" });
      expect(result.statusCode).toBe(200);
    });
  });

  describe("POST /voice/speak", () => {
    it("returns base64 audio from ElevenLabs", async () => {
      const audioBuffer = new ArrayBuffer(8);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });

      const result = await handler({
        httpMethod: "POST",
        path: "/voice/speak",
        body: JSON.stringify({
          therapistId: "dr-sarah-chen",
          text: "Hello, welcome to our session.",
        }),
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.text).toBe("Hello, welcome to our session.");
      expect(body.audioUrl).toMatch(/^data:audio\/mpeg;base64,/);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("uses correct voice ID for known therapist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      });

      await handler({
        httpMethod: "POST",
        path: "/voice/speak",
        body: JSON.stringify({ therapistId: "dr-marcus-wright", text: "Hello" }),
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain("nPczCjzI2devNBz1zQrb");
    });

    it("uses default voice for unknown therapist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      });

      await handler({
        httpMethod: "POST",
        path: "/voice/speak",
        body: JSON.stringify({ therapistId: "unknown-therapist", text: "Hello" }),
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain("EXAVITQu4vr4xnSDxMaL");
    });

    it("returns 400 when text is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/voice/speak",
        body: JSON.stringify({ therapistId: "dr-sarah-chen" }),
      });

      expect(result.statusCode).toBe(400);
    });

    it("returns 502 when ElevenLabs fails", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await handler({
        httpMethod: "POST",
        path: "/voice/speak",
        body: JSON.stringify({ therapistId: "dr-sarah-chen", text: "Hello" }),
      });

      expect(result.statusCode).toBe(502);
    });
  });

  describe("POST /voice/transcribe", () => {
    it("transcribes audio with speaker labels", async () => {
      mockS3Send.mockResolvedValue({}); // upload + delete

      const transcriptResult = {
        results: {
          transcripts: [{ transcript: "I feel unheard" }],
          items: [
            { start_time: "0.0", end_time: "0.5", alternatives: [{ content: "I" }] },
            { start_time: "0.5", end_time: "1.0", alternatives: [{ content: "feel" }] },
            { start_time: "1.0", end_time: "1.5", alternatives: [{ content: "unheard" }] },
          ],
          speaker_labels: {
            speakers: 1,
            segments: [
              {
                speaker_label: "spk_0",
                items: [
                  { start_time: "0.0", end_time: "0.5" },
                  { start_time: "0.5", end_time: "1.0" },
                  { start_time: "1.0", end_time: "1.5" },
                ],
              },
            ],
          },
        },
      };

      mockTranscribeSend
        .mockResolvedValueOnce({}) // start job
        .mockResolvedValueOnce({
          TranscriptionJob: {
            TranscriptionJobStatus: "COMPLETED",
            Transcript: { TranscriptFileUri: "https://s3.amazonaws.com/transcript.json" },
          },
        });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(transcriptResult),
      });

      const audioBase64 = Buffer.from("fake-audio-data").toString("base64");
      const result = await handler({
        httpMethod: "POST",
        path: "/voice/transcribe",
        body: JSON.stringify({ audio: audioBase64 }),
        isBase64Encoded: false,
      });

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.transcript).toBe("I feel unheard");
      expect(body.segments).toBeDefined();
      expect(body.segments.length).toBeGreaterThan(0);
      expect(body.segments[0].speaker).toBe(0);
    });

    it("uses format parameter for media type", async () => {
      mockS3Send.mockResolvedValue({});

      const transcriptResult = {
        results: {
          transcripts: [{ transcript: "test" }],
          items: [],
          speaker_labels: null,
        },
      };

      mockTranscribeSend.mockResolvedValueOnce({}).mockResolvedValueOnce({
        TranscriptionJob: {
          TranscriptionJobStatus: "COMPLETED",
          Transcript: { TranscriptFileUri: "https://s3.amazonaws.com/transcript.json" },
        },
      });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(transcriptResult),
      });

      const audioBase64 = Buffer.from("fake-audio-data").toString("base64");
      await handler({
        httpMethod: "POST",
        path: "/voice/transcribe",
        body: JSON.stringify({ audio: audioBase64, format: "mp4" }),
        isBase64Encoded: false,
      });

      // Verify S3 upload used correct content type
      const { PutObjectCommand } = require("@aws-sdk/client-s3");
      const putCall = PutObjectCommand.mock.calls[PutObjectCommand.mock.calls.length - 1][0];
      expect(putCall.ContentType).toBe("audio/mp4");
      expect(putCall.Key).toMatch(/\.mp4$/);

      // Verify Transcribe job used correct format
      const { StartTranscriptionJobCommand } = require("@aws-sdk/client-transcribe");
      const transcribeCall =
        StartTranscriptionJobCommand.mock.calls[
          StartTranscriptionJobCommand.mock.calls.length - 1
        ][0];
      expect(transcribeCall.MediaFormat).toBe("mp4");
    });

    it("returns 400 when audio is missing", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/voice/transcribe",
        body: JSON.stringify({}),
        isBase64Encoded: false,
      });

      expect(result.statusCode).toBe(400);
    });

    it("returns empty segments when transcription fails", async () => {
      mockS3Send.mockResolvedValue({});
      mockTranscribeSend.mockResolvedValueOnce({}).mockResolvedValueOnce({
        TranscriptionJob: {
          TranscriptionJobStatus: "FAILED",
          FailureReason: "Audio too short",
        },
      });

      const audioBase64 = Buffer.from("short").toString("base64");
      const result = await handler({
        httpMethod: "POST",
        path: "/voice/transcribe",
        body: JSON.stringify({ audio: audioBase64 }),
        isBase64Encoded: false,
      });

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).segments).toEqual([]);
    });
  });

  describe("unknown routes", () => {
    it("returns 404 for unknown path", async () => {
      const result = await handler({
        httpMethod: "POST",
        path: "/voice/unknown",
      });
      expect(result.statusCode).toBe(404);
    });
  });
});
