"use client";

import { motion } from "motion/react";
import { api } from "~/trpc/react";

export default function AboutPage() {
  const { data: dbStats, isLoading: dbStatsLoading } = api.stats.getDatabaseSize.useQuery();

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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 15,
      },
    },
  };

  const imageVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const numberCountUpVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12,
        delay: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="mx-auto max-w-6xl px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-12 text-center" variants={itemVariants}>
        <motion.h1
          className="mb-6 text-5xl font-bold text-[#3a2a14]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
        >
          About WikiClone
        </motion.h1>
        <motion.p
          className="mx-auto max-w-3xl text-xl text-gray-600"
          variants={itemVariants}
        >
          Empowering knowledge sharing through innovative technology and
          collaborative learning experiences.
        </motion.p>
      </motion.div>

      <motion.div
        className="mb-16 grid items-center gap-12 md:grid-cols-2"
        variants={itemVariants}
      >
        <motion.div
          className="relative h-64 overflow-hidden rounded-lg md:h-80"
          variants={imageVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3a2a14] to-[#5a4a34]">
            <motion.div
              className="text-center text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="mb-4 text-6xl">📚</div>
              <div className="text-2xl font-bold">Knowledge Hub</div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-3xl font-semibold text-[#3a2a14]">Our Mission</h2>
          <p className="leading-relaxed text-gray-700">
            WikiClone was born from a simple yet powerful idea: to create a
            platform where knowledge flows freely and everyone can contribute to
            the collective understanding of our world. We believe that
            information should be accessible, accurate, and continuously
            improved by a global community of learners and experts.
          </p>
          <p className="leading-relaxed text-gray-700">
            Our mission is to democratize knowledge sharing and create an
            environment where curiosity meets expertise, fostering collaboration
            and learning across all disciplines and cultures.
          </p>
        </motion.div>
      </motion.div>

      {/* Database Statistics Section */}
      <motion.div
        className="mb-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-8 shadow-lg"
        variants={itemVariants}
        whileInView={{ scale: [0.98, 1.01, 1] }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <motion.h2
            className="mb-6 text-3xl font-bold text-[#3a2a14]"
            variants={itemVariants}
          >
            🗄️ Our Knowledge Database
          </motion.h2>

          {dbStatsLoading ? (
            <motion.div
              className="flex justify-center items-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <motion.div
                  key={index}
                  className="w-3 h-3 bg-[#3a2a14] rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.15,
                  }}
                />
              ))}
              <motion.span
                className="ml-4 text-[#3a2a14] font-medium"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Loading database info...
              </motion.span>
            </motion.div>
          ) : dbStats ? (
            <motion.div
              className="grid gap-6 md:grid-cols-2"
              variants={containerVariants}
            >
              {/* Main Database Size */}
              <motion.div
                className="bg-white rounded-xl p-6 border-2 border-indigo-200"
                variants={cardVariants}
                whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px rgba(59, 130, 246, 0.12)",
                  borderColor: "#3b82f6"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-6xl mb-4"
                  whileHover={{
                    scale: 1.05,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                >
                  💾
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Database Size</h3>
                <motion.div
                  className="text-4xl font-bold text-[#3a2a14]"
                  variants={numberCountUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {dbStats?.formattedSize ?? 'N/A'}
                </motion.div>
                {dbStats?.error && (
                  <p className="text-sm text-red-500 mt-2">{dbStats.error}</p>
                )}
              </motion.div>

              {/* Article Count */}
              <motion.div
                className="bg-white rounded-xl p-6 border-2 border-purple-200"
                variants={cardVariants}
                whileHover={{
                  y: -3,
                  boxShadow: "0 10px 25px rgba(147, 51, 234, 0.12)",
                  borderColor: "#9333ea"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-4xl mb-4"
                  whileHover={{
                    rotate: 15,
                    scale: 1.05,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                >
                  📄
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Article Count</h3>
                <motion.div
                  className="text-4xl font-bold text-purple-600"
                  variants={numberCountUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {dbStats?.articleCount?.toLocaleString() ?? 'N/A'}
                </motion.div>
              </motion.div>


            </motion.div>
          ) : (
            <motion.div
              className="text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Unable to load database statistics
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="mb-16 grid gap-8 md:grid-cols-3"
        variants={containerVariants}
      >
        {[
          {
            icon: "🎯",
            title: "Our Vision",
            description:
              "To become the world's most trusted source of collaborative knowledge, where accuracy meets accessibility.",
          },
          {
            icon: "💡",
            title: "Innovation",
            description:
              "Leveraging cutting-edge technology to enhance the knowledge sharing experience through AI and advanced search.",
          },
          {
            icon: "🤝",
            title: "Community",
            description:
              "Building a global community of contributors who share our passion for learning and knowledge preservation.",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="rounded-lg border bg-white p-6 shadow-lg"
            variants={cardVariants}
            whileHover={{
              y: -5,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="mb-4 text-center text-4xl"
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {item.icon}
            </motion.div>
            <h3 className="mb-3 text-center text-xl font-semibold text-[#3a2a14]">
              {item.title}
            </h3>
            <p className="text-center text-gray-600">{item.description}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mb-16 rounded-lg bg-gradient-to-r from-[#3a2a14] to-[#5a4a34] p-8 text-white"
        variants={itemVariants}
        whileInView={{ scale: [0.9, 1.05, 1] }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold">Our Story</h2>
            <p className="mb-4 leading-relaxed">
              Founded in 2025 BC, WikiClone emerged from the collaborative efforts
              of passionate educators, technologists, and knowledge enthusiasts
              who recognized the need for a more dynamic and accessible
              knowledge platform.
            </p>
            <p className="leading-relaxed">
              What started as a small project has grown into a comprehensive
              platform that serves thousands of users worldwide, all united by
              their love for learning and sharing knowledge.
            </p>
          </div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.div
              className="mb-4 text-6xl"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🚀
            </motion.div>
            <div className="text-2xl font-bold">Growing Every Day</div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="text-center" variants={itemVariants}>
        <h2 className="mb-6 text-3xl font-semibold text-[#3a2a14]">
          Join Our Journey
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600">
          {`Whether you're here to learn, contribute, or simply explore, you're
          part of our growing community. Together, we're building something
          amazing.`}
        </p>
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          variants={containerVariants}
        >
          {["Explore", "Contribute", "Learn", "Connect"].map(
            (action, index) => (
              <motion.button
                key={index}
                className="rounded-lg bg-[#3a2a14] px-6 py-3 font-medium text-white"
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "#2d1f0f",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {action}
              </motion.button>
            ),
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
