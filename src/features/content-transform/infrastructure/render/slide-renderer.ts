import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import type { LogoPosition } from "@/features/slide-template/domain/entities/slide-template.entity";

const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;
const LOGO_SIZE = 120;
const LOGO_MARGIN = 48;

type SlideTemplateLike = {
  backgroundColor?: string;
  backgroundImageUrl?: string | null;
  textColor?: string;
  fontFamily?: string;
  logoUrl?: string | null;
  logoPosition?: string | null;
};

const VALID_LOGO_POSITIONS: LogoPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

export async function renderSlideToPngBuffer(
  text: string,
  slideNumber: number,
  totalSlides: number,
  template: SlideTemplateLike | null
): Promise<Buffer> {
  const canvas = createCanvas(SLIDE_WIDTH, SLIDE_HEIGHT);
  const ctx = canvas.getContext("2d");

  const bgColor = template?.backgroundColor ?? "#18181B";
  const textColor = template?.textColor ?? "#FAFAFA";
  const fontFamily = template?.fontFamily ?? "sans-serif";

  if (template?.backgroundImageUrl) {
    try {
      const bgImage = await loadImage(template.backgroundImageUrl);
      ctx.drawImage(bgImage, 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    } catch {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
    }
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  }

  if (template?.logoUrl) {
    try {
      const logoImage = await loadImage(template.logoUrl);
      const { x, y } = getLogoPosition(normalizeLogoPosition(template.logoPosition));
      ctx.drawImage(logoImage, x, y, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // logo gagal load, lanjut tanpa logo
    }
  }

  ctx.fillStyle = textColor;
  ctx.font = `bold 56px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxWidth = SLIDE_WIDTH - 160;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = 70;
  const startY = SLIDE_HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => ctx.fillText(line, SLIDE_WIDTH / 2, startY + i * lineHeight));

  ctx.font = `32px ${fontFamily}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText(`${slideNumber} / ${totalSlides}`, SLIDE_WIDTH / 2, SLIDE_HEIGHT - 80);
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

function normalizeLogoPosition(position: string | null | undefined): LogoPosition {
  return VALID_LOGO_POSITIONS.includes(position as LogoPosition) ? (position as LogoPosition) : "top-left";
}

function getLogoPosition(position: LogoPosition): { x: number; y: number } {
  switch (position) {
    case "top-right": return { x: SLIDE_WIDTH - LOGO_SIZE - LOGO_MARGIN, y: LOGO_MARGIN };
    case "bottom-left": return { x: LOGO_MARGIN, y: SLIDE_HEIGHT - LOGO_SIZE - LOGO_MARGIN };
    case "bottom-right": return { x: SLIDE_WIDTH - LOGO_SIZE - LOGO_MARGIN, y: SLIDE_HEIGHT - LOGO_SIZE - LOGO_MARGIN };
    default: return { x: LOGO_MARGIN, y: LOGO_MARGIN };
  }
}

function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}