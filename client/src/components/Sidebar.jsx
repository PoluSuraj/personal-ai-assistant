import React, { useState } from "react";
import {
  Badge,
  Box,
  VStack,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Switch,
  Text,
  useColorMode,
  useColorModeValue,
  Tooltip,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { FaWikipediaW, FaComments, FaYoutube, FaClipboardList, FaCog, FaHome, FaBell, FaMicrophone, FaEllipsisH, FaUserCircle, FaFilm } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useNotificationCounts from "../hooks/useNotificationCounts";

const SidebarIcon = ({ icon, to, label, badgeCount = 0 }) => {
  const inactiveColor = useColorModeValue("gray.600", "gray.400");
  const inactiveBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const hoverBg = useColorModeValue("gray.200", "whiteAlpha.200");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.50");

  return (
    <Tooltip label={label} placement="right" hasArrow bg="brand.900" color="white" borderRadius="md" gutter={12}>
      <NavLink to={to}>
        {({ isActive }) => (
          <Box position="relative">
            <Box
              p={{ base: 3.5, xl: 4 }}
              borderRadius="2xl"
              bg={isActive ? "brand.600" : inactiveBg}
              color={isActive ? "white" : inactiveColor}
              boxShadow={isActive ? "lg" : "none"}
              _hover={{ bg: isActive ? "brand.600" : hoverBg, transform: "translateY(-2px)", boxShadow: "lg" }}
              transition="all 0.25s ease"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="1px solid"
              borderColor={isActive ? "transparent" : borderColor}
            >
              {React.createElement(icon, { size: 20 })}
            </Box>
            {badgeCount > 0 ? (
              <Badge
                position="absolute"
                top="-2"
                right="-2"
                minW="20px"
                h="20px"
                px={1}
                borderRadius="full"
                bg="red.500"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="0.7rem"
                boxShadow="md"
              >
                {badgeCount > 9 ? "9+" : badgeCount}
              </Badge>
            ) : null}
          </Box>
        )}
      </NavLink>
    </Tooltip>
  );
};

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mobileMenu = useDisclosure();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const [collapsed, setCollapsed] = useState(true);
  const userData = useSelector((state) => state.authSlice.userData);
  const { userUnread } = useNotificationCounts(userData);
  const bg = useColorModeValue("#ffffff", "#111111");
  const sidebarBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const avatarBg = useColorModeValue("brand.500", "brand.400");
  const avatarColor = useColorModeValue("white", "gray.900");
  const settingsColor = useColorModeValue("gray.500", "gray.400");
  const settingsBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const scrollbarThumb = useColorModeValue("gray.300", "whiteAlpha.300");
  const mobileInactiveColor = useColorModeValue("gray.600", "gray.300");
  const mobileItems = [
    { icon: FaHome, label: "Home", to: "/dashboard" },
    { icon: FaComments, label: "Chat", to: "/chat" },
    { icon: FaFilm, label: "VidyaVritta", to: "/vidya-vritta" },
    { icon: FaClipboardList, label: "Quiz", to: "/quiz" },
  ];
  const moreItems = [
    { icon: FaMicrophone, label: "Voice assistant", to: "/voice-assistant" },
    { icon: FaYoutube, label: "Videos", to: "/youtube-recommendation" },
    { icon: FaWikipediaW, label: "Knowledge Base", to: "/wikipedia-search" },
    { icon: FaBell, label: "Notifications", to: "/notifications" },
    { icon: FaUserCircle, label: "Profile & Settings", to: "/userSettings" },
  ];

  return (
    <>
      <Box
        display={{ base: "none", md: "flex" }}
        w={collapsed ? "88px" : "220px"}
        h="100dvh"
        maxH="100dvh"
        bg={bg}
        borderRight="1px solid"
        borderColor={sidebarBorder}
        transition="width 0.25s ease"
        flexDirection="column"
        alignItems="center"
        py={5}
        px={2}
        zIndex={100}
        gap={5}
        position="sticky"
        top="0"
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <NavLink to="/userSettings">
          <Box
            p={1}
            borderRadius="full"
            border="2px solid"
            borderColor="brand.400"
            boxShadow="0 0 14px var(--chakra-colors-brand-400)"
            transition="all 0.3s"
            _hover={{ transform: "scale(1.05)", borderColor: "accent.400" }}
          >
            <Avatar name={userData?.name} size={collapsed ? "md" : "lg"} src={userData?.avatar} bg={avatarBg} color={avatarColor} cursor="pointer" />
          </Box>
        </NavLink>

        <VStack
          spacing={3}
          w="full"
          px={2}
          flex={1}
          justify="flex-start"
          pt={2}
          overflowY="auto"
          minH={0}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '24px' },
          }}
        >
          <SidebarIcon icon={FaHome} to="/dashboard" label="Dashboard" />
          <SidebarIcon icon={FaComments} to="/chat" label="Chat" />
          <SidebarIcon icon={FaMicrophone} to="/voice-assistant" label="Voice Assistant" />
          <SidebarIcon icon={FaYoutube} to="/youtube-recommendation" label="Videos" />
          <SidebarIcon icon={FaFilm} to="/vidya-vritta" label="VidyaVritta study shorts" />
          <SidebarIcon icon={FaWikipediaW} to="/wikipedia-search" label="Wiki" />
          <SidebarIcon icon={FaClipboardList} to="/quiz" label="Quiz" />
          <SidebarIcon icon={FaBell} to="/notifications" label="Notifications" badgeCount={userUnread} />
        </VStack>

        <Box pt={1}>
          <Tooltip label="Settings" placement="right">
            <Box p={3} borderRadius="xl" _hover={{ bg: "whiteAlpha.200", transform: "rotate(90deg)" }} transition="all 0.35s" cursor="pointer" onClick={onOpen}>
              <FaCog size={22} color={settingsColor} />
            </Box>
          </Tooltip>
        </Box>
      </Box>
      <HStack
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex="sticky"
        justify="space-around"
        align="stretch"
        spacing={0}
        minH="68px"
        pb="env(safe-area-inset-bottom)"
        bg={bg}
        borderTop="1px solid"
        borderColor={sidebarBorder}
        boxShadow="0 -4px 18px rgba(15, 23, 42, 0.10)"
      >
        {mobileItems.map(({ icon, label, to }) => {
          const active = location.pathname === to;
          return (
            <NavLink key={to} to={to} style={{ flex: 1 }}>
              <VStack spacing={1} h="68px" justify="center" color={active ? "var(--chakra-colors-brand-600)" : "var(--chakra-colors-gray-600)"}>
                <Icon as={icon} boxSize={5} />
                <Text fontSize="xs" fontWeight={active ? "bold" : "medium"}>{label}</Text>
              </VStack>
            </NavLink>
          );
        })}
        <Button flex={1} h="68px" variant="ghost" color={mobileInactiveColor} onClick={mobileMenu.onOpen} aria-label="More features">
          <VStack spacing={1}><Icon as={FaEllipsisH} boxSize={5} /><Text fontSize="xs">More</Text></VStack>
        </Button>
      </HStack>
      <Drawer isOpen={mobileMenu.isOpen} placement="bottom" onClose={mobileMenu.onClose}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="xl" pb="env(safe-area-inset-bottom)">
          <DrawerCloseButton />
          <DrawerHeader>More learning tools</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={2}>
              {moreItems.map(({ icon, label, to }) => (
                <Button key={to} as={NavLink} to={to} justifyContent="flex-start" leftIcon={<Icon as={icon} />} variant={location.pathname === to ? "solid" : "ghost"} colorScheme={location.pathname === to ? "brand" : undefined} onClick={mobileMenu.onClose}>
                  {label}{to === "/notifications" && userUnread > 0 ? ` (${userUnread > 9 ? "9+" : userUnread})` : ""}
                </Button>
              ))}
              <Button justifyContent="flex-start" leftIcon={<Icon as={FaCog} />} variant="ghost" onClick={() => { mobileMenu.onClose(); onOpen(); }}>Preferences</Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <Box display="flex" justifyContent="space-between" alignItems="center" p={4} bg={settingsBg} borderRadius="xl">
              <Text fontWeight="medium">Dark Mode</Text>
              <Switch isChecked={colorMode === "dark"} onChange={toggleColorMode} colorScheme="brand" size="lg" />
            </Box>
          </ModalBody>
          <ModalFooter><Button colorScheme="brand" onClick={onClose} borderRadius="xl">Done</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Sidebar;
