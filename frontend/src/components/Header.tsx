"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { Language } from "@/lib/i18n";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
  { value: "de", label: "DE" },
];

export default function Header() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { href: "/", label: t("navDashboard") },
    { href: "/test/new", label: t("navNewTest") },
    { href: "/history", label: t("navHistory") },
    { href: "/settings", label: t("navSettings") },
  ];

  return (
    <header className="bg-navy-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-navy-400 flex items-center justify-center font-bold text-sm">
                PST
              </div>
              <span className="font-semibold text-lg tracking-tight">
                {t("appTitle")}
              </span>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-navy-700 text-white"
                      : "text-navy-200 hover:bg-navy-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-navy-700 text-navy-100 text-sm rounded-md px-2 py-1 border border-navy-600 focus:outline-none focus:ring-1 focus:ring-navy-400 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-navy-300">v1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
}
