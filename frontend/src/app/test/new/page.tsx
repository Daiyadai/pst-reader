"use client";

import { useState, useRef } from "react";
import PSTResult from "@/components/PSTResult";
import { useLanguage } from "@/lib/LanguageContext";

export default function NewTest() {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<File | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current = file;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  const canSubmit = !!preview && !loading;

  const handleAnalyze = async () => {
    if (!fileRef.current) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", fileRef.current);
      if (location) formData.append("location", location);
      if (notes) formData.append("notes", notes);

      const res = await fetch("/api/analyze-combined", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `${t("serverError")}: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || t("analysisFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-6">{t("testResult")}</h1>
        <PSTResult result={result} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-6">{t("newTest")}</h1>

      <div className="space-y-6">
        {/* Upload */}
        <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy-700 mb-4">
            {t("uploadSampleImage")}
          </h2>

          {preview ? (
            <div className="text-center">
              <img
                src={preview}
                alt="Sample"
                className="max-h-64 mx-auto rounded-lg shadow-sm mb-3"
              />
              <p className="text-sm text-navy-500 mb-2">{fileName}</p>
              <label className="inline-block cursor-pointer text-sm text-navy-500 hover:text-navy-700 underline">
                {t("changeImage")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-navy-200 rounded-xl p-6 text-center hover:border-navy-400 hover:bg-navy-50 transition-all">
                <div className="py-8">
                  <svg
                    className="w-10 h-10 text-navy-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-navy-600 font-medium">
                    {t("uploadInstruction")}
                  </p>
                  <p className="text-xs text-navy-400 mt-1">
                    {t("clickToSelect")}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          )}

          <p className="text-xs text-navy-400 mt-3">
            {t("autoSplitNote")}
          </p>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy-700 mb-4">
            {t("testDetails")}
          </h2>
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
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!canSubmit}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
            canSubmit
              ? "bg-navy-700 hover:bg-navy-800 text-white shadow-md"
              : "bg-navy-200 text-navy-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("analyzing")}
            </span>
          ) : (
            t("startAnalysis")
          )}
        </button>
      </div>
    </div>
  );
}
