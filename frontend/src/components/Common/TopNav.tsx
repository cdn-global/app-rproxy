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
import { useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import {
  FiLogOut,
  FiMenu,
  FiUsers,
  FiUserCheck,
  FiSettings,
} from "react-icons/fi";
import { FaGlobe, FaSitemap, FaServer } from "react-icons/fa";
import { useEffect, useRef } from "react";
import { CSSProperties } from "react";

import Logo from "../Common/Logo";
import type { UserPublic } from "../../client";
import useAuth from "../../hooks/useAuth";

interface NavItem {
  title: string;
  icon?: any;
  path?: string;
  onClick?: () => void;
  description?: string;
  subItems?: { title: string; path: string; description: string }[];
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
    subItems: [
      {
        title: "HTTPS API",
        path: "/web-scraping-tools/https-api",
        description: "Access any webpage with our powerful rotating proxy network.",
      },
    ],
  },
  {
    title: "Hosting",
    subItems: [
      {
        title: "Managed VPS",
        path: "https://cloud.roamingproxy.com/hosting/billing",
        description: "Fully managed virtual private servers for your needs.",
      },
    ],
  },
];

const NavGroupDropdown = ({ item, activeTextColor, hoverColor, textColor }: NavGroupDropdownProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { location } = useRouterState();
  const { pathname } = location;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { title, subItems, icon } = item;
  const isGroupActive = subItems?.some((sub) => pathname.startsWith(sub.path!));

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hoverStyles: CSSProperties = {
    color: hoverColor,
    background: "gray.100",
    textDecoration: "none",
  };

  const activeStyles: CSSProperties = {
    color: activeTextColor,
    background: "orange.100",
  };

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} position="relative">
      <Menu isOpen={isOpen} gutter={4} isLazy>
        <MenuButton
          as={Flex}
          px={4}
          py={2}
          alignItems="center" // Ensure all items are vertically centered
          cursor="pointer"
          color={isGroupActive ? activeTextColor : textColor}
          _hover={hoverStyles}
          borderRadius="md"
          transition="all 0.2s"
          aria-label={`Open ${title} menu`}
        >
          {icon && <Icon as={icon} mr={2} boxSize={5} />}
          <Text fontWeight="500" mr={1}>{title}</Text>
        </MenuButton>
        <MenuList
          boxShadow="lg"
          p={2}
          borderRadius="md"
          borderWidth={1}
          minW="320px"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {subItems?.map((subItem) => (
            <MenuItem
              key={subItem.title}
              as={RouterLink}
              to={subItem.path}
              onClick={onClose}
              borderRadius="md"
              p={3}
              _hover={{ background: "orange.50" }}
              activeProps={{ style: activeStyles }}
              aria-label={subItem.title}
            >
              <Flex align="flex-start" w="100%">
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
  const hoverColor = "orange.600";
  const activeTextColor = "orange.800";
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
    if (onClose) onClose();
  };

  const finalNavStructure: NavItem[] = [...navStructure];
  if (
    currentUser?.is_superuser &&
    !finalNavStructure.some((item) => item.title === "Admin")
  ) {
    finalNavStructure.push({ title: "Admin", icon: FiUsers, path: "/admin" });
  }

  if (currentUser) {
    finalNavStructure.push({
      title: "Settings",
      icon: FiSettings,
      path: "/settings",
    });
  }

  finalNavStructure.push({
    title: "Sign Out",
    icon: FiLogOut,
    onClick: handleLogout,
  });

  const isEnabled = (title: string) => {
    return [
      "Admin",
      "HTTPS API",
      "SERP API",
      "User Agents",
      "Settings",
      "Sign Out",
      "Managed VPS",
    ].includes(title);
  };

  const hoverStyles: CSSProperties = {
    color: hoverColor,
    background: "gray.100",
    textDecoration: "none",
  };

  const activeStyles: CSSProperties = {
    color: activeTextColor,
    background: "orange.100",
  };

  const disabledHoverStyles: CSSProperties = {
    background: "gray.100",
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const { icon, title, path, subItems, onClick } = item;
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
            />
          );
        }

        return (
          <Box key={title} w="100%">
            <Flex
              px={4}
              py={2}
              color={textColor}
              align="center"
              _hover={{ color: hoverColor, background: "gray.100" }}
              borderRadius="md"
              transition="all 0.2s"
            >
              {icon && <Icon as={icon} mr={2} boxSize={5} />}
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
                  _hover={hoverStyles}
                  activeProps={{ style: activeStyles }}
                  align="center"
                  onClick={onClose}
                  w="100%"
                  borderRadius="md"
                  transition="all 0.2s"
                >
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
              _hover={disabledHoverStyles}
              borderRadius="md"
              transition="all 0.2s"
            >
              {icon && <Icon as={icon} mr={2} boxSize={5} color={disabledColor} />}
              <Text fontWeight="500">{title}</Text>
            </Flex>
          </Tooltip>
        );
      }

      const isLink = !!path;
      if (isLink) {
        return (
          <Flex
            key={title}
            as={RouterLink}
            to={path}
            px={4}
            py={2}
            color={textColor}
            _hover={hoverStyles}
            activeProps={{ style: activeStyles }}
            align="center"
            onClick={onClose}
            w={isMobile ? "100%" : "auto"}
            borderRadius="md"
            transition="all 0.2s"
            aria-label={title}
          >
            {icon && <Icon as={icon} mr={2} boxSize={5} />}
            <Text fontWeight="500">{title}</Text>
          </Flex>
        );
      } else {
        return (
          <Flex
            key={title}
            as="button"
            px={4}
            py={2}
            color={textColor}
            _hover={hoverStyles}
            align="center"
            onClick={() => {
              if (onClick) onClick();
              if (onClose) onClose();
            }}
            w={isMobile ? "100%" : "auto"}
            borderRadius="md"
            transition="all 0.2s"
            aria-label={title}
          >
            {icon && <Icon as={icon} mr={2} boxSize={5} />}
            <Text fontWeight="500">{title}</Text>
          </Flex>
        );
      }
    });

  return (
    <Flex
      align="center"
      gap={isMobile ? 2 : 4}
      flexDir={isMobile ? "column" : "row"}
      w={isMobile ? "100%" : "auto"}
    >
      {renderNavItems(finalNavStructure)}
    </Flex>
  );
};

const TopNav = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const textColor = "gray.800";
  const hoverColor = "orange.600";
  const activeTextColor = "orange.800";
  const btnRef = useRef<HTMLButtonElement>(null);

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
  src="/assets/images/roaming-proxy-network-logo.png"
  alt="Roaming Proxy Logo"
  boxSize="40px"
  href="/"
/>

        <IconButton
          ref={btnRef}
          onClick={isOpen ? onClose : onOpen}
          display={{ base: "flex", md: "none" }}
          aria-label="Toggle Menu"
          fontSize="20px"
          color="orange.600"
          icon={<FiMenu />}
          variant="ghost"
        />

        <Flex align="center" gap={4} display={{ base: "none", md: "flex" }}>
          <NavItems />
        </Flex>
      </Flex>

      <Box
        display={{ base: isOpen ? "block" : "none", md: "none" }}
        position="absolute"
        top="100%"
        left={0}
        right={0}
        bg="white"
        boxShadow="md"
        p={4}
        maxH="80vh"
        overflowY="auto"
        transition="all 0.3s"
      >
        <Flex flexDir="column" gap={4}>
          <NavItems onClose={onClose} isMobile={true} />
        </Flex>
      </Box>
    </Box>
  );
};

export default TopNav;