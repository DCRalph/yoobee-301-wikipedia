"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "~/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleClick = (e: React.MouseEvent) => {
    // Only handle left click
    if (e.button === 0) {
      e.preventDefault()
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onMouseDown={handleClick}
        >
          {/* <span>{theme}</span> */}
          {mounted && (
            <>
              <Sun className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
              <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
              <Palette className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'pink' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
            </>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setTheme("light")}>
          Light
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTheme("dark")}>
          Dark
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTheme("pink")}>
          Pink
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setTheme("system")}>
          System
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
} 