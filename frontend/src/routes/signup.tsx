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
import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import Logo from "../components/Common/Logo"
import type { UserRegister } from "../client"
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
            Access Your Data Needs
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            color="gray.600" 
            mb={{ base: 3, md: 4 }}
          >
            Sign up to wield cutting-edge tools and transform your data into pure power.
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.500"
          >
            Curious how far you can go? Our expert crew and secret knowledge base are your launchpad to greatness.
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

          <FormControl id="full_name" isInvalid={!!errors.full_name} width="100%">
            <FormLabel htmlFor="full_name" srOnly>
              Full Name
            </FormLabel>
            <Input
              id="full_name"
              minLength={3}
              {...register("full_name", { required: "Full Name is required" })}
              placeholder="Full Name"
              type="text"
              size={{ base: "md", md: "lg" }}
            />
            {errors.full_name && (
              <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="email" isInvalid={!!errors.email} width="100%">
            <FormLabel htmlFor="email" srOnly>
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

          <FormControl id="password" isInvalid={!!errors.password} width="100%">
            <FormLabel htmlFor="password" srOnly>
              Password
            </FormLabel>
            <Input
              id="password"
              {...register("password", passwordRules())}
              placeholder="Password"
              type="password"
              size={{ base: "md", md: "lg" }}
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="confirm_password" isInvalid={!!errors.confirm_password} width="100%">
            <FormLabel htmlFor="confirm_password" srOnly>
              Confirm Password
            </FormLabel>
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Repeat Password"
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
            Sign Up
          </Button>

          <Text fontSize={{ base: "sm", md: "md" }}>
            Already have an account?{" "}
            <Link 
              as={RouterLink} 
              to="/login" 
              color="red.500"
            >
              Log In
            </Link>
          </Text>
        </Box>
      </Flex>
    </Container>
  )
}

export default SignUp