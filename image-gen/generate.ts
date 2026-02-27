/**
 * Solv Image Generator
 * Generates images via Google Gemini for blog posts, product screenshots, and marketing assets.
 *
 * Usage:
 *   npx ts-node generate.ts "your prompt" [options]
 *
 * Options:
 *   --ref <path>    Path to a reference image (used as visual style guide)
 *   --size <ratio>  Aspect ratio: 1:1 | 16:9 | 9:16 | 4:3 | 3:4  (default: 16:9)
 *   --model <id>    Override the model  (default: gemini-3-pro-image-preview)
 *   --out <dir>     Output directory    (default: ./output)
 *
 * Examples:
 *   npx ts-node generate.ts "Hero image for an urgent care landing page, clean, professional, medical blue tones"
 *   npx ts-node generate.ts "Blog post header: AI in healthcare operations" --size 16:9
 *   npx ts-node generate.ts "Match this style — show a busy front desk at a clinic" --ref ./brand-screenshot.png
 *   npx ts-node generate.ts "Square social card" --size 1:1 --model gemini-3.1-flash-image-preview
 */

import { GoogleGenAI, Part } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_MODEL        = "gemini-3-pro-image-preview";
const DEFAULT_ASPECT_RATIO = "16:9";
const VALID_ASPECT_RATIOS  = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
type AspectRatio = typeof VALID_ASPECT_RATIOS[number];

const MIME_TYPES: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
};

// ── Arg parser ─────────────────────────────────────────────────────────────────

interface Args {
  prompt:  string;
  refPath: string | undefined;
  size:    string;
  model:   string;
  outDir:  string;
}

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--") && i + 1 < argv.length) {
      flags[argv[i].slice(2)] = argv[i + 1];
      i++; // skip the value
    } else {
      positional.push(argv[i]);
    }
  }

  return {
    prompt:  positional.join(" "),
    refPath: flags["ref"],
    size:    flags["size"]  ?? DEFAULT_ASPECT_RATIO,
    model:   flags["model"] ?? DEFAULT_MODEL,
    outDir:  flags["out"]   ?? "./output",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text: string, maxLen = 45): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
}

function printUsage(): void {
  console.log(`
  Solv Image Generator

  Usage:
    npx ts-node generate.ts "prompt" [options]

  Options:
    --ref <path>    Reference image path (used as style guide)
    --size <ratio>  ${VALID_ASPECT_RATIOS.join(" | ")}  (default: ${DEFAULT_ASPECT_RATIO})
    --model <id>    Model ID  (default: ${DEFAULT_MODEL})
    --out <dir>     Output directory  (default: ./output)

  Examples:
    npx ts-node generate.ts "Hero banner for an urgent care website, clean and professional"
    npx ts-node generate.ts "Blog header: the future of urgent care operations" --size 16:9
    npx ts-node generate.ts "Match this visual style — new scene: a patient checking in" --ref ./ref.png
    npx ts-node generate.ts "Square social card, bold typography" --size 1:1
`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Validate prompt
  if (!args.prompt) {
    printUsage();
    process.exit(1);
  }

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`
  Error: GEMINI_API_KEY is not set.

  1. Copy .env.example to .env
  2. Add your API key: GEMINI_API_KEY=your_key_here
  3. Get a key at: https://aistudio.google.com/app/apikey
`);
    process.exit(1);
  }

  // Validate aspect ratio
  if (!VALID_ASPECT_RATIOS.includes(args.size as AspectRatio)) {
    console.error(`  Error: Invalid aspect ratio "${args.size}"\n  Valid options: ${VALID_ASPECT_RATIOS.join(", ")}`);
    process.exit(1);
  }

  // Build request parts
  const parts: Part[] = [];

  if (args.refPath) {
    if (!fs.existsSync(args.refPath)) {
      console.error(`  Error: Reference image not found: ${args.refPath}`);
      process.exit(1);
    }

    const ext      = path.extname(args.refPath).toLowerCase();
    const mimeType = MIME_TYPES[ext];

    if (!mimeType) {
      console.error(`  Error: Unsupported image format "${ext}"\n  Supported: ${Object.keys(MIME_TYPES).join(", ")}`);
      process.exit(1);
    }

    const imageData = fs.readFileSync(args.refPath).toString("base64");

    // Add reference image first, then the instruction
    parts.push({ inlineData: { mimeType, data: imageData } });
    parts.push({
      text: `Use the provided image strictly as a visual style reference — match its color palette, `
          + `lighting, composition style, and overall aesthetic. Do not reproduce any text, logos, or `
          + `UI elements from the reference. Generate a new image described as: ${args.prompt}`,
    });
  } else {
    parts.push({ text: args.prompt });
  }

  // Log what we're doing
  console.log(`
  Model   ${args.model}
  Size    ${args.size}
  Prompt  ${args.prompt.slice(0, 90)}${args.prompt.length > 90 ? "…" : ""}${args.refPath ? `\n  Ref     ${args.refPath}` : ""}

  Generating…`);

  // Call the API
  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model:    args.model,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: args.size as AspectRatio },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n  Generation failed: ${message}\n`);

    // Surface common issues
    if (message.includes("API_KEY")) {
      console.error("  → Check that your GEMINI_API_KEY is correct and has not expired.");
    } else if (message.includes("404") || message.includes("not found")) {
      console.error(`  → Model "${args.model}" may not be available yet in your region or account tier.`);
      console.error(`  → Try: --model gemini-2.5-flash-image`);
    } else if (message.includes("SAFETY") || message.includes("blocked")) {
      console.error("  → The prompt was blocked by safety filters. Try rephrasing.");
    }

    process.exit(1);
  }

  // Extract and save the image
  const candidates = response?.candidates ?? [];
  let saved = false;

  for (const candidate of candidates) {
    for (const part of candidate?.content?.parts ?? []) {
      const inline = (part as { inlineData?: { data: string; mimeType: string } }).inlineData;
      if (inline?.data) {
        const imageBuffer = Buffer.from(inline.data, "base64");

        // Ensure output directory exists
        fs.mkdirSync(args.outDir, { recursive: true });

        // Build filename: timestamp + slugified prompt
        const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const slug     = slugify(args.prompt);
        const filename = `${ts}--${slug}.png`;
        const outPath  = path.join(args.outDir, filename);

        fs.writeFileSync(outPath, imageBuffer);
        console.log(`\n  ✓ Saved: ${outPath}\n`);
        saved = true;
        break;
      }
    }
    if (saved) break;
  }

  if (!saved) {
    // No image — check if model returned a text refusal instead
    const textPart = candidates[0]?.content?.parts?.find(
      (p: unknown) => (p as { text?: string }).text
    ) as { text?: string } | undefined;

    console.error("\n  No image was returned in the response.");
    if (textPart?.text) {
      console.error(`  Model responded with text: ${textPart.text}`);
    }
    process.exit(1);
  }
}

main();
