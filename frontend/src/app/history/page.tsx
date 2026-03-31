"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { translateLabel, getDateLocale } from "@/lib/i18n";

interface TestSummary {
  id: number;
  pst_value: number;
  is_clean: boolean;
  label: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function History() {
  const { t, lang } = useLanguage();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => res.json())
      .then(setTests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">{t("history")}</h1>
        <Link
          href="/test/new"
          className="bg-navy-700 hover:bg-navy-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {t("newTest")}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-navy-400">{t("loading")}</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-navy-100">
          <svg
            className="w-12 h-12 text-navy-200 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-navy-500 mb-4">{t("noTestRecords")}</p>
          <Link
            href="/test/new"
            className="text-navy-600 hover:text-navy-800 font-medium underline"
          >
            {t("startFirstTest")}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-800 text-white text-sm">
                <th className="text-left py-3 px-4 font-medium">{t("colId")}</th>
                <th className="text-left py-3 px-4 font-medium">{t("colDate")}</th>
                <th className="text-left py-3 px-4 font-medium">{t("colPstValue")}</th>
                <th className="text-left py-3 px-4 font-medium">{t("colStatus")}</th>
                <th className="text-left py-3 px-4 font-medium">{t("colLocation")}</th>
                <th className="text-left py-3 px-4 font-medium">{t("colNotes")}</th>
                <th className="text-right py-3 px-4 font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr
                  key={test.id}
                  className="border-t border-navy-50 hover:bg-navy-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-navy-600">
                    #{test.id}
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {new Date(test.created_at).toLocaleDateString(getDateLocale(lang))}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-navy-800">
                      {test.pst_value.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.is_clean
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {translateLabel(test.label, lang)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-500">
                    {test.location || "\u2014"}
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-500">
                    {test.notes || "\u2014"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/test/${test.id}`}
                        className="text-navy-500 hover:text-navy-700 text-sm font-medium"
                      >
                        {t("view")}
                      </Link>
                      <a
                        href={`/api/reports/${test.id}/pdf?lang=${lang}`}
                        className="text-navy-500 hover:text-navy-700 text-sm font-medium"
                      >
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
