"use client";

import React, { useState, useEffect, use } from "react";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useRouter } from "next/navigation";

function getErrorMessage(error: string | null, code: string | null) {
  if (!error) return null;
  if (code === "credentials") return "Invalid email or password";
  return error;
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center p-8 transition-colors duration-300`}
    >
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-white/90 p-10 shadow-xl backdrop-blur-sm dark:bg-zinc-900/90">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold dark:text-gray-100">
            Admin Panel
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Sign in to access the admin portal
          </p>
        </div>

        {registered && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-700/10 dark:text-green-300">
            Account created successfully! You can now sign in.
          </div>
        )}

        {getErrorMessage(loginError, loginErrorCode) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-700/10 dark:text-red-300">
            {getErrorMessage(loginError, loginErrorCode)}
          </div>
        )}

        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MdEmail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="pink:text-pink-500 bg-white px-2 dark:bg-zinc-900">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          onClick={() => handleOAuthSignIn("google")}
          disabled={isLoading}
          className="flex w-full items-center justify-center space-x-2 border border-blue-100 bg-white text-base font-medium shadow-md hover:bg-gray-50"
          variant="outline"
        >
          <FcGoogle className="h-5 w-5" />
          <span>Sign in with Google</span>
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {"Don't have an account? "}
            <a
              href={`/signup?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign up
            </a>
          </p>
          {redirectUrl && redirectUrl !== "/" && (
            <p className="mt-4 text-sm text-gray-400">
              Redirecting to {redirectUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
