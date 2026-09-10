import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

const text = {
  en: {
    title: "LIRAEL",
    eyebrow: "Vessel Monitoring Platform",
    subtitle: "Real-time machinery, navigation, and alarm monitoring for connected vessels.",
    username: "Username",
    password: "Password",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "admin123",
    signIn: "Sign In",
    signingIn: "Signing In",
    authentication: "Authentication",
    demoAccount: "Default accounts: admin, operator, viewer",
    required: "Username and password are required.",
    failed: "Login failed. Check the account or backend service.",
  },
  zh: {
    title: "LIRAEL",
    eyebrow: "船舶监测平台",
    subtitle: "面向联网船舶的主机、航行和报警实时监测平台。",
    username: "用户名",
    password: "密码",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "admin123",
    signIn: "登录",
    signingIn: "登录中",
    authentication: "身份认证",
    demoAccount: "默认账号：admin、operator、viewer",
    required: "请输入用户名和密码。",
    failed: "登录失败，请检查账号或后端服务。",
  },
};

const LoginPage = () => {
  const { language } = useLanguage();
  const { login, status } = useAuth();
  const copy = text[language === "zh" ? "zh" : "en"];
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isLoading = status === "authenticating";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError(copy.required);
      return;
    }

    try {
      await login({ username: username.trim(), password });
    } catch (loginError) {
      setError(loginError?.payload?.message || loginError?.message || copy.failed);
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#0b2230] text-[#15232e]">
      <div className="absolute inset-0 bg-cover bg-center lg:bg-[center]" style={{ backgroundImage: "url('/image/board.jpg')" }} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,18,29,0.68)_0%,rgba(4,18,29,0.33)_43%,rgba(4,18,29,0.14)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,18,29,0.46)_0%,transparent_48%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1680px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <header>
          <div className="inline-flex items-center rounded-lg border border-white/80 bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(4,18,29,0.24)] backdrop-blur-md">
            <img src="/image/logo.png" alt={language === "zh" ? "seabornix 标志" : "seabornix logo"} className="h-8 w-auto object-contain sm:h-9" />
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col justify-end gap-8 pb-1 pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pb-6">
          <section className="min-w-0 max-w-xl pb-2 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] lg:pb-12">
            <p className="mb-4 text-xs font-bold leading-5 tracking-[0.12em] text-white/85 sm:tracking-[0.16em]">{copy.eyebrow}</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">{copy.title}</h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/90 sm:text-base">{copy.subtitle}</p>
          </section>

          <motion.form
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            onSubmit={handleSubmit}
            className="w-full max-w-md self-end rounded-lg border border-white/75 bg-white/[0.92] p-6 shadow-[0_24px_64px_rgba(4,18,29,0.32)] backdrop-blur-xl sm:p-8 lg:mb-4"
          >
            <div className="mb-8">
              <p className="text-xs font-black tracking-[0.16em] text-[#0b6d86]">{copy.authentication}</p>
              <h2 className="mt-3 text-3xl font-black text-[#15232e]">{language === "zh" ? "用户登录" : "User Login"}</h2>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">{copy.username}</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="h-12 w-full rounded-md border border-slate-300 bg-white/90 px-4 text-sm font-semibold text-[#15232e] outline-none transition placeholder:text-slate-400 focus:border-[#0b6d86] focus:ring-2 focus:ring-[#0b6d86]/15"
                  placeholder={copy.usernamePlaceholder}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">{copy.password}</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-md border border-slate-300 bg-white/90 px-4 text-sm font-semibold text-[#15232e] outline-none transition placeholder:text-slate-400 focus:border-[#0b6d86] focus:ring-2 focus:ring-[#0b6d86]/15"
                  placeholder={copy.passwordPlaceholder}
                />
              </label>
            </div>

            {error && (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-7 h-12 w-full rounded-md bg-[#0b6d86] text-sm font-bold text-white transition hover:bg-[#07586d] focus:outline-none focus:ring-2 focus:ring-[#0b6d86] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? copy.signingIn : copy.signIn}
            </button>

            <p className="mt-5 text-center text-xs font-medium leading-5 text-slate-500">{copy.demoAccount}</p>
          </motion.form>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
