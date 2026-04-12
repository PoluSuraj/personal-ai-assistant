import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { apiFetch, isUnauthorizedError } from "../utils/api";

const ADMIN_EMAILS = ["21a91a0547@gmail.com", "21a91a0547@aec.edu.in"];

export default function AdminInbox() {
  const user = useSelector((state) => state.authSlice.userData);
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const messageBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const isAdmin = useMemo(() => Boolean(user?.isAdmin) || ADMIN_EMAILS.includes(String(user?.email || "").toLowerCase()), [user]);

  const loadData = async () => {
    const [messageData, adminData] = await Promise.all([
      apiFetch("/api/v1/contact/all"),
      apiFetch("/api/v1/users/admins"),
    ]);
    setMessages(messageData.data || []);
    setAdmins(adminData.data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData()
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({ title: "Session expired", description: "Please sign in again to continue.", status: "warning" });
          return;
        }
        toast({ title: "Admin panel unavailable", description: error.message, status: "error" });
      })
      .finally(() => setLoading(false));
  }, [isAdmin, toast]);

  if (!user) return <Navigate to="/authentication/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const updateStatus = async (status) => {
    if (!selectedMessage) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/api/v1/contact/${selectedMessage._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, reply }),
      });
      const updated = data.data;
      setMessages((prev) => prev.map((item) => item._id === updated._id ? updated : item));
      setSelectedMessage(updated);
      toast({ title: status === "replied" ? "Reply saved" : "Message updated", status: "success" });
    } catch (error) {
      toast({ title: "Update failed", description: error.message, status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const grantAdmin = async () => {
    if (!adminEmail.trim()) return;
    setAdminSaving(true);
    try {
      await apiFetch("/api/v1/users/admins/grant", {
        method: "PATCH",
        body: JSON.stringify({ email: adminEmail.trim().toLowerCase() }),
      });
      setAdminEmail("");
      await loadData();
      toast({ title: "Admin added", status: "success" });
    } catch (error) {
      toast({ title: "Could not add admin", description: error.message, status: "error" });
    } finally {
      setAdminSaving(false);
    }
  };

  const revokeAdmin = async (email) => {
    setAdminSaving(true);
    try {
      await apiFetch("/api/v1/users/admins/revoke", {
        method: "PATCH",
        body: JSON.stringify({ email }),
      });
      await loadData();
      toast({ title: "Admin removed", status: "success" });
    } catch (error) {
      toast({ title: "Could not remove admin", description: error.message, status: "error" });
    } finally {
      setAdminSaving(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">Admin Panel</Heading>
          <Text color={muted}>Manage contact replies, admin access, and launch operations from one separate admin workspace.</Text>
        </Box>
        {loading ? (
          <Flex justify="center" py={20}><Spinner size="xl" color="brand.500" /></Flex>
        ) : (
          <VStack align="stretch" spacing={6}>
            <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="lg">
              <SimpleGrid columns={{ base: 1, lg: "1fr 420px" }} spacing={6}>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Administrators</Heading>
                  {admins.map((admin) => (
                    <HStack key={admin.email} justify="space-between" p={3} bg={messageBg} borderRadius="lg">
                      <Box>
                        <Text fontWeight="bold">{admin.name || "Administrator"}</Text>
                        <Text fontSize="sm" color={muted}>{admin.email}</Text>
                      </Box>
                      <HStack>
                        <Badge colorScheme="green">admin</Badge>
                        {!ADMIN_EMAILS.includes(String(admin.email).toLowerCase()) && (
                          <Button size="sm" colorScheme="red" variant="outline" onClick={() => revokeAdmin(admin.email)} isLoading={adminSaving}>Remove</Button>
                        )}
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Add Admin Manually</Heading>
                  <FormControl>
                    <FormLabel>User email</FormLabel>
                    <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="existing-user@example.com" />
                  </FormControl>
                  <Text fontSize="sm" color={muted}>This grants admin access to an existing user account. Protected administrators cannot be removed here.</Text>
                  <Button colorScheme="teal" onClick={grantAdmin} isLoading={adminSaving}>Grant Admin Access</Button>
                </VStack>
              </SimpleGrid>
            </Box>
            <SimpleGrid columns={{ base: 1, xl: "380px 1fr" }} spacing={6}>
              <VStack align="stretch" spacing={4}>
                {messages.map((message) => (
                  <Box key={message._id} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4} cursor="pointer" boxShadow="md" onClick={() => { setSelectedMessage(message); setReply(message.reply || ""); }}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" noOfLines={1}>{message.name}</Text>
                      <Badge colorScheme={message.status === "new" ? "red" : message.status === "read" ? "yellow" : "green"}>{message.status}</Badge>
                    </HStack>
                    <Text fontSize="sm" color={muted} noOfLines={1}>{message.email}</Text>
                    <Text mt={2} fontWeight="medium" noOfLines={1}>{message.subject}</Text>
                    <Text fontSize="sm" color={muted} noOfLines={2}>{message.message}</Text>
                  </Box>
                ))}
              </VStack>
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="lg" minH="420px">
                {selectedMessage ? (
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <Heading size="md">{selectedMessage.subject}</Heading>
                      <Badge colorScheme={selectedMessage.status === "new" ? "red" : selectedMessage.status === "read" ? "yellow" : "green"}>{selectedMessage.status}</Badge>
                    </HStack>
                    <Text><Text as="span" fontWeight="bold">From:</Text> {selectedMessage.name} ({selectedMessage.email})</Text>
                    <Text color={muted}>{new Date(selectedMessage.createdAt).toLocaleString()}</Text>
                    <Box p={4} bg={messageBg} borderRadius="xl"><Text whiteSpace="pre-wrap">{selectedMessage.message}</Text></Box>
                    <FormControl>
                      <FormLabel>Admin reply / support note</FormLabel>
                      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write the admin reply or internal support note here" minH="180px" />
                    </FormControl>
                    <HStack>
                      <Button colorScheme="yellow" variant="outline" onClick={() => updateStatus("read")} isLoading={saving}>Mark Read</Button>
                      <Button colorScheme="green" onClick={() => updateStatus("replied")} isLoading={saving}>Save Reply</Button>
                    </HStack>
                  </VStack>
                ) : (
                  <Flex align="center" justify="center" h="100%"><Text color={muted}>Select a message to review it and reply from the admin panel.</Text></Flex>
                )}
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
