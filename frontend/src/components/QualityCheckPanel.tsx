"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  runQualityChecks,
  type QualityCheckResult,
  type QualityIssueDetail,
  type QualityIssueKey,
} from "@/lib/imageQuality";
import type { TranslationKey } from "@/lib/i18n";

const TITLE_KEY: Record<QualityIssueKey, TranslationKey> = {
  tooDark: "qcTooDarkTitle",
  tooBright: "qcTooBrightTitle",
  colorCastYellow: "qcColorCastYellowTitle",
  colorCastBlue: "qcColorCastBlueTitle",
  blurry: "qcBlurryTitle",
  noBottlesDetected: "qcNoBottlesTitle",
  tooLowRes: "qcTooLowResTitle",
};

const ADVICE_KEY: Record<QualityIssueKey, TranslationKey> = {
  tooDark: "qcTooDarkAdvice",
  tooBright: "qcTooBrightAdvice",
  colorCastYellow: "qcColorCastYellowAdvice",
  colorCastBlue: "qcColorCastBlueAdvice",
  blurry: "qcBlurryAdvice",
  noBottlesDetected: "qcNoBottlesAdvice",
  tooLowRes: "qcTooLowResAdvice",
};

const ICON_FOR: Record<QualityIssueKey, string> = {
  tooDark: "🌙",
  tooBright: "☀️",
  colorCastYellow: "💡",
  colorCastBlue: "❄️",
  blurry: "🫥",
  noBottlesDetected: "🔍",
  tooLowRes: "📐",
};

export default function QualityCheckPanel({
  imageCanvas,
  previewUrl,
  sourceWidth,
  sourceHeight,
  onPass,
  onRetake,
  onUseAnyway,
}: {
  imageCanvas: HTMLCanvasElement;
  previewUrl: string;
  sourceWidth?: number;
  sourceHeight?: number;
  onPass: () => void;
  onRetake: () => void;
  onUseAnyway: () => void;
}) {
  const { t } = useLanguage();
  const [result, setResult] = useState<QualityCheckResult | null>(null);

  useEffect(() => {
    const original =
      sourceWidth && sourceHeight ? { width: sourceWidth, height: sourceHeight } : undefined;
    setResult(runQualityChecks(imageCanvas, original));
  }, [imageCanvas, sourceWidth, sourceHeight]);

  // Auto-advance only when fully clean
  useEffect(() => {
    if (result && result.passed) {
      const timer = setTimeout(onPass, 350);
      return () => clearTimeout(timer);
    }
  }, [result, onPass]);

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
        <p className="text-sm text-navy-500">{t("qcRunning")}</p>
      </div>
    );
  }

  if (result.passed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">✓</span>
          <div>
            <h3 className="font-semibold text-emerald-800">{t("qcPassed")}</h3>
            <p className="text-sm text-emerald-700 mt-0.5">{t("qcPassedHint")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">!</span>
        <div className="flex-1">
          <h3 className="font-semibold text-navy-700">{t("qcFailedTitle")}</h3>
          <p className="text-sm text-navy-500 mt-0.5">{t("qcFailedSubtitle")}</p>
        </div>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="cropped preview"
          className="mt-4 max-h-40 mx-auto rounded-md shadow-sm"
        />
      )}

      <ul className="mt-4 space-y-3">
        {result.issues.map((issue) => (
          <Issue key={issue.key} issue={issue} t={t} />
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 mt-5">
        <button
          onClick={onRetake}
          className="flex-1 min-w-[140px] py-2.5 px-4 bg-navy-700 hover:bg-navy-800 text-white rounded-lg font-medium text-sm shadow-sm"
        >
          {t("qcRetake")}
        </button>
        <button
          onClick={onUseAnyway}
          className="py-2.5 px-4 text-navy-600 hover:text-navy-800 text-sm border border-navy-200 rounded-lg"
        >
          {t("qcUseAnyway")}
        </button>
      </div>
    </div>
  );
}

function Issue({
  issue,
  t,
}: {
  issue: QualityIssueDetail;
  t: (k: TranslationKey) => string;
}) {
  const isError = issue.severity === "error";
  return (
    <li
      className={`flex items-start gap-3 rounded-md px-3 py-3 border ${
        isError
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <span className="text-xl leading-none mt-0.5">{ICON_FOR[issue.key]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className={`text-sm font-semibold ${isError ? "text-red-800" : "text-amber-800"}`}>
            {t(TITLE_KEY[issue.key])}
          </h4>
          {issue.display && (
            <code className="text-[11px] text-navy-500 font-mono">
              {issue.display}
            </code>
          )}
        </div>
        <p className={`text-sm mt-1 leading-snug ${isError ? "text-red-700" : "text-amber-700"}`}>
          {t(ADVICE_KEY[issue.key])}
        </p>
      </div>
    </li>
  );
}
