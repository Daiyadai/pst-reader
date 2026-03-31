"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

export default function Register() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, company_name: company }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("registrationFailed"));

      localStorage.setItem("pst_user", JSON.stringify(data));
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-xl border border-navy-100 shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-navy-800 mb-6 text-center">
          {t("createAccount")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">
              {t("emailRequired")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-navy-400 outline-none"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">
              {t("passwordMin6")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-navy-400 outline-none"
              placeholder={t("createPassword")}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-600 mb-1">
              {t("companyName")}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-navy-400 focus:border-navy-400 outline-none"
              placeholder={t("yourCompany")}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? t("creatingAccount") : t("register")}
          </button>
        </form>
        <p className="text-center text-sm text-navy-400 mt-4">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-navy-600 hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
