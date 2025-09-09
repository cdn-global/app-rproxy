import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  Flex,
  Box,
  Heading,
  useBoolean,
} from "@chakra-ui/react"
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import Logo from "../components/Common/Logo"
import type { Body_login_login_access_token as AccessToken } from "../client"
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
  const [show, setShow] = useBoolean()
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
    <Link href="https://github.com/CobaltDataNet" target="_blank" rel="noopener noreferrer">
      <Image src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" boxSize={{ base: "28px", md: "32px" }} />
    </Link>
  )

  const LinkedInLogo = () => (
    <Link href="https://www.linkedin.com/company/CobaltDataNet" target="_blank" rel="noopener noreferrer">
      <Image src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn Logo" boxSize={{ base: "28px", md: "32px" }} />
    </Link>
  )

  const XLogo = () => (
    <Link href="https://twitter.com/cobaltdata" target="_blank" rel="noopener noreferrer">
      <Image src="https://images.freeimages.com/image/large-previews/f35/x-twitter-logo-on-black-circle-5694247.png" alt="XLogo" boxSize={{ base: "28px", md: "32px" }} />
    </Link>
  )

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
          Web Scraping, Made Easy
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }} 
            color="gray.600" 
            mb={{ base: 3, md: 4 }}
          >
            Sign in to experience seamless data management and take control with confidence.
          </Text>
          <Text 
            fontSize={{ base: "sm", md: "md" }} 
            color="gray.500"
          >
            Need a Boost? Our expert support team and comprehensive documentation are here to fuel your success.
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

          <FormControl id="username" isInvalid={!!errors.username || !!error} width="100%">
            <Input
              id="username"
              {...register("username", {
                required: "Username is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              required
              size={{ base: "md", md: "lg" }}
            />
            {errors.username && (
              <FormErrorMessage>{errors.username.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="password" isInvalid={!!error} width="100%">
            <InputGroup>
              <Input
                {...register("password", { required: "Password is required" })}
                type={show ? "text" : "password"}
                placeholder="Password"
                required
                size={{ base: "md", md: "lg" }}
              />
              <InputRightElement 
                color="ui.dim" 
                _hover={{ cursor: "pointer" }}
                pr={{ base: 2, md: 3 }}
              >
                <Icon
                  as={show ? ViewOffIcon : ViewIcon}
                  onClick={setShow.toggle}
                  aria-label={show ? "Hide password" : "Show password"}
                  boxSize={{ base: 5, md: 6 }}
                />
              </InputRightElement>
            </InputGroup>
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>

          <Link 
            as={RouterLink} 
            to="/recover-password" 
            color="red.500"
            fontSize={{ base: "sm", md: "md" }}
          >
            Forgot password?
          </Link>

          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isSubmitting} 
            width="100%"
            size={{ base: "md", md: "lg" }}
          >
            Log In
          </Button>

          <Text fontSize={{ base: "sm", md: "md" }}>
            Don't have an account?{" "}
            <Link 
              as={RouterLink} 
              to="/signup" 
              color="red.500"
            >
              Sign up
            </Link>
          </Text>

          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="center" 
            align="center" 
            gap={{ base: 3, md: 4 }} 
            mt={{ base: 4, md: 6 }}
          >
            <GitHubLogo />
            <LinkedInLogo />
            <XLogo />
          </Flex>
        </Box>
      </Flex>
    </Container>
  )
}

export default Login