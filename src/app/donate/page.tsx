"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const scaleVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const slideInVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const fadeInUpVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

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
    <motion.div
      className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.header
        className="border-border/40 sticky top-0 z-10 border-b bg-white/80 py-3 shadow-sm backdrop-blur"
        variants={slideInVariants}
      >
        <div className="container flex items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-2 transition-colors"
              >
                <motion.div
                  animate={{ x: [-2, 2, -2] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.div>
                <span>Back to WikiClone</span>
              </Button>
            </motion.div>
          </Link>
          <motion.div
            className="flex items-center gap-2"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
            >
              <HeartIcon className="text-primary h-5 w-5" />
            </motion.div>
            <span className="text-lg font-semibold">Donation Portal</span>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex justify-center py-4 md:py-8">
          <div className="container max-w-2xl px-4">
            {/* Impact Stats */}
            <motion.div
              className="mb-8 flex flex-col justify-center gap-4 sm:flex-row"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow"
                variants={fadeInUpVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  transition: { duration: 0.2 },
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </motion.div>
                <motion.span
                  className="text-lg font-semibold"
                  key={displayedAmount}
                  initial={{ scale: 1.2, color: "#16a34a" }}
                  animate={{ scale: 1, color: "#000000" }}
                  transition={{ duration: 0.3 }}
                >
                  $
                  {displayedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </motion.span>
                <span className="text-muted-foreground text-sm">
                  raised this month
                </span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow"
                variants={fadeInUpVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  transition: { duration: 0.2 },
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                >
                  <Users className="h-5 w-5 text-blue-600" />
                </motion.div>
                <span className="text-lg font-semibold">{totalDonors}</span>
                <span className="text-muted-foreground text-sm">donors</span>
              </motion.div>
            </motion.div>

            {/* Main Card */}
            <motion.div
              variants={scaleVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="mx-auto w-full overflow-hidden rounded-2xl border-0 pt-0 shadow-xl">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <CardHeader className="bg-primary/10 py-4">
                    <CardTitle className="flex items-center justify-center text-2xl font-bold">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <DollarSign className="mr-2 h-6 w-6" />
                      </motion.div>
                      Make a Donation
                    </CardTitle>
                  </CardHeader>
                </motion.div>

                <CardContent className="p-8 pt-0">
                  <motion.div
                    className="mb-6 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  >
                    <div className="mb-4 flex justify-center">
                      <motion.div
                        className="bg-primary/20 rounded-full p-4 shadow"
                        whileHover={{
                          scale: 1.1,
                          rotate: 360,
                          transition: { duration: 0.6 },
                        }}
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0.4)",
                            "0 0 0 20px rgba(59, 130, 246, 0)",
                          ],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut",
                          }}
                        >
                          <HeartIcon className="text-primary h-10 w-10" />
                        </motion.div>
                      </motion.div>
                    </div>
                    <motion.h1
                      className="mb-2 text-3xl font-bold tracking-tight"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.6, type: "spring" }}
                    >
                      Support WikiClone
                    </motion.h1>
                    <motion.p
                      className="text-muted-foreground mx-auto max-w-xl text-base"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.8 }}
                    >
                      Your donation helps us keep knowledge free and accessible
                      for everyone. Every dollar goes directly to maintaining
                      and improving this platform.
                    </motion.p>
                  </motion.div>

                  {/* Why Donate */}
                  <motion.div
                    className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                      >
                        <Info className="h-5 w-5 text-blue-500" />
                      </motion.div>
                      <span className="font-semibold">Why donate?</span>
                    </div>
                    <motion.ul
                      className="list-inside list-disc space-y-1 text-sm text-blue-900"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {[
                        "No ads, ever. 100% user-supported.",
                        "Help us cover server and development costs.",
                        "Enable new features and better content.",
                        "Every donation, big or small, makes a difference!",
                      ].map((item, index) => (
                        <motion.li
                          key={index}
                          variants={fadeInUpVariants}
                          whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        >
                          {item}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  {/* Donation Amount */}
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                  >
                    <RadioGroup
                      value={
                        donationOption === "preset"
                          ? amount.toString()
                          : "custom"
                      }
                      onValueChange={handleAmountChange}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    >
                      {DONATION_AMOUNTS.map((option, index) => (
                        <motion.div
                          key={option.value}
                          className="relative"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 2 + index * 0.1,
                            duration: 0.5,
                            type: "spring",
                          }}
                        >
                          <RadioGroupItem
                            value={option.value.toString()}
                            id={`amount-${option.value}`}
                            className="peer sr-only"
                          />
                          <motion.div
                            whileHover={{
                              scale: 1.05,
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Label
                              htmlFor={`amount-${option.value}`}
                              className="border-muted hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary flex h-16 cursor-pointer items-center justify-center rounded-xl border-2 bg-white text-lg font-semibold shadow-sm transition-all"
                            >
                              {option.label}
                            </Label>
                          </motion.div>
                        </motion.div>
                      ))}

                      <motion.div
                        className="col-span-2 mt-2 sm:col-span-3"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 2.6,
                          duration: 0.5,
                          type: "spring",
                        }}
                      >
                        <RadioGroupItem
                          value="custom"
                          id="amount-custom"
                          checked={donationOption === "custom"}
                          className="peer sr-only"
                        />
                        <motion.div
                          whileHover={{
                            scale: 1.02,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
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
                        </motion.div>
                      </motion.div>
                    </RadioGroup>
                  </motion.div>

                  {/* How Your Donation Helps */}
                  <motion.div
                    className="mt-8 rounded-lg border border-green-100 bg-green-50 p-4 text-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.8, duration: 0.8 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(34, 197, 94, 0.1)",
                    }}
                  >
                    <h3 className="mb-2 font-semibold text-green-900">
                      How your donation helps
                    </h3>
                    <motion.ul
                      className="space-y-1 text-sm text-green-900"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {[
                        "💡 Keeps the site online and ad-free",
                        "🔒 Funds security and privacy improvements",
                        "🌍 Expands access to more users globally",
                      ].map((item, index) => (
                        <motion.li
                          key={index}
                          variants={fadeInUpVariants}
                          whileHover={{
                            scale: 1.05,
                            x: 5,
                            transition: { duration: 0.2 },
                          }}
                        >
                          {item}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  {/* Testimonial */}
                  <motion.div
                    className="text-muted-foreground mt-6 text-center text-sm italic"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3, duration: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {`"I use this site every day for research. Donating was an easy choice!"`}
                    <br />
                    <span className="font-semibold not-italic">
                      - Recent Donor
                    </span>
                  </motion.div>
                </CardContent>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 3.2, duration: 0.8 }}
                >
                  <CardFooter className="bg-muted/20 flex flex-col gap-3 border-t px-8 py-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleDonate}
                        disabled={
                          isLoading || createCheckout.isPending || amount <= 0
                        }
                        className="from-primary to-primary/80 hover:text-primary-foreground w-full rounded-xl bg-gradient-to-r py-4 text-lg font-bold shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        size="lg"
                      >
                        <AnimatePresence mode="wait">
                          {isLoading || createCheckout.isPending ? (
                            <motion.span
                              className="flex items-center justify-center"
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.div
                                className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              />
                              Processing...
                            </motion.span>
                          ) : (
                            <motion.span
                              className="flex items-center justify-center"
                              key="donate"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                <CreditCard className="mr-2 h-5 w-5" />
                              </motion.div>
                              Donate{" "}
                              {amount > 0
                                ? `$${(amount / 100).toFixed(2)}`
                                : ""}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                    <motion.div
                      className="mt-2 flex justify-center gap-4"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {[
                        { src: "/stripe.svg", alt: "Stripe" },
                        { src: "/visa.svg", alt: "Visa" },
                        { src: "/mastercard.svg", alt: "Mastercard" },
                      ].map((payment) => (
                        <motion.div
                          key={payment.alt}
                          variants={fadeInUpVariants}
                          whileHover={{
                            scale: 1.1,
                            y: -5,
                            transition: { duration: 0.2 },
                          }}
                        >
                          <Image
                            src={payment.src}
                            alt={payment.alt}
                            width={100}
                            height={100}
                            className="h-8 w-auto"
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.div
                      className="text-muted-foreground mt-2 text-center text-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.8, duration: 0.8 }}
                    >
                      100% Secure Payments. No card info is stored on our
                      servers.
                    </motion.div>
                  </CardFooter>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-border/40 bg-muted/20 flex justify-center border-t py-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 4, duration: 0.8 }}
      >
        <div className="container flex justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="mb-4 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              >
                <ShieldCheck className="text-primary h-5 w-5" />
              </motion.div>
              <span className="font-medium">Secure Payments via Stripe</span>
            </motion.div>
            <motion.div
              className="text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2, duration: 0.8 }}
            >
              <p>
                WikiClone &copy; {new Date().getFullYear()} • All donations
                securely processed
              </p>
              <p className="mt-1">
                <motion.a
                  href="mailto:support@dcralph.com"
                  className="hover:text-foreground underline"
                  whileHover={{ scale: 1.05 }}
                >
                  support@dcralph.com
                </motion.a>
                {" • "}
                <motion.div className="inline" whileHover={{ scale: 1.05 }}>
                  <Link
                    href="/privacy"
                    className="hover:text-foreground underline"
                  >
                    Privacy Policy
                  </Link>
                </motion.div>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
