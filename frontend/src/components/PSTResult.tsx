"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { translateLabel } from "@/lib/i18n";

interface PSTResultProps {
  result: {
    test_id: number;
    pst_value: number;
    is_clean: boolean;
    label: string;
    color_class: string;
    before_rgb: number[];
    after_rgb: number[];
    before_lab: { L: number; a: number; b: number };
    after_lab: { L: number; a: number; b: number };
    deltas: { delta_L: number; delta_a: number; delta_b: number; delta_E: number };
    before_image_url: string;
    after_image_url: string;
  };
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export default function PSTResult({ result }: PSTResultProps) {
  const { t, lang } = useLanguage();
  const colors = colorMap[result.color_class] || colorMap.green;
  const localizedLabel = translateLabel(result.label, lang);

  const rgbToHex = (rgb: number[]) =>
    `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

  return (
    <div className="space-y-6">
      {/* PST Value Card */}
      <div
        className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-8 text-center`}
      >
        <p className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">
          {t("pstValue")}
        </p>
        <p className={`text-6xl font-bold ${colors.text} mb-4 leading-none`}>
          {result.pst_value.toFixed(2)}
        </p>
        <p className={`text-xl font-semibold ${colors.text} mt-2`}>
          {localizedLabel}
        </p>
        <p className="text-sm text-navy-400 mt-3">
          {result.is_clean ? t("meetsThreshold") : t("belowThreshold")}
        </p>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-navy-100 p-4">
          <p className="text-sm font-semibold text-navy-600 mb-3">
            {t("standardReference")}
          </p>
          <img
            src={result.before_image_url}
            alt="Standard"
            className="w-full rounded-lg shadow-sm mb-3"
          />
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-navy-200 shadow-inner"
              style={{ backgroundColor: rgbToHex(result.before_rgb) }}
            />
            <div className="text-xs text-navy-500">
              <p>RGB: ({result.before_rgb.join(", ")})</p>
              <p>
                L*{result.before_lab.L} a*{result.before_lab.a} b*
                {result.before_lab.b}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-navy-100 p-4">
          <p className="text-sm font-semibold text-navy-600 mb-3">
            {t("testSampleResult")}
          </p>
          <img
            src={result.after_image_url}
            alt="Test Sample"
            className="w-full rounded-lg shadow-sm mb-3"
          />
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-navy-200 shadow-inner"
              style={{ backgroundColor: rgbToHex(result.after_rgb) }}
            />
            <div className="text-xs text-navy-500">
              <p>RGB: ({result.after_rgb.join(", ")})</p>
              <p>
                L*{result.after_lab.L} a*{result.after_lab.a} b*
                {result.after_lab.b}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Details */}
      <div className="bg-white rounded-xl border border-navy-100 p-6">
        <p className="text-sm font-semibold text-navy-600 mb-3">
          {t("colorAnalysis")}
        </p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Delta a*", value: result.deltas.delta_a },
            { label: "Delta L*", value: result.deltas.delta_L },
            { label: "Delta b*", value: result.deltas.delta_b },
            { label: "Delta E", value: result.deltas.delta_E },
          ].map((d) => (
            <div key={d.label} className="text-center">
              <p className="text-xs text-navy-400 mb-1">{d.label}</p>
              <p className="text-lg font-semibold text-navy-800">
                {d.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a
          href={`/api/reports/${result.test_id}/pdf?lang=${lang}`}
          className="flex-1 bg-navy-700 hover:bg-navy-800 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t("downloadPdf")}
        </a>
        <a
          href="/test/new"
          className="flex-1 bg-white hover:bg-navy-50 text-navy-700 text-center font-medium py-3 px-4 rounded-lg border border-navy-200 transition-colors"
        >
          {t("newTest")}
        </a>
      </div>
    </div>
  );
}
