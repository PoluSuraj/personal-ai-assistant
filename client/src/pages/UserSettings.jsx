import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Select,
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
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { logout, login } from "../store/authSlice.js";
import { FaUserEdit, FaSignOutAlt, FaCog, FaBell, FaLock, FaBrain, FaFire, FaGraduationCap, FaChartLine, FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiFetch, clearStoredAccessToken, getStoredAccessToken } from "../utils/api";
import { clearDeviceSession, getStorageMode, isDeviceStorageEnabled, setStorageMode as persistStorageMode } from "../utils/deviceStorage";

const skillTags = ["AI Chat", "Research", "Video Learning", "Quiz Practice", "Revision"];
const defaultPreferences = {
  emailNotifications: true,
  twoFactorAuth: false,
  adaptivePractice: true,
  dailyMotivationEmails: true,
};

function UserSettings() {
  const user = useSelector((state) => state.authSlice.userData);
  const history = useSelector((state) => state.chatTopic.topics || []);
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", username: "", bio: "", dateOfBirth: "", institutionName: "", institutionCountry: "", institutionType: "", preferences: defaultPreferences });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [activityHistory, setActivityHistory] = useState([]);
  const [activityCursor, setActivityCursor] = useState(null);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [storageMode, setStorageModeState] = useState(getStorageMode());
  const fileInputRef = useRef(null);

  const bg = useColorModeValue("gray.50", "gray.950");
  const cardBg = useColorModeValue("white", "gray.800");
  const panelBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const editableBg = useColorModeValue("white", "gray.700");
  const readOnlyBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const historyBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const heroGradient = useColorModeValue("linear(to-br, teal.500, brand.600, accent.500)", "linear(to-br, teal.700, brand.800, accent.700)");
  const statBg = useColorModeValue("whiteAlpha.900", "blackAlpha.200");
  const avatarButtonBg = useColorModeValue("white", "gray.800");
  const avatarButtonColor = useColorModeValue("gray.800", "white");
  const avatarButtonBorder = useColorModeValue("gray.200", "whiteAlpha.300");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth || "",
        institutionName: user.institutionName || "",
        institutionCountry: user.institutionCountry || "",
        institutionType: user.institutionType || "",
        preferences: {
          ...defaultPreferences,
          ...(user.preferences || {}),
        },
      });
    }
  }, [user]);

  const loadActivityHistory = useCallback(async (cursor = null) => {
    setActivityLoading(true);
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (cursor) query.set("cursor", cursor);
      const result = await apiFetch(`/api/v1/chat/activity/mine?${query.toString()}`);
      const page = result.data || {};
      setActivityHistory((previous) => cursor ? [...previous, ...(page.items || [])] : (page.items || []));
      setActivityCursor(page.nextCursor || null);
      setActivityHasMore(Boolean(page.hasMore));
    } catch (error) {
      toast({ title: "Could not load saved history", description: error.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setActivityLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.email) loadActivityHistory();
  }, [loadActivityHistory, storageMode, user?.email]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (isDeviceStorageEnabled()) {
        clearDeviceSession(user?.email);
        clearStoredAccessToken();
        dispatch(logout());
        navigate('/authentication/login');
        toast({ title: "Logged out", description: "Your data remains saved on this device.", status: "success", duration: 3000, isClosable: true });
        return;
      }
      const storedToken = getStoredAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
        method: "POST",
        credentials: "include",
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
      if (!res.ok) throw new Error("Getting problem while logging out");
      clearStoredAccessToken();
      dispatch(logout());
      navigate('/authentication/login');
      toast({ title: "Logged out successfully.", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      clearStoredAccessToken();
      toast({ title: "Logout failed.", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleStorageModeChange = (mode) => {
    persistStorageMode(mode, user);
    setStorageModeState(mode);
    toast({
      title: mode === "device" ? "This device will store your learner data" : "Account sync enabled",
      description: mode === "device" ? "Profile and chat/quiz history stay in this browser and are not sent to admin history." : "New profile and activity changes will use your signed-in account again.",
      status: "success",
      duration: 4500,
      isClosable: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (key) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
  };


  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      if (isDeviceStorageEnabled()) {
        if (file.size > 1024 * 1024) throw new Error("For device storage, choose a photo smaller than 1 MB.");
        const avatar = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Could not read this photo"));
          reader.readAsDataURL(file);
        });
        const data = await apiFetch("/api/v1/users/update-account", {
          method: "PATCH",
          body: JSON.stringify({ ...formData, avatar }),
        });
        dispatch(login(data.data));
        toast({ title: "Photo saved on this device", status: "success", duration: 2500, isClosable: true });
        return;
      }
      const avatarForm = new FormData();
      avatarForm.append("avatar", file);
      const storedToken = getStoredAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/users/updateAvatar`, {
        method: "POST",
        credentials: "include",
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        body: avatarForm,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile photo");
      }

      dispatch(login(data.data));
      toast({ title: "Profile photo updated", status: "success", duration: 2500, isClosable: true });
    } catch (error) {
      toast({ title: "Avatar upload failed", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      event.target.value = "";
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      const data = await apiFetch(`/api/v1/users/removeAvatar`, {
        method: "DELETE",
      });

      dispatch(login(data.data));
      toast({ title: "Profile photo removed", status: "success", duration: 2500, isClosable: true });
    } catch (error) {
      toast({ title: "Could not remove photo", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const data = await apiFetch(`/api/v1/users/update-account`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          bio: formData.bio,
          dateOfBirth: formData.dateOfBirth,
          institutionName: formData.institutionName,
          institutionCountry: formData.institutionCountry,
          institutionType: formData.institutionType,
          preferences: formData.preferences,
        }),
      });

      dispatch(login(data.data));
      toast({ title: "Profile updated", description: "Your changes have been saved successfully.", status: "success", duration: 3000, isClosable: true });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Update failed", description: error.message || "Could not save changes. Please try again.", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsSaving(false);
    }
  };

  const resetEdits = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      bio: user?.bio || "",
      dateOfBirth: user?.dateOfBirth || "",
      institutionName: user?.institutionName || "",
      institutionCountry: user?.institutionCountry || "",
      institutionType: user?.institutionType || "",
      preferences: {
        ...defaultPreferences,
        ...(user?.preferences || {}),
      },
    });
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
                <Button
                  position="absolute"
                  bottom="-3"
                  left="50%"
                  transform="translateX(-50%)"
                  size="sm"
                  leftIcon={<FaCamera />}
                  bg={avatarButtonBg}
                  color={avatarButtonColor}
                  borderWidth="1px"
                  borderColor={avatarButtonBorder}
                  _hover={{ bg: avatarButtonBg, opacity: 0.92 }}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAvatar}
                  loadingText="Uploading"
                >
                  Update photo
                </Button>
                {user?.avatar ? (
                  <Button
                    position="absolute"
                    top="-3"
                    right="-3"
                    size="xs"
                    colorScheme="red"
                    borderRadius="full"
                    onClick={handleRemoveAvatar}
                    isLoading={isRemovingAvatar}
                  >
                    Remove
                  </Button>
                ) : null}
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
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
                  <Text><Text as="span" fontWeight="bold" color={textColor}>Institution:</Text> {formData.institutionName ? `${formData.institutionName}${formData.institutionCountry ? `, ${formData.institutionCountry}` : ""}` : "Not set"}</Text>
                  <Text><Text as="span" fontWeight="bold" color={textColor}>Date of birth:</Text> {formData.dateOfBirth || "Not set"}</Text>
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
                        <FormControl><FormLabel>Email Address</FormLabel><Input name="email" value={formData.email} onChange={handleInputChange} isReadOnly bg={readOnlyBg} borderColor="transparent" /></FormControl>
                        <FormControl><FormLabel>Username</FormLabel><Input name="username" value={formData.username} onChange={handleInputChange} isReadOnly={!isEditing} placeholder="Choose a username" bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
                        <FormControl isDisabled={!isEditing}>
                          <FormLabel>School or college</FormLabel>
                          <Select name="institutionType" value={formData.institutionType} onChange={handleInputChange} bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"}>
                            <option value="">Choose type</option><option value="school">School</option><option value="college">College / university</option><option value="other">Other</option>
                          </Select>
                        </FormControl>
                        <InstitutionPicker
                          isDisabled={!isEditing}
                          value={formData.institutionName}
                          country={formData.institutionCountry}
                          onChange={(institutionName, institutionCountry = "") => setFormData((prev) => ({ ...prev, institutionName, institutionCountry }))}
                        />
                        <FormControl isDisabled={!isEditing}><FormLabel>Date of birth</FormLabel><Input type="date" name="dateOfBirth" value={formData.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={handleInputChange} bg={fieldBg} borderColor={isEditing ? "teal.500" : "transparent"} /></FormControl>
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
                    <VStack align="stretch" spacing={4}>
                      <Text color={mutedColor}>{storageMode === "device" ? "Your chat, voice, and quiz history is saved only in this browser. It is not synced to your account or visible to administrators." : "Your saved chat, voice, and quiz activity is linked to this account. Authorized administrators can review the same records."}</Text>
                      {activityHistory.length ? activityHistory.map((activity) => (
                        <Box key={activity._id} p={4} bg={historyBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                          <Flex justify="space-between" align="start" gap={3} flexWrap="wrap" mb={3}>
                            <VStack align="start" spacing={1}>
                              <Badge colorScheme={activity.kind === "quiz" ? "orange" : activity.kind === "voice" ? "purple" : "teal"}>{activity.kind === "quiz" ? "Quiz" : activity.kind === "voice" ? "Voice assistant" : "Chat"}</Badge>
                              <Text fontWeight="semibold" color={textColor}>{activity.topic || activity.prompt || "Learning activity"}</Text>
                            </VStack>
                            <Text fontSize="xs" color={mutedColor}>{new Date(activity.createdAt).toLocaleString()}</Text>
                          </Flex>
                          {activity.kind === "quiz" ? (
                            <VStack align="stretch" spacing={2}>
                              <Text><strong>Score:</strong> {activity.score}/{activity.total} ({activity.percentage}%)</Text>
                              {(activity.questions || []).map((question, index) => {
                                const answer = activity.answers?.[index] ?? activity.answers?.[String(index)] ?? "";
                                return <Box key={`${activity._id}-${index}`} borderTopWidth="1px" borderColor={borderColor} pt={2}>
                                  <Text fontWeight="medium">Q{index + 1}. {question.question}</Text>
                                  <Text fontSize="sm"><strong>Your answer:</strong> {answer ? `${answer}. ${question.options?.[answer] || ""}` : "Not answered"}</Text>
                                  <Text fontSize="sm" color={mutedColor}><strong>Correct:</strong> {question.correct}. {question.options?.[question.correct] || ""}</Text>
                                </Box>;
                              })}
                            </VStack>
                          ) : (
                            <VStack align="stretch" spacing={2}>
                              <Text whiteSpace="pre-wrap"><strong>You:</strong> {activity.prompt}</Text>
                              <Text whiteSpace="pre-wrap"><strong>Assistant:</strong> {activity.response}</Text>
                            </VStack>
                          )}
                        </Box>
                      )) : (
                        <Flex direction="column" align="center" justify="center" minH="220px" color={mutedColor} bg={historyBg} borderRadius="xl" textAlign="center" px={6}>
                          {activityLoading ? <Spinner /> : <><Heading size="md" mb={2}>No saved history yet</Heading><Text>New chats, voice sessions, and completed quizzes will appear here.</Text></>}
                        </Flex>
                      )}
                      {activityHasMore ? <Button alignSelf="center" onClick={() => loadActivityHistory(activityCursor)} isLoading={activityLoading}>Load older activity</Button> : null}
                    </VStack>
                  </TabPanel>
                  <TabPanel>
                    <VStack spacing={6} align="stretch" maxW="lg">
                      <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
                        <Flex justify="space-between" align={{ base: "start", sm: "center" }} gap={4} direction={{ base: "column", sm: "row" }}>
                          <Box>
                            <Text fontWeight="semibold">Data storage</Text>
                            <Text fontSize="sm" color={mutedColor}>{storageMode === "device" ? "Saved in this browser on this device" : "Saved to your signed-in account"}</Text>
                          </Box>
                          <HStack>
                            <Button size="sm" variant={storageMode === "account" ? "solid" : "outline"} colorScheme="teal" onClick={() => handleStorageModeChange("account")}>Account sync</Button>
                            <Button size="sm" variant={storageMode === "device" ? "solid" : "outline"} colorScheme="teal" onClick={() => handleStorageModeChange("device")}>This device</Button>
                          </HStack>
                        </Flex>
                        {storageMode === "device" ? <Alert status="warning" mt={4} borderRadius="md"><AlertIcon /><Text fontSize="sm">Profile and chat/quiz history stay in this browser and are not sent to admin history. Chat prompts still go to the online AI service to generate answers. Device data is not encrypted separately, does not sync to other devices, and is removed if this browser data is cleared.</Text></Alert> : null}
                      </Box>
                      <Preference icon={FaBell} label="Email Notifications"><Switch colorScheme="teal" isChecked={formData.preferences.emailNotifications} onChange={() => handlePreferenceChange('emailNotifications')} /></Preference>
                      <Preference icon={FaLock} label="Two-Factor Authentication"><Switch colorScheme="teal" isChecked={formData.preferences.twoFactorAuth} onChange={() => handlePreferenceChange('twoFactorAuth')} /></Preference>
                      <Preference icon={FaCog} label="Adaptive Practice"><Switch colorScheme="teal" isChecked={formData.preferences.adaptivePractice} onChange={() => handlePreferenceChange('adaptivePractice')} /></Preference>
                      <Preference icon={FaFire} label="Daily motivation emails"><Switch colorScheme="teal" isChecked={formData.preferences.dailyMotivationEmails} onChange={() => handlePreferenceChange('dailyMotivationEmails')} /></Preference>
                      <HStack justify="flex-end" pt={2}>
                        <Button colorScheme="teal" onClick={handleSaveProfile} isLoading={isSaving}>Save Preferences</Button>
                      </HStack>
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

function InstitutionPicker({ isDisabled, value, country, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.300");
  const menuBg = useColorModeValue("white", "gray.800");

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    const search = query.trim();
    if (search.length < 3) {
      setResults([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://api.openalex.org/institutions?search=${encodeURIComponent(search)}&per-page=8`, { signal: controller.signal });
        if (!response.ok) throw new Error("Institution search unavailable");
        const data = await response.json();
        setResults((data.results || []).map((item) => ({ name: item.display_name, country: item.country })).filter((item) => item.name));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const choose = (institution) => {
    setQuery(institution.name);
    onChange(institution.name, institution.country || "");
    setIsOpen(false);
  };

  return (
    <FormControl isDisabled={isDisabled} position="relative">
      <FormLabel>Institution name</FormLabel>
      <Input value={query} maxLength={160} placeholder="Search worldwide or enter it manually" onFocus={() => setIsOpen(true)} onChange={(event) => { setQuery(event.target.value); onChange(event.target.value, ""); setIsOpen(true); }} onBlur={() => setTimeout(() => setIsOpen(false), 150)} />
      <Text mt={1} fontSize="xs" color={mutedColor}>Global institution suggestions; if yours is missing, enter its name directly.</Text>
      {isOpen && !isDisabled && query.trim().length >= 3 ? (
        <VStack align="stretch" spacing={0} position="absolute" top="100%" left={0} right={0} zIndex="dropdown" mt={1} bg={menuBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" boxShadow="lg" maxH="240px" overflowY="auto">
          {results.map((institution) => (
            <Button key={`${institution.name}-${institution.country}`} variant="ghost" borderRadius={0} justifyContent="flex-start" whiteSpace="normal" h="auto" py={3} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(institution)}>
              {institution.name}{institution.country ? ` · ${institution.country}` : ""}
            </Button>
          ))}
          <Button variant="ghost" borderRadius={0} justifyContent="flex-start" whiteSpace="normal" h="auto" py={3} onMouseDown={(event) => event.preventDefault()} onClick={() => choose({ name: query.trim(), country: "" })}>
            Add “{query.trim()}” as a custom institution{country ? ` · ${country}` : ""}
          </Button>
          {isSearching ? <Text px={3} py={2} fontSize="sm" color={mutedColor}>Searching institution directory…</Text> : null}
        </VStack>
      ) : null}
    </FormControl>
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
