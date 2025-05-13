"use client";

import React, { useState, useEffect, use } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MdEmail, MdPerson, MdPhone } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { ThemeToggle } from "~/components/theme-toggle";

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

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = use(searchParams);

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const redirectUrl = params?.redirect_url ?? "/";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center p-8 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-white/90 p-10 shadow-xl backdrop-blur-sm dark:bg-zinc-900/90">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold dark:text-gray-100">
            Create Account
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300">
            Sign up to access the Admin Portal
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MdPerson className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <MdEmail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <MdPhone className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                disabled={isLoading}
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
              />
            </div>
            <div className="relative">
              <RiLockPasswordLine className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {"Already have an account? "}
            <a
              href={`/signin?redirect_url=${encodeURIComponent(redirectUrl)}`}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign in
            </a>
          </p>

          <div className="absolute top-6 right-6 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
