"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useLayoutEffect, useState } from "react"

export function ThemeToggle() {

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // prevents hydration mismatch
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themes = [
    { name: "light", icon: Sun },
    { name: "dark", icon: Moon },
    { name: "system", icon: Laptop },
  ]

  return (
    <div
      className="
        relative
        flex
        items-center
        gap-1
        rounded-full
        border
        border-white/10
        bg-white/10
        backdrop-blur-xl
        p-1
        shadow-lg
      "
    >

      {themes.map(({ name, icon: Icon }) => {

        const active = theme === name

        return (
          <button
            key={name}
            onClick={() => setTheme(name)}
            className="
              relative
              z-10
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              transition
            "
          >
            {/* Active Bubble */}
            {active && (
              <motion.span
                layoutId="bubble"
                className="
                  absolute
                  inset-0
                  rounded-full
                  bg-gradient-to-br
                  from-indigo-500
                  to-cyan-400
                  shadow-md
                "
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              />
            )}

            <Icon
              className={`
                h-4 w-4
                relative
                transition
                ${active ? "text-white" : "text-muted-foreground"}
              `}
            />
          </button>
        )
      })}
    </div>
  )
}
