import {
  Box,
  Flex,
  Icon,
  Text,
  IconButton,
  Tooltip,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack,
  Image, // Added for Logo
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import {
  FiLogOut,
  FiMenu,
  FiUsers,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiSettings,
} from "react-icons/fi";
import { FaBook, FaKey, FaCreditCard, FaGlobe, FaSitemap } from "react-icons/fa";

import useAuth from "../../hooks/useAuth";

interface NavItem {
  title: string;
  icon?: any;
  path?: string;
  description?: string;
  subItems?: NavItem[];
}
interface NavGroupDropdownProps {
  item: NavItem;
  activeTextColor: string;
  hoverColor: string;
  textColor: string;
}
interface NavItemsProps {
  onClose?: () => void;
  isMobile?: boolean;
}

// Sample Logo Component (replace with your actual Logo component if different)
const Logo = ({ src, alt, href }: { src: string; alt: string; href: string }) => (
  <Box
    as={RouterLink}
    to={href}
    display="flex"
    alignItems="center"
    height="40px" // Match approximate height of nav links
  >
    <Image
      src={src}
      alt={alt}
      height="40px" // Explicit height to align with nav links
      objectFit="contain" // Ensure image scales properly
    />
  </Box>
);

// ... (NavGroupDropdown, NavItems, and navStructure remain unchanged)

const TopNav = () => {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logout } = useAuth();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const textColor = "gray.800";
  const hoverColor = "red.600";
  const activeTextColor = "red.800";

  const handleLogout = async () => {
    logout();
    onClose();
  };

  return (
    <Box
      bg="gray.50"
      px={4}
      py={2}
      position="sticky"
      top="0"
      zIndex="sticky"
      boxShadow="sm"
      w="100%"
      borderBottomWidth="1px"
      borderBottomColor="gray.300"
    >
      <Flex
        align="center"
        justify="space-between" // Changed to space-between for better spacing
        maxW="1200px"
        mx="auto"
        height="48px" // Explicit height to ensure consistency
      >
        {/* Logo */}
        <Logo
          src="/assets/images/roaming-proxy-network-logo.png"
          alt="Roaming Proxy Logo"
          href="/"
        />

        {/* Mobile Menu Button */}
        <IconButton
          onClick={isOpen ? onClose : onOpen}
          display={{ base: "flex", md: "none" }}
          aria-label="Open Menu"
          fontSize="20px"
          color="red.600"
          icon={<FiMenu />}
          variant="ghost"
          alignSelf="center" // Ensure button is centered vertically
        />

        {/* Desktop Navigation */}
        <Flex
          align="center"
          gap={4}
          display={{ base: "none", md: "flex" }}
          height="100%" // Match parent height
        >
          <NavItems />
          {currentUser && (
            <>
              <Flex
                as={RouterLink}
                to="/settings"
                px={4}
                py={2}
                color={textColor}
                _hover={{ color: hoverColor, textDecoration: "none" }}
                activeProps={{
                  style: { color: activeTextColor },
                }}
                align="center"
                borderRadius="md"
              >
                <Icon as={FiSettings} mr={2} boxSize={5} />
                <Text fontWeight="500">Settings</Text>
              </Flex>
              <Flex
                as="button"
                onClick={handleLogout}
                px={4}
                py={2}
                color={textColor}
                _hover={{ color: hoverColor }}
                align="center"
                borderRadius="md"
              >
                <Icon as={FiLogOut} mr={2} boxSize={5} />
                <Text fontWeight="500">Log out</Text>
              </Flex>
            </>
          )}
        </Flex>
      </Flex>

      {/* Mobile Menu */}
      <Box
        display={{ base: isOpen ? "block" : "none", md: "none" }}
        position="absolute"
        top="100%"
        left={0}
        right={0}
        bg="white"
        boxShadow="md"
        p={4}
      >
        <Flex flexDir="column" gap={4}>
          <NavItems onClose={onClose} isMobile={true} />
          {currentUser && (
            <>
              <Text
                color={textColor}
                fontSize="sm"
                mt={4}
                borderTopWidth="1px"
                pt={4}
              >
                Logged in as: {currentUser.email}
              </Text>
              <Flex flexDir="column" gap={2}>
                <Flex
                  as={RouterLink}
                  to="/settings"
                  px={4}
                  py={2}
                  color={textColor}
                  _hover={{ color: hoverColor }}
                  onClick={onClose}
                  align="center"
                >
                  <Icon as={FiSettings} mr={2} boxSize={5} />
                  <Text fontWeight="500">Settings</Text>
                </Flex>
                <Flex
                  as="button"
                  onClick={handleLogout}
                  px={4}
                  py={2}
                  color={textColor}
                  _hover={{ color: hoverColor }}
                  align="center"
                >
                  <Icon as={FiLogOut} mr={2} boxSize={5} />
                  <Text fontWeight="500">Log out</Text>
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default TopNav;