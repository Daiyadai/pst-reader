"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Threshold {
  max: number;
  label: string;
  color_class: string;
  is_clean: boolean;
}

export default function Settings() {
  const { t } = useLanguage();
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [calInfo, setCalInfo] = useState<any>(null);

  const COLOR_OPTIONS = [
    { value: "red", label: t("colorRed") },
    { value: "orange", label: t("colorOrange") },
    { value: "yellow", label: t("colorYellow") },
    { value: "green", label: t("colorGreen") },
    { value: "emerald", label: t("colorEmerald") },
  ];

  useEffect(() => {
    Promise.all([
      fetch("/api/thresholds").then((r) => r.json()),
      fetch("/api/calibration/info").then((r) => r.json()),
    ])
      .then(([thData, calData]) => {
        setThresholds(thData.thresholds);
        setCalInfo(calData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thresholds }),
      });
      if (!res.ok) throw new Error("save failed");
      setMessage(t("thresholdsSaved"));
    } catch {
      setMessage(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateThreshold = (index: number, field: string, value: any) => {
    const updated = [...thresholds];
    (updated[index] as any)[field] = value;
    setThresholds(updated);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-navy-400">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-6">{t("settings")}</h1>

      {calInfo && (
        <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-navy-700 mb-3">
            {t("calibrationModel")}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-navy-800">
                {calInfo.n_samples}
              </p>
              <p className="text-xs text-navy-400">{t("trainingSamples")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">
                {(calInfo.r_squared * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-navy-400">{t("rSquaredFit")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-navy-800">
                {thresholds.length}
              </p>
              <p className="text-xs text-navy-400">{t("thresholdLevels")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-navy-700 mb-4">
          {t("pstThresholds")}
        </h2>
        <p className="text-sm text-navy-400 mb-4">
          {t("thresholdsDescription")}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-navy-500 px-1">
            <div className="col-span-2">{t("maxPst")}</div>
            <div className="col-span-3">{t("levelName")}</div>
            <div className="col-span-3">{t("color")}</div>
            <div className="col-span-2">{t("isClean")}</div>
            <div className="col-span-2"></div>
          </div>

          {thresholds.map((th, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-center bg-navy-50 rounded-lg p-2"
            >
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  value={th.max}
                  onChange={(e) =>
                    updateThreshold(i, "max", parseFloat(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-navy-200 rounded text-sm"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  value={th.label}
                  onChange={(e) => updateThreshold(i, "label", e.target.value)}
                  className="w-full px-2 py-1 border border-navy-200 rounded text-sm"
                />
              </div>
              <div className="col-span-3">
                <select
                  value={th.color_class}
                  onChange={(e) =>
                    updateThreshold(i, "color_class", e.target.value)
                  }
                  className="w-full px-2 py-1 border border-navy-200 rounded text-sm"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 text-center">
                <input
                  type="checkbox"
                  checked={th.is_clean}
                  onChange={(e) =>
                    updateThreshold(i, "is_clean", e.target.checked)
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="col-span-2 text-right">
                <button
                  onClick={() =>
                    setThresholds(thresholds.filter((_, j) => j !== i))
                  }
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setThresholds([
              ...thresholds,
              { max: 1.0, label: t("newLevel"), color_class: "green", is_clean: true },
            ])
          }
          className="mt-3 text-sm text-navy-500 hover:text-navy-700"
        >
          {t("addLevel")}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-navy-700 hover:bg-navy-800 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveSettings")}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message === t("saveFailed") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
