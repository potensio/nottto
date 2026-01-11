"use client";

import { useState } from "react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement auth logic
    console.log(isLogin ? "Login" : "Signup", { email, password, name });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
        {/* Animated Blobs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-orange-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-orange-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob delay-2000"></div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 tech-grid opacity-20"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex h-6">
            <img
              src="/nottto-logo-negative.png"
              alt="Description"
              className="h-full"
            />
          </div>

          {/* Center Content */}
          <div className="max-w-md">
            <h1 className="text-6xl font-instrument-serif font-normal mb-6 leading-tight">
              Capture bugs,
              <br />
              <span className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                ship faster
              </span>
            </h1>
            <p className="text-neutral-400 leading-relaxed">
              Screenshot, annotate, and share bug reports in seconds. Join
              thousands of teams streamlining their feedback workflow.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  24.8K
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Screenshots
                </div>
              </div>
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  1.2K
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Teams
                </div>
              </div>
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  99.9%
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Uptime
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-xs text-neutral-500">
            © 2025 Nottto. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:pencil-ruler"
                className="text-xl text-white"
              ></iconify-icon>
            </div>
            <span className="font-bold tracking-tight text-xl text-neutral-900">
              Nott<span className="text-accent">to</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
          </div>

          {/* Toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                isLogin
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                !isLogin
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <iconify-icon
                      icon="lucide:user"
                      className="text-neutral-400"
                    ></iconify-icon>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <iconify-icon
                    icon="lucide:mail"
                    className="text-neutral-400"
                  ></iconify-icon>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                {isLogin && (
                  <a
                    href="#"
                    className="text-sm text-accent hover:text-orange-600 transition-colors"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <iconify-icon
                    icon="lucide:lock"
                    className="text-neutral-400"
                  ></iconify-icon>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              {isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 text-neutral-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-neutral-200 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors">
              <iconify-icon icon="logos:google-icon" width="18"></iconify-icon>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-neutral-200 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors">
              <iconify-icon icon="lucide:github" width="18"></iconify-icon>
              GitHub
            </button>
          </div>

          {/* Terms */}
          {!isLogin && (
            <p className="mt-6 text-xs text-neutral-500 text-center">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-accent hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-accent hover:underline">
                Privacy Policy
              </a>
            </p>
          )}

          {/* Back to home */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors inline-flex items-center gap-1"
            >
              <iconify-icon icon="lucide:arrow-left" width="14"></iconify-icon>
              Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
