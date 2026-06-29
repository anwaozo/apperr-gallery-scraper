"use client";
import { useState, useRef } from "react";
import styles from "./page.module.css";

type Phase = "idle" | "previewing" | "previewed" | "downloading" | "done" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePreview() {
    const trimmed = url.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setPhase("previewing");
    setError("");
    setImages([]);
    setProgress("Fetching page…");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, mode: "preview" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setImages(data.images);
      setPhase("previewed");
      setProgress("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
      setProgress("");
    }
  }

  async function handleDownload() {
    setPhase("downloading");
    setProgress(`Downloading ${images.length} images and zipping…`);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), mode: "zip" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="(.+?)"/);
      dl.download = match?.[1] ?? "gallery-images.zip";
      dl.click();
      setPhase("done");
      setProgress("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed.");
      setPhase("error");
      setProgress("");
    }
  }

  function reset() {
    setUrl("");
    setImages([]);
    setPhase("idle");
    setError("");
    setProgress("");
  }

  const busy = phase === "previewing" || phase === "downloading";

  return (
    <main className={styles.main}>
      {/* Nav */}
      <nav className={styles.nav}>
        <a href="https://apperr.com" target="_blank" rel="noreferrer" className={styles.logoWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.prod.website-files.com/674c57b8bc8863cb7e9c6a4b/674ef71f9243e8e3af0563d8_ApperrDesigns_Icon_White_RGB-1.png"
            alt="Apperr"
            className={styles.logoIcon}
          />
          <span className={styles.logoText}>Apperr</span>
        </a>
        <span className={styles.navTag}>Gallery Scraper</span>
      </nav>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>AI-Powered Tool</div>
          <h1 className={styles.title}>Gallery Image Scraper</h1>
          <p className={styles.subtitle}>
            Paste any public gallery URL to preview and download all images as a zip — built by Apperr.
          </p>
        </div>

        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && handlePreview()}
            placeholder="https://example.com/gallery"
            disabled={busy}
            style={{ flex: 1 }}
          />
          <button
            className={styles.btnPrimary}
            onClick={handlePreview}
            disabled={busy || !url.trim()}
          >
            {phase === "previewing" ? "Fetching…" : "Preview"}
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error}
            <button className={styles.retryBtn} onClick={reset}>Try again</button>
          </div>
        )}

        {progress && <p className={styles.progress}>{progress}</p>}

        {phase === "previewed" && images.length > 0 && (
          <>
            <div className={styles.resultsBar}>
              <span className={styles.count}>{images.length} images found</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className={styles.btnOutline} onClick={reset}>Clear</button>
                <button className={styles.btnPrimary} onClick={handleDownload}>
                  Download zip
                </button>
              </div>
            </div>
            <div className={styles.grid}>
              {images.map((src, i) => (
                <div key={i} className={styles.imgCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Image ${i + 1}`}
                    className={styles.thumb}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {phase === "downloading" && (
          <div className={styles.downloadingState}>
            <div className={styles.spinner} />
            <p>{progress}</p>
          </div>
        )}

        {phase === "done" && (
          <div className={styles.successBox}>
            ✓ Zip downloaded!{" "}
            <button className={styles.retryBtn} onClick={reset}>Scrape another page</button>
          </div>
        )}
      </div>

      <p className={styles.footer}>
        Built by <a href="https://apperr.com" target="_blank" rel="noreferrer">Apperr</a> · info@apperr.com
      </p>
    </main>
  );
}
