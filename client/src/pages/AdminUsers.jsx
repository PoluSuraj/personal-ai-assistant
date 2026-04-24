import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
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
  Stat,
  StatLabel,
  StatNumber,
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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
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
          password: form.password,
          isAdmin: form.role === "admin",
        }),
      });
      setForm({ name: "", email: "", password: "", role: "user" });
      await load();
      toast({ title: "User created", status: "success" });
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Create failed", description: isUnauthorizedError(error) ? "Please sign in again to continue." : error.message, status: "error" });
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
          <Text color={muted}>Administrators can create users, remove users, and inspect all stored account, contact, and notification data from one place.</Text>
        </Box>
        <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
            <FormControl><FormLabel>Name</FormLabel><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Email</FormLabel><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Password</FormLabel><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></FormControl>
            <FormControl><FormLabel>Role</FormLabel><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></Select></FormControl>
          </Grid>
          <Button mt={4} colorScheme="teal" onClick={createUser} isLoading={loading}>Create Manually</Button>
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
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <StatBox label="Notifications" value={selectedDetails.stats?.notifications || 0} softBg={softBg} />
                  <StatBox label="Unread" value={selectedDetails.stats?.unreadNotifications || 0} softBg={softBg} />
                  <StatBox label="Contact Messages" value={selectedDetails.stats?.contactMessages || 0} softBg={softBg} />
                  <StatBox label="Replies" value={selectedDetails.stats?.repliedContacts || 0} softBg={softBg} />
                </SimpleGrid>
                <Box bg={softBg} borderRadius="xl" p={4}>
                  <Heading size="sm" mb={3}>Stored profile</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Text><strong>Username:</strong> {selectedDetails.user?.username || 'Not set'}</Text>
                    <Text><strong>Role:</strong> {selectedDetails.user?.isAdmin ? 'Administrator' : 'Learner'}</Text>
                    <Text><strong>Created:</strong> {selectedDetails.user?.createdAt ? new Date(selectedDetails.user.createdAt).toLocaleString() : '—'}</Text>
                    <Text><strong>Updated:</strong> {selectedDetails.user?.updatedAt ? new Date(selectedDetails.user.updatedAt).toLocaleString() : '—'}</Text>
                  </SimpleGrid>
                  <Text mt={3}><strong>Bio:</strong> {selectedDetails.user?.bio || 'No bio added yet.'}</Text>
                </Box>
                <Box bg={softBg} borderRadius="xl" p={4}>
                  <Heading size="sm" mb={2}>Availability note</Heading>
                  <Text color={muted}>{selectedDetails.availability?.note}</Text>
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
            <Text fontSize="sm" color="gray.400" noOfLines={4}>{item.message || item.reply || 'No details available.'}</Text>
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
