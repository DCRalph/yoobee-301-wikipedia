"use client";

import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";

export default function WikiNotFound() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-[#f5f0e6]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-1 items-center justify-center p-4">
        <motion.div
          className="mx-auto max-w-2xl rounded-lg border border-[#d4bc8b] bg-[#f9f5eb] p-8 shadow-sm"
          variants={itemVariants}
        >
          <div className="text-center">
            <h1 className="mb-6 font-serif text-4xl font-bold text-[#3a2a14]">
              Article Not Found
            </h1>

            <motion.div className="mb-8 text-[#605244]" variants={itemVariants}>
              <p className="mb-4">
                {`The wiki article you're looking for could not be found. It might
                have been moved, renamed, or it may not exist yet.`}
              </p>
              <p>
                You can help by creating this article if you have knowledge
                about this topic.
              </p>
            </motion.div>

            <motion.div
              className="mx-auto mb-8 h-32 w-32 rounded-full bg-[#e8dcc3] p-6"
              variants={itemVariants}
            >
              <BookOpen className="h-full w-full text-[#5c3c10]" />
            </motion.div>

            <motion.div
              className="mb-8 rounded-lg border border-[#d4bc8b] bg-[#e8dcc3] p-4"
              variants={itemVariants}
            >
              <h3 className="mb-2 font-serif text-lg font-semibold text-[#3a2a14]">
                What you can do:
              </h3>
              <ul className="space-y-2 text-[#605244]">
                <li className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search for the article using different terms
                </li>
                {/* <li className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  Check the article history to see if it was renamed
                </li> */}
                <li className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create the article if you have knowledge about this topic
                </li>
              </ul>
            </motion.div>

            <motion.div
              className="flex justify-center space-x-4"
              variants={itemVariants}
            >
              <Button
                variant="outline"
                size="sm"
                className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                asChild
              >
                <Link href="/wiki">Browse All Articles</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#d4bc8b] text-[#5c3c10] hover:bg-[#e8dcc3]"
                asChild
              >
                <Link href="/wiki/create">Create New Article</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
