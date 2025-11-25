import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type ApiError, LoginService } from "../client"
import Logo from "../components/Common/Logo"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { emailPattern, handleError } from "../utils"

interface FormData {
  email: string
}

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function RecoverPassword() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
    },
  })
  const showToast = useCustomToast()

  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      email: data.email,
    })
  }

  const mutation = useMutation<void, ApiError, FormData>({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showToast(
        "Email sent.",
        "We sent an email with a link to get back into your account.",
        "success",
      )
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (isSubmitting) return
    mutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-lg md:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-4 bg-muted/30 p-8 md:p-12">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Recover Your Password
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Enter your email to receive a link to reset your password and regain
            access.
          </p>
          <p className="text-sm text-muted-foreground">
            Need assistance? Our support team and documentation are here to
            help.
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
            <Label htmlFor="email">Email</Label>
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

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Sending"
            className="h-12 w-full text-base"
            variant="primary"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}

export default RecoverPassword
