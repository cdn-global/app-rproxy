import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import React from "react"
import type { UserPublic } from "../../client"
import ApiKeyModule from "../../components/ScrapingTools/ApiKey"

// --- User Settings Tab Component ---
function UserSettingsTab({ user }: { user: UserPublic }) {
  const toast = useToast()

  // Placeholder for future edit functionality
  const handleUpdateSettings = () => {
    toast({
      title: "Update Settings",
      description: "User settings update is not yet implemented.",
      status: "info",
      duration: 5000,
      isClosable: true,
    })
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Heading as="h1" size="xl" color="gray.800">
        User Settings
      </Heading>
      <Text color="gray.600">View and manage your account details.</Text>
      <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
        <FormControl mb={4}>
          <FormLabel color="gray.700">Full Name</FormLabel>
          <Input value={user.full_name || "N/A"} isReadOnly bg="gray.100" />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel color="gray.700">Email</FormLabel>
          <Input value={user.email || "N/A"} isReadOnly bg="gray.100" />
        </FormControl>
        <Button
          colorScheme="blue"
          onClick={handleUpdateSettings}
          isDisabled // Placeholder: disabled until update API is implemented
        >
          Update Settings
        </Button>
      </Box>
    </VStack>
  )
}

// --- Tab Configuration ---
const tabsConfig = [
  {
    title: "User Settings",
    component: () => {
      const queryClient = useQueryClient()
      const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
      return currentUser ? <UserSettingsTab user={currentUser} /> : null
    },
  },
]

// --- TanStack Router Route Definition ---
export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

// --- Main Settings Page Component ---
function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  if (!currentUser) {
    return (
      <Container maxW="full" py={6}>
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
      </Container>
    )
  }

  const finalTabs = currentUser.is_superuser ? tabsConfig : tabsConfig

  return (
    <Container maxW="full" py={9}>
      <Flex align="center" justify="space-between" py={6}>
        <Text fontSize="3xl" color="black">
          Settings
        </Text>
        <Flex align="center" gap={4}>
          <Text fontSize="lg" color="gray.600">
            Manage your account settings
          </Text>
          <Button
            as={Link}
            to="/hosting/billing"
            colorScheme="blue"
            variant="outline"
          >
            Manage Billing
          </Button>
        </Flex>
      </Flex>

      <Tabs isLazy variant="enclosed-colored" colorScheme="red">
        <TabList>
          {finalTabs.map((tab, index) => (
            <Tab
              key={index}
              bg="white"
              fontWeight="semibold"
              fontSize="lg"
              color="gray.400"
              _selected={{
                bg: "gray.50",
                color: "red.600",
                borderColor: "inherit",
                borderBottomColor: "gray.50",
                borderTopWidth: "2px",
                borderTopColor: "red.400",
                marginTop: "-1px",
              }}
            >
              {tab.title}
            </Tab>
          ))}
        </TabList>
        <TabPanels bg="gray.50" pt={6} pb={6} borderRadius="0 0 md md">
          {finalTabs.map((tab, index) => (
            <TabPanel key={index}>
              {React.createElement(tab.component)}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Container>
  )
}

export default UserSettings
