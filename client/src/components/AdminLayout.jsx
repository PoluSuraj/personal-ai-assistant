import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  VStack,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { FaChartPie, FaInbox, FaHome, FaSignOutAlt, FaBell, FaUsers } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { API_BASE_URL } from "../utils/api";
import BackendStatus from "./BackendStatus";
import useNotificationCounts from "../hooks/useNotificationCounts";

const adminLinks = [
  { label: "Dashboard", to: "/admin", icon: FaChartPie, countKey: null },
  { label: "Inbox", to: "/admin/inbox", icon: FaInbox, countKey: "inboxUnread" },
  { label: "Notifications", to: "/admin/notifications", icon: FaBell, countKey: "adminUnread" },
  { label: "Users", to: "/admin/users", icon: FaUsers, countKey: null },
  { label: "User App", to: "/", icon: FaHome, countKey: null },
];

function AdminNavItem({ label, to, icon, badgeCount = 0, onNavigate }) {
  const inactiveColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  return (
    <NavLink to={to} end={to === "/admin"} onClick={onNavigate}>
      {({ isActive }) => (
        <HStack
          spacing={3}
          p={3}
          borderRadius="xl"
          bg={isActive ? "teal.500" : "transparent"}
          color={isActive ? "white" : inactiveColor}
          _hover={{ bg: isActive ? "teal.500" : hoverBg }}
          transition="all 0.2s"
          justify="space-between"
        >
          <HStack spacing={3} minW={0}>
            <Icon as={icon} />
            <Text fontWeight="semibold" noOfLines={1}>{label}</Text>
          </HStack>
          {badgeCount > 0 ? <Badge colorScheme={isActive ? "blackAlpha" : "red"} borderRadius="full">{badgeCount > 9 ? "9+" : badgeCount}</Badge> : null}
        </HStack>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const user = useSelector((state) => state.authSlice.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isAdmin, adminUnread, inboxUnread } = useNotificationCounts(user);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const shellBg = useColorModeValue("gray.100", "gray.950");
  const sidebarBg = useColorModeValue("white", "gray.900");
  const panelBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  if (!user) return <Navigate to="/authentication/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/users/logout`, { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Admin logout failed", error);
    }
    dispatch(logout());
    navigate("/authentication/login");
  };

  const countMap = { adminUnread, inboxUnread };
  const navList = (
    <VStack align="stretch" spacing={2}>
      {adminLinks.map((link) => (
        <AdminNavItem
          key={link.to}
          {...link}
          badgeCount={link.countKey ? countMap[link.countKey] : 0}
          onNavigate={onClose}
        />
      ))}
    </VStack>
  );

  return (
    <Flex minH="100dvh" bg={shellBg} direction={{ base: "column", md: "row" }}>
      <Box display={{ base: "none", md: "block" }} w="280px" bg={sidebarBg} borderRightWidth="1px" borderColor={borderColor} p={5}>
        <VStack align="stretch" spacing={6} h="full">
          <VStack align="start" spacing={3}>
            <Avatar name={user.name} src={user.avatar} size="lg" />
            <Box>
              <Heading size="md">Admin Workspace</Heading>
              <Text fontSize="sm" color="gray.500" noOfLines={1}>{user.email}</Text>
            </Box>
          </VStack>
          {navList}
          <Box mt="auto">
            <VStack align="stretch" spacing={3}>
              <BackendStatus adminView compact={false} />
              <Button leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />} variant="outline" onClick={toggleColorMode}>Theme</Button>
              <Button leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={handleLogout}>Logout</Button>
            </VStack>
          </Box>
        </VStack>
      </Box>

      <Flex flex="1" direction="column" minW={0}>
        <Box px={{ base: 4, md: 8 }} py={{ base: 4, md: 5 }} borderBottomWidth="1px" borderColor={borderColor} bg={panelBg} backdropFilter="blur(18px)">
          <HStack justify="space-between" align="start">
            <HStack spacing={3} align="start">
              <IconButton
                display={{ base: "inline-flex", md: "none" }}
                aria-label="Open admin menu"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="outline"
              />
              <Box>
                <Heading size={{ base: "sm", md: "md" }}>Administrator Panel</Heading>
                <Text fontSize="sm" color="gray.500">Operations, support, and launch controls</Text>
              </Box>
            </HStack>
            <Tooltip label="Toggle theme">
              <IconButton aria-label="Toggle theme" icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />} onClick={toggleColorMode} variant="ghost" />
            </Tooltip>
          </HStack>
        </Box>
        <Box flex="1" overflowY="auto"><Outlet /></Box>
      </Flex>

      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Admin Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={5} mt={4}>
              <HStack spacing={3}>
                <Avatar name={user.name} src={user.avatar} size="md" />
                <Box minW={0}>
                  <Text fontWeight="bold" noOfLines={1}>{user.name}</Text>
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>{user.email}</Text>
                </Box>
              </HStack>
              {navList}
              <BackendStatus adminView compact={false} />
              <Button leftIcon={colorMode === "light" ? <MoonIcon /> : <SunIcon />} variant="outline" onClick={toggleColorMode}>Theme</Button>
              <Button leftIcon={<FaSignOutAlt />} colorScheme="red" onClick={handleLogout}>Logout</Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}
