#!/usr/bin/env node

/**
 * AI Image Generation Script for TogetherTherapy
 *
 * Generates realistic therapist profile photos and site imagery using
 * Amazon Bedrock Nova Canvas (us-east-1). Auto-converts to compressed JPEG.
 *
 * Usage:
 *   node scripts/generate-images.cjs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REGION = "us-east-1";
const MODEL_ID = "amazon.nova-canvas-v1:0";
const OUTPUT_DIR = path.join(__dirname, "..", "public", "images");

// Ensure output directories exist
fs.mkdirSync(path.join(OUTPUT_DIR, "therapists"), { recursive: true });
fs.mkdirSync(path.join(OUTPUT_DIR, "site"), { recursive: true });

// Therapist profile photo prompts
const THERAPIST_PROMPTS = [
  {
    id: "dr-sarah-chen",
    prompt:
      "Professional headshot portrait of a warm, approachable Asian-American woman in her early 40s. She has shoulder-length dark hair, gentle brown eyes, and a compassionate smile. Wearing a soft cream blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-marcus-wright",
    prompt:
      "Professional headshot portrait of a confident, friendly African-American man in his late 40s. He has a short beard, warm brown eyes, and an assured yet approachable expression. Wearing a navy blazer over a light shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-elena-vasquez",
    prompt:
      "Professional headshot portrait of a gentle, calming Latina woman in her mid-30s. She has long dark wavy hair, warm hazel eyes, and a serene, reassuring expression. Wearing a soft sage green top. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-james-okonkwo",
    prompt:
      "Professional headshot portrait of an energetic, charismatic man in his late 30s with dark skin. He has a bright, engaging smile, short-cropped hair, and warm dark eyes. Wearing a light blue shirt with top button open. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-mei-tanaka",
    prompt:
      "Professional headshot portrait of a calm, contemplative Japanese-American woman in her early 40s. She has straight black hair in a neat bob, gentle dark eyes, and a peaceful expression with a subtle smile. Wearing a soft white top. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-rachel-abrams",
    prompt:
      "Professional headshot portrait of a friendly, intelligent woman in her mid-40s with auburn hair pulled back loosely. She has bright green eyes, light freckles, and a confident welcoming smile. Wearing a soft burgundy blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-david-kim",
    prompt:
      "Professional headshot portrait of a calm, reassuring Korean-American man in his mid-40s. He has short black hair with subtle grey at the temples, kind dark eyes, and a composed steady expression. Wearing a charcoal sweater over a collared shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-amara-osei",
    prompt:
      "Professional headshot portrait of a warm, radiant West African woman in her mid-30s. She has natural curly hair styled elegantly, expressive dark brown eyes, and a bright genuine smile. Wearing gold hoop earrings and a deep teal blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-thomas-brennan",
    prompt:
      "Professional headshot portrait of a practical, approachable Irish-American man in his mid-40s. He has sandy brown hair, blue-grey eyes, a neat beard, and a friendly assured expression. Wearing a light grey blazer with an open-collared white shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-sofia-petrov",
    prompt:
      "Professional headshot portrait of an elegant Eastern European woman in her late 30s. She has long honey-blonde hair, striking grey-blue eyes, and a warm gentle smile. Wearing a soft lavender blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-nathan-cole",
    prompt:
      "Professional headshot portrait of a relatable, down-to-earth man in his early 40s. He has brown wavy hair, warm hazel eyes, slight stubble, and a kind relaxed smile. Wearing a casual olive green button-down shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-aisha-rahman",
    prompt:
      "Professional headshot portrait of a composed, graceful South Asian woman in her mid-30s wearing a soft mauve hijab. She has warm brown eyes, a gentle reassuring smile, and an air of calm confidence. Wearing a cream-colored blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-carlos-mendoza",
    prompt:
      "Professional headshot portrait of a creative, engaging Latino man in his late 30s. He has dark curly hair, deep brown eyes, a well-groomed beard, and an open friendly expression. Wearing a dark brown corduroy blazer over a cream shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-hannah-liu",
    prompt:
      "Professional headshot portrait of a kind, nurturing Chinese-American woman in her early 30s. She has long straight dark hair, gentle dark eyes with a hint of warmth, and a soft caring smile. Wearing a pale pink cardigan. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-omar-hassan",
    prompt:
      "Professional headshot portrait of a steady, dignified Middle Eastern man in his mid-40s. He has short dark hair with grey at the temples, a trimmed dark beard, compassionate brown eyes, and a calm reassuring expression. Wearing a navy shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-lily-chen-wu",
    prompt:
      "Professional headshot portrait of a wise, diplomatic Chinese-American woman in her late 30s. She has shoulder-length dark hair with subtle highlights, intelligent dark eyes, and a warm knowing smile. Wearing pearl earrings and a cream blazer. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-ryan-murphy",
    prompt:
      "Professional headshot portrait of a friendly, approachable man in his late 30s with light brown hair and blue eyes. He has a welcoming open smile and a relaxed confident posture. Wearing a soft blue henley shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-priya-sharma",
    prompt:
      "Professional headshot portrait of an insightful, warm Indian woman in her early 40s. She has long dark hair with a centre part, deep expressive brown eyes, and a gentle knowing smile. Wearing a rich jewel-toned maroon top. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-michael-torres",
    prompt:
      "Professional headshot portrait of a steady, compassionate Latino man in his mid-40s. He has short dark hair going silver, warm brown eyes with crow's feet from smiling, and a strong calm expression. Wearing a dark green polo shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-emma-williams",
    prompt:
      "Professional headshot portrait of a relatable, warm woman in her late 30s with medium-length light brown hair in loose waves. She has warm brown eyes and a bright authentic smile. Wearing a soft terracotta knit sweater. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-alex-novak",
    prompt:
      "Professional headshot portrait of an energetic, optimistic man in his early 30s with short blond hair and a clean-shaven face. He has bright blue eyes and an enthusiastic genuine smile. Wearing a crisp light blue shirt with rolled sleeves. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-grace-adeyemi",
    prompt:
      "Professional headshot portrait of an elegant, thoughtful Nigerian woman in her late 30s. She has natural coiled hair styled in a protective style, kind dark brown eyes, and a serene warm smile. Wearing a patterned amber and gold blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-daniel-park",
    prompt:
      "Professional headshot portrait of a thoughtful, refined Korean-American man in his late 30s. He has neat dark hair, intelligent dark eyes behind slim modern glasses, and a gentle contemplative expression with a slight smile. Wearing a fitted charcoal sweater over a white shirt collar. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-nina-kowalski",
    prompt:
      "Professional headshot portrait of a gentle, compassionate Eastern European woman in her early 40s. She has medium-length light brown hair with honey highlights, soft blue eyes, and a tender empathetic expression. Wearing a dusty rose blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-jay-robinson",
    prompt:
      "Professional headshot portrait of an upbeat, motivating African-American man in his early 30s. He has a close-cropped fade haircut, warm dark eyes, a bright infectious smile showing perfect teeth. Wearing a fitted navy polo shirt. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
  {
    id: "dr-fatima-al-rashid",
    prompt:
      "Professional headshot portrait of an intuitive, warm Middle Eastern woman in her mid-40s. She has dark wavy hair to her shoulders, deep compassionate brown eyes, and a gentle knowing smile. Wearing a deep olive green silk blouse. Warm studio lighting, shallow depth of field, neutral warm-toned background. High quality professional portrait photography.",
  },
];

// Site imagery prompts
const SITE_PROMPTS = [
  {
    id: "hero-couple",
    prompt:
      "A warm, softly-lit photograph of a diverse couple sitting together on a comfortable couch, having a heartfelt conversation. They are leaning toward each other with open body language, holding hands. Soft natural light from a window, warm color tones, cozy living room setting. The mood is hopeful and intimate. Editorial style photography.",
    width: 1792,
    height: 1024,
  },
  {
    id: "couple-talking",
    prompt:
      "An intimate photograph of a young couple sitting across from each other at a kitchen table with coffee, having an earnest conversation. Morning sunlight streaming in, warm golden tones. They look engaged and listening to each other. Comfortable home environment. Lifestyle photography.",
    width: 1792,
    height: 1024,
  },
  {
    id: "couple-walking",
    prompt:
      "A warm photograph of a happy couple walking together in a park during golden hour, holding hands and smiling at each other. Soft sunlight, autumn leaves, peaceful atmosphere. They look connected and at ease. Editorial lifestyle photography.",
    width: 1792,
    height: 1024,
  },
  {
    id: "couple-relief",
    prompt:
      "A photograph of a couple embracing in a relieved, tender hug. One partner has their eyes closed with a peaceful expression. Soft, warm lighting, minimal background. The mood conveys healing, forgiveness, and reconnection. Emotional portrait photography.",
    width: 1792,
    height: 1024,
  },
  {
    id: "family-together",
    prompt:
      "A warm photograph of a young family, a couple with a small child, sitting together on a couch, looking relaxed and content. Soft natural lighting, cozy home setting, warm earth tones. They look like they have found peace together. Lifestyle family photography.",
    width: 1792,
    height: 1024,
  },
];

function generateImage(prompt, outputPath, width = 1024, height = 1024) {
  const body = JSON.stringify({
    taskType: "TEXT_IMAGE",
    textToImageParams: { text: prompt },
    imageGenerationConfig: {
      numberOfImages: 1,
      quality: "premium",
      height,
      width,
      seed: Math.floor(Math.random() * 1000000),
    },
  });

  const tmpOut = path.join("/tmp", `bedrock-out-${Date.now()}.json`);
  const b64Body = Buffer.from(body).toString("base64");

  try {
    execSync(
      `aws bedrock-runtime invoke-model --model-id ${MODEL_ID} --region ${REGION} --content-type application/json --accept application/json --body "${b64Body}" ${tmpOut}`,
      { stdio: "pipe", timeout: 120000 },
    );
    const result = JSON.parse(fs.readFileSync(tmpOut, "utf-8"));
    if (result.images && result.images.length > 0) {
      const imageBuffer = Buffer.from(result.images[0], "base64");
      fs.writeFileSync(outputPath, imageBuffer);
      return true;
    } else if (result.error) {
      throw new Error(result.error);
    } else {
      throw new Error("No images in response");
    }
  } finally {
    try {
      fs.unlinkSync(tmpOut);
    } catch {}
  }
}

function convertToJpeg(pngPath, jpgPath, quality) {
  execSync(`sips -s format jpeg -s formatOptions ${quality} "${pngPath}" --out "${jpgPath}"`, {
    stdio: "pipe",
  });
  fs.unlinkSync(pngPath);
}

async function main() {
  console.log("Generating TogetherTherapy images via Amazon Bedrock Nova Canvas...\n");

  console.log(`Generating ${THERAPIST_PROMPTS.length} therapist profile photos...`);
  for (const therapist of THERAPIST_PROMPTS) {
    const jpgPath = path.join(OUTPUT_DIR, "therapists", `${therapist.id}.jpg`);
    if (fs.existsSync(jpgPath)) {
      console.log(`  Skipping ${therapist.id} (already exists)`);
      continue;
    }
    const pngPath = path.join(OUTPUT_DIR, "therapists", `${therapist.id}.png`);
    try {
      console.log(`  Generating ${therapist.id}...`);
      generateImage(therapist.prompt, pngPath);
      convertToJpeg(pngPath, jpgPath, 80);
      console.log(`  Done: ${therapist.id}`);
    } catch (err) {
      console.error(`  Failed ${therapist.id}: ${err.message}`);
    }
  }

  console.log(`\nGenerating ${SITE_PROMPTS.length} site images...`);
  for (const image of SITE_PROMPTS) {
    const jpgPath = path.join(OUTPUT_DIR, "site", `${image.id}.jpg`);
    if (fs.existsSync(jpgPath)) {
      console.log(`  Skipping ${image.id} (already exists)`);
      continue;
    }
    const pngPath = path.join(OUTPUT_DIR, "site", `${image.id}.png`);
    try {
      console.log(`  Generating ${image.id}...`);
      generateImage(image.prompt, pngPath, image.width, image.height);
      convertToJpeg(pngPath, jpgPath, 75);
      console.log(`  Done: ${image.id}`);
    } catch (err) {
      console.error(`  Failed ${image.id}: ${err.message}`);
    }
  }

  console.log("\nDone! Images saved to public/images/");
}

main().catch(console.error);
