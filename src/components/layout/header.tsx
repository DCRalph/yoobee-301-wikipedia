"use client";

import Link from "next/link";
import { UserMenu } from "./user-menu";
import { BookText, Brain, Home, Heart, Menu, X } from "lucide-react";
import { api } from "~/trpc/react";
import { SearchDialog } from "~/components/wiki/SearchDialog";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch public settings to check if AI features are enabled
  const { data: settings } = api.admin.settings.getPublic.useQuery();
  const showAIFeatures = settings?.enableAIFeatures;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/wiki",
      label: "Articles",
      icon: BookText,
    },
    {
      href: "/donate",
      label: "Donate",
      icon: Heart,
    },
    ...(showAIFeatures
      ? [
          {
            href: "/testing",
            label: "AI Testing",
            icon: Brain,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#2E1503] text-white backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/icon.png" alt="WikiClone" width={32} height={32} />
            <span className="hidden sm:inline">WikiClone</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 lg:flex">
          <ul className="flex gap-6">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-popover flex items-center gap-2 text-sm transition-colors"
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <SearchDialog />
          </div>
          <UserMenu />
        </nav>

        {/* Mobile navigation */}
        <div className="flex items-center gap-2 lg:hidden">
          <SearchDialog />
          <UserMenu />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="text-white hover:bg-white/10"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <motion.div
              className="border-t border-white/10 bg-[#2E1503]"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <nav className="container mx-auto px-4 py-4">
                <motion.ul
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                >
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.li
                        key={item.href}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Link
                          href={item.href}
                          className="hover:text-popover flex items-center gap-3 py-2 text-white transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <IconComponent className="size-6" />
                          {item.label}
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
