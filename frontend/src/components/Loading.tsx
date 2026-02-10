"use client"

import { motion } from "framer-motion"

const Loading = ({ fullScreen = true }: { fullScreen?: boolean }) => {
  return (
    <div
      className={`
        ${fullScreen ? "min-h-screen" : "h-full"}
        w-full flex items-center justify-center
        bg-gradient-to-br
        from-indigo-50 via-white to-cyan-50
        dark:from-black dark:via-zinc-950 dark:to-indigo-950
        relative overflow-hidden
      `}
    >
      {/* Glow Orbs */}
      <motion.div
        className="absolute w-72 h-72 bg-slate-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -40, 40, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Loader */}
      <div className="relative flex flex-col items-center gap-6">
        
        {/* Spinning Rings */}
        <div className="relative flex items-center justify-center">
          
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-indigo-500/30"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "linear",
            }}
          />

          <motion.div
            className="absolute w-16 h-16 rounded-full border-2 border-cyan-400"
            animate={{ rotate: -360 }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear",
            }}
          />

          <motion.div
            className="w-6 h-6 rounded-full bg-indigo-800"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
            }}
          />
        </div>

        {/* Text */}
        <motion.p
          className="text-sm tracking-widest text-zinc-400 dark:text-zinc-200 font-medium"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          Initializing Secure Session...
        </motion.p>
      </div>
    </div>
  )
}

export default Loading
