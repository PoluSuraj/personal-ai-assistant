import React, { useState, useEffect } from "react";
import {
  Flex,
  Box,
  Avatar,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Spinner,
  useToast,
  useColorModeValue,
  Container,
  Heading,
  Badge,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Center,
  HStack,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Textarea,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { logout, login } from "../store/authSlice.js";
import { FaHistory, FaUserEdit, FaSignOutAlt, FaCog, FaBell, FaLock, FaBrain, FaFire, FaGraduationCap, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

const skillTags = ["AI Chat", "Research", "Video Learning", "Quiz Practice", "Revision"];

function UserSettings() {
  const user = useSelector((state) => state.authSlice.userData);
  const history = useSelector((state) => state.chatTopic.topics || []);
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", username: "", bio: "" });
  const [isSaving, setIsSaving] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.950");
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const editableBg = useColorModeValue("white", "gray.700");
  const readOnlyBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const historyBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const historyHoverBg = useColorModeValue("teal.50", "whiteAlpha.200");
  const heroGradient = useColorModeValue("linear(to-br, teal.500, brand.600, accent.500)", "linear(to-br, teal.700, brand.800, accent.700)");
  const statBg = useColorModeValue("whiteAlpha.900", "blackAlpha.200");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/logout`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Getting problem while logging out");
      dispatch(logout());
      navigate('/authentication/login');
      toast({ title: "Logged out successfully.", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: "Logout failed.", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/update-account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await res.json();
      dispatch(login({ userData: data.data }));
      toast({ title: "Profile updated", description: "Your changes have been saved successfully.", status: "success", duration: 3000, isClosable: true });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Update failed", description: error.message || "Could not save changes. Please try again.", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsSaving(false);
    }
  };

  const resetEdits = () => {
    setFormData({ name: user?.name || "", email: user?.email || "", username: user?.username || "", bio: user?.bio || "" });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Center h="100%" w="100%" bg={bg}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="lg" color={mutedColor}>Loading profile...</Text>
          <Button variant="link" colorScheme="brand" onClick={() => navigate('/authentication/login')}>Go to Login</Button>
        </VStack>
      </Center>
    );
  }

  const fieldBg = isEditing ? editableBg : readOnlyBg;
  const firstName = formData.name?.split(" ")?.[0] || "Learner";
  const completedTopics = history.length;
  const learningScore = Math.min(100, 35 + completedTopics * 12);

  return (
    <Flex minH="100%" width="100%" bg={bg} justifyContent="center" overflowY="auto">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch" pb={20}>
          <Box bgGradient={heroGradient} borderRadius="2xl" overflow="hidden" color="white" boxShadow="2xl" position="relative">
            <Box position="absolute" right="-80px" top="-80px" boxSize="240px" borderRadius="full" bg="whiteAlpha.200" />
            <Box position="absolute" left="-60px" bottom="-100px" boxSize="220px" borderRadius="full" bg="blackAlpha.200" />
            <Flex direction={{ base: "column", lg: "row" }} gap={8} align="center" p={{ base: 6, md: 10 }} position="relative">
              <Box position="relative">
                <Avatar size="2xl" name={formData.name} src={user?.avatar} borderWidth="5px" borderColor="whiteAlpha.800" boxShadow="2xl" />
                <Badge position="absolute" bottom="4px" right="0" colorScheme="green" borderRadius="full" px={3} py={1}>Active</Badge>
              </Box>
              <VStack align={{ base: "center", lg: "start" }} textAlign={{ base: "center", lg: "left" }} spacing={3} flex={1}>
                <Badge colorScheme="whiteAlpha" borderRadius="full" px={3}>Personal learning profile</Badge>
                <Heading size="2xl">{firstName}'s Training Space</Heading>
                <Text fontSize="lg" color="whiteAlpha.900" maxW="2xl">{formData.bio || "Build topics, collect resources, and turn every chat into practice."}</Text>
                <Wrap justify={{ base: "center", lg: "flex-start" }}>
                  {skillTags.map((tag) => <WrapItem key={tag}><Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1}>{tag}</Badge></WrapItem>)}
                </Wrap>
              </VStack>
              <VStack align="stretch" minW={{ base: "full", lg: "280px" }} spacing={3}>
                <Button leftIcon={<FaUserEdit />} bg="white" color="brand.700" _hover={{ bg: "gray.100" }} onClick={() => setIsEditing(true)}>Edit Profile</Button>
                <Button leftIcon={<FaSignOutAlt />} colorScheme="red" variant="solid" onClick={handleLogout} isLoading={isLoggingOut}>Logout</Button>
              </VStack>
            </Flex>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <StatCard icon={FaBrain} label="Saved Topics" value={completedTopics} bg={statBg} borderColor={borderColor} />
            <StatCard icon={FaFire} label="Learning Streak" value={`${Math.max(1, Math.min(7, completedTopics + 1))} days`} bg={statBg} borderColor={borderColor} />
            <StatCard icon={FaChartLine} label="Readiness" value={`${learningScore}%`} bg={statBg} borderColor={borderColor} />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, xl: "360px 1fr" }} spacing={6} alignItems="start">
            <VStack align="stretch" spacing={6}>
              <Box bg={cardBg} borderRadius="2xl" p={6} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
                <HStack mb={4}><Icon as={FaGraduationCap} color="teal.500" /><Heading size="md" color={textColor}>Learning Level</Heading></HStack>
                <Text color={mutedColor} mb={3}>Your profile becomes stronger as you save topics and complete quizzes.</Text>
                <Progress value={learningScore} colorScheme="teal" borderRadius="full" mb={3} />
                <Text fontSize="sm" color={mutedColor}>{learningScore}% ready for the next quiz session</Text>
              </Box>
              <Box bg={cardBg} borderRadius="2xl" p={6} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
                <Heading size="md" color={textColor} mb={4}>Identity</Heading>
                <VStack align="stretch" spacing={3} color={mutedColor}>
                  <Text><Text as="span" fontWeight="bold" color={textColor}>Email:</Text> {formData.email}</Text>
                  <Text><Text as="span" fontWeight="bold" color={textColor}>Username:</Text> {formData.username || "Not set"}</Text>
                  <Text><Text as="span" fontWeight="bold" color={textColor}>Role:</Text> Focused Learner</Text>
                </VStack>
              </Box>
            </VStack>

            <Box bg={panelBg} backdropFilter="blur(20px)" borderRadius="2xl" boxShadow="xl" overflow="hidden" borderWidth="1px" borderColor={borderColor} minH="460px">
              <Tabs variant="line" colorScheme="teal" isLazy size="lg">
                <TabList px={6} pt={4} borderBottomColor={borderColor} overflowX="auto">
                  <Tab fontWeight="semibold">Profile Details</Tab>
                  <Tab fontWeight="semibold">Activity History</Tab>
                  <Tab fontWeight="semibold">Preferences</Tab>
                </TabList>
                <TabPanels p={{ base: 4, md: 8 }}>
                  <TabPanel>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      <VStack align="start" spacing={4}>
                        <FormControl><FormLabel>Full Name</FormLabel><Input name="name" value={formData.name} onChange={handleInputChange} isReadOnly={!isEditing} bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
                        <FormControl><FormLabel>Email Address</FormLabel><Input name="email" value={formData.email} onChange={handleInputChange} isReadOnly={!isEditing} bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
                        <FormControl><FormLabel>Username</FormLabel><Input name="username" value={formData.username} onChange={handleInputChange} isReadOnly={!isEditing} bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
                      </VStack>
                      <VStack align="start" spacing={4}>
                        <FormControl><FormLabel>Bio</FormLabel><Textarea name="bio" value={formData.bio} onChange={handleInputChange} isReadOnly={!isEditing} placeholder="Tell us a little about yourself..." minH="150px" bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
                        {isEditing ? (
                          <Flex gap={4} width="100%" mt={4}>
                            <Button flex={1} variant="outline" onClick={resetEdits} isDisabled={isSaving}>Cancel</Button>
                            <Button flex={1} colorScheme="teal" onClick={handleSaveProfile} isLoading={isSaving} loadingText="Saving...">Save Changes</Button>
                          </Flex>
                        ) : (
                          <Button leftIcon={<FaUserEdit />} colorScheme="teal" variant="outline" mt={4} width="100%" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                      </VStack>
                    </SimpleGrid>
                  </TabPanel>
                  <TabPanel>
                    {history.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {history.map((item, i) => (
                          <Flex key={`${item}-${i}`} p={4} bg={historyBg} borderRadius="xl" align="center" gap={4} _hover={{ bg: historyHoverBg, transform: "translateY(-3px)" }} transition="all 0.2s" cursor="pointer" borderWidth="1px" borderColor={borderColor}>
                            <Box p={3} bg="teal.100" borderRadius="full" color="teal.700"><FaHistory /></Box>
                            <VStack align="start" spacing={0}><Text color={textColor} fontWeight="semibold">{item}</Text><Text fontSize="xs" color={mutedColor}>Ready for quiz and resources</Text></VStack>
                          </Flex>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Flex direction="column" align="center" justify="center" h="300px" color={mutedColor} bg={historyBg} borderRadius="xl" textAlign="center" px={6}>
                        <Heading size="md" mb={2}>No History Found</Heading>
                        <Text>Start a chat and your learning topics will become part of this profile.</Text>
                      </Flex>
                    )}
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={6} align="stretch" maxW="lg">
                      <Preference icon={FaBell} label="Email Notifications"><Switch colorScheme="teal" defaultChecked /></Preference>
                      <Preference icon={FaLock} label="Two-Factor Authentication"><Switch colorScheme="teal" /></Preference>
                      <Preference icon={FaCog} label="Adaptive Practice"><Switch colorScheme="teal" defaultChecked /></Preference>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>
    </Flex>
  );
}

function StatCard({ icon, label, value, bg, borderColor }) {
  return (
    <Box bg={bg} borderRadius="2xl" p={6} borderWidth="1px" borderColor={borderColor} boxShadow="lg">
      <HStack spacing={4}>
        <Center boxSize="46px" borderRadius="xl" bg="teal.500" color="white"><Icon as={icon} /></Center>
        <Stat><StatLabel>{label}</StatLabel><StatNumber>{value}</StatNumber></Stat>
      </HStack>
    </Box>
  );
}

function Preference({ icon, label, children }) {
  return (
    <Flex justify="space-between" align="center" gap={4}>
      <Flex gap={3} align="center"><Icon as={icon} /><Text fontWeight="medium">{label}</Text></Flex>
      {children}
    </Flex>
  );
}

export default UserSettings;
