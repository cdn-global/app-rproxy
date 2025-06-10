import React, { useState } from "react";
import {
  Container,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Box,
  Button,
  VStack,
  useToast,
  Heading,
  Spinner,
  // Imports required for ApiKeyModule are assumed to be within that component
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { UserPublic } from "../../client";
import ApiKeyModule from "../../components/ScrapingTools/ApiKey";
import BillingTab from "../../components/Common/BillingTab"
// Note: ApiKeyModule definition is external to this file.

// --- Tab Configuration ---
const tabsConfig = [
  {
    title: "Credentials",
    component: () => {
      const token = localStorage.getItem("access_token");
      // Render ApiKeyModule, passing the token if it exists.
      return <ApiKeyModule token={token} />;
    },
  },
  {
    title: "Billing",
    component: BillingTab,
  },
];

// --- TanStack Router Route Definition ---
export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
});

// --- Main Settings Page Component ---
function UserSettings() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  if (!currentUser) {
    // Show a spinner while user data is being fetched by the layout
    return (
      <Container maxW="full" py={6}>
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  // Example for potentially different tabs for superusers vs. regular users
  const finalTabs = currentUser?.is_superuser ? tabsConfig : tabsConfig;

  return (
    <Container maxW="full" py={9}>
      <Flex align="center" justify="space-between" py={6}>
        <Text fontSize="3xl" color="black">
          Settings
        </Text>
        <Text fontSize="lg" color="gray.600">
          Manage your account settings
        </Text>
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
  );
}

export default UserSettings;