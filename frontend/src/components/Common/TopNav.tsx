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
import { FaBook, FaKey, FaCreditCard, FaGlobe, FaSitemap } from 'react-icons/fa';

import Logo from "../Common/Logo";
import type { UserPublic } from "../../client";
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

const navStructure: NavItem[] = [
    {
    title: "User Agents",
    path: "/web-scraping-tools/user-agents",
    icon: FiUserCheck,
  },
  {
    title: "Web Scraping APIs",
    icon: FaSitemap,
    subItems: [
      {
        title: "HTTPS API",
        path: "/web-scraping-tools/https-api",
        icon: FaGlobe,
        description: "Access any webpage with our powerful rotating proxy network.",
      },
      // {
      //   title: "SERP API",
      //   path: "/web-scraping-tools/serp-api",
      //   icon: FiSearch,
      //   description: "Scrape search engine results pages from Google in real-time.",
      // },
    ],
  },

];

const NavGroupDropdown = ({ item, activeTextColor, hoverColor, textColor }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { location } = useRouterState();
  const { pathname } = location;

  const { title, subItems } = item;
  const isGroupActive = subItems.some(sub => pathname.startsWith(sub.path!));

  return (
    <Box onMouseEnter={onOpen} onMouseLeave={onClose} position="relative">
      <Menu isOpen={isOpen} gutter={4}>
        <MenuButton
          as={Flex}
          px={4}
          py={2}
          align="center"
          cursor="pointer"
          // MODIFIED: No background color change, only text color for active group
          color={isGroupActive ? activeTextColor : textColor}
          _hover={{ color: hoverColor, textDecoration: "none" }}
          borderRadius="md"
        >
          <Text fontWeight="500">{title}</Text>
          {/* Chevron icon can be added for better UX if desired */}
          {/* <Icon as={ChevronDownIcon} ml={1} /> */}
        </MenuButton>
        <MenuList boxShadow="lg" p={2} borderRadius="md" borderWidth={1} minW="320px">
          {subItems.map((subItem) => (
            <MenuItem
              key={subItem.title}
              as={RouterLink}
              to={subItem.path}
              onClick={onClose}
              borderRadius="md"
              p={3}
              _hover={{ bg: "red.50" }}
               // MODIFIED: Removed background from activeProps style
               activeProps={{
                 style: { color: activeTextColor },
               }}
            >
              <Flex align="flex-start" w="100%">
                <Icon as={subItem.icon} boxSize={6} color="red.500" mt={1} mr={4} />
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="600" color="gray.800">{subItem.title}</Text>
                  <Text fontSize="sm" color="gray.500" whiteSpace="normal">{subItem.description}</Text>
                </VStack>
              </Flex>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};


const NavItems = ({ onClose, isMobile = false }: NavItemsProps) => {
  const queryClient = useQueryClient();
  const textColor = "gray.800";
  const disabledColor = "gray.300";
  const hoverColor = "red.600";
  // MODIFIED: bgActive is no longer needed as we only change text color
  // const bgActive = "red.100";
  const activeTextColor = "red.800";
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  const finalNavStructure = [...navStructure];
  if (
    currentUser?.is_superuser &&
    !finalNavStructure.some((item) => item.title === "Admin")
  ) {
    finalNavStructure.push({ title: "Admin", icon: FiUsers, path: "/admin" });
  }

  const isEnabled = (title: string) => {
    return [
      "Admin",
      "HTTPS API",
      "SERP API",
      "User Agents",
    ].includes(title);
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const { icon, title, path, subItems } = item;
      const hasSubItems = subItems && subItems.length > 0;

      if (hasSubItems) {
        if (!isMobile) {
          return (
            <NavGroupDropdown
              key={item.title}
              item={item}
              textColor={textColor}
              hoverColor={hoverColor}
              activeTextColor={activeTextColor}
              // MODIFIED: bgActive prop removed
            />
          );
        }

        // Mobile Grouped List
        return (
          <Box key={title} w="100%">
            <Flex px={4} py={2} color={textColor} align="center">
              <Icon as={icon} mr={2} boxSize={5} />
              <Text fontWeight="600">{title}</Text>
            </Flex>
            <Flex direction="column" pl={6}>
              {subItems.map((subItem) => (
                <Flex
                  key={subItem.title}
                  as={RouterLink}
                  to={subItem.path}
                  px={4}
                  py={2}
                  color={textColor}
                  _hover={{ color: hoverColor, textDecoration: "none" }}
                  // MODIFIED: Removed background from activeProps style
                  activeProps={{
                    style: { color: activeTextColor },
                  }}
                  align="center"
                  onClick={onClose}
                  w="100%"
                  borderRadius="md"
                >
                  <Icon as={subItem.icon} mr={2} boxSize={5} />
                  <Text fontWeight="500">{subItem.title}</Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        );
      }
      
      const enabled = isEnabled(title);
      if (!enabled) {
        return (
          <Tooltip
            key={title}
            label="Coming Soon"
            placement={isMobile ? "right" : "bottom"}
          >
            <Flex
              px={4}
              py={2}
              color={disabledColor}
              cursor="not-allowed"
              align="center"
              flexDir="row"
            >
              {icon && <Icon as={icon} mr={2} boxSize={5} color={disabledColor} />}
              <Text fontWeight="500">{title}</Text>
            </Flex>
          </Tooltip>
        );
      }

      return (
        <Flex
          key={title}
          as={RouterLink}
          to={path}
          px={4}
          py={2}
          color={textColor}
          _hover={{ color: hoverColor, textDecoration: "none" }}
          // MODIFIED: Removed background from activeProps style
          activeProps={{
            style: { color: activeTextColor },
          }}
          align="center"
          onClick={onClose}
          w={isMobile ? "100%" : "auto"}
          borderRadius="md"
        >
          {icon && <Icon as={icon} mr={2} boxSize={5} />}
          <Text fontWeight="500">{title}</Text>
        </Flex>
      );
    });

  return (
    <Flex
      align="center"
      gap={isMobile ? 2 : 1}
      flexDir={isMobile ? "column" : "row"}
      w={isMobile ? "100%" : "auto"}
    >
      {renderNavItems(finalNavStructure)}
    </Flex>
  );
};


const TopNav = () => {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logout } = useAuth();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const textColor = "gray.800";
  const hoverColor = "red.600";
  // MODIFIED: bgActive is no longer needed
  // const bgActive = "red.100";
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
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
 <Logo 
      src="public/assets/images/roaming-proxy-network-logo.png"
      alt="Roaming Proxy Logo"
      boxSize="220px"
      href="/"
    />

        <IconButton
          onClick={isOpen ? onClose : onOpen}
          display={{ base: "flex", md: "none" }}
          aria-label="Open Menu"
          fontSize="20px"
          color="red.600"
          icon={<FiMenu />}
          variant="ghost"
        />

        {/* Desktop Navigation */}
        <Flex align="center" gap={4} display={{ base: "none", md: "flex" }}>
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
                // MODIFIED: Removed background from activeProps style
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