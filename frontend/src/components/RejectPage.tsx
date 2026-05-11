"use client";

import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

export type RejectReason =
  | "no_bottles"
  | "too_dark"
  | "too_bright"
  | "too_blurry"
  | "too_low_res";

const TITLE_KEY: Record<RejectReason, TranslationKey> = {
  no_bottles: "rejectNoBottlesTitle",
  too_dark: "rejectTooDarkTitle",
  too_bright: "rejectTooBrightTitle",
  too_blurry: "rejectTooBlurryTitle",
  too_low_res: "rejectTooLowResTitle",
};

const ADVICE_KEY: Record<RejectReason, TranslationKey> = {
  no_bottles: "rejectNoBottlesAdvice",
  too_dark: "rejectTooDarkAdvice",
  too_bright: "rejectTooBrightAdvice",
  too_blurry: "rejectTooBlurryAdvice",
  too_low_res: "rejectTooLowResAdvice",
};

const ICON_FOR: Record<RejectReason, string> = {
  no_bottles: "🫥",
  too_dark: "🌙",
  too_bright: "☀️",
  too_blurry: "💨",
  too_low_res: "📐",
};

export default function RejectPage({
  reason,
  detail,
  uploadedImageUrl,
  onRetake,
}: {
  reason: RejectReason;
  detail?: Record<string, unknown>;
  uploadedImageUrl?: string | null;
  onRetake: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl leading-none">{ICON_FOR[reason]}</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-800">
            {t("rejectHeading")}
          </h2>
          <p className="text-sm text-red-700 mt-0.5">
            {t("rejectSubheading")}
          </p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
        <h3 className="text-base font-semibold text-red-900 mb-1.5">
          {t(TITLE_KEY[reason])}
        </h3>
        <p className="text-sm text-red-800 leading-snug">
          {t(ADVICE_KEY[reason])}
        </p>
        {detail && Object.keys(detail).length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-red-700 cursor-pointer">
              {t("rejectShowDetails")}
            </summary>
            <pre className="text-[11px] font-mono text-red-700 mt-2 overflow-x-auto">
              {JSON.stringify(detail, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {uploadedImageUrl && (
        <div className="mb-4">
          <p className="text-xs text-navy-500 mb-1.5">{t("rejectYourUpload")}</p>
          <img
            src={uploadedImageUrl}
            alt="rejected upload"
            className="max-h-40 mx-auto rounded-md shadow-sm border border-navy-100"
          />
        </div>
      )}

      <button
        onClick={onRetake}
        className="w-full py-2.5 px-4 bg-navy-700 hover:bg-navy-800 text-white rounded-lg font-medium text-sm shadow-sm"
      >
        {t("rejectRetake")}
      </button>
    </div>
  );
}
