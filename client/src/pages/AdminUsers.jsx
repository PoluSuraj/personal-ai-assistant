import React, { useEffect, useState } from "react";
import {
  Badge,
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { apiFetch, isUnauthorizedError } from "../utils/api";

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [profileForm, setProfileForm] = useState({ name: "", username: "", bio: "", emailNotifications: true, adaptivePractice: true });
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const load = async () => {
    const data = await apiFetch("/api/v1/users/manage-users");
    setUsers(data.data || []);
  };

  const loadDetails = async (email) => {
    setDetailLoading(true);
    setSelectedEmail(email);
    try {
      const data = await apiFetch(`/api/v1/users/manage-users/${encodeURIComponent(email)}`);
      setSelectedDetails(data.data);
      setProfileForm({
        name: data.data.user?.name || "",
        username: data.data.user?.username || "",
        bio: data.data.user?.bio || "",
        emailNotifications: data.data.user?.preferences?.emailNotifications ?? true,
        adaptivePractice: data.data.user?.preferences?.adaptivePractice ?? true,
      });
    } catch (error) {
      toast({
        title: isUnauthorizedError(error) ? "Session expired" : "Could not load user details",
        description: isUnauthorizedError(error) ? "Please sign in again to continue." : error.message,
        status: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMoreActivities = async () => {
    if (!selectedEmail || !selectedDetails?.activitiesNextCursor) return;
    setActivityLoading(true);
    try {
      const query = new URLSearchParams({ limit: "50", cursor: selectedDetails.activitiesNextCursor });
      const result = await apiFetch(`/api/v1/users/manage-users/${encodeURIComponent(selectedEmail)}/activities?${query.toString()}`);
      setSelectedDetails((current) => ({
        ...current,
        activities: [...(current?.activities || []), ...(result.data?.items || [])],
        activitiesNextCursor: result.data?.nextCursor || null,
        activitiesHaveMore: Boolean(result.data?.hasMore),
      }));
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Could not load older activity", description: error.message, status: "error" });
    } finally {
      setActivityLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await apiFetch(`/api/v1/users/manage-users/${encodeURIComponent(selectedEmail)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: profileForm.name,
          username: profileForm.username,
          bio: profileForm.bio,
          preferences: {
            emailNotifications: profileForm.emailNotifications,
            adaptivePractice: profileForm.adaptivePractice,
          },
        }),
      });
      await Promise.all([load(), loadDetails(selectedEmail)]);
      toast({ title: "User profile updated", status: "success" });
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Profile update failed", description: error.message, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/v1/users/manage-users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          isAdmin: form.role === "admin",
        }),
      });
      setForm({ name: "", email: "", role: "user" });
      await load();
      toast({ title: "User created and setup email sent", status: "success" });
    } catch (error) {
      const oldBackendRequiresPassword = /name,\s*email,\s*and password are required/i.test(error.message || "");
      toast({
        title: isUnauthorizedError(error) ? "Session expired" : oldBackendRequiresPassword ? "Backend needs an update" : "Create failed",
        description: isUnauthorizedError(error)
          ? "Please sign in again to continue."
          : oldBackendRequiresPassword
            ? "This API still requires an admin-entered password. Deploy the updated backend to enable emailed temporary passwords. No account was created."
            : error.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (email) => {
    setLoading(true);
    try {
      await apiFetch("/api/v1/users/manage-users", {
        method: "DELETE",
        body: JSON.stringify({ email }),
      });
      if (selectedEmail === email) {
        setSelectedEmail("");
        setSelectedDetails(null);
      }
      await load();
      toast({ title: "User removed", status: "success" });
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Remove failed", description: isUnauthorizedError(error) ? "Please sign in again to continue." : error.message, status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">User Management</Heading>
          <Text color={muted}>Review account profiles, support records, chat and voice transcripts, quiz answers, and saved preferences. Passwords and authentication tokens are never shown.</Text>
        </Box>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <FormControl><FormLabel>Name</FormLabel><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Email</FormLabel><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Role</FormLabel><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></Select></FormControl>
          </Grid>
          <Text mt={3} fontSize="sm" color={muted}>A secure temporary password will be emailed to the new user. They must replace it at first sign-in.</Text>
          <Button mt={4} colorScheme="teal" onClick={createUser} isLoading={loading}>Create Account &amp; Email Setup</Button>
        </Box>

        <SimpleGrid columns={{ base: 1, xl: '360px 1fr' }} spacing={6} alignItems="start">
          <VStack align="stretch" spacing={4}>
            {users.map((user) => (
              <Box key={user.email} bg={cardBg} borderWidth="1px" borderColor={selectedEmail === user.email ? 'teal.400' : borderColor} borderRadius="xl" p={4}>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Text fontWeight="bold">{user.name || "User"}</Text>
                      <Text fontSize="sm" color={muted}>{user.email}</Text>
                    </Box>
                    <Badge colorScheme={user.isAdmin ? "green" : "blue"}>{user.isAdmin ? "admin" : "user"}</Badge>
                  </HStack>
                  <HStack>
                    <Button size="sm" colorScheme="teal" variant="outline" onClick={() => loadDetails(user.email)} isLoading={detailLoading && selectedEmail === user.email}>View data</Button>
                    <Button size="sm" colorScheme="red" variant="outline" onClick={() => removeUser(user.email)} isLoading={loading}>Remove</Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </VStack>

          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md" minH="420px">
            {selectedDetails ? (
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="md">{selectedDetails.user?.name || 'User'} data overview</Heading>
                  <Text color={muted}>{selectedDetails.user?.email}</Text>
                </Box>
                <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
                  <StatBox label="Notifications" value={selectedDetails.stats?.notifications || 0} softBg={softBg} />
                  <StatBox label="Unread" value={selectedDetails.stats?.unreadNotifications || 0} softBg={softBg} />
                  <StatBox label="Contact Messages" value={selectedDetails.stats?.contactMessages || 0} softBg={softBg} />
                  <StatBox label="Replies" value={selectedDetails.stats?.repliedContacts || 0} softBg={softBg} />
                  <StatBox label="Chat exchanges" value={selectedDetails.stats?.chats || 0} softBg={softBg} />
                  <StatBox label="Voice exchanges" value={selectedDetails.stats?.voiceSessions || 0} softBg={softBg} />
                  <StatBox label="Quiz attempts" value={selectedDetails.stats?.quizzes || 0} softBg={softBg} />
                </SimpleGrid>
                <Box bg={softBg} borderRadius="xl" p={4}>
                  <Heading size="sm" mb={3}>Stored profile</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Text><strong>Username:</strong> {selectedDetails.user?.username || 'Not set'}</Text>
                    <Text><strong>Role:</strong> {selectedDetails.user?.isAdmin ? 'Administrator' : 'Learner'}</Text>
                    <Text><strong>Email verified:</strong> {selectedDetails.user?.isEmailVerified ? 'Yes' : 'No'}</Text>
                    <Text><strong>Created:</strong> {selectedDetails.user?.createdAt ? new Date(selectedDetails.user.createdAt).toLocaleString() : '—'}</Text>
                    <Text><strong>Updated:</strong> {selectedDetails.user?.updatedAt ? new Date(selectedDetails.user.updatedAt).toLocaleString() : '—'}</Text>
                    <Text><strong>Avatar:</strong> {selectedDetails.user?.avatar || 'No profile photo'}</Text>
                  </SimpleGrid>
                  <Text mt={3}><strong>Bio:</strong> {selectedDetails.user?.bio || 'No bio added yet.'}</Text>
                  <Divider my={4} />
                  <Heading size="sm" mb={3}>Saved preferences</Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <Text><strong>Email notifications:</strong> {selectedDetails.user?.preferences?.emailNotifications ? 'On' : 'Off'}</Text>
                    <Text><strong>Two-factor authentication:</strong> {selectedDetails.user?.preferences?.twoFactorAuth ? 'On' : 'Off'}</Text>
                    <Text><strong>Adaptive practice:</strong> {selectedDetails.user?.preferences?.adaptivePractice ? 'On' : 'Off'}</Text>
                  </SimpleGrid>
                </Box>
                <Box bg={softBg} borderRadius="xl" p={4}>
                  <Heading size="sm" mb={3}>Edit learner profile</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl><FormLabel>Name</FormLabel><Input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} maxLength={100} /></FormControl>
                    <FormControl><FormLabel>Username</FormLabel><Input value={profileForm.username} onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })} maxLength={30} placeholder="3-30 letters, numbers, . _ -" /></FormControl>
                    <FormControl gridColumn={{ md: "1 / -1" }}><FormLabel>Bio</FormLabel><Textarea value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} maxLength={500} /></FormControl>
                  </SimpleGrid>
                  <HStack mt={4} spacing={6} flexWrap="wrap">
                    <Checkbox isChecked={profileForm.emailNotifications} onChange={(event) => setProfileForm({ ...profileForm, emailNotifications: event.target.checked })}>Email notifications</Checkbox>
                    <Checkbox isChecked={profileForm.adaptivePractice} onChange={(event) => setProfileForm({ ...profileForm, adaptivePractice: event.target.checked })}>Adaptive practice</Checkbox>
                  </HStack>
                  <Button mt={4} colorScheme="teal" onClick={saveProfile} isLoading={loading}>Save profile changes</Button>
                  <Text fontSize="xs" color={muted} mt={2}>Role changes and account removal remain separate administrator actions.</Text>
                </Box>
                <Box bg={softBg} borderRadius="xl" p={4}>
                  <Heading size="sm" mb={2}>Newsletter subscription</Heading>
                  <Text>Status: {selectedDetails.subscription?.isActive ? 'Subscribed' : selectedDetails.subscription ? 'Unsubscribed' : 'Not subscribed'}</Text>
                  {selectedDetails.subscription?.subscribedAt ? <Text color={muted}>Since {new Date(selectedDetails.subscription.subscribedAt).toLocaleString()}</Text> : null}
                </Box>
                <Alert status="info" borderRadius="lg"><AlertIcon /><Text>{selectedDetails.availability?.note} History is shown newest first; use Load older activity to review earlier records.</Text></Alert>
                <Box>
                  <Heading size="md" mb={3}>Chat, voice, and quiz activity</Heading>
                  <VStack align="stretch" spacing={3}>
                    {(selectedDetails.activities || []).length ? selectedDetails.activities.map((activity) => (
                      <Box key={activity._id} bg={softBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4}>
                        <HStack justify="space-between" align="start" mb={3} flexWrap="wrap">
                          <Heading size="sm">{activity.kind === 'quiz' ? `Quiz: ${activity.topic || 'Untitled topic'}` : activity.kind === 'voice' ? 'Voice assistant exchange' : 'Chat exchange'}</Heading>
                          <HStack><Badge colorScheme={activity.kind === 'quiz' ? 'orange' : 'purple'}>{activity.kind}</Badge><Text fontSize="xs" color={muted}>{new Date(activity.createdAt).toLocaleString()}</Text></HStack>
                        </HStack>
                        {activity.kind === 'quiz' ? (
                          <VStack align="stretch" spacing={3}>
                            <Text><strong>Result:</strong> {activity.score}/{activity.total} ({activity.percentage}%)</Text>
                            {activity.autoSubmitReason ? <Text><strong>Submission:</strong> {activity.autoSubmitReason}</Text> : null}
                            {(activity.questions || []).map((question, index) => {
                              const selected = activity.answers?.[index] ?? activity.answers?.[String(index)] ?? '';
                              return <Box key={`${activity._id}-${index}`} borderTopWidth="1px" borderColor={borderColor} pt={3}>
                                <Text fontWeight="semibold">Q{index + 1}. {question.question}</Text>
                                <Text><strong>Learner answer:</strong> {selected ? `${selected}. ${question.options?.[selected] || ''}` : 'Not answered'}</Text>
                                <Text><strong>Correct answer:</strong> {question.correct}. {question.options?.[question.correct] || ''}</Text>
                                {question.explanation ? <Text color={muted}><strong>Explanation:</strong> {question.explanation}</Text> : null}
                              </Box>;
                            })}
                          </VStack>
                        ) : (
                          <VStack align="stretch" spacing={3}>
                            <Box><Text fontWeight="semibold">Learner message</Text><Text whiteSpace="pre-wrap" maxH="280px" overflowY="auto">{activity.prompt}</Text></Box>
                            <Box><Text fontWeight="semibold">Assistant response</Text><Text whiteSpace="pre-wrap" maxH="360px" overflowY="auto">{activity.response}</Text></Box>
                          </VStack>
                        )}
                      </Box>
                    )) : <Text color={muted}>No activity has been saved for this user yet. New chat, voice, and quiz activity will appear here.</Text>}
                    {selectedDetails.activitiesHaveMore ? <Button alignSelf="center" onClick={loadMoreActivities} isLoading={activityLoading}>Load older activity</Button> : null}
                  </VStack>
                </Box>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  <RecordList title="Recent notifications" items={selectedDetails.notifications || []} emptyLabel="No notifications stored for this user yet." />
                  <RecordList title="Recent contact messages" items={selectedDetails.contacts || []} emptyLabel="No contact messages stored for this user yet." />
                </SimpleGrid>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={3} justify="center" h="100%">
                <Heading size="md">Choose a user</Heading>
                <Text color={muted}>Select "View data" on the left to inspect stored user details, notifications, and contact submissions.</Text>
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
}

function StatBox({ label, value, softBg }) {
  return (
    <Box bg={softBg} borderRadius="xl" p={4}>
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Heading size="md">{value}</Heading>
    </Box>
  );
}

function RecordList({ title, items, emptyLabel }) {
  return (
    <Box>
      <Heading size="sm" mb={3}>{title}</Heading>
      <VStack align="stretch" spacing={3}>
        {items.length ? items.map((item) => (
          <Box key={item._id} borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" p={3}>
            <HStack justify="space-between" align="start" mb={1}>
              <Text fontWeight="semibold">{item.title || item.subject || 'Record'}</Text>
              <Badge>{item.status || item.type || 'saved'}</Badge>
            </HStack>
            {item.message ? <Text fontSize="sm" color="gray.400" whiteSpace="pre-wrap">{item.message}</Text> : null}
            {item.reply ? <Box mt={2} pl={3} borderLeftWidth="2px" borderColor="teal.400"><Text fontSize="xs" color="gray.500" fontWeight="bold">Admin reply</Text><Text fontSize="sm" color="gray.400" whiteSpace="pre-wrap">{item.reply}</Text></Box> : null}
            {!item.message && !item.reply ? <Text fontSize="sm" color="gray.400">No details available.</Text> : null}
            {item.createdAt ? <Text fontSize="xs" color="gray.500" mt={2}>{new Date(item.createdAt).toLocaleString()}</Text> : null}
          </Box>
        )) : (
          <Box borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" p={4}>
            <Text color="gray.500">{emptyLabel}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
