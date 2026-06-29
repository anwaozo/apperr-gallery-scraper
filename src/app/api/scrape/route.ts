import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import JSZip from "jszip";

export const maxDuration = 60;
export const runtime = "nodejs";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

function resolveUrl(src: string, base: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function isLikelyRealImage(src: string): boolean {
  const lower = src.toLowerCase();
  // Skip tracking pixels, base64, data URIs, svg icons
  if (src.startsWith("data:")) return false;
  if (lower.includes("pixel") && lower.includes("1x1")) return false;
  if (lower.includes("spacer")) return false;
  const ext = lower.split("?")[0].split(".").pop() ?? "";
  const validExts = ["jpg", "jpeg", "png", "gif", "webp", "avif"];
  // If no extension, still allow (some CMSes serve images without extension)
  return validExts.includes(ext) || !ext;
}

export async function POST(req: NextRequest) {
  const { url, mode } = await req.json();

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // --- Fetch the page ---
  let html: string;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Could not fetch page: ${msg}` },
      { status: 502 }
    );
  }

  // --- Parse images ---
  const $ = cheerio.load(html);
  const seen = new Set<string>();

  $("img").each((_, el) => {
    const attrs = [
      "src",
      "data-src",
      "data-lazy-src",
      "data-original",
      "data-full-url",
      "data-large-file",
    ];
    for (const attr of attrs) {
      const val = $(el).attr(attr);
      if (val) {
        const resolved = resolveUrl(val, url);
        if (resolved && isLikelyRealImage(resolved)) seen.add(resolved);
      }
      // Handle srcset
      const srcset = $(el).attr("srcset") || $(el).attr("data-srcset");
      if (srcset) {
        srcset.split(",").forEach((part) => {
          const src = part.trim().split(/\s+/)[0];
          const resolved = resolveUrl(src, url);
          if (resolved && isLikelyRealImage(resolved)) seen.add(resolved);
        });
      }
    }
  });

  // Also pick up <a href> pointing to images
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(href)) {
      const resolved = resolveUrl(href, url);
      if (resolved) seen.add(resolved);
    }
  });

  const imageUrls = Array.from(seen);

  if (imageUrls.length === 0) {
    return NextResponse.json({ error: "No images found on that page." }, { status: 404 });
  }

  // --- Preview mode: just return URLs ---
  if (mode === "preview") {
    return NextResponse.json({ images: imageUrls });
  }

  // --- Zip mode: download all and zip ---
  const zip = new JSZip();
  const folder = zip.folder("gallery-images")!;
  let downloaded = 0;

  await Promise.allSettled(
    imageUrls.map(async (imgUrl, i) => {
      try {
        const res = await fetch(imgUrl, { headers: HEADERS });
        if (!res.ok) return;
        const buffer = await res.arrayBuffer();
        const rawName =
          decodeURIComponent(imgUrl.split("/").pop()?.split("?")[0] ?? "") ||
          `image-${i + 1}`;
        const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = safeName.includes(".") ? safeName : `${safeName}.jpg`;
        folder.file(filename, buffer);
        downloaded++;
      } catch {
        // skip failed images
      }
    })
  );

  if (downloaded === 0) {
    return NextResponse.json(
      { error: "Found images but could not download any." },
      { status: 502 }
    );
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const domain = new URL(url).hostname.replace("www.", "");

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${domain}-images.zip"`,
    },
  });
}
