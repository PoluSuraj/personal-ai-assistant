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
} from "@chakra-ui/react";
import { FaWikipediaW, FaComments, FaYoutube, FaClipboardList, FaCog, FaHome, FaBell, FaMicrophone } from "react-icons/fa";
import { NavLink } from "react-router-dom";
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

  return (
    <>
      <Box
        w={collapsed ? "88px" : "220px"}
        h="100dvh"
        maxH="100dvh"
        bg={bg}
        borderRight="1px solid"
        borderColor={sidebarBorder}
        transition="width 0.25s ease"
        display="flex"
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
