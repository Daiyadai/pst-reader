"use client";

import { useEffect, useRef, useState } from "react";
import PSTResult from "@/components/PSTResult";
import PhotoGuidelines from "@/components/PhotoGuidelines";
import ColorPickerStep from "@/components/ColorPickerStep";
import RejectPage, { type RejectReason } from "@/components/RejectPage";
import BottleLayoutOverlay from "@/components/BottleLayoutOverlay";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Flow:
 *   1. guidelines  — 4-panel comic (skippable via "don't show again")
 *   2. upload      — pick a file
 *   3. preparing   — POST to /api/validate-and-prepare
 *                    backend auto-upscales, detects bottles, auto-crops,
 *                    runs quality checks, conservatively auto-WBs, and
 *                    runs analysis on the prepared image.
 *   4a. result     — show PST (happy path)
 *   4b. rejected   — show reason + advice (gatekeeper path)
 *   4c. pick       — manual color picker fallback (user opted in)
 */
type Step =
  | "guidelines"
  | "upload"
  | "preparing"
  | "result"
  | "rejected"
  | "pick";

const GUIDELINES_SUPPRESSED_KEY = "pst.guidelinesSuppressed.v1";

export default function NewTest() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("upload");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<RejectReason | null>(null);
  const [rejectDetail, setRejectDetail] = useState<Record<string, unknown>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(GUIDELINES_SUPPRESSED_KEY)) {
      setStep("guidelines");
    }
  }, []);

  function resetAll() {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setOriginalName(null);
    setOriginalFile(null);
    setError(null);
    setRejectReason(null);
    setRejectDetail({});
    setResult(null);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resetAll();
    setOriginalFile(file);
    setOriginalName(file.name);
    setOriginalUrl(URL.createObjectURL(file));
    setStep("preparing");
    await runPipeline(file);
  }

  async function runPipeline(file: File) {
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (location) fd.append("location", location);
      if (notes) fd.append("notes", notes);

      const res = await fetch("/api/validate-and-prepare", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `${t("serverError")}: ${res.status}`);
      }
      const data = await res.json();
      if (data.approved) {
        setResult(data);
        setStep("result");
      } else {
        setRejectReason((data.reject_reason as RejectReason) ?? "no_bottles");
        setRejectDetail(data.reject_detail ?? {});
        setStep("rejected");
      }
    } catch (err: any) {
      setError(err.message || t("analysisFailed"));
      setStep("upload");
    }
  }

  function handleGuidelinesContinue() {
    setStep("upload");
  }

  function handleGuidelinesDontShowAgain() {
    if (typeof window !== "undefined") {
      localStorage.setItem(GUIDELINES_SUPPRESSED_KEY, "1");
    }
    setStep("upload");
  }

  function handleRetake() {
    resetAll();
    setStep("upload");
    setTimeout(() => fileInputRef.current?.click(), 0);
  }

  function handleManualFallback() {
    if (!originalUrl) return;
    setStep("pick");
  }

  async function handleManualPickConfirm(data: {
    blob: Blob;
    canvas: HTMLCanvasElement;
    previewUrl: string;
  }) {
    setStep("preparing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", data.blob, "manual.jpg");
      if (location) fd.append("location", location);
      if (notes) fd.append("notes", notes);
      const res = await fetch("/api/analyze-combined", { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `${t("serverError")}: ${res.status}`);
      }
      const json = await res.json();
      setResult({ ...json, approved: true });
      setStep("result");
    } catch (err: any) {
      setError(err.message || t("analysisFailed"));
      setStep("pick");
    }
  }

  if (step === "result" && result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-6">{t("testResult")}</h1>
        <PSTResult result={result} />
        {result.wb_applied && (
          <p className="mt-3 text-xs text-navy-500 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5">
            <span>⚖️</span>
            {t("resultWBApplied")}
          </p>
        )}

        {/* Fine-tune option — preserves the clean auto flow but offers a manual
            refine button for the rare case where the auto result looks off. */}
        {(result.prepared_image_url || originalUrl) && (
          <div className="mt-6 bg-navy-50/40 border border-navy-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">🎯</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-navy-700">
                  {t("resultFineTuneTitle")}
                </h3>
                <p className="text-xs text-navy-500 mt-1 leading-snug">
                  {t("resultFineTuneSubtitle")}
                </p>
              </div>
              <button
                onClick={() => {
                  setStep("pick");
                }}
                className="text-sm text-navy-700 hover:text-navy-800 underline whitespace-nowrap"
              >
                {t("resultFineTuneButton")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">{t("newTest")}</h1>
        {step !== "guidelines" && (
          <button
            onClick={() => setStep("guidelines")}
            className="text-sm text-navy-500 hover:text-navy-700 underline"
          >
            {t("guidelinesShowAgain")}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {step === "guidelines" && (
          <PhotoGuidelines
            onContinue={handleGuidelinesContinue}
            onDontShowAgain={handleGuidelinesDontShowAgain}
          />
        )}

        {step === "upload" && (
          <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              {t("uploadSampleImage")}
            </h2>
            <label className="block cursor-pointer group">
              <div className="rounded-xl bg-navy-50/50 hover:bg-navy-50 transition-all overflow-hidden">
                <div className="px-4 pt-4">
                  <p className="text-xs text-navy-500 text-center mb-2">
                    {t("uploadIdealHint")}
                  </p>
                  <div className="aspect-[4/3] mx-auto max-w-md">
                    <BottleLayoutOverlay variant="template" />
                  </div>
                </div>
                <div className="px-4 pb-5 pt-2 text-center border-t border-navy-100 mt-3">
                  <p className="text-sm text-navy-700 font-medium group-hover:text-navy-800">
                    {t("uploadInstruction")}
                  </p>
                  <p className="text-xs text-navy-400 mt-1">{t("clickToSelect")}</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-navy-400 mt-3">{t("uploadPipelineNote")}</p>
          </div>
        )}

        {step === "preparing" && (
          <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg className="animate-spin h-5 w-5 text-navy-700" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <h2 className="text-base font-semibold text-navy-700">{t("preparingTitle")}</h2>
                <p className="text-xs text-navy-500 mt-0.5">{t("preparingSubtitle")}</p>
              </div>
            </div>
            <ul className="text-xs text-navy-500 space-y-1 ml-8">
              <li>· {t("preparingStep1")}</li>
              <li>· {t("preparingStep2")}</li>
              <li>· {t("preparingStep3")}</li>
              <li>· {t("preparingStep4")}</li>
            </ul>
          </div>
        )}

        {step === "rejected" && rejectReason && (
          <>
            <RejectPage
              reason={rejectReason}
              detail={rejectDetail}
              uploadedImageUrl={originalUrl}
              onRetake={handleRetake}
            />
            <div className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm">
              <p className="text-xs text-navy-500 mb-2">{t("rejectManualOverridePrompt")}</p>
              <button
                onClick={handleManualFallback}
                className="text-sm text-navy-600 hover:text-navy-800 underline"
              >
                {t("rejectManualOverrideButton")}
              </button>
            </div>
          </>
        )}

        {step === "pick" && (result?.prepared_image_url || originalUrl) && (
          <ColorPickerStep
            // Prefer the auto-cropped prepared image when available — it's
            // already framed correctly so the picker just samples colors.
            // Falls back to the raw upload when we got there via reject path.
            imageUrl={result?.prepared_image_url ?? originalUrl ?? ""}
            onConfirm={handleManualPickConfirm}
            onBack={() => {
              if (result) setStep("result");
              else if (rejectReason) setStep("rejected");
              else setStep("upload");
            }}
          />
        )}

        {(step === "upload" || step === "pick") && (
          <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-navy-700 mb-4">{t("testDetails")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">
                  {t("location")}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-navy-400 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-600 mb-1">
                  {t("notes")}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-navy-400 outline-none text-sm"
                />
              </div>
            </div>
            {originalName && (
              <p className="text-xs text-navy-400 mt-3">📎 {originalName}</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
