import React from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Icon,
  Link,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FaUserCircle, FaSignOutAlt, FaCog, FaHome, FaEnvelope, FaInfoCircle, FaStar, FaBell } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/authSlice';
import BackendStatus from './BackendStatus';
import { API_BASE_URL, clearStoredAccessToken, getStoredAccessToken } from "../utils/api";
import useNotificationCounts from '../hooks/useNotificationCounts';

const navItems = [
  { label: 'Home', to: '/dashboard', icon: FaHome },
  { label: 'Features', to: '/features', icon: FaStar },
  { label: 'About', to: '/about', icon: FaInfoCircle },
  { label: 'Contact', to: '/contact-us', icon: FaEnvelope },
];

export default function Navbar() {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const user = useSelector((state) => state.authSlice.userData);
  const { isAdmin, userUnread } = useNotificationCounts(user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'white');
  const activeColor = useColorModeValue('brand.600', 'brand.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.200');
  const activeBg = useColorModeValue('brand.50', 'whiteAlpha.200');
  const menuBg = useColorModeValue('white', 'gray.800');

  const handleLogout = async () => {
    try {
      const storedToken = getStoredAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      if (res.ok) {
        clearStoredAccessToken();
        dispatch(logout());
        navigate('/authentication/login');
      }
    } catch (error) {
      clearStoredAccessToken();
      console.error('Logout failed', error);
    }
  };

  const MobileNavItem = ({ label, icon, to, badgeCount = 0 }) => {
    const isActive = location.pathname === to;
    return (
      <Flex
        align="center"
        justify="space-between"
        p={4}
        mx={-4}
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : 'inherit'}
        _hover={{ bg: activeBg, color: activeColor }}
        onClick={() => { navigate(to); onClose(); }}
      >
        <Flex align="center">
          {icon && <Icon mr="4" fontSize="16" _groupHover={{ color: activeColor }} as={icon} />}
          <Text fontWeight={600}>{label}</Text>
        </Flex>
        {badgeCount > 0 ? <Badge colorScheme="red" borderRadius="full">{badgeCount > 9 ? '9+' : badgeCount}</Badge> : null}
      </Flex>
    );
  };

  return (
    <Box position="sticky" top="0" zIndex="sticky" width="100%">
      <Flex bg={bg} color={textColor} minH="60px" py={{ base: 2 }} px={{ base: 4 }} borderBottom={1} borderStyle="solid" borderColor={borderColor} align="center" boxShadow="sm">
        <Flex flex={{ base: 1, md: 'auto' }} ml={{ base: -2 }} display={{ base: 'flex', md: 'none' }}>
          <IconButton onClick={onToggle} icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />} variant="ghost" aria-label="Toggle Navigation" />
        </Flex>

        <Flex flex={{ base: 1 }} justify={{ base: 'start', md: 'start' }} alignItems="center">
          <Link onClick={() => navigate('/dashboard')} _hover={{ textDecoration: 'none', opacity: 0.8 }} cursor="pointer">
            <Flex alignItems="center">
              <Box as="img" src="/logo.svg" alt="AI Assistant Logo" h="40px" mr={3} objectFit="contain" />
              <Text textAlign={useBreakpointValue({ base: 'center', md: 'left' })} fontFamily="heading" fontWeight="bold" fontSize="xl" bgGradient="linear(to-r, brand.400, accent.500)" bgClip="text" display={{ base: 'none', md: 'block' }}>
                Personal AI Assistant
              </Text>
            </Flex>
          </Link>
        </Flex>

        <Flex display={{ base: 'none', md: 'flex' }} alignItems="center" ml="auto">
          <Stack direction="row" spacing={4} alignItems="center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Button key={item.to} variant="ghost" fontWeight={isActive ? 700 : 500} color={isActive ? activeColor : inactiveColor} onClick={() => navigate(item.to)} leftIcon={<Icon as={item.icon} />} size="sm" _hover={{ opacity: 0.9, bg: activeBg }}>
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Flex>

        <Stack flex={{ base: 1, md: 0 }} justify="flex-end" direction="row" spacing={4} alignItems="center">
          {user ? <BackendStatus compact={false} adminView={isAdmin} /> : null}
          <IconButton size="md" icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} aria-label="Toggle Color Mode" onClick={toggleColorMode} variant="ghost" rounded="full" />
          {user ? (
            <Menu>
              <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0} position="relative">
                <Avatar size="sm" src={user.avatar} name={user.name} borderWidth="2px" borderColor="brand.400" />
                {userUnread > 0 ? (
                  <Badge position="absolute" top="-1" right="-1" minW="18px" h="18px" borderRadius="full" bg="red.500" color="white" display="flex" alignItems="center" justifyContent="center" fontSize="0.65rem">
                    {userUnread > 9 ? '9+' : userUnread}
                  </Badge>
                ) : null}
              </MenuButton>
              <MenuList alignItems="center" bg={menuBg} borderColor={borderColor} zIndex={20}>
                <Box textAlign="center" py={4} px={6}>
                  <Avatar size="lg" src={user.avatar} name={user.name} mb={2} />
                  <Text fontWeight="bold">{user.name}</Text>
                  <Text fontSize="sm" color="gray.500">{user.email}</Text>
                </Box>
                <MenuDivider />
                <MenuItem icon={<FaUserCircle />} onClick={() => navigate('/userSettings')}>Profile</MenuItem>
                <MenuItem icon={<FaBell />} onClick={() => navigate('/notifications')}>
                  <Flex align="center" justify="space-between" w="full">
                    <Text>Notifications</Text>
                    {userUnread > 0 ? <Badge colorScheme="red" borderRadius="full">{userUnread > 9 ? '9+' : userUnread}</Badge> : null}
                  </Flex>
                </MenuItem>
                <MenuItem icon={<FaCog />} onClick={() => navigate('/userSettings')}>Settings</MenuItem>
                {isAdmin && <MenuItem icon={<FaCog />} onClick={() => navigate('/admin')}>Admin Inbox</MenuItem>}
                <MenuDivider />
                <MenuItem icon={<FaSignOutAlt />} color="red.400" onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button fontSize="sm" fontWeight={600} color="white" bg="brand.500" _hover={{ bg: 'brand.600' }} onClick={() => navigate('/authentication/login')}>Sign In</Button>
          )}
        </Stack>
      </Flex>

      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={2} mt={4}>
              {navItems.map((item) => <MobileNavItem key={item.to} label={item.label} icon={item.icon} to={item.to} />)}
              {user && <MobileNavItem label="Profile" icon={FaUserCircle} to="/userSettings" />}
              {user && <MobileNavItem label="Notifications" icon={FaBell} to="/notifications" badgeCount={userUnread} />}
              {isAdmin && <MobileNavItem label="Inbox" icon={FaCog} to="/admin" />}
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
