"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PSTResult from "@/components/PSTResult";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function TestDetail() {
  const params = useParams();
  const id = params.id;
  const { t } = useLanguage();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tests/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(t("testNotFound"));
        return res.json();
      })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-navy-400">
        {t("loading")}
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-red-600 mb-4">{error || t("testNotFound")}</p>
        <Link href="/history" className="text-navy-600 hover:underline">
          {t("backToHistory")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/history"
          className="text-navy-500 hover:text-navy-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-navy-800">{t("testNumber")}{id}</h1>
      </div>
      <PSTResult result={result} />
    </div>
  );
}
