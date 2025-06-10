import {
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Link,
  Text,
  Box,
  Heading,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import Logo from "../components/Common/Logo"
import { type ApiError } from "../client"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../utils"

interface NewPasswordForm {
  new_password: string
  confirm_password: string
}

export const Route = createFileRoute('/activate')({
  component: ActivateAccount,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

async function activateAccount(data: { new_password: string; token: string }) {
  const baseUrl = 'https://api.roamingproxy.com'
  if (!baseUrl) {
    console.error("base url is not defined")
    throw new Error("API URL is not configured")
  }
  const apiUrl = `${baseUrl}/v2/activate`
  console.log("Sending request to:", apiUrl, "with data:", data)
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      token: data.token,
      new_password: data.new_password,
    }),
  })

  console.log("Response status:", response.status, response.statusText)
  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error response:", errorData)
    const error: ApiError = {
      name: "ApiError",
      url: apiUrl,
      status: response.status,
      statusText: response.statusText,
      body: errorData,
      request: {
        method: "POST",
        url: apiUrl,
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
      },
      message: errorData.detail || "Failed to activate account",
    }
    throw error
  }

  return response.json()
}

function ActivateAccount() {
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

  const mutation = useMutation<{ message: string }, ApiError, { new_password: string; token: string }>({
    mutationFn: activateAccount,
    onSuccess: () => {
      showToast("Success!", "Account activated successfully.", "success")
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      showToast("Error", "Activation token is missing.", "error")
      return
    }
    mutation.mutate({ new_password: data.new_password, token })
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
            Activate Your Account
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            color="gray.600" 
            mb={{ base: 3, md: 4 }}
          >
            Set your new password to unlock seamless data management and take control with confidence.
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.500"
          >
            Need assistance? Our expert support team and comprehensive documentation are here to help.
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
      src="/assets/images/roaming-proxy-network-logo.png"
      alt="Roaming Proxy Logo"
      boxSize="220px"
      href="/"
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
            Activate Account
          </Button>
        </Box>
      </Flex>
    </Container>
  )
}

export default ActivateAccount