"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  sampleColorAtPoint,
  rgbToCss,
  eventToImageCoords,
  type SampledColor,
} from "@/lib/colorPicker";
import { autoPickPoints } from "@/lib/autoPickColors";
import { synthesizeTwoColorBlob, applyWhiteBalance, decideWBAction } from "@/lib/synthesizeImage";

interface Props {
  imageUrl: string;
  onConfirm: (data: { blob: Blob; canvas: HTMLCanvasElement; previewUrl: string }) => void;
  onBack: () => void;
}

type ActivePicker = "standard" | "test" | "white";

interface PickedPoint {
  imgX: number;
  imgY: number;
  cssX: number;
  cssY: number;
  color: SampledColor;
}

export default function ColorPickerStep({ imageUrl, onConfirm, onBack }: Props) {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [active, setActive] = useState<ActivePicker>("standard");
  const [standard, setStandard] = useState<PickedPoint | null>(null);
  const [test, setTest] = useState<PickedPoint | null>(null);
  const [white, setWhite] = useState<PickedPoint | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  /** Auto-pick standard + test on image load. White stays empty — user-driven. */
  const handleImageLoad = useCallback(() => {
    setImgLoaded(true);
    const img = imgRef.current;
    if (!img) return;
    const auto = autoPickPoints(img);
    if (!auto) return;

    const rect = img.getBoundingClientRect();
    const scaleX = rect.width / img.naturalWidth;
    const scaleY = rect.height / img.naturalHeight;
    const toPicked = (p: { x: number; y: number; color: SampledColor }): PickedPoint => ({
      imgX: p.x,
      imgY: p.y,
      cssX: p.x * scaleX,
      cssY: p.y * scaleY,
      color: p.color,
    });

    setStandard(toPicked(auto.standard));
    setTest(toPicked(auto.test));
  }, []);

  /** Recompute marker CSS coords when the image element resizes. */
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const update = () => {
      const rect = img.getBoundingClientRect();
      const sx = rect.width / img.naturalWidth;
      const sy = rect.height / img.naturalHeight;
      const remap = (p: PickedPoint | null): PickedPoint | null =>
        p ? { ...p, cssX: p.imgX * sx, cssY: p.imgY * sy } : null;
      setStandard((p) => remap(p));
      setTest((p) => remap(p));
      setWhite((p) => remap(p));
    };
    const ro = new ResizeObserver(update);
    ro.observe(img);
    return () => ro.disconnect();
  }, [imgLoaded]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      const img = imgRef.current;
      if (!img) return;
      const coords = eventToImageCoords(e, img);
      if (!coords) return;
      const color = sampleColorAtPoint(img, coords.x, coords.y);
      if (!color) return;

      const rect = img.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      const point: PickedPoint = { imgX: coords.x, imgY: coords.y, cssX, cssY, color };

      if (active === "standard") {
        setStandard(point);
      } else if (active === "test") {
        setTest(point);
      } else {
        setWhite(point);
      }
    },
    [active]
  );

  const handleConfirm = async () => {
    if (!standard || !test) return;
    setBusy(true);
    try {
      const whiteRef = white ? { r: white.color.r, g: white.color.g, b: white.color.b } : null;
      const { blob, canvas } = await synthesizeTwoColorBlob(
        { r: standard.color.r, g: standard.color.g, b: standard.color.b },
        { r: test.color.r, g: test.color.g, b: test.color.b },
        whiteRef
      );
      const previewUrl = URL.createObjectURL(blob);
      onConfirm({ blob, canvas, previewUrl });
    } finally {
      setBusy(false);
    }
  };

  const canConfirm = !!standard && !!test && !busy;

  // For preview, also compute white-balanced versions of standard/test
  const whiteRef = white ? { r: white.color.r, g: white.color.g, b: white.color.b } : null;
  const wbAction = whiteRef ? decideWBAction(whiteRef) : null;
  const wbWillApply = wbAction?.kind === "apply";
  const previewStandard =
    whiteRef && standard
      ? applyWhiteBalance(
          { r: standard.color.r, g: standard.color.g, b: standard.color.b },
          whiteRef
        )
      : null;
  const previewTest =
    whiteRef && test
      ? applyWhiteBalance({ r: test.color.r, g: test.color.g, b: test.color.b }, whiteRef)
      : null;

  // Marker ring color reflects what will happen with this white reference
  // green = WB will fire and help; gray = already balanced (no-op); amber = looks wrong
  const whiteRingColor =
    wbAction?.kind === "apply"
      ? "#10b981"
      : wbAction?.kind === "skip-already-white"
      ? "#94a3b8"
      : "#f59e0b";

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-navy-700">{t("pickerTitle")}</h2>
        <p className="text-sm text-navy-500 mt-1">{t("pickerSubtitle")}</p>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <PickerTab
          label={t("pickerStandard")}
          colorDot={standard ? rgbToCss(standard.color) : undefined}
          active={active === "standard"}
          done={!!standard}
          onClick={() => setActive("standard")}
          step={1}
        />
        <PickerTab
          label={t("pickerTest")}
          colorDot={test ? rgbToCss(test.color) : undefined}
          active={active === "test"}
          done={!!test}
          onClick={() => setActive("test")}
          step={2}
        />
        <PickerTab
          label={t("pickerWhite")}
          optional
          colorDot={white ? rgbToCss(white.color) : undefined}
          active={active === "white"}
          done={!!white}
          onClick={() => setActive("white")}
          step={3}
          statusBadge={
            white && wbAction
              ? wbAction.kind === "apply"
                ? "✓"
                : wbAction.kind === "skip-already-white"
                ? "—"
                : "!"
              : undefined
          }
          statusColor={
            white && wbAction
              ? wbAction.kind === "apply"
                ? "#10b981"
                : wbAction.kind === "skip-already-white"
                ? "#94a3b8"
                : "#f59e0b"
              : undefined
          }
        />
      </div>

      <div className="relative bg-navy-900 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 250 }}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt="upload"
          onLoad={handleImageLoad}
          onClick={handleClick}
          crossOrigin="anonymous"
          className="cursor-crosshair"
          style={{ maxHeight: "60vh", maxWidth: "100%", display: "block", touchAction: "manipulation" }}
        />
        {imgLoaded && standard && (
          <Marker x={standard.cssX} y={standard.cssY} ringColor="#a78bfa" />
        )}
        {imgLoaded && test && (
          <Marker x={test.cssX} y={test.cssY} ringColor="#86efac" />
        )}
        {imgLoaded && white && (
          <Marker x={white.cssX} y={white.cssY} ringColor={whiteRingColor} />
        )}
      </div>

      <p className="text-xs text-navy-500 mt-2">
        {active === "standard"
          ? t("pickerHintStandardAuto")
          : active === "test"
          ? t("pickerHintTestAuto")
          : t("pickerHintWhite")}
      </p>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <ColorBlock
          title={t("pickerStandard")}
          point={standard}
          accent="#7c3aed"
          previewCorrected={previewStandard}
          isActive={active === "standard"}
          onSelect={() => setActive("standard")}
          onClear={standard ? () => setStandard(null) : undefined}
          t={t}
        />
        <ColorBlock
          title={t("pickerTest")}
          point={test}
          accent="#16a34a"
          previewCorrected={previewTest}
          isActive={active === "test"}
          onSelect={() => setActive("test")}
          onClear={test ? () => setTest(null) : undefined}
          t={t}
        />
        <ColorBlock
          title={t("pickerWhite")}
          point={white}
          accent="#f59e0b"
          isActive={active === "white"}
          onSelect={() => setActive("white")}
          onClear={white ? () => setWhite(null) : undefined}
          optionalLabel={t("pickerOptional")}
          t={t}
        />
      </div>

      {whiteRef && (() => {
        const action = decideWBAction(whiteRef);
        if (action.kind === "apply") {
          return (
            <p className="text-xs text-navy-500 mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
              <span>⚖️</span>
              {t("pickerWBApplied")}
            </p>
          );
        }
        if (action.kind === "skip-already-white") {
          return (
            <p className="text-xs text-emerald-700 mt-3 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
              <span>✓</span>
              {t("pickerWBSkipAlreadyWhite")}
            </p>
          );
        }
        return (
          <p className="text-xs text-amber-700 mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
            <span>⚠️</span>
            {t("pickerWBSkipNotWhite")}
          </p>
        );
      })()}

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
          disabled={!canConfirm}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg font-medium text-sm shadow-sm ${
            canConfirm
              ? "bg-navy-700 hover:bg-navy-800 text-white"
              : "bg-navy-200 text-navy-400 cursor-not-allowed"
          }`}
        >
          {busy ? t("cropProcessing") : t("pickerConfirm")}
        </button>
      </div>
    </div>
  );
}

function PickerTab({
  label,
  step,
  active,
  done,
  colorDot,
  optional,
  onClick,
  statusBadge,
  statusColor,
  disabled,
  disabledTooltip,
}: {
  label: string;
  step: number;
  active: boolean;
  done: boolean;
  colorDot?: string;
  optional?: boolean;
  onClick: () => void;
  statusBadge?: string;
  statusColor?: string;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledTooltip : undefined}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        disabled
          ? "bg-navy-50 text-navy-300 border-navy-100 cursor-not-allowed"
          : active
          ? "bg-navy-700 text-white border-navy-700"
          : done
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-white text-navy-600 border-navy-200 hover:border-navy-300"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
          active ? "bg-white text-navy-700" : done ? "bg-emerald-500 text-white" : "bg-navy-100 text-navy-500"
        }`}
      >
        {done ? "✓" : step}
      </span>
      <span>{label}</span>
      {optional && !done && (
        <span className="text-[10px] uppercase tracking-wide opacity-60">opt</span>
      )}
      {colorDot && (
        <span
          className="w-4 h-4 rounded-full ml-1 border border-white/40"
          style={{ background: colorDot }}
        />
      )}
      {statusBadge && statusColor && (
        <span
          className="w-4 h-4 rounded-full ml-1 flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: statusColor }}
          title={statusBadge}
        >
          {statusBadge}
        </span>
      )}
    </button>
  );
}

function Marker({
  x,
  y,
  ringColor,
}: {
  x: number;
  y: number;
  ringColor: string;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}px`, top: `${y}px`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="w-7 h-7 rounded-full border-2 shadow-md"
        style={{ borderColor: ringColor, background: "rgba(255,255,255,0.25)" }}
      />
      <div
        className="w-1 h-1 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ background: ringColor }}
      />
    </div>
  );
}

function ColorBlock({
  title,
  point,
  accent,
  onClear,
  previewCorrected,
  optionalLabel,
  isActive,
  onSelect,
  t,
}: {
  title: string;
  point: PickedPoint | null;
  accent: string;
  onClear?: () => void;
  previewCorrected?: { r: number; g: number; b: number } | null;
  optionalLabel?: string;
  isActive: boolean;
  onSelect: () => void;
  t: (k: any) => string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg overflow-hidden transition-all ${
        isActive
          ? "border-2 border-navy-700 shadow-md ring-2 ring-navy-700/20"
          : "border border-navy-100 hover:border-navy-300 hover:shadow-sm"
      }`}
    >
      <div
        className="aspect-[3/2] flex items-center justify-center text-[11px] font-mono text-center px-1"
        style={{
          background: point
            ? rgbToCss(point.color)
            : "repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 8px,#e2e8f0 8px,#e2e8f0 16px)",
          color: point ? readableTextColor(point.color) : "#64748b",
        }}
      >
        {point ? `${point.color.r},${point.color.g},${point.color.b}` : optionalLabel ?? t("pickerTapToPick")}
      </div>
      {previewCorrected && point && (
        <div
          className="h-5 flex items-center justify-center text-[10px] font-mono"
          style={{
            background: rgbToCss(previewCorrected),
            color: readableTextColor(previewCorrected),
          }}
          title={t("pickerWBPreview")}
        >
          → {previewCorrected.r},{previewCorrected.g},{previewCorrected.b}
        </div>
      )}
      <div className={`px-3 py-2 flex items-center gap-2 ${isActive ? "bg-navy-50" : "bg-white"}`}>
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <span className={`text-xs font-medium flex-1 truncate ${isActive ? "text-navy-900" : "text-navy-700"}`}>
          {title}
        </span>
        {isActive && (
          <span className="text-[10px] uppercase tracking-wide text-navy-700 font-semibold">
            {t("pickerActive")}
          </span>
        )}
        {onClear && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }
            }}
            className="text-[11px] text-navy-400 hover:text-navy-700 underline cursor-pointer"
          >
            {t("pickerReset")}
          </span>
        )}
      </div>
    </button>
  );
}

function readableTextColor(c: { r: number; g: number; b: number }): string {
  const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  return lum > 140 ? "#1e293b" : "#f8fafc";
}
