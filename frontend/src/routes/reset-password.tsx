import {
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Link,
  Input,
  Text,
  Box,
  Heading,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import Logo from "../components/Common/Logo"
import { type ApiError, LoginService, type NewPassword } from "../client"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../utils"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function ResetPassword() {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })
  const showToast = useCustomToast()
  const navigate = useNavigate()

  const resetPassword = async (data: NewPassword) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      throw new Error("Reset token is missing")
    }
    await LoginService.resetPassword({
      requestBody: { new_password: data.new_password, token: token },
    })
  }

  const mutation = useMutation<void, ApiError, NewPassword>({
    mutationFn: resetPassword,
    onSuccess: () => {
      showToast("Success!", "Password updated successfully.", "success")
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    if (isSubmitting) return
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      showToast("Error", "Reset token is missing.", "error")
      return
    }
    mutation.mutate(data)
  }

  return (
    <Container 
      maxW="container.xl" 
      p={{ base: 4, md: 0 }} 
      minH="100vh" 
      display="flex" 
      alignItems="center"
      justifyContent="center"
    >
      <Flex 
        direction={{ base: "column", md: "row" }} 
        width="100%"
        maxW={{ base: "100%", md: "container.xl" }}
        bg="white"
        boxShadow={{ base: "sm", md: "md" }}
        borderRadius={{ base: "lg", md: "md" }}
        overflow="hidden"
      >
        {/* Left Column - Text Section */}
        <Box
          flex={{ md: 1 }}
          bg="gray.50"
          p={{ base: 6, md: 10 }}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius={{ base: "lg lg 0 0", md: "md 0 0 md" }}
        >
          <Heading 
            as="h1" 
            size={{ base: "lg", md: "xl" }} 
            mb={{ base: 4, md: 6 }}
            color="gray.800"
          >
            Reset Your Password
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            color="gray.600" 
            mb={{ base: 3, md: 4 }}
          >
            Set a new password to regain access and continue managing your data with ease.
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.500"
          >
            Need help? Our support team and documentation are ready to assist you.
          </Text>
        </Box>

        {/* Right Column - Form Section */}
        <Box
          flex={{ md: 1 }}
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          p={{ base: 6, md: 10 }}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={{ base: 4, md: 6 }}
          width={{ base: "100%", md: "auto" }}
        >
             <Logo 
      src="/logo.png" // Path to your logo in the public folder
      alt="DataProxy Logo"
      boxSize="45px" // Control the size of the logo easily
      href="/dashboard" // Link to a different page
    />


          <FormControl id="new_password" isInvalid={!!errors.new_password} width="100%">
            <FormLabel htmlFor="new_password" fontSize={{ base: "sm", md: "md" }}>
              Set Password
            </FormLabel>
            <Input
              id="new_password"
              {...register("new_password", passwordRules())}
              placeholder="Password"
              type="password"
              size={{ base: "md", md: "lg" }}
            />
            {errors.new_password && (
              <FormErrorMessage>{errors.new_password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="confirm_password" isInvalid={!!errors.confirm_password} width="100%">
            <FormLabel htmlFor="confirm_password" fontSize={{ base: "sm", md: "md" }}>
              Confirm Password
            </FormLabel>
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Confirm Password"
              type="password"
              size={{ base: "md", md: "lg" }}
            />
            {errors.confirm_password && (
              <FormErrorMessage>{errors.confirm_password.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isSubmitting}
            width="100%"
            size={{ base: "md", md: "lg" }}
          >
            Reset Password
          </Button>
        </Box>
      </Flex>
    </Container>
  )
}

export default ResetPassword