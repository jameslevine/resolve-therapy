#!/usr/bin/env node

/**
 * Generate static voice preview snippets for all therapists using ElevenLabs.
 *
 * Creates short MP3 greetings saved to public/audio/therapists/<id>.mp3
 * for instant client-side playback during therapist selection.
 *
 * Usage:
 *   node scripts/generate-voice-snippets.cjs
 */

const fs = require("fs");
const path = require("path");

// Read .env manually (no dotenv dependency)
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
  if (match) process.env[match[1].trim()] = match[2];
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not found in .env");
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, "..", "public", "audio", "therapists");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const THERAPISTS = [
  { id: "dr-sarah-chen", name: "Dr. Sarah Chen", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dr-marcus-wright", name: "Dr. Marcus Wright", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-elena-vasquez", name: "Dr. Elena Vasquez", voiceId: "XB0fDUnXU5powFXDhCwa" },
  { id: "dr-james-okonkwo", name: "Dr. James Okonkwo", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-mei-tanaka", name: "Dr. Mei Tanaka", voiceId: "jBpfuIE2acCO8z3wKNLl" },
  { id: "dr-rachel-abrams", name: "Dr. Rachel Abrams", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dr-david-kim", name: "Dr. David Kim", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-amara-osei", name: "Dr. Amara Osei", voiceId: "XB0fDUnXU5powFXDhCwa" },
  { id: "dr-thomas-brennan", name: "Dr. Thomas Brennan", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-sofia-petrov", name: "Dr. Sofia Petrov", voiceId: "jBpfuIE2acCO8z3wKNLl" },
  { id: "dr-nathan-cole", name: "Dr. Nathan Cole", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-aisha-rahman", name: "Dr. Aisha Rahman", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dr-carlos-mendoza", name: "Dr. Carlos Mendoza", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-hannah-liu", name: "Dr. Hannah Liu", voiceId: "XB0fDUnXU5powFXDhCwa" },
  { id: "dr-omar-hassan", name: "Dr. Omar Hassan", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-lily-chen-wu", name: "Dr. Lily Chen-Wu", voiceId: "jBpfuIE2acCO8z3wKNLl" },
  { id: "dr-ryan-murphy", name: "Dr. Ryan Murphy", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-priya-sharma", name: "Dr. Priya Sharma", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dr-michael-torres", name: "Dr. Michael Torres", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-emma-williams", name: "Dr. Emma Williams", voiceId: "XB0fDUnXU5powFXDhCwa" },
  { id: "dr-alex-novak", name: "Dr. Alex Novak", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-grace-adeyemi", name: "Dr. Grace Adeyemi", voiceId: "jBpfuIE2acCO8z3wKNLl" },
  { id: "dr-daniel-park", name: "Dr. Daniel Park", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { id: "dr-nina-kowalski", name: "Dr. Nina Kowalski", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { id: "dr-jay-robinson", name: "Dr. Jay Robinson", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { id: "dr-fatima-al-rashid", name: "Dr. Fatima Al-Rashid", voiceId: "XB0fDUnXU5powFXDhCwa" },
];

async function generateSnippet(therapist) {
  const outPath = path.join(OUTPUT_DIR, `${therapist.id}.mp3`);
  if (fs.existsSync(outPath)) {
    console.log(`  Skipping ${therapist.id} (already exists)`);
    return;
  }

  const text = `Hello, I'm ${therapist.name}. I'm looking forward to working with you today. Together, we'll create a safe space where you can explore what matters most to your relationship.`;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${therapist.voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  Generated ${therapist.id} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log(`Generating voice snippets for ${THERAPISTS.length} therapists...\n`);

  for (const therapist of THERAPISTS) {
    try {
      await generateSnippet(therapist);
    } catch (err) {
      console.error(`  Failed ${therapist.id}: ${err.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nDone! Audio saved to public/audio/therapists/");
}

main().catch(console.error);
