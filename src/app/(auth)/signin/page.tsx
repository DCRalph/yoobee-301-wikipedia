"use client";

import React, { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { redirect, useSearchParams, useRouter } from "next/navigation";

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect_url") ?? "/";
  const registered = searchParams?.get("registered") === "true";
  const loginError = searchParams?.get("error") ?? null;
  const loginErrorCode = searchParams?.get("code") ?? null;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    const result = await signIn(provider, {
      redirectTo: redirectUrl,
      redirect: false,
    });
    setIsLoading(false);
    console.log(result);
    if (result?.error) {
      setError("An error occurred while signing in. Please try again.");
    }

    if (result?.ok && result?.url) {
      redirect(result.url);
    }
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);
      await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: redirectUrl,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 p-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-blue-100 bg-white/90 p-10 shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-blue-800">Admin Panel</h1>
          <p className="mb-8 text-gray-600">
            Sign in to access the admin portal
          </p>
        </div>

        {registered && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Account created successfully! You can now sign in.
          </div>
        )}

        {loginError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loginErrorCode == "credentials"
              ? "Invalid email or password"
              : loginError}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <MdEmail className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-blue-200 pl-10 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <RiLockPasswordLine className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-blue-200 pl-10 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-blue-200"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={() => handleSignIn("google")}
            disabled={isLoading}
            className="flex w-full items-center justify-center space-x-2 border border-blue-100 bg-white text-base font-medium text-gray-700 shadow-md hover:bg-gray-50"
          >
            <FcGoogle className="h-5 w-5" />
            <span>Sign in with Google</span>
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {"Don't have an account? "}
              <a
                href={`/signup?redirect_url=${encodeURIComponent(redirectUrl)}`}
                className="font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                Sign up
              </a>
            </p>

            {redirectUrl && redirectUrl != "/" && (
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to {redirectUrl}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
