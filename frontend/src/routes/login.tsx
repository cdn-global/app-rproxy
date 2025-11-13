import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Body_login_login_access_token as AccessToken } from "../client"
import Logo from "../components/Common/Logo"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { emailPattern } from "../utils"

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/" })
    }
  },
})

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccessToken>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { username: "", password: "" },
  })

  const onSubmit: SubmitHandler<AccessToken> = async (data) => {
    if (isSubmitting) return
    resetError()
    try {
      await loginMutation.mutateAsync(data)
    } catch {
      // error is handled by useAuth hook
    }
  }

  // Social media logo components
  const GitHubLogo = () => (
    <a
      href="https://github.com/CobaltDataNet"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      <img
        src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
        alt="GitHub Logo"
        className="h-7 w-7 md:h-8 md:w-8"
      />
    </a>
  )

  const LinkedInLogo = () => (
    <a
      href="https://www.linkedin.com/company/CobaltDataNet"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
        alt="LinkedIn Logo"
        className="h-7 w-7 md:h-8 md:w-8"
      />
    </a>
  )

  const XLogo = () => (
    <a
      href="https://twitter.com/cobaltdata"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      <img
        src="https://images.freeimages.com/image/large-previews/f35/x-twitter-logo-on-black-circle-5694247.png"
        alt="X Logo"
        className="h-7 w-7 md:h-8 md:w-8"
      />
    </a>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-lg md:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-4 bg-muted/30 p-8 md:p-12">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Web Scraping, Made Easy
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Sign in to experience seamless data management and take control
            with confidence.
          </p>
          <p className="text-sm text-muted-foreground">
            Need a boost? Our expert support team and comprehensive
            documentation are here to fuel your success.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-6 p-8 md:p-12"
        >
          <Logo
            src="/assets/images/roaming-proxy-network-logo.png"
            alt="Roaming Proxy Logo"
            imgClassName="w-24 md:w-28"
            className="self-start"
          />

          <div className="w-full space-y-2">
            <Label htmlFor="username">Email</Label>
            <Input
              id="username"
              {...register("username", {
                required: "Username is required",
                pattern: emailPattern,
              })}
              type="email"
              placeholder="you@example.com"
              className="h-12 text-base"
              required
            />
            {errors.username ? (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                {...register("password", { required: "Password is required" })}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 pr-12 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <RouterLink
            to="/recover-password"
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </RouterLink>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Logging in"
            className="h-12 w-full text-base"
            variant="primary"
          >
            Log In
          </Button>

          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <RouterLink to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </RouterLink>
          </p>

          <div className="mt-2 flex flex-col items-center gap-3 md:flex-row">
            <GitHubLogo />
            <LinkedInLogo />
            <XLogo />
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
