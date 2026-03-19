const mockBedrockSend = jest.fn();

jest.mock("@aws-sdk/client-bedrock-runtime", () => ({
  BedrockRuntimeClient: jest.fn(() => ({ send: mockBedrockSend })),
  ConverseCommand: jest.fn((params) => ({ type: "Converse", ...params })),
}));

const { getTherapistResponse } = require("../dist/lib/bedrock");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("bedrock getTherapistResponse", () => {
  it("returns cleaned text and extracted memories", async () => {
    mockBedrockSend.mockResolvedValue({
      output: {
        message: {
          content: [
            {
              text: 'I hear you, Alice. It sounds like finances trigger anxiety.\n<memories>\n<memory category="TRIGGER">Financial discussions trigger anxiety in Alice</memory>\n<memory category="CONFLICT_PATTERN">Avoidance when money topics arise</memory>\n</memories>',
            },
          ],
        },
      },
    });

    const result = await getTherapistResponse(
      "You are Dr. Sarah Chen...",
      "Communication issues",
      [],
      [{ content: "We argue about money", isTherapist: false }],
      { names: ["Alice", "Bob"], relationship: "Partners", context: "" },
    );

    expect(result.text).toBe("I hear you, Alice. It sounds like finances trigger anxiety.");
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].category).toBe("TRIGGER");
    expect(result.memories[1].category).toBe("CONFLICT_PATTERN");
  });

  it("returns text without memories when none present", async () => {
    mockBedrockSend.mockResolvedValue({
      output: {
        message: {
          content: [{ text: "Welcome to our session today." }],
        },
      },
    });

    const result = await getTherapistResponse("You are Dr. Sarah Chen...", "", [], [], null);

    expect(result.text).toBe("Welcome to our session today.");
    expect(result.memories).toEqual([]);
  });

  it("handles empty messages array with default greeting", async () => {
    mockBedrockSend.mockResolvedValue({
      output: {
        message: {
          content: [{ text: "Hello, welcome." }],
        },
      },
    });

    const result = await getTherapistResponse("prompt", "", [], [], null);

    // Should have formatted a default "Hello, we're ready to begin" message
    const commandCall = mockBedrockSend.mock.calls[0][0];
    expect(commandCall.messages[0].role).toBe("user");
  });

  it("merges consecutive same-role messages", async () => {
    mockBedrockSend.mockResolvedValue({
      output: { message: { content: [{ text: "I see." }] } },
    });

    await getTherapistResponse(
      "prompt",
      "",
      [],
      [
        { content: "Alice: I feel ignored", isTherapist: false },
        { content: "Bob: That's not true", isTherapist: false },
      ],
      null,
    );

    const commandCall = mockBedrockSend.mock.calls[0][0];
    // Two consecutive user messages should be merged into one
    expect(commandCall.messages).toHaveLength(1);
    expect(commandCall.messages[0].role).toBe("user");
    expect(commandCall.messages[0].content[0].text).toContain("Alice: I feel ignored");
    expect(commandCall.messages[0].content[0].text).toContain("Bob: That's not true");
  });

  it("includes memories in system prompt when provided", async () => {
    mockBedrockSend.mockResolvedValue({
      output: { message: { content: [{ text: "I remember." }] } },
    });

    await getTherapistResponse(
      "prompt",
      "",
      [{ category: "TRIGGER", value: "Money arguments" }],
      [{ content: "Hello", isTherapist: false }],
      null,
    );

    const commandCall = mockBedrockSend.mock.calls[0][0];
    const systemTexts = commandCall.system.map((s) => s.text).join(" ");
    expect(systemTexts).toContain("Money arguments");
  });

  it("includes participant info in system prompt", async () => {
    mockBedrockSend.mockResolvedValue({
      output: { message: { content: [{ text: "Hello Alice and Bob." }] } },
    });

    await getTherapistResponse(
      "prompt",
      "",
      [],
      [{ content: "Hello", isTherapist: false }],
      { names: ["Alice", "Bob"], relationship: "Married", context: "10 years" },
    );

    const commandCall = mockBedrockSend.mock.calls[0][0];
    const systemTexts = commandCall.system.map((s) => s.text).join(" ");
    expect(systemTexts).toContain("Alice, Bob");
    expect(systemTexts).toContain("Married");
  });

  it("strips assistant messages from start of conversation", async () => {
    mockBedrockSend.mockResolvedValue({
      output: { message: { content: [{ text: "Okay." }] } },
    });

    await getTherapistResponse(
      "prompt",
      "",
      [],
      [
        { content: "Welcome", isTherapist: true },
        { content: "Hello", isTherapist: false },
      ],
      null,
    );

    const commandCall = mockBedrockSend.mock.calls[0][0];
    // First assistant message should be stripped, conversation starts with user
    expect(commandCall.messages[0].role).toBe("user");
  });
});
