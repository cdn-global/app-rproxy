import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast,
} from "@chakra-ui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FaUserSecret } from "react-icons/fa";
import { FiLogOut, FiUser, FiCreditCard } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

import useAuth from "../../hooks/useAuth";

// Define SubscriptionStatus interface (copied from ProtectedComponent)
interface SubscriptionStatus {
  hasSubscription: boolean;
  isTrial: boolean;
  isDeactivated: boolean;
}

// Fetch subscription status (copied from ProtectedComponent)
async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      "https://api.ROAMINGPROXY.com/v2/subscription-status",
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

const UserMenu = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Fetch subscription status (optional, remove if not needed)
  const { data: subscriptionStatus, error } = useQuery({
    queryKey: ["subscriptionStatus", "user-menu"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Invalid subscription status"))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/login" });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle unauthorized error (e.g., session expired)
  if (error?.message.includes("Unauthorized")) {
    return (
      <Box position="fixed" top={4} right={4}>
        <IconButton
          aria-label="Log in"
          icon={<FaUserSecret color="gray.800" fontSize="18px" />}
          bg="gray.50"
          border="1px solid"
          borderColor="red.300"
          _hover={{ bg: "red.100", borderColor: "red.400" }}
          _active={{ bg: "red.200", borderColor: "red.500" }}
          isRound
          onClick={() => navigate({ to: "/login" })}
          data-testid="login-button"
        />
      </Box>
    );
  }

  return (
    <>
    {/* Desktop */}
<Box
  display={{ base: "none", md: "block" }}
  position="fixed"
  top={4}
  right={4}
>
  <Menu>
    <MenuButton
      as={IconButton}
      aria-label="User menu"
      icon={<FaUserSecret color="gray.800" fontSize="18px" />}
      bg="gray.50"
      border="1px solid"
      borderColor="red.300" /* <-- FIX 1 */
      _hover={{ bg: "red.100", borderColor: "red.400" }} /* <-- FIX 2 */
      _active={{ bg: "red.200", borderColor: "red.500" }}
      isRound
      data-testid="user-menu-button"
    />
    <MenuList
      bg="gray.50"
      borderColor="gray.200"
      color="gray.800"
      boxShadow="md"
    >
      {/* ... rest of the component is fine */}
            <MenuItem
              as={Link}
              to="/settings"
              icon={<FiUser fontSize="18px" color="gray.600" />}
              _hover={{ bg: "red.100", color: "red.500" }}
              data-testid="settings-menu-item"
            >
              Settings
            </MenuItem>
            {/* Show subscription management for subscribed or trial users */}
            {subscriptionStatus && (subscriptionStatus.hasSubscription || subscriptionStatus.isTrial) && (
              <MenuItem
                as={Link}
                to="/proxies/pricing"
                icon={<FiCreditCard fontSize="18px" color="gray.600" />}
                _hover={{ bg: "red.100", color: "red.500" }}
                data-testid="subscription-menu-item"
              >
                Manage Subscription
              </MenuItem>
            )}
            <MenuItem
              icon={<FiLogOut fontSize="18px" color="red.500" />}
              onClick={handleLogout}
              color="red.500"
              fontWeight="bold"
              _hover={{ bg: "red.100" }}
              data-testid="logout-menu-item"
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>

      {/* Mobile (optional, remove if not needed) */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        top={4}
        right={4}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="User menu"
            icon={<FaUserSecret color="gray.800" fontSize="16px" />}
            bg="gray.50"
            border="1px solid"
            borderColor="red.300"
            _hover={{ bg: "red.100", borderColor: "red.400" }}
            _active={{ bg: "red.200", borderColor: "red.500" }}
            isRound
            size="sm"
            data-testid="user-menu-button-mobile"
          />
          <MenuList
            bg="gray.50"
            borderColor="gray.200"
            color="gray.800"
            boxShadow="md"
          >
            <MenuItem
              as={Link}
              to="/settings"
              icon={<FiUser fontSize="16px" color="gray.600" />}
              _hover={{ bg: "red.100", color: "red.500" }}
              data-testid="settings-menu-item-mobile"
            >
              Settings
            </MenuItem>
            {subscriptionStatus && (subscriptionStatus.hasSubscription || subscriptionStatus.isTrial) && (
              <MenuItem
                as={Link}
                to="/proxies/pricing"
                icon={<FiCreditCard fontSize="16px" color="gray.600" />}
                _hover={{ bg: "red.100", color: "red.500" }}
                data-testid="subscription-menu-item-mobile"
              >
                Manage Subscription
              </MenuItem>
            )}
            <MenuItem
              icon={<FiLogOut fontSize="16px" color="red.500" />}
              onClick={handleLogout}
              color="red.500"
              fontWeight="bold"
              _hover={{ bg: "red.100" }}
              data-testid="logout-menu-item-mobile"
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </>
  );
};

export default UserMenu;