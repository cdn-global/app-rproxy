import { Box, Button, Link, Text, VStack } from "@chakra-ui/react"
import type React from "react"

const ComingSoon: React.FC = () => {
  return (
    <Box maxW="100%" mx="auto" px={{ base: 6, md: 12 }} py={12}>
      <VStack
        spacing={8}
        align="center"
        justify="center"
        maxW="600px"
        mx="auto"
      >
        <Text
          fontSize={{ base: "sm", md: "md" }}
          color="gray.600"
          textAlign="center"
        >
          Account is not linked to a valid subscription
        </Text>
        <Button
          as="a"
          href="https://ROAMINGPROXY.com/pricing"
          target="_blank"
          rel="noopener noreferrer"
          colorScheme="blue"
          size="md"
          px={6}
        >
          Explore Plans
        </Button>
        <Text
          fontSize={{ base: "sm", md: "md" }}
          color="gray.600"
          textAlign="center"
        >
          If you have purchased a subscription, please{" "}
          <Link
            href="mailto:support@ROAMINGPROXY.com"
            color="red.500"
            textDecoration="underline"
            _hover={{ color: "red.700" }}
          >
            contact support
          </Link>{" "}
          using the same email address used for the purchase.
        </Text>
      </VStack>
    </Box>
  )
}

export default ComingSoon
