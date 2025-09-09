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
import { createFileRoute, redirect } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import Logo from "../components/Common/Logo"
import { type ApiError, LoginService } from "../client"
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
            Recover Your Password
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            color="gray.600" 
            mb={{ base: 3, md: 4 }}
          >
            Enter your email to receive a link to reset your password and regain access.
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.500"
          >
            Need assistance? Our support team and documentation are here to help.
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
  width="110px"
      href="/"
    />

          <FormControl id="email" isInvalid={!!errors.email} width="100%">
            <FormLabel htmlFor="email" fontSize={{ base: "sm", md: "md" }}>
              Email
            </FormLabel>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              size={{ base: "md", md: "lg" }}
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isSubmitting}
            width="100%"
            size={{ base: "md", md: "lg" }}
          >
            Continue
          </Button>
        </Box>
      </Flex>
    </Container>
  )
}

export default RecoverPassword