"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { Toaster } from "react-hot-toast"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const {theme} = useTheme();
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
       <Toaster
  position="top-center"
  toastOptions={{
    style: {
      background: "hsl(var(--card))",
      color: "hsl(var(--card-foreground))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "12px",
      backdropFilter: "blur(8px)",
    },
  }}
/>

      {children}
    </NextThemesProvider>
  )
}
