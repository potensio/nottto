"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { validateEmail } from "@/lib/validation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type AuthMode = "login" | "register";
type AuthStep = "form" | "confirmation" | "error";

interface OAuthParams {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state: string;
  mode?: "login" | "register";
}

function AuthorizePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
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
  const [oauthParams, setOAuthParams] = useState<OAuthParams | null>(null);

  // Extract and validate OAuth parameters
  useEffect(() => {
    const response_type = searchParams.get("response_type");
    const client_id = searchParams.get("client_id");
    const redirect_uri = searchParams.get("redirect_uri");
    const code_challenge = searchParams.get("code_challenge");
    const code_challenge_method = searchParams.get("code_challenge_method");
    const state = searchParams.get("state");
    const modeParam = searchParams.get("mode");

    // Validate required OAuth parameters
    if (
      !response_type ||
      !client_id ||
      !redirect_uri ||
      !code_challenge ||
      !code_challenge_method ||
      !state
    ) {
      setError("Invalid OAuth request. Missing required parameters.");
      setStep("error");
      return;
    }

    if (response_type !== "code") {
      setError("Invalid response_type. Only 'code' is supported.");
      setStep("error");
      return;
    }

    if (code_challenge_method !== "S256") {
      setError("Invalid code_challenge_method. Only 'S256' is supported.");
      setStep("error");
      return;
    }

    const params: OAuthParams = {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
      mode: modeParam === "register" ? "register" : "login",
    };

    setOAuthParams(params);
    setMode(params.mode || "login");

    // Store OAuth parameters in localStorage for use after authentication
    if (typeof window !== "undefined") {
      localStorage.setItem("oauthParams", JSON.stringify(params));
    }
  }, [searchParams]);

  // If user is already authenticated, redirect to generate auth code
  useEffect(() => {
    if (user && oauthParams) {
      // User is authenticated, generate authorization code
      // Add a small delay so user can see what's happening
      const timer = setTimeout(() => {
        generateAuthorizationCode();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, oauthParams]);

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

  const generateAuthorizationCode = async () => {
    if (!oauthParams) return;

    try {
      setIsLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

      const response = await fetch(`${API_URL}/oauth/authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        credentials: "include",
        body: JSON.stringify({
          response_type: oauthParams.response_type,
          client_id: oauthParams.client_id,
          redirect_uri: oauthParams.redirect_uri,
          code_challenge: oauthParams.code_challenge,
          code_challenge_method: oauthParams.code_challenge_method,
          state: oauthParams.state,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate authorization code");
      }

      const data = await response.json();

      // Clear stored OAuth params
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauthParams");
      }

      // Redirect to extension with authorization code
      const redirectUrl = new URL(oauthParams.redirect_uri);
      redirectUrl.searchParams.set("code", data.code);
      redirectUrl.searchParams.set("state", data.state);

      console.log("Redirecting to:", redirectUrl.toString());

      // Use window.location.replace for immediate redirect
      // This works better with chrome.identity.launchWebAuthFlow
      window.location.replace(redirectUrl.toString());
    } catch (err) {
      console.error("Failed to generate authorization code:", err);
      setError("Failed to complete authorization. Please try again.");
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
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

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email");
      isValid = false;
    }

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
      // If OAuth flow, encode OAuth parameters to include in magic link
      let extensionSession = undefined;
      if (oauthParams) {
        // Encode OAuth parameters as a session identifier
        // This will be included in the magic link URL
        extensionSession = btoa(JSON.stringify(oauthParams));
      }

      const result = await apiClient.requestMagicLink(
        email,
        mode === "register",
        mode === "register" ? name.trim() : undefined,
        extensionSession,
      );
      setMaskedEmail(result.email);
      setStep("confirmation");
      setCanResend(false);
      setResendCountdown(60);
    } catch (err: unknown) {
      const errorObj = err as { message?: string; status?: number };
      const errorMessage =
        errorObj.message || "Something went wrong. Please try again.";

      if (errorObj.status === 409) {
        setError(
          "An account with this email already exists. Please login instead.",
        );
      } else if (errorObj.status === 404) {
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

  // Show loading while checking authentication
  if (!oauthParams && step !== "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-pulse text-neutral-400">
          Validating request...
        </div>
      </div>
    );
  }

  // Show loading while generating auth code for authenticated users
  if (user && oauthParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <iconify-icon
              icon="lucide:check-circle"
              className="text-4xl text-green-600"
            ></iconify-icon>
          </div>
          <h2 className="text-3xl font-instrument-serif font-normal text-neutral-900 mb-3">
            Already signed in!
          </h2>
          <p className="text-neutral-500 mb-4">
            Authorizing extension access...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
            <iconify-icon
              icon="lucide:loader-2"
              className="animate-spin"
            ></iconify-icon>
            <span>Redirecting to extension</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-orange-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-orange-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob delay-2000"></div>
        <div className="absolute inset-0 tech-grid opacity-20"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <a href="/" className="flex h-6 hover:opacity-80 transition-opacity">
            <img
              src="/notto-logo-negative.png"
              alt="Notto"
              className="h-full"
            />
          </a>

          <div className="max-w-md">
            <h1 className="text-6xl font-instrument-serif font-normal mb-6 leading-tight">
              Authorize
              <br />
              <span className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Extension
              </span>
            </h1>
            <p className="text-neutral-400 leading-relaxed">
              Sign in to connect the Notto Chrome extension to your account.
              Capture and annotate screenshots directly from your browser.
            </p>
          </div>

          <div className="text-xs text-neutral-500">
            © 2025 Notto. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
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
              <div className="mb-8">
                <h2 className="text-4xl font-instrument-serif font-normal text-neutral-900 mb-2">
                  {mode === "login"
                    ? "Sign in to authorize"
                    : "Create account to authorize"}
                </h2>
                <p className="text-neutral-500">
                  {mode === "login"
                    ? "Enter your email to authorize the extension"
                    : "Enter your details to authorize the extension"}
                </p>
              </div>

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

              <form onSubmit={handleSubmit} className="space-y-5">
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

              <p className="mt-6 text-xs text-neutral-500 text-center">
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-accent hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </a>
              </p>
            </>
          )}

          {step === "confirmation" && (
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
              <p className="text-neutral-900 font-medium mb-6">{maskedEmail}</p>
              <p className="text-sm text-neutral-500 mb-8">
                Click the link in the email to authorize the extension. The link
                expires in 15 minutes.
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
          )}

          {step === "error" && (
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
                {error || "We couldn't process your request. Please try again."}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={<AuthorizePageLoading />}>
      <AuthorizePageContent />
    </Suspense>
  );
}

function AuthorizePageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-pulse text-neutral-400">Loading...</div>
    </div>
  );
}
