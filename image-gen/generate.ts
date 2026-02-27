/**
 * Solv Image Generator
 * Generates on-brand images via Google Gemini for blog posts, social cards,
 * hero banners, and email headers. Solv's visual style is applied automatically.
 *
 * Usage:
 *   npx ts-node generate.ts "your prompt" [options]
 *
 * Options:
 *   --type <type>   Content type: blog | social | hero | email  (adds layout guidance)
 *   --ref <path>    Reference image path (used as additional style context)
 *   --size <ratio>  1:1 | 16:9 | 9:16 | 4:3 | 3:4  (default: 16:9)
 *   --model <id>    Model override  (default: gemini-3-pro-image-preview)
 *   --out <dir>     Output directory  (default: ./output)
 *   --no-brand      Skip the Solv brand style layer (raw prompt only)
 *
 * Examples:
 *   npx ts-node generate.ts "The future of urgent care scheduling" --type blog
 *   npx ts-node generate.ts "How AI reduces no-shows" --type social --size 1:1
 *   npx ts-node generate.ts "Homepage hero — show the Solv dashboard" --type hero
 *   npx ts-node generate.ts "Q1 operator newsletter header" --type email
 *   npx ts-node generate.ts "Abstract purple gradient texture" --no-brand
 */

import { GoogleGenAI, Part } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { BRAND_STYLE, CONTENT_TYPE_STYLES } from "./brand";

dotenv.config();

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_MODEL        = "gemini-3-pro-image-preview";
const DEFAULT_ASPECT_RATIO = "16:9";
const VALID_ASPECT_RATIOS  = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
const VALID_TYPES          = ["blog", "social", "hero", "email"] as const;

type AspectRatio  = typeof VALID_ASPECT_RATIOS[number];
type ContentType  = typeof VALID_TYPES[number];

const MIME_TYPES: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
};

// Default sizes per content type when --size isn't specified
const DEFAULT_SIZES: Partial<Record<ContentType, AspectRatio>> = {
  blog:   "16:9",
  social: "1:1",
  hero:   "16:9",
  email:  "16:9",
};

// ── Arg parser ─────────────────────────────────────────────────────────────────

interface Args {
  prompt:   string;
  type:     ContentType | undefined;
  refPath:  string | undefined;
  size:     string;
  model:    string;
  outDir:   string;
  noBrand:  boolean;
}

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--no-brand") {
      flags["no-brand"] = true;
    } else if (argv[i].startsWith("--") && i + 1 < argv.length) {
      flags[argv[i].slice(2)] = argv[i + 1];
      i++;
    } else {
      positional.push(argv[i]);
    }
  }

  const type = flags["type"] as ContentType | undefined;

  return {
    prompt:  positional.join(" "),
    type:    VALID_TYPES.includes(type as ContentType) ? type : undefined,
    refPath: flags["ref"] as string | undefined,
    size:    (flags["size"] as string) ?? (type && DEFAULT_SIZES[type as ContentType]) ?? DEFAULT_ASPECT_RATIO,
    model:   (flags["model"] as string) ?? DEFAULT_MODEL,
    outDir:  (flags["out"] as string) ?? "./output",
    noBrand: flags["no-brand"] === true,
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

function buildPrompt(args: Args): string {
  const parts: string[] = [];

  // 1. User's creative direction
  parts.push(`SUBJECT / CONCEPT:\n${args.prompt}`);

  // 2. Brand style (unless --no-brand)
  if (!args.noBrand) {
    parts.push(`BRAND STYLE GUIDE (apply to all outputs):\n${BRAND_STYLE}`);
  }

  // 3. Content-type layout guidance
  if (args.type && CONTENT_TYPE_STYLES[args.type]) {
    parts.push(`CONTENT TYPE — ${args.type.toUpperCase()}:\n${CONTENT_TYPE_STYLES[args.type]}`);
  }

  return parts.join("\n\n");
}

function printUsage(): void {
  console.log(`
  Solv Image Generator — Solv brand style applied automatically

  Usage:
    npx ts-node generate.ts "prompt" [options]

  Options:
    --type <type>   ${VALID_TYPES.join(" | ")}  (sets layout context + default size)
    --ref <path>    Reference image for additional style context
    --size <ratio>  ${VALID_ASPECT_RATIOS.join(" | ")}
    --model <id>    Model ID  (default: ${DEFAULT_MODEL})
    --out <dir>     Output directory  (default: ./output)
    --no-brand      Skip Solv brand style (raw prompt only)

  Examples:
    npx ts-node generate.ts "The future of urgent care scheduling" --type blog
    npx ts-node generate.ts "How AI reduces no-shows by 40 percent" --type social --size 1:1
    npx ts-node generate.ts "Homepage hero showing the Solv dashboard in action" --type hero
    npx ts-node generate.ts "Q1 operator newsletter header" --type email
    npx ts-node generate.ts "Abstract purple gradient texture" --no-brand
`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.prompt) {
    printUsage();
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(`
  Error: GEMINI_API_KEY is not set.
  Add it to image-gen/.env — see .env.example for the format.
  Get a key at: https://aistudio.google.com/app/apikey
`);
    process.exit(1);
  }

  if (!VALID_ASPECT_RATIOS.includes(args.size as AspectRatio)) {
    console.error(`  Error: Invalid size "${args.size}". Valid: ${VALID_ASPECT_RATIOS.join(", ")}`);
    process.exit(1);
  }

  // Build the full prompt
  const fullPrompt = buildPrompt(args);
  const parts: Part[] = [];

  // Reference image (style context)
  if (args.refPath) {
    if (!fs.existsSync(args.refPath)) {
      console.error(`  Error: Reference image not found: ${args.refPath}`);
      process.exit(1);
    }
    const ext      = path.extname(args.refPath).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      console.error(`  Error: Unsupported image format "${ext}". Supported: ${Object.keys(MIME_TYPES).join(", ")}`);
      process.exit(1);
    }
    const imageData = fs.readFileSync(args.refPath).toString("base64");
    parts.push({ inlineData: { mimeType, data: imageData } });
    parts.push({ text: `Use the provided image as additional visual context and style reference.\n\n${fullPrompt}` });
  } else {
    parts.push({ text: fullPrompt });
  }

  // Log summary
  console.log(`
  Model   ${args.model}
  Type    ${args.type ?? "none"}
  Size    ${args.size}
  Brand   ${args.noBrand ? "off" : "on"}
  Prompt  ${args.prompt.slice(0, 80)}${args.prompt.length > 80 ? "…" : ""}${args.refPath ? `\n  Ref     ${args.refPath}` : ""}

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
    if (message.includes("API_KEY"))                               console.error("  → Check that your GEMINI_API_KEY is valid.");
    else if (message.includes("404") || message.includes("not found")) console.error(`  → Model "${args.model}" may not be available yet.\n  → Try: --model gemini-2.5-flash-image`);
    else if (message.includes("SAFETY") || message.includes("blocked")) console.error("  → Prompt was blocked by safety filters. Try rephrasing.");
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
        fs.mkdirSync(args.outDir, { recursive: true });

        const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const slug     = slugify(args.prompt);
        const label    = args.type ? `${args.type}--` : "";
        const filename = `${ts}--${label}${slug}.png`;
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
    const textPart = candidates[0]?.content?.parts?.find(
      (p: unknown) => (p as { text?: string }).text
    ) as { text?: string } | undefined;
    console.error("\n  No image returned in response.");
    if (textPart?.text) console.error(`  Model said: ${textPart.text}`);
    process.exit(1);
  }
}

main();
