"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  const [showConfetti, setShowConfetti] = useState(false);

  // Example stats (replace with real data)
  const totalDonors = 312;

  // Animation ref
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const duration = 2000; // 2 seconds

  // Animation variants
  const celebrationVariants: Variants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.6,
        duration: 1.5,
      },
    },
  };

  const confettiVariants: Variants = {
    hidden: { y: -100, opacity: 0, rotate: 0 },
    visible: (i: number) => ({
      y: [0, 200],
      opacity: [0, 1, 0],
      rotate: [0, 180 + i * 45, 360 + i * 45],
      x: [0, (i % 2 === 0 ? 100 : -100) * Math.random()],
      transition: {
        delay: i * 0.1,
        duration: 2 + Math.random(),
        ease: "easeOut",
      },
    }),
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.5,
        staggerChildren: 0.2,
      },
    },
  };

  const bounceVariants: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.5,
        duration: 1.5,
      },
    },
  };

  const slideInVariants: Variants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const fadeInUpVariants: Variants = {
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

  // Trigger confetti after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-50">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-4 w-4 rounded-full"
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  left: `${Math.random() * 100}%`,
                  top: -20,
                }}
                variants={confettiVariants}
                initial="hidden"
                animate="visible"
                custom={i}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

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
        {/* Impact Stats */}
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
                  boxShadow: "0 20px 40px rgba(34, 197, 94, 0.2)",
                  transition: { duration: 0.3 },
                }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(34, 197, 94, 0.4)",
                    "0 0 0 20px rgba(34, 197, 94, 0)",
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
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </motion.div>
                <motion.span
                  className="text-lg font-semibold"
                  animate={{ color: ["#000000", "#16a34a", "#000000"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Donation Complete!
                </motion.span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 shadow"
                variants={fadeInUpVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)",
                  transition: { duration: 0.3 },
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                >
                  <Users className="h-5 w-5 text-blue-600" />
                </motion.div>
                <motion.span
                  className="text-lg font-semibold"
                  key={displayedDonors}
                  initial={{ scale: 1.5, color: "#2563eb" }}
                  animate={{ scale: 1, color: "#000000" }}
                  transition={{ duration: 0.5 }}
                >
                  {displayedDonors}
                </motion.span>
                <span className="text-muted-foreground text-sm">donors</span>
              </motion.div>
            </motion.div>

            <motion.div
              className="mb-10 text-center"
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-4 flex justify-center">
                <motion.div
                  className="bg-primary/20 relative rounded-full p-4 shadow"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                      "0 0 0 20px rgba(239, 68, 68, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0.4)",
                      "0 0 0 20px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(59, 130, 246, 0.4)",
                      "0 0 0 20px rgba(59, 130, 246, 0)",
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.2,
                    rotate: 360,
                    transition: { duration: 0.8 },
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <HeartIcon className="text-primary h-10 w-10" />
                  </motion.div>
                </motion.div>
              </div>
              <motion.h1
                className="mb-2 text-3xl font-bold tracking-tight"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.8,
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.4,
                }}
              >
                Thank You For Your Donation!
              </motion.h1>
              <motion.p
                className="text-muted-foreground mx-auto max-w-xl text-base"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                Your generous support helps us keep knowledge free and
                accessible for everyone. Every dollar goes directly to
                maintaining and improving this platform.
              </motion.p>
            </motion.div>

            <motion.div
              variants={bounceVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="mx-auto w-full overflow-hidden rounded-2xl border-0 pt-0 shadow-xl">
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                >
                  <CardHeader className="bg-primary/10 py-4">
                    <CardTitle className="flex items-center justify-center text-2xl font-bold">
                      <motion.span
                        animate={{
                          background: [
                            "linear-gradient(45deg, #3b82f6, #ef4444)",
                            "linear-gradient(45deg, #ef4444, #22c55e)",
                            "linear-gradient(45deg, #22c55e, #3b82f6)",
                            "linear-gradient(45deg, #3b82f6, #ef4444)", // Added to make the loop smooth
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }} // Changed repeatType to "loop"
                        className="!bg-clip-text text-transparent "
                      >
                        Donation Confirmation
                      </motion.span>
                    </CardTitle>
                  </CardHeader>
                </motion.div>

                <CardContent className="space-y-6 p-8">
                  <motion.div
                    className="bg-card rounded-lg border p-6 text-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.6 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    }}
                  >
                    <motion.h3
                      className="mb-2 text-lg font-medium"
                      animate={{ color: ["#000000", "#22c55e", "#000000"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Your donation was successful!
                    </motion.h3>
                    <motion.p
                      className="text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2, duration: 0.8 }}
                    >
                      A receipt has been sent to your email address. Thank you
                      for your generosity!
                    </motion.p>
                  </motion.div>

                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.8 }}
                  >
                    <h3 className="text-center font-medium">Your Impact</h3>
                    <p className="text-muted-foreground text-center text-sm">
                      Your contribution makes a real difference in supporting
                      our mission to provide free and accessible knowledge to
                      everyone. With your help, we can continue to:
                    </p>

                    <div className="mx-auto max-w-xs">
                      <motion.ul
                        className="text-muted-foreground text-left text-sm"
                        variants={staggerContainerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {[
                          {
                            text: "Maintain a high-quality platform",
                            icon: "✅",
                          },
                          { text: "Develop new features", icon: "🚀" },
                          { text: "Support our growing community", icon: "👥" },
                          { text: "Expand knowledge globally", icon: "🌍" },
                        ].map((item, index) => (
                          <motion.li
                            key={index}
                            className="mb-2 flex items-center"
                            variants={fadeInUpVariants}
                            whileHover={{
                              x: 10,
                              scale: 1.05,
                              transition: { duration: 0.2 },
                            }}
                          >
                            <motion.div
                              className="mr-2"
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2 + index * 0.5,
                                ease: "easeInOut",
                              }}
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </motion.div>
                            {item.text}
                          </motion.li>
                        ))}
                      </motion.ul>
                    </div>
                  </motion.div>
                </CardContent>

                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 3, duration: 0.8 }}
                >
                  <CardFooter className="bg-muted/20 flex flex-col space-y-3 border-t p-6 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="from-primary to-primary/80 hover:from-primary/80 hover:to-primary w-full transition-all duration-300 hover:scale-[1.02] sm:w-auto"
                      >
                        <Link
                          href="/"
                          className="flex items-center justify-center"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Home className="mr-2 h-4 w-4" />
                          </motion.div>
                          Return to Homepage
                        </Link>
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.4)",
                          "0 0 0 10px rgba(59, 130, 246, 0)",
                        ],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
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
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
                        </Link>
                      </Button>
                    </motion.div>
                  </CardFooter>
                </motion.div>
              </Card>
            </motion.div>

            <motion.div
              className="mt-8 rounded-lg border border-green-100 bg-green-50 p-4 text-center"
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 3.5, duration: 0.8, type: "spring" }}
              whileHover={{
                scale: 1.05,
                rotate: 1,
                boxShadow: "0 20px 40px rgba(34, 197, 94, 0.2)",
              }}
            >
              <motion.h3
                className="mb-2 font-semibold text-green-900"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                How your donation helps
              </motion.h3>
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
                      scale: 1.1,
                      x: 10,
                      color: "#15803d",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-border/40 bg-muted/20 flex justify-center border-t py-8"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 4, duration: 1 }}
      >
        <div className="container flex justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <motion.div
              className="mb-4 flex items-center gap-2"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
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
                    scale: 1.2,
                    y: -10,
                    rotate: 5,
                    transition: { duration: 0.3 },
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
              className="text-muted-foreground mt-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.5, duration: 0.8 }}
            >
              <p>
                WikiClone &copy; {new Date().getFullYear()} • All donations
                securely processed
              </p>
              <p className="mt-1">
                <motion.a
                  href="mailto:support@dcralph.com"
                  className="hover:text-foreground underline"
                  whileHover={{ scale: 1.05, color: "#3b82f6" }}
                >
                  support@dcralph.com
                </motion.a>
                {" • "}
                <motion.div
                  className="inline"
                  whileHover={{ scale: 1.05, color: "#3b82f6" }}
                >
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
