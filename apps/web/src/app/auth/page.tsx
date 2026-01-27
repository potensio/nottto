"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateEmail } from "@/lib/validation";
import { apiClient } from "@/lib/api-client";

type AuthMode = "login" | "register";
type AuthStep = "form" | "confirmation" | "error";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // Set initial mode from URL query parameter (only once)
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "register") {
      setMode("register");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get extension session from URL if present
  const extensionSession = searchParams.get("session");

  // Countdown timer for resend button
  useEffect(() => {
    if (step !== "confirmation" || canResend) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, canResend]);

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    // Preserve email when switching modes
    setEmailError(null);
    setNameError(null);
    setError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) setNameError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email");
      isValid = false;
    }

    // Validate name for registration
    if (mode === "register" && (!name || name.trim().length === 0)) {
      setNameError("Full name is required");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.requestMagicLink(
        email,
        mode === "register",
        mode === "register" ? name.trim() : undefined,
        extensionSession || undefined,
      );
      setMaskedEmail(result.email);
      setStep("confirmation");
      setCanResend(false);
      setResendCountdown(60);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      const errorMessage =
        errorObj.message || "Something went wrong. Please try again.";

      // Check if it's a "switch mode" error
      if (errorObj.status === 409) {
        // Account exists - suggest login
        setError(
          "An account with this email already exists. Please login instead.",
        );
      } else if (errorObj.status === 404) {
        // No account - suggest register
        setError("No account found with this email. Please register first.");
      } else {
        setError(errorMessage);
      }
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setCanResend(false);
    setResendCountdown(60);

    try {
      const result = await apiClient.requestMagicLink(
        email,
        mode === "register",
        mode === "register" ? name.trim() : undefined,
        extensionSession || undefined,
      );
      setMaskedEmail(result.email);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || "Failed to resend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setStep("form");
    setEmail("");
    setName("");
    setError(null);
    setEmailError(null);
    setNameError(null);
  };

  const handleTryAgain = () => {
    setStep("form");
    setError(null);
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
          <a href="/" className="flex h-6 hover:opacity-80 transition-opacity">
            <img
              src="/notto-logo-negative.png"
              alt="Notto"
              className="h-full"
            />
          </a>

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
              hundres of teams streamlining their feedback workflow.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  6.8K
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Screenshots
                </div>
              </div>
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  100+
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Teams
                </div>
              </div>
              <div>
                <div className="text-3xl font-instrument-serif text-white">
                  200+
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">
                  Integrations
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="text-xs text-neutral-500">
            © 2025 Notto. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <a
            href="/"
            className="flex items-center gap-3 mb-10 lg:hidden hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:pencil-ruler"
                className="text-xl text-white"
              ></iconify-icon>
            </div>
            <span className="font-bold tracking-tight text-xl text-neutral-900">
              Nott<span className="text-accent">to</span>
            </span>
          </a>

          {step === "form" && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-neutral-500">
                  {mode === "login"
                    ? "Enter your email to sign in"
                    : "Enter your details to get started"}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    mode === "register"
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name field - only for registration */}
                {mode === "register" && (
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
                        onChange={handleNameChange}
                        placeholder="John Doe"
                        autoFocus
                        className={`w-full pl-11 pr-4 py-3 bg-white border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${
                          nameError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            : "border-neutral-200"
                        }`}
                      />
                    </div>
                    {nameError && (
                      <p className="mt-2 text-sm text-red-600">{nameError}</p>
                    )}
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
                      onChange={handleEmailChange}
                      placeholder="you@example.com"
                      autoFocus={mode === "login"}
                      className={`w-full pl-11 pr-4 py-3 bg-white border rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all ${
                        emailError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-neutral-200"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <iconify-icon
                        icon="lucide:loader-2"
                        className="animate-spin"
                      ></iconify-icon>
                      Sending link...
                    </>
                  ) : (
                    <>
                      {mode === "login"
                        ? "Sign in with Email"
                        : "Create Account"}
                      <iconify-icon icon="lucide:arrow-right"></iconify-icon>
                    </>
                  )}
                </button>
              </form>

              {/* Terms */}
              <p className="mt-6 text-xs text-neutral-500 text-center">
                By continuing, you agree to our{" "}
                <a href="#" className="text-accent hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-accent hover:underline">
                  Privacy Policy
                </a>
              </p>
            </>
          )}

          {step === "confirmation" && (
            <>
              {/* Check Email Screen */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <iconify-icon
                    icon="lucide:mail-check"
                    className="text-3xl text-green-600"
                  ></iconify-icon>
                </div>
                <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
                  Check your email
                </h2>
                <p className="text-neutral-500 mb-2">We sent a magic link to</p>
                <p className="text-neutral-900 font-medium mb-6">
                  {maskedEmail}
                </p>
                <p className="text-sm text-neutral-500 mb-8">
                  Click the link in the email to{" "}
                  {mode === "login" ? "sign in" : "complete registration"}. The
                  link expires in 15 minutes.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleResend}
                    disabled={!canResend || isLoading}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      canResend && !isLoading
                        ? "bg-neutral-900 text-white hover:bg-neutral-800"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <iconify-icon
                          icon="lucide:loader-2"
                          className="animate-spin"
                        ></iconify-icon>
                        Sending...
                      </>
                    ) : canResend ? (
                      <>
                        <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
                        Resend link
                      </>
                    ) : (
                      <>
                        <iconify-icon icon="lucide:clock"></iconify-icon>
                        Resend in {resendCountdown}s
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleUseDifferentEmail}
                    className="w-full py-3 rounded-lg font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                    Use different email
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "error" && (
            <>
              {/* Error Screen */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <iconify-icon
                    icon="lucide:alert-circle"
                    className="text-3xl text-red-600"
                  ></iconify-icon>
                </div>
                <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
                  {error?.includes("already exists") ||
                  error?.includes("No account")
                    ? "Oops!"
                    : "Something went wrong"}
                </h2>
                <p className="text-neutral-500 mb-8">
                  {error ||
                    "We couldn't send the magic link. Please try again."}
                </p>

                <div className="space-y-3">
                  {error?.includes("already exists") && (
                    <button
                      onClick={() => {
                        setMode("login");
                        setStep("form");
                        setError(null);
                      }}
                      className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <iconify-icon icon="lucide:log-in"></iconify-icon>
                      Login instead
                    </button>
                  )}
                  {error?.includes("No account") && (
                    <button
                      onClick={() => {
                        setMode("register");
                        setStep("form");
                        setError(null);
                      }}
                      className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <iconify-icon icon="lucide:user-plus"></iconify-icon>
                      Register instead
                    </button>
                  )}
                  <button
                    onClick={handleTryAgain}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      error?.includes("already exists") ||
                      error?.includes("No account")
                        ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                  >
                    <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                    Try again
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-pulse text-neutral-400">Loading...</div>
    </div>
  );
}
