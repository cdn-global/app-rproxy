import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserRegister } from "../client"
import Logo from "../components/Common/Logo"
import useAuth, { isLoggedIn } from "../hooks/useAuth"
import { confirmPasswordRules, emailPattern, passwordRules } from "../utils"

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

function SignUp() {
  const { signUpMutation } = useAuth()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
    signUpMutation.mutate(data)
  }

  return (
    <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Logo />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              “This library has saved me countless hours of work and helped me
              deliver stunning designs to my clients faster than ever before.”
            </p>
            <footer className="text-sm">Roaming Proxy</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    {...register("full_name", {
                      required: "Full name is required.",
                    })}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-gray-500">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    {...register("email", {
                      required: "Email is required.",
                      pattern: emailPattern,
                    })}
                    placeholder="name@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                  />
                  {errors.email && (
                    <p className="text-sm text-gray-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", passwordRules())}
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <p className="text-sm text-gray-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register(
                      "confirm_password",
                      confirmPasswordRules(getValues),
                    )}
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-gray-500">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <RouterLink
              to="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </RouterLink>{" "}
            and{" "}
            <RouterLink
              to="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </RouterLink>
            .
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <RouterLink
              to="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Log in
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
