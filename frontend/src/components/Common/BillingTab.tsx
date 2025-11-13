import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  Flex,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"
import React, { useState } from "react"

// --- Helper function for Billing ---
const fetchBillingPortal = async (token: string) => {
  const response = await fetch(
    "https://api.ROAMINGPROXY.com/v2/customer-portal",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch portal: ${response.status}`)
  }
  const data = await response.json()
  if (!data.portal_url) {
    throw new Error("No portal URL received")
  }
  return data.portal_url
}

// --- Tab Content: BillingTab ---
const BillingTab = () => {
  const [token] = useState<string | null>(localStorage.getItem("access_token"))
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleBillingClick = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const portalUrl = await fetchBillingPortal(token)
      window.location.href = portalUrl
    } catch (error) {
      console.error("Error accessing customer portal:", error)
      toast({
        title: "Error",
        description: "Failed to access billing portal. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Guard clause to match the provided template's pattern
  if (!token) {
    return (
      <Box p={6} width="100%">
        <Alert status="warning">
          <AlertIcon />
          Please log in to manage your billing information.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <VStack spacing={2} align="stretch">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
        >
          <Box>
            <Text fontSize="lg" mb={2} color="gray.700">
              Manage your subscriptions, view invoices, and update payment
              methods.
            </Text>
            <Text fontSize="lg" mb={4} color="gray.700">
              You will be securely redirected to our customer portal.
            </Text>
          </Box>
          <Button
            colorScheme="blue"
            onClick={handleBillingClick}
            isLoading={isLoading}
            loadingText="Redirecting..."
            isDisabled={isLoading}
          >
            Manage Billing
          </Button>
        </Flex>
        <Divider mb={4} />
      </VStack>
    </Box>
  )
}

export default BillingTab
