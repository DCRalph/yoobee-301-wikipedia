import Link from "next/link";
import Image from "next/image";
// import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer
      className="relative z-50 mt-auto bg-linear-to-br from-[#3b2a1a] to-[#2a1f12] px-4 py-12"
    // initial={{ opacity: 0, y: 20 }}
    // animate={{ opacity: 1, y: 0 }}
    // transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Main Footer Content */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="group flex flex-col items-center space-y-4 lg:items-start">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-linear-to-br from-[#f8f5f1] to-[#e8e0d6] p-2 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <Image src="/icon.png" alt="WikiClone" width={32} height={32} />
              </div>
              <span className="font-serif text-2xl font-bold text-[#f8f5f1] transition-colors duration-300 group-hover:text-white">
                WikiClone
              </span>
            </div>
            <p className="text-center text-sm text-[#f8f5f1]/80 transition-colors duration-300 group-hover:text-[#f8f5f1] lg:text-left">
              The free encyclopedia that anyone can edit
            </p>
            <div className="mx-auto h-0.5 w-16 bg-linear-to-r from-transparent via-[#f8f5f1]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:mx-0" />
          </div>

          {/* Navigation Links */}
          <div className="text-center lg:text-left">
            <h3 className="mb-4 font-serif text-lg font-semibold text-[#f8f5f1]">
              About
            </h3>
            <div className="space-y-3">
              <Link
                href="/about"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  About WikiClone
                </span>
              </Link>
              <Link
                href="/contact"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  Contact Us
                </span>
              </Link>
            </div>
          </div>

          {/* Games Section */}
          <div className="text-center lg:text-left">
            <h3 className="mb-4 font-serif text-lg font-semibold text-[#f8f5f1]">
              Games
            </h3>
            <div className="space-y-3">
              <Link
                href="/leaderboards"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  Leaderboards
                </span>
              </Link>
              <Link
                href="/play"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  Play Games
                </span>
              </Link>
            </div>
          </div>

          {/* Legal Links */}
          <div className="text-center lg:text-left">
            <h3 className="mb-4 font-serif text-lg font-semibold text-[#f8f5f1]">
              Legal
            </h3>
            <div className="space-y-3">
              <Link
                href="/privacy-policy"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  Privacy Policy
                </span>
              </Link>
              <Link
                href="/terms-of-service"
                className="group/link block text-sm text-[#f8f5f1]/80 transition-all duration-200 hover:translate-x-1 hover:text-[#f8f5f1]"
              >
                <span className="border-b border-transparent transition-all duration-200 group-hover/link:border-[#f8f5f1]/50">
                  Terms of Service
                </span>
              </Link>
            </div>
          </div>

          {/* Community Stats */}
          <div className="text-center lg:text-left">
            <h3 className="mb-4 font-serif text-lg font-semibold text-[#f8f5f1]">
              Community
            </h3>
            <div className="space-y-3">
              <div className="group/stat rounded-lg border border-[#f8f5f1]/20 bg-linear-to-br from-[#6b4c35]/20 to-[#3b2a1a]/20 p-3 transition-all duration-300 hover:scale-105 hover:border-[#f8f5f1]/40">
                <div className="text-lg font-bold text-[#f8f5f1] transition-colors duration-200 group-hover/stat:text-white">
                  Growing Daily
                </div>
                <div className="text-xs text-[#f8f5f1]/70 transition-colors duration-200 group-hover/stat:text-[#f8f5f1]/90">
                  Articles & Contributors
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px bg-linear-to-r from-transparent via-[#f8f5f1]/30 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="text-sm text-[#f8f5f1]/60">
            © 2025 BC WikiClone. Content is probably copyrighted.
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-[#f8f5f1]/20 bg-linear-to-r from-[#6b4c35]/20 to-[#3b2a1a]/20 px-4 py-2 text-xs text-[#f8f5f1]/80 transition-all duration-300 hover:scale-105 hover:border-[#f8f5f1]/40 hover:text-[#f8f5f1]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              Made with care
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
