"use client";

import React, { useState, useEffect, use } from "react";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MdEmail, MdPerson, MdPhone } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import Link from "next/link";

const signupRequestSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters long" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const signupResponseSchema = z.object({
  message: z.string(),
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expires: z.string(),
    sessionToken: z.string(),
  }),
});

function getErrorMessage(error: string | null, code: string | null) {
  if (!error) return null;
  if (code === "credentials") return "Invalid email or password";
  return error;
}

export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [useImageBg, setUseImageBg] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const params = use(searchParams);

  const redirectUrl = params?.redirect_url ?? "/";
  const registered = params?.registered === "true";
  const loginError = params?.error ?? null;
  const loginErrorCode = params?.code ?? null;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/");
    }
  }, [session, status, router]);

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    const result = await signIn(provider, {
      redirect: false,
      callbackUrl: redirectUrl,
    });
    setIsLoading(false);

    if (result?.error) {
      setFormError("An error occurred while signing in. Please try again.");
    } else if (result?.url) {
      router.push(result.url);
    }
  };

  // Handle email/password sign in
  const handleEmailPasswordSignIn = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Email and password are required");
      return;
    }

    setIsLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: redirectUrl,
    });
    setIsLoading(false);

    if (result?.error) {
      setFormError("Invalid email or password");
    } else if (result?.url) {
      router.push(result.url);
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setFormError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);

      const signupRequest = {
        name,
        email,
        phone,
        password,
        confirmPassword,
      };

      const res = signupRequestSchema.safeParse(signupRequest);

      if (!res.success) {
        const errorTexts: string[] = [];
        for (const error of res.error.errors) {
          if (error.path.includes("confirmPassword")) {
            continue;
          }
          errorTexts.push(error.message);
        }
        setFormError(errorTexts.join("\n"));
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupRequest),
      });

      const json = (await response.json()) as unknown;
      const res2 = signupResponseSchema.safeParse(json);

      if (!res2.success) {
        setFormError(res2.error.message);
        setIsLoading(false);
        return;
      }

      // Switch to sign-in mode and show success message
      setIsSignUp(false);
      setFormError("Account created successfully! You can now sign in.");
      // Clear form fields except email
      setName("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Registration error:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormError(null);
    // Keep email but clear other fields when switching
    setPassword("");
    setName("");
    setPhone("");
    setConfirmPassword("");
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${!useImageBg ? 'bg-linear-to-b from-primary via-input to-primary' : ''}`}>
      {/* Background Image - Only show when toggle is on */}
      {useImageBg && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/auth/bg.png')",
            }}
          />

          {/* Dimming Overlay */}
          <div className="absolute inset-0 bg-primary/60" />
        </>
      )}

      {/* Background Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 50px,
            rgba(75, 46, 19, 0.1) 50px,
            rgba(75, 46, 19, 0.1) 52px
          )`,
        }}
      />

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-lg">
          {/* WikiClone Logo and Title */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <Image
                src="/icon.png"
                alt="WikiClone Logo"
                width={120}
                height={120}
                className="mx-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-5xl font-serif text-background mb-2 drop-shadow-md">
              Welcome to WikiClone
            </h1>
            <p className="text-xl text-background/90 font-light">
              The Free Encyclopedia
            </p>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center my-8">
              <div className="h-px bg-linear-to-r from-transparent via-background/60 to-transparent w-32"></div>
              <div className="mx-4 text-background/80 text-2xl">✦</div>
              <div className="h-px bg-linear-to-r from-transparent via-background/60 to-transparent w-32"></div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border-2 border-border shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-primary py-4 px-6 border-b border-border">
              <h2 className="text-2xl font-serif text-center text-primary-foreground">
                {isSignUp ? "Join WikiClone" : "Encyclopedia Access"}
              </h2>
            </div>

            {/* Card Content */}
            <div className="p-8 bg-card">
              <div className="text-center mb-8">
                <p className="text-card-foreground text-lg leading-relaxed">
                  {isSignUp
                    ? "Create an account to contribute to WikiClone"
                    : "Please sign in to access the complete collection of WikiClone"
                  }
                </p>
              </div>

              {/* Error Messages */}
              {registered && !isSignUp && (
                <div className="mb-6 rounded-lg border-2 border-green-600 bg-green-50 p-4 text-green-800 text-center font-medium">
                  Account created successfully! You can now sign in.
                </div>
              )}

              {getErrorMessage(loginError, loginErrorCode) && !isSignUp && (
                <div className="mb-6 rounded-lg border-2 border-destructive bg-red-50 p-4 text-red-800 text-center font-medium">
                  {getErrorMessage(loginError, loginErrorCode)}
                </div>
              )}

              {formError && (
                <div className={`mb-6 rounded-lg border-2 p-4 text-center font-medium ${formError.includes("successfully")
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-destructive bg-red-50 text-red-800"
                  }`}>
                  {formError}
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleEmailPasswordSignIn} className="space-y-4 mb-6">
                {isSignUp && (
                  <div className="relative">
                    <MdPerson className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="relative">
                  <MdEmail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                {isSignUp && (
                  <div className="relative">
                    <MdPhone className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="relative">
                  <RiLockPasswordLine className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
                    disabled={isLoading}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>

                {isSignUp && (
                  <div className="relative">
                    <RiLockPasswordLine className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-lg transition-all duration-200"
                >
                  {isLoading
                    ? (isSignUp ? "Creating Account..." : "Signing in...")
                    : (isSignUp ? "Create Account" : "Sign in")
                  }
                </Button>
              </form>

              {/* OAuth Section - Only show for sign in */}
              {!isSignUp && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-4 text-muted-foreground font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={isLoading}
                      className="w-full bg-background hover:bg-secondary border-2 border-border text-foreground py-4 text-lg font-medium transition-all duration-200 hover:shadow-lg hover:border-primary/50"
                      variant="outline"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <FcGoogle className="h-6 w-6" />
                        <span>Sign in with Google</span>
                      </div>
                    </Button>

                    {/* Indicator Dots */}
                    <div className="flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <div className="w-2 h-2 bg-muted rounded-full"></div>
                    </div>
                  </div>
                </>
              )}

              {/* Toggle Button */}
              <div className="mt-6 text-center">
                <p className="text-muted-foreground mb-4 font-medium">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="w-full bg-secondary hover:bg-accent border-2 border-border text-secondary-foreground font-semibold hover:border-primary/50 transition-all duration-200"
                >
                  {isSignUp ? "Sign In Instead" : "Create Account"}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8">
            <p className="text-background/90 text-lg flex flex-wrap justify-center items-center gap-1">
              <span>By {isSignUp ? "creating an account" : "signing in"}, you agree to our</span>
              <Link href="/terms" className="text-background hover:text-accent underline font-semibold transition-colors">
                Terms of Service
              </Link>
              <span>and</span>
              <Link href="/privacy" className="text-background hover:text-accent underline font-semibold transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/donate" className="text-background hover:text-accent underline font-semibold transition-colors">
                Donate
              </Link>
              <span>•</span>
              <button
                onClick={() => setUseImageBg(!useImageBg)}
                className="text-background hover:text-accent underline font-semibold transition-colors"
              >
                {useImageBg ? 'Use Gradient' : 'Use Image'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
