/**
 * Generates app icon PNGs for all 12 mascot colors.
 * Run with: `node --experimental-strip-types scripts/generate-app-icons.ts`
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAUS_COLORS = {
  green: "#009957",
  blue: "#377FE6",
  red: "#D94B52",
  orange: "#E78531",
  purple: "#8057C8",
  cyan: "#0EA5C6",
  pink: "#D84F8B",
  yellow: "#D8A729",
  teal: "#01A492",
  coral: "#E5634E",
} as const;

type MausColor = keyof typeof MAUS_COLORS;

function mix(hex: string, toward: string, t: number): string {
  const a = Number.parseInt(hex.slice(1), 16);
  const b = Number.parseInt(toward.slice(1), 16);
  const channel = (shift: number) => {
    const va = (a >> shift) & 0xff;
    const vb = (b >> shift) & 0xff;
    return Math.round(va + (vb - va) * t);
  };
  return `#${[channel(16), channel(8), channel(0)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

function gradientFor(color: MausColor): [string, string, string] {
  const fill = MAUS_COLORS[color] ?? MAUS_COLORS.green;
  return [mix(fill, "#ffffff", 0.55), fill, mix(fill, "#000000", 0.42)];
}

function buildGradientStops([light, mid, dark]: [string, string, string]): string {
  return `
      <stop offset="0"    stop-color="${light}" />
      <stop offset="0.28" stop-color="${mix(mid, light, 0.5)}" />
      <stop offset="0.58" stop-color="${mid}" />
      <stop offset="0.82" stop-color="${mix(mid, dark, 0.5)}" />
      <stop offset="1"    stop-color="${dark}" />`.trim();
}

async function generateIcons() {
  const templatePath = join(__dirname, "..", "public", "app-icon.svg");
  const outputDir = join(__dirname, "..", "public", "icons");

  const template = readFileSync(templatePath, "utf8");

  mkdirSync(outputDir, { recursive: true });

  for (const color of Object.keys(MAUS_COLORS) as MausColor[]) {
    const [light, mid, dark] = gradientFor(color);
    const stops = buildGradientStops([light, mid, dark]);

    const svg = template.replace("{{GRADIENT_STOPS}}", stops);

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1024 },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    const outputPath = join(outputDir, `app-icon-${color}.png`);
    writeFileSync(outputPath, pngBuffer);

    console.log(`Generated ${outputPath} (${pngBuffer.length} bytes)`);
  }

  // Also generate the default (green) as app-icon.png for backwards compat
  const defaultColor: MausColor = "green";
  const [light, mid, dark] = gradientFor(defaultColor);
  const stops = buildGradientStops([light, mid, dark]);
  const svg = template.replace("{{GRADIENT_STOPS}}", stops);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } });
  const pngBuffer = resvg.render().asPng();
  writeFileSync(join(outputDir, "app-icon.png"), pngBuffer);
  console.log(`Generated default app-icon.png`);

  console.log("\nAll icons generated in public/icons/");
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});