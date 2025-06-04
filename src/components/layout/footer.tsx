import Link from "next/link";
import Image from "next/image";
// import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer
      className="bg-[#3a2a14] p-4 text-center text-[#f9f5eb] relative z-50 mt-auto"
    // initial={{ opacity: 0, y: 20 }}
    // animate={{ opacity: 1, y: 0 }}
    // transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="WikiClone"
            width={32}
            height={32}
          />
          <span className="font-serif">WikiClone</span>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="#" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="#" className="hover:underline">
            Policy Privacy
          </Link>
          <Link href="#" className="hover:underline">
            Contact WikiClone
          </Link>
          <Link href="#" className="hover:underline">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
} 