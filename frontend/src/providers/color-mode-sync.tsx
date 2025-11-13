import { useColorMode } from "@chakra-ui/react"
import { useEffect } from "react"

const classNames: Record<string, string> = {
  light: "light",
  dark: "dark",
}

export function ColorModeSync() {
  const { colorMode } = useColorMode()

  useEffect(() => {
    const mode = classNames[colorMode] ?? "light"
    const root = window.document.documentElement

    root.classList.remove(mode === "dark" ? "light" : "dark")
    root.classList.add(mode)
    root.style.setProperty("color-scheme", mode)
  }, [colorMode])

  return null
}
