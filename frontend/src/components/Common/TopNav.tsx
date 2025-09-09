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
  useColorMode,
  Collapse,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useRouterState } from '@tanstack/react-router';
import { FiLogOut, FiUsers, FiUserCheck, FiSettings } from 'react-icons/fi';
import { FaGlobe, FaSitemap, FaServer } from 'react-icons/fa';
import { useEffect, useRef } from 'react';
import { CSSProperties } from 'react';

import Logo from '../Common/Logo';
import type { UserPublic } from '../../client';
import useAuth from '../../hooks/useAuth';

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

const navStructure: NavItem[] = [ {
        title: 'Roaming IP',
        path: '/web-scraping-tools/https-api',
        description: 'Access any webpage with our powerful rotating proxy network.',
      },
      {
        title: 'Managed VPS',
        path: 'https://cloud.ROAMINGPROXY.com/hosting',
        description: 'Fully managed virtual private servers for your needs.',
      },
  {
    title: 'Billing',
    path: '/hosting/billing',
    icon: FaServer,
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
    background: 'gray.100',
    textDecoration: 'none',
  };

  const activeStyles: CSSProperties = {
    color: activeTextColor,
    background: 'red.100',
  };

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} position="relative">
      <Menu isOpen={isOpen} gutter={4} isLazy>
        <MenuButton
          as={Flex}
          px={4}
          py={2}
          alignItems="center"
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
              _hover={{ background: 'red.50' }}
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
  const textColor = 'gray.800';
  const disabledColor = 'gray.300';
  const hoverColor = 'red.600';
  const activeTextColor = 'red.800';
  const currentUser = queryClient.getQueryData<UserPublic>(['currentUser']);
  const { logout } = useAuth();

  const handleLogout = async () => {
    logout();
    if (onClose) onClose();
  };

  const finalNavStructure: NavItem[] = [...navStructure];
  if (
    currentUser?.is_superuser &&
    !finalNavStructure.some((item) => item.title === 'Admin')
  ) {
    finalNavStructure.push({ title: 'Admin', icon: FiUsers, path: '/admin' });
  }

  if (currentUser) {
    finalNavStructure.push({
      title: 'Settings',
      icon: FiSettings,
      path: '/settings',
    });
  }

  finalNavStructure.push({
    title: 'Sign Out',
    icon: FiLogOut,
    onClick: handleLogout,
  });

  const isEnabled = (title: string) => {
    return [
      'Admin',
      'Roaming IP',
      'SERP API',
      'User Agents',
      'Settings',
      'Sign Out',
      'Managed VPS',
      'Billing',
    ].includes(title);
  };

  const hoverStyles: CSSProperties = {
    color: hoverColor,
    background: 'gray.100',
    textDecoration: 'none',
  };

  const activeStyles: CSSProperties = {
    color: activeTextColor,
    background: 'red.100',
  };

  const disabledHoverStyles: CSSProperties = {
    background: 'gray.100',
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
              _hover={{ color: hoverColor, background: 'gray.100' }}
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
            placement={isMobile ? 'right' : 'bottom'}
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
            w={isMobile ? '100%' : 'auto'}
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
            w={isMobile ? '100%' : 'auto'}
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
      flexDir={isMobile ? 'column' : 'row'}
      w={isMobile ? '100%' : 'auto'}
    >
      {renderNavItems(finalNavStructure)}
    </Flex>
  );
};

const TopNav = () => {
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
  const { colorMode } = useColorMode();
  const textColor = 'gray.800';
  const hoverColor = 'red.600';
  const activeTextColor = 'red.800';
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <Box
      bg={colorMode === 'light' ? 'gray.50' : 'gray.800'}
      px={4}
      py={2}
      position="sticky"
      top="0"
      zIndex="sticky"
      boxShadow="sm"
      w="100%"
      borderBottomWidth="1px"
      borderBottomColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
    >
      <Flex align="center" maxW="1200px" mx="auto" w="100%" justify="space-between">
        <Logo
          src="/assets/images/roaming-proxy-network-logo.png"
          alt="Roaming Proxy Logo"
          to="/"
          width={{ base: '80px', md: '110px' }}
        />
        <Flex align="center" gap={4}>
          <Box display={{ base: 'none', md: 'block' }}>
            <NavItems />
          </Box>
          <IconButton
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            display={{ base: 'block', md: 'none' }}
            onClick={onToggle}
            variant="ghost"
            size="lg"
            ref={btnRef}
          />
        </Flex>
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box display={{ base: 'block', md: 'none' }} mt={4}>
          <NavItems isMobile onClose={onClose} />
        </Box>
      </Collapse>
    </Box>
  );
};

export default TopNav;