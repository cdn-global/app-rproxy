import React, { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Text, VStack, Button, Flex, Spinner } from "@chakra-ui/react";
import PromoSERP from "./ComingSoon"; // Adjust the import path as needed
import useAuth from "../../hooks/useAuth";

interface SubscriptionStatus {
  hasSubscription: boolean;
  isTrial: boolean;
  isDeactivated: boolean;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      "https://api.roamingproxy.com/v2/subscription-status",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized: Invalid or expired session.");
      }
      throw new Error(`Failed to fetch subscription status: ${response.status}`);
    }

    const data = await response.json();
    // Validate response shape
    if (
      typeof data.hasSubscription !== "boolean" ||
      typeof data.isTrial !== "boolean" ||
      typeof data.isDeactivated !== "boolean"
    ) {
      throw new Error("Invalid subscription status response");
    }

    return data;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Network error occurred while fetching subscription status");
  }
}

const ProtectedComponent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate({ to: "/login" }); // Redirect to login after logout
  }, [logout, navigate]);

  const { data: subscriptionStatus, isLoading, error } = useQuery({
    queryKey: ["subscriptionStatus", "serp"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Invalid subscription status"))
      ) {
        return false; // Don't retry on unauthorized or invalid response
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
  });

  // Effect to automatically log out on error after a delay
  useEffect(() => {
    const isUnauthorizedError =
      error instanceof Error && error.message.includes("Unauthorized");

    // Only set a timer for non-authentication errors
    if (error && !isUnauthorizedError) {
      const timer = setTimeout(() => {
        handleLogout();
      }, 30000); // 30 seconds

      // Cleanup the timer if the component unmounts or error changes
      return () => clearTimeout(timer);
    }
  }, [error, handleLogout]);

  // Loading state
  if (isLoading) {
    return (
      <VStack spacing={4}>
        <Spinner size="lg" />
        <Text>Loading subscription status...</Text>
      </VStack>
    );
  }

  // Error state
  if (error) {
    const isUnauthorizedError =
      error instanceof Error && error.message.includes("Unauthorized");

    // Handle session expiration immediately
    if (isUnauthorizedError) {
      return (
        <VStack spacing={4}>
          <Text color="red.500">Your session has expired. Please log in again.</Text>
          <Button colorScheme="blue" onClick={() => navigate({ to: "/login" })}>
            Log In
          </Button>
        </VStack>
      );
    }

    // Handle other errors with a timed logout
    return (
      <VStack spacing={4}>
        <Text color="red.500">
          An error occurred while loading your subscription status.
        </Text>
        <Text>You will be logged out in 30 seconds to clear your session.</Text>
        <Button colorScheme="red" onClick={handleLogout}>
          Logout and Relogin Now
        </Button>
      </VStack>
    );
  }

  // Validate subscription status
  if (!subscriptionStatus) {
    return (
      <VStack spacing={4}>
        <Text color="red.500">
          Unable to load subscription status. Please try again.
        </Text>
        <Button colorScheme="blue" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </VStack>
    );
  }

  // Extract subscription details
  const { hasSubscription, isTrial, isDeactivated } = subscriptionStatus;

  // Define access conditions
  const isLocked = !hasSubscription && !isTrial; // No subscription or trial
  const isFullyDeactivated = isDeactivated && !hasSubscription; // Deactivated without subscription

  // No access: show promotional content for non-subscribed users
  if (isLocked) {
    return <PromoSERP />;
  }

  // Deactivated tools: prompt to reactivate (only for non-subscribed users)
  if (isFullyDeactivated) {
    return (
      <Flex
        justify="space-between"
        align="center"
        w="full"
        p={4}
        bg="red.50"
        borderRadius="md"
      >
        <Text color="gray.800">Your tools have been deactivated.</Text>
        <Button
          colorScheme="red"
          onClick={() => navigate({ to: "/proxies/pricing" })}
        >
          Reactivate Now
        </Button>
      </Flex>
    );
  }

  // Subscribed or trial users: render protected content
  if (hasSubscription || isTrial) {
    return <>{children}</>;
  }

  // Fallback: render protected content (should not be reached due to above conditions)
  return <>{children}</>;
};

export default ProtectedComponent;