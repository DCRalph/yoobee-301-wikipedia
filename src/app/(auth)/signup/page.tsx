"use client";

import React, { useState, Suspense, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MdEmail, MdPerson, MdPhone } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { z } from "zod";

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

function SignUpContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect_url") ?? "/";
  const { data: session, status } = useSession();

  // Check if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [session, status, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        console.log(res.error);
        for (const error of res.error.errors) {
          if (error.path.includes("confirmPassword")) {
            continue;
          }
          errorTexts.push(error.message);
        }
        setError(errorTexts.join("\n"));

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
      console.log(json);

      const res2 = signupResponseSchema.safeParse(json);

      if (!res2.success) {
        setError(res2.error.message);
        setIsLoading(false);
        return;
      }

      // Redirect to sign-in page with success message
      router.push(
        `/signin?registered=true&redirect_url=${encodeURIComponent(redirectUrl)}`,
      );
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 p-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-blue-100 bg-white/90 p-10 shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-blue-800">
            Create Account
          </h1>
          <p className="mb-8 text-gray-600">
            Sign up to access the Admin Portal
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <MdPerson className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-blue-200 pl-10 focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                />
              </div>
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
                  <MdPhone className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  type="phone"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <RiLockPasswordLine className="h-5 w-5 text-blue-500" />
                </div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {"Already have an account? "}
              <a
                href={`/signin?redirect_url=${encodeURIComponent(redirectUrl)}`}
                className="font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
