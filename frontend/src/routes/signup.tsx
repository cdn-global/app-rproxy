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
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-lg md:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-4 bg-muted/30 p-8 md:p-12">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Access Your Data Needs
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Sign up to wield cutting-edge tools and transform your data into
            pure power.
          </p>
          <p className="text-sm text-muted-foreground">
            Curious how far you can go? Our expert crew and knowledge base are
            your launchpad to greatness.
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
            <Label htmlFor="full_name" className="sr-only">
              Full Name
            </Label>
            <Input
              id="full_name"
              minLength={3}
              {...register("full_name", { required: "Full Name is required" })}
              placeholder="Full Name"
              type="text"
              className="h-12 text-base"
            />
            {errors.full_name ? (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              className="h-12 text-base"
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <Input
              id="password"
              {...register("password", passwordRules())}
              placeholder="Password"
              type="password"
              className="h-12 text-base"
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="confirm_password" className="sr-only">
              Confirm Password
            </Label>
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Repeat Password"
              type="password"
              className="h-12 text-base"
            />
            {errors.confirm_password ? (
              <p className="text-sm text-destructive">
                {errors.confirm_password.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Creating account"
            className="h-12 w-full text-base"
            variant="primary"
          >
            Sign Up
          </Button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <RouterLink to="/login" className="font-medium text-primary hover:underline">
              Log In
            </RouterLink>
          </p>
        </form>
      </div>
    </div>
  )
}

export default SignUp
