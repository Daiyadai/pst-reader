"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-navy-800 mb-4">
          {t("appTitle")}
        </h1>
        <p className="text-lg text-navy-600 max-w-2xl mx-auto">
          {t("dashboardSubtitle")}
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <h2 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-6 text-center">
          {t("howItWorks")}
        </h2>
        <div className="flex items-start gap-6">
          {[
            { step: "1", text: t("dashboardStep1") },
            { step: "2", text: t("dashboardStep2") },
            { step: "3", text: t("dashboardStep3") },
          ].map((item) => (
            <div key={item.step} className="flex-1 flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-navy-700 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                {item.step}
              </span>
              <p className="text-sm text-navy-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/test/new"
          className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-md"
        >
          {t("startTest")}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
