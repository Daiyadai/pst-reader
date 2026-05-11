"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useLanguage } from "@/lib/LanguageContext";
import { suggestCropBox, canvasToBlob } from "@/lib/autoCrop";
import type { UpscaledImage } from "@/lib/autoUpscale";
import BottleLayoutOverlay from "./BottleLayoutOverlay";

interface CropStepProps {
  imageUrl: string;
  autoUpscaleInfo?: UpscaledImage | null;
  onConfirm: (cropped: { blob: Blob; canvas: HTMLCanvasElement; previewUrl: string }) => void;
  onBack: () => void;
}

const OUTPUT_W = 960;
const OUTPUT_H = 720;
const ASPECT = OUTPUT_W / OUTPUT_H;

export default function CropStep({ imageUrl, autoUpscaleInfo, onConfirm, onBack }: CropStepProps) {
  const { t } = useLanguage();

  // workUrl is the (possibly upscaled / rotated) version we display + crop from.
  // We keep the ORIGINAL imageUrl untouched so users can reset.
  const [workUrl, setWorkUrl] = useState<string>(imageUrl);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);
  const [scale, setScale] = useState(1);   // 1 = original, 2 = upscaled
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previousWorkUrl = useRef<string>(imageUrl);

  // When the source URL changes (parent passes new image), reset everything.
  useEffect(() => {
    setWorkUrl(imageUrl);
    setScale(1);
    setRotation(0);
    setAutoApplied(false);
  }, [imageUrl]);

  // Revoke any object URL we generated when it changes
  useEffect(() => {
    return () => {
      if (previousWorkUrl.current !== imageUrl && previousWorkUrl.current.startsWith("blob:")) {
        URL.revokeObjectURL(previousWorkUrl.current);
      }
      previousWorkUrl.current = workUrl;
    };
  }, [workUrl, imageUrl]);

  // When the displayed image loads, set the initial crop from auto-detection
  // (only on the first load — subsequent rotates/upscales preserve user's crop).
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (autoApplied) return;
      const img = e.currentTarget;
      try {
        const box = suggestCropBox(img);
        const widthPct = (box.width / img.naturalWidth) * 100;
        const heightPct = (box.height / img.naturalHeight) * 100;
        const xPct = (box.x / img.naturalWidth) * 100;
        const yPct = (box.y / img.naturalHeight) * 100;
        setCrop({ unit: "%", x: xPct, y: yPct, width: widthPct, height: heightPct });
      } catch {
        // Fallback to a centered 4:3 crop covering 80% of the image
        setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 80 }, ASPECT, img.width, img.height), img.width, img.height));
      }
      setAutoApplied(true);
    },
    [autoApplied]
  );

  // ---- Image transforms (rotate / upscale) ----

  /** Apply a transformation to the current work image and update workUrl. */
  const transformImage = async (
    transform: (sourceCanvas: HTMLCanvasElement) => HTMLCanvasElement
  ) => {
    const sourceImg = imgRef.current;
    if (!sourceImg) return;
    setBusy(true);
    try {
      // Draw current image onto a canvas
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = sourceImg.naturalWidth;
      sourceCanvas.height = sourceImg.naturalHeight;
      const sctx = sourceCanvas.getContext("2d");
      if (!sctx) return;
      sctx.drawImage(sourceImg, 0, 0);
      const out = transform(sourceCanvas);
      const blob = await canvasToBlob(out);
      const url = URL.createObjectURL(blob);
      setWorkUrl(url);
      setAutoApplied(false); // recompute crop on new image
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = () =>
    transformImage((src) => {
      const rotated = document.createElement("canvas");
      rotated.width = src.height;
      rotated.height = src.width;
      const ctx = rotated.getContext("2d");
      if (!ctx) return src;
      ctx.translate(rotated.width / 2, rotated.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(src, -src.width / 2, -src.height / 2);
      setRotation((r) => (r + 90) % 360);
      return rotated;
    });

  const handleUpscale = () =>
    transformImage((src) => {
      const up = document.createElement("canvas");
      up.width = src.width * 2;
      up.height = src.height * 2;
      const ctx = up.getContext("2d");
      if (!ctx) return src;
      // Bilinear (default) — does not add real detail, only smooths. Useful
      // when source is small so the crop UI is more comfortable to use.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, up.width, up.height);
      setScale((s) => Math.min(s * 2, 4));
      return up;
    });

  // ---- Confirm: render the chosen crop to a fixed-size output canvas ----

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !completedCrop) return;
    setBusy(true);
    try {
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const sx = completedCrop.x * scaleX;
      const sy = completedCrop.y * scaleY;
      const sw = completedCrop.width * scaleX;
      const sh = completedCrop.height * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_W, OUTPUT_H);
      const blob = await canvasToBlob(canvas);
      const previewUrl = URL.createObjectURL(blob);
      onConfirm({ blob, canvas, previewUrl });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-navy-700">{t("cropTitle")}</h2>
        <p className="text-sm text-navy-500 mt-1">
          {autoApplied ? t("cropAutoSuggested") : t("cropManualHint")}
        </p>
        {autoUpscaleInfo && autoUpscaleInfo.scale > 1 && (
          <p className="text-xs text-navy-500 mt-2 inline-flex items-center gap-1.5 bg-navy-50 border border-navy-100 rounded-md px-2.5 py-1">
            <span className="text-base leading-none">✨</span>
            {t("cropAutoUpscaled").replace(
              "{scale}",
              `${autoUpscaleInfo.scale}×`,
            ).replace(
              "{from}",
              `${autoUpscaleInfo.originalWidth}×${autoUpscaleInfo.originalHeight}`,
            ).replace(
              "{to}",
              `${autoUpscaleInfo.width}×${autoUpscaleInfo.height}`,
            )}
          </p>
        )}
      </div>

      <div className="relative w-full bg-navy-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 300 }}>
        <ReactCrop
          crop={crop}
          onChange={(_, percent) => setCrop(percent)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={ASPECT}
          keepSelection
          className="max-h-[60vh]"
        >
          <img
            ref={imgRef}
            src={workUrl}
            alt="upload"
            onLoad={onImageLoad}
            crossOrigin="anonymous"
            style={{ maxHeight: "60vh", display: "block" }}
          />
        </ReactCrop>
        {showOverlay && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full opacity-50">
              <BottleLayoutOverlay variant="overlay" />
            </div>
          </div>
        )}
      </div>

      {/* Tools row */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          type="button"
          onClick={handleRotate}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-navy-700 border border-navy-200 rounded-md hover:bg-navy-50 disabled:opacity-50"
          title={t("cropRotate")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75V4.5m0 0h5.25M3 4.5l5.25 5.25M21 14.25v5.25m0 0h-5.25M21 19.5l-5.25-5.25" />
          </svg>
          {t("cropRotate")}
        </button>
        <button
          type="button"
          onClick={handleUpscale}
          disabled={busy || scale >= 4}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-navy-700 border border-navy-200 rounded-md hover:bg-navy-50 disabled:opacity-50"
          title={t("cropUpscaleHint")}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h6m-6 0v6m0-6L10.5 12M21 19.5h-6m6 0v-6m0 6L13.5 12" />
          </svg>
          {t("cropUpscale")} ({scale}×)
        </button>
        <button
          type="button"
          onClick={() => setShowOverlay((v) => !v)}
          className="text-xs text-navy-500 hover:text-navy-700 underline ml-auto"
        >
          {showOverlay ? t("cropHideGuide") : t("cropShowGuide")}
        </button>
      </div>
      <p className="text-xs text-navy-400 mt-2">{t("cropUpscaleHint")}</p>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={onBack}
          disabled={busy}
          className="py-2.5 px-4 text-navy-600 hover:text-navy-800 text-sm border border-navy-200 rounded-lg disabled:opacity-50"
        >
          {t("back")}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!completedCrop || busy}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg font-medium text-sm shadow-sm ${
            !completedCrop || busy
              ? "bg-navy-200 text-navy-400 cursor-not-allowed"
              : "bg-navy-700 hover:bg-navy-800 text-white"
          }`}
        >
          {busy ? t("cropProcessing") : t("cropConfirm")}
        </button>
      </div>
    </div>
  );
}
