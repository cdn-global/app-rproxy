// src/components/Appearance.tsx
import { useColorMode } from "@chakra-ui/react"

const OPTIONS = [
  {
    label: "Light Mode",
    value: "light",
    helper: "Default",
    description: "Bright interface optimised for daytime use.",
  },
  {
    label: "Dark Mode",
    value: "dark",
    helper: "",
    description:
      "Reduced glare with higher contrast for low-light environments.",
  },
] as const

const helperBadgeClasses =
  "rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary-foreground"

function Appearance() {
  const { colorMode, setColorMode } = useColorMode()

  return (
    <section
      aria-labelledby="appearance-section-title"
      className="space-y-5 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h2
          id="appearance-section-title"
          className="text-sm font-semibold text-foreground"
        >
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground">
          Switch between light and dark themes. Your preference is saved locally
          on this device.
        </p>
      </div>

      <div
        className="grid gap-3 md:grid-cols-2"
        role="radiogroup"
        aria-label="Color mode preference"
      >
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="block cursor-pointer"
            htmlFor={`appearance-${option.value}`}
          >
            <input
              id={`appearance-${option.value}`}
              className="peer sr-only"
              type="radio"
              name="color-mode"
              value={option.value}
              checked={colorMode === option.value}
              onChange={() => setColorMode(option.value)}
            />

            <div className="rounded-lg border border-border bg-background p-4 shadow-sm transition-colors duration-200 focus-within:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-checked:border-primary peer-checked:bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
                {option.helper ? (
                  <span className={helperBadgeClasses}>{option.helper}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}

export default Appearance
