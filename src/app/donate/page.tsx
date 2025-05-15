"use client";

import { useState, useEffect, useRef } from "react";
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
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/components/ui/input";
import { DONATION_AMOUNTS, DEFAULT_DONATION_AMOUNT } from "~/lib/stripe";
import {
  HeartIcon,
  CreditCard,
  DollarSign,
  ShieldCheck,
  ArrowLeft,
  Users,
  TrendingUp,
  Info,
} from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function DonatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);
  const [customAmount, setCustomAmount] = useState("");
  const [donationOption, setDonationOption] = useState("preset");
  const [displayedAmount, setDisplayedAmount] = useState(0);

  // Example stats (replace with real data)
  const totalRaised = 124350; // in cents
  const totalDonors = 312;

  // Animation ref
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const duration = 2000; // 2 seconds

  // Count-up animation
  useEffect(() => {
    const target = totalRaised / 100;

    const animate = (timestamp: number) => {
      startTimeRef.current ??= timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve: progress = 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = easeOut * target;
      setDisplayedAmount(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayedAmount(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalRaised]);

  const createCheckout = api.stripe.createCheckoutSession.useMutation({
    onError: (error) => {
      toast.error("Failed to create checkout session");
      console.error("Error creating checkout session:", error);
      setIsLoading(false);
    },
  });

  const handleAmountChange = (value: string) => {
    setAmount(parseInt(value));
    setDonationOption("preset");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      const amountInCents = Math.floor(parseFloat(value) * 100);
      if (!isNaN(amountInCents) && amountInCents > 0) {
        setAmount(amountInCents);
      }
    }
    setDonationOption("custom");
  };

  const handleDonate = async () => {
    try {
      setIsLoading(true);
      const result = await createCheckout.mutateAsync({ amount });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      // Error handling is in the onError callback
    }
  };

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
              <span>Back to Wikipedia</span>
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
        <div className="flex justify-center py-4 md:py-8">
          <div className="container max-w-2xl px-4">
            {/* Impact Stats */}
            <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
              <div className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold">
                  $
                  {displayedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-muted-foreground text-sm">
                  raised this month
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold">{totalDonors}</span>
                <span className="text-muted-foreground text-sm">donors</span>
              </div>
            </div>

            {/* Main Card */}
            <Card className="mx-auto w-full overflow-hidden rounded-2xl border-0 pt-0 shadow-xl">
              <CardHeader className="bg-primary/10 py-4">
                <CardTitle className="flex items-center justify-center text-2xl font-bold">
                  <DollarSign className="mr-2 h-6 w-6" />
                  Make a Donation
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-0">
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-primary/20 rounded-full p-4 shadow">
                      <HeartIcon className="text-primary h-10 w-10" />
                    </div>
                  </div>
                  <h1 className="mb-2 text-3xl font-bold tracking-tight">
                    Support Wikipedia Clone
                  </h1>
                  <p className="text-muted-foreground mx-auto max-w-xl text-base">
                    Your donation helps us keep knowledge free and accessible
                    for everyone. Every dollar goes directly to maintaining and
                    improving this platform.
                  </p>
                </div>

                {/* Why Donate */}
                <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Why donate?</span>
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-sm text-blue-900">
                    <li>No ads, ever. 100% user-supported.</li>
                    <li>Help us cover server and development costs.</li>
                    <li>Enable new features and better content.</li>
                    <li>Every donation, big or small, makes a difference!</li>
                  </ul>
                </div>

                {/* Donation Amount */}
                <div className="space-y-6">
                  <RadioGroup
                    value={
                      donationOption === "preset" ? amount.toString() : "custom"
                    }
                    onValueChange={handleAmountChange}
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    {DONATION_AMOUNTS.map((option) => (
                      <div key={option.value} className="relative">
                        <RadioGroupItem
                          value={option.value.toString()}
                          id={`amount-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`amount-${option.value}`}
                          className="border-muted hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary flex h-16 cursor-pointer items-center justify-center rounded-xl border-2 bg-white text-lg font-semibold shadow-sm transition-all"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}

                    <div className="col-span-2 mt-2 sm:col-span-3">
                      <RadioGroupItem
                        value="custom"
                        id="amount-custom"
                        checked={donationOption === "custom"}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="amount-custom"
                        className="border-muted hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 flex cursor-pointer items-center rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all"
                      >
                        <div className="flex w-full items-center justify-center">
                          <span className="text-muted-foreground mr-3 text-lg font-medium">
                            $
                          </span>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Custom amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            onClick={() => setDonationOption("custom")}
                            className="max-w-[150px] border-0 bg-transparent p-0 text-center text-lg font-semibold focus-visible:ring-0"
                            aria-label="Custom donation amount"
                          />
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* How Your Donation Helps */}
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

                {/* Testimonial */}
                <div className="text-muted-foreground mt-6 text-center text-sm italic">
                  {`"I use this site every day for research. Donating was an easy choice!"`}
                  <br />
                  <span className="font-semibold not-italic">
                    - Recent Donor
                  </span>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 flex flex-col gap-3 border-t px-8 py-6">
                <Button
                  onClick={handleDonate}
                  disabled={
                    isLoading || createCheckout.isPending || amount <= 0
                  }
                  className="from-primary to-primary/80 hover:text-primary-foreground w-full rounded-xl bg-gradient-to-r py-4 text-lg font-bold shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  size="lg"
                >
                  {isLoading || createCheckout.isPending ? (
                    <span className="flex items-center justify-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Donate {amount > 0 ? `$${(amount / 100).toFixed(2)}` : ""}
                    </span>
                  )}
                </Button>
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
                  {/* Add more payment icons as needed */}
                </div>
                <div className="text-muted-foreground mt-2 text-center text-xs">
                  100% Secure Payments. No card info is stored on our servers.
                </div>
              </CardFooter>
            </Card>
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
            <div className="text-muted-foreground text-sm">
              <p>
                Wikipedia Clone &copy; {new Date().getFullYear()} • All
                donations securely processed
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
