"use client";

import { useLanguage } from "@/lib/LanguageContext";

/**
 * 4-panel comic-style guide that shows what a good photo looks like.
 *
 * Default behavior: shows on EVERY visit (helpful for the field team) until
 * the user explicitly clicks "Don't show again", which sets a localStorage
 * flag that suppresses it. They can always re-show via the "Photo tips" link.
 *
 * Pure SVG placeholders for now — replace each panel's icon component with
 * an AI-generated illustration later.
 */
export default function PhotoGuidelines({
  onContinue,
  onDontShowAgain,
}: {
  onContinue: () => void;
  onDontShowAgain: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-navy-700 mb-1">
        {t("guidelinesTitle")}
      </h2>
      <p className="text-sm text-navy-500 mb-4">{t("guidelinesSubtitle")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Panel index={1} title={t("guidelinePosition")} caption={t("guidelinePositionCaption")}>
          <PositionIcon />
        </Panel>
        <Panel index={2} title={t("guidelineDistance")} caption={t("guidelineDistanceCaption")}>
          <DistanceIcon />
        </Panel>
        <Panel index={3} title={t("guidelineAngle")} caption={t("guidelineAngleCaption")}>
          <AngleIcon />
        </Panel>
        <Panel index={4} title={t("guidelineLighting")} caption={t("guidelineLightingCaption")}>
          <LightingIcon />
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={onContinue}
          className="flex-1 min-w-[140px] py-2.5 px-4 bg-navy-700 hover:bg-navy-800 text-white rounded-lg font-medium text-sm shadow-sm"
        >
          {t("guidelinesGotIt")}
        </button>
        <button
          onClick={onDontShowAgain}
          className="py-2.5 px-4 text-navy-500 hover:text-navy-700 text-sm border border-navy-200 rounded-lg"
        >
          {t("guidelinesDontShowAgain")}
        </button>
      </div>
    </div>
  );
}

function Panel({
  index,
  title,
  caption,
  children,
}: {
  index: number;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/40 overflow-hidden">
      <div className="aspect-square bg-white border-b border-navy-100 flex items-center justify-center relative">
        <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center">
          {index}
        </span>
        {children}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-navy-700">{title}</h3>
        <p className="text-xs text-navy-500 mt-1 leading-snug">{caption}</p>
      </div>
    </div>
  );
}

/* --- Panel illustrations (SVG placeholders) --- */

function PositionIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
      <rect x="20" y="80" width="60" height="3" fill="#cbd5e1" />
      {/* Two cylinders side by side, centered */}
      <rect x="35" y="35" width="11" height="45" rx="2" stroke="#475569" strokeWidth="1.5" />
      <rect x="54" y="35" width="11" height="45" rx="2" stroke="#475569" strokeWidth="1.5" />
      <rect x="35" y="50" width="11" height="30" fill="#a78bfa" opacity="0.85" />
      <rect x="54" y="50" width="11" height="30" fill="#86efac" opacity="0.85" />
      {/* Centering crosshair */}
      <line x1="50" y1="20" x2="50" y2="30" stroke="#16a34a" strokeWidth="1.2" />
      <line x1="45" y1="25" x2="55" y2="25" stroke="#16a34a" strokeWidth="1.2" />
    </svg>
  );
}

function DistanceIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
      {/* Phone outline */}
      <rect x="20" y="65" width="22" height="32" rx="3" stroke="#475569" strokeWidth="1.5" />
      <circle cx="31" cy="80" r="3" fill="#475569" />
      {/* Frame lines (FOV) */}
      <line x1="42" y1="68" x2="80" y2="35" stroke="#94a3b8" strokeDasharray="2,2" strokeWidth="1" />
      <line x1="42" y1="93" x2="80" y2="80" stroke="#94a3b8" strokeDasharray="2,2" strokeWidth="1" />
      {/* Bottles inside frame */}
      <rect x="63" y="48" width="6" height="30" rx="1" stroke="#475569" strokeWidth="1.2" />
      <rect x="73" y="48" width="6" height="30" rx="1" stroke="#475569" strokeWidth="1.2" />
      <rect x="63" y="58" width="6" height="20" fill="#a78bfa" opacity="0.85" />
      <rect x="73" y="58" width="6" height="20" fill="#86efac" opacity="0.85" />
      <text x="56" y="20" fontSize="8" fill="#16a34a" fontWeight="600">
        ✓
      </text>
    </svg>
  );
}

function AngleIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
      {/* Vertical phone */}
      <rect x="42" y="20" width="22" height="60" rx="3" stroke="#475569" strokeWidth="1.5" />
      <circle cx="53" cy="73" r="2.5" fill="#475569" />
      {/* Plumb line */}
      <line x1="53" y1="14" x2="53" y2="86" stroke="#16a34a" strokeWidth="1" strokeDasharray="2,2" />
      {/* Tilted phone (crossed out) */}
      <g transform="rotate(-25 25 50)" opacity="0.4">
        <rect x="14" y="35" width="22" height="30" rx="3" stroke="#dc2626" strokeWidth="1.5" />
      </g>
      <line x1="14" y1="38" x2="36" y2="60" stroke="#dc2626" strokeWidth="1.5" />
    </svg>
  );
}

function LightingIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-3/4 h-3/4" fill="none">
      {/* Sun rays */}
      <circle cx="50" cy="30" r="9" stroke="#f59e0b" strokeWidth="1.5" fill="#fef3c7" />
      <g stroke="#f59e0b" strokeWidth="1.2">
        <line x1="50" y1="14" x2="50" y2="20" />
        <line x1="50" y1="40" x2="50" y2="46" />
        <line x1="34" y1="30" x2="40" y2="30" />
        <line x1="60" y1="30" x2="66" y2="30" />
        <line x1="38" y1="18" x2="42" y2="22" />
        <line x1="58" y1="22" x2="62" y2="18" />
        <line x1="38" y1="42" x2="42" y2="38" />
        <line x1="58" y1="38" x2="62" y2="42" />
      </g>
      {/* Even-lit cylinders below */}
      <rect x="38" y="58" width="9" height="32" rx="2" stroke="#475569" strokeWidth="1.2" />
      <rect x="53" y="58" width="9" height="32" rx="2" stroke="#475569" strokeWidth="1.2" />
      <rect x="38" y="70" width="9" height="20" fill="#a78bfa" opacity="0.85" />
      <rect x="53" y="70" width="9" height="20" fill="#86efac" opacity="0.85" />
    </svg>
  );
}
