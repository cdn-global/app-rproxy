import { Link as RouterLink } from "@tanstack/react-router"
import type React from "react"

import { cn } from "@/lib/utils"

interface LogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  src: string
  alt?: string
  to?: string
  imgClassName?: string
}

const Logo: React.FC<LogoProps> = ({
  to = "/",
  src,
  alt = "Company Logo",
  className,
  imgClassName,
  ...rest
}) => {
  return (
    <RouterLink
      to={to}
      className={cn(
        "inline-flex transition-opacity duration-200 hover:opacity-80",
        className,
      )}
      {...rest}
    >
      <img
        src={src}
        alt={alt}
        className={cn("h-auto w-[110px] object-contain", imgClassName)}
      />
    </RouterLink>
  )
}

export default Logo
