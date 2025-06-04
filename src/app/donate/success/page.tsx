"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
  Home,
  HeartIcon,
  ArrowLeft,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function DonationSuccessPage() {
  // Animation states
  const [displayedDonors, setDisplayedDonors] = useState(0);

  // Example stats (replace with real data)
  const totalDonors = 312;

  // Animation ref
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const duration = 2000; // 2 seconds

  // Count-up animation
  useEffect(() => {
    const animate = (timestamp: number) => {
      startTimeRef.current ??= timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve: progress = 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.floor(easeOut * totalDonors);
      setDisplayedDonors(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedDonors(totalDonors);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalDonors]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="border-border/40 sticky top-0 z-10 border-b bg-white/80 py-3 shadow-sm backdrop-blur">
        <div className="container flex items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to WikiClone</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon className="text-primary h-5 w-5" />
            <span className="text-lg font-semibold">Donation Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Impact Stats */}
        <div className="flex justify-center py-4 md:py-8">
          <div className="container max-w-2xl px-4">
            {/* Impact Stats */}
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <div className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">
                  Donation Complete!
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold">{displayedDonors}</span>
                <span className="text-muted-foreground text-sm">donors</span>
              </div>
            </div>

            <div className="mb-10 text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/20 rounded-full p-4 shadow">
                  <HeartIcon className="text-primary h-10 w-10" />
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">
                Thank You For Your Donation!
              </h1>
              <p className="text-muted-foreground mx-auto max-w-xl text-base">
                Your generous support helps us keep knowledge free and
                accessible for everyone. Every dollar goes directly to
                maintaining and improving this platform.
              </p>
            </div>

            <Card className="mx-auto w-full overflow-hidden rounded-2xl border-0 pt-0 shadow-xl">
              <CardHeader className="bg-primary/10 py-4">
                <CardTitle className="flex items-center justify-center text-2xl font-bold">
                  Donation Confirmation
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 p-8">
                <div className="bg-card rounded-lg border p-6 text-center">
                  <h3 className="mb-2 text-lg font-medium">
                    Your donation was successful!
                  </h3>
                  <p className="text-muted-foreground">
                    A receipt has been sent to your email address. Thank you for
                    your generosity!
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-center font-medium">Your Impact</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    Your contribution makes a real difference in supporting our
                    mission to provide free and accessible knowledge to
                    everyone. With your help, we can continue to:
                  </p>

                  <div className="mx-auto max-w-xs">
                    <ul className="text-muted-foreground text-left text-sm">
                      <li className="mb-2 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Maintain a high-quality platform
                      </li>
                      <li className="mb-2 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Develop new features
                      </li>
                      <li className="mb-2 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Support our growing community
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Expand knowledge globally
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 flex flex-col space-y-3 border-t p-6 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="from-primary to-primary/80 hover:from-primary/80 hover:to-primary w-full transition-all duration-300 hover:scale-[1.02] sm:w-auto"
                >
                  <Link href="/" className="flex items-center justify-center">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Homepage
                  </Link>
                </Button>

                <Button
                  size="lg"
                  asChild
                  className="from-primary to-primary/80 hover:from-primary/80 hover:to-primary w-full transition-all duration-300 hover:scale-[1.02] sm:w-auto"
                >
                  <Link
                    href="/donate"
                    className="flex items-center justify-center"
                  >
                    Make Another Donation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <div className="mt-8 rounded-lg border border-green-100 bg-green-50 p-4 text-center">
              <h3 className="mb-2 font-semibold text-green-900">
                How your donation helps
              </h3>
              <ul className="space-y-1 text-sm text-green-900">
                <li>💡 Keeps the site online and ad-free</li>
                <li>🔒 Funds security and privacy improvements</li>
                <li>🌍 Expands access to more users globally</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-border/40 bg-muted/20 flex justify-center border-t py-8">
        <div className="container flex justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              <span className="font-medium">Secure Payments via Stripe</span>
            </div>
            <div className="mt-2 flex justify-center gap-4">
              <Image
                src="/stripe.svg"
                alt="Stripe"
                width={100}
                height={100}
                className="h-8 w-auto"
              />
              <Image
                src="/visa.svg"
                alt="Visa"
                width={100}
                height={100}
                className="h-8 w-auto"
              />
              <Image
                src="/mastercard.svg"
                alt="Mastercard"
                width={100}
                height={100}
                className="h-8 w-auto"
              />
            </div>
            <div className="text-muted-foreground mt-2 text-sm">
              <p>
                WikiClone &copy; {new Date().getFullYear()} • All donations
                securely processed
              </p>
              <p className="mt-1">
                <a
                  href="mailto:support@dcralph.com"
                  className="hover:text-foreground underline"
                >
                  support@dcralph.com
                </a>
                {" • "}
                <Link
                  href="/privacy"
                  className="hover:text-foreground underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
