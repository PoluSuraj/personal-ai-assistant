import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Select,
  Spinner,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { apiFetch, isUnauthorizedError } from "../utils/api";

const initialDirectForm = { recipientEmail: "", audience: "user", title: "", message: "" };
const initialBroadcastForm = { title: "", message: "" };

export default function AdminNotifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [directForm, setDirectForm] = useState(initialDirectForm);
  const [broadcastForm, setBroadcastForm] = useState(initialBroadcastForm);
  const [loading, setLoading] = useState(true);
  const [sendingDirect, setSendingDirect] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");

  const unreadCount = useMemo(() => notifications.filter((item) => item.status === "unread").length, [notifications]);

  const load = async () => {
    const data = await apiFetch("/api/v1/notifications");
    setNotifications(data.data || []);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const sendDirect = async () => {
    if (!directForm.recipientEmail.trim() || !directForm.title.trim() || !directForm.message.trim()) return;
    setSendingDirect(true);
    try {
      await apiFetch("/api/v1/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          recipientEmail: directForm.recipientEmail.trim().toLowerCase(),
          audience: directForm.audience,
          title: directForm.title.trim(),
          message: directForm.message.trim(),
          link: "/notifications",
        }),
      });
      setDirectForm(initialDirectForm);
      toast({ title: "Notification sent", status: "success" });
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Send failed", description: isUnauthorizedError(error) ? "Please sign in again to continue." : error.message, status: "error" });
    } finally {
      setSendingDirect(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;
    setSendingBroadcast(true);
    try {
      await apiFetch("/api/v1/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: broadcastForm.title.trim(),
          message: broadcastForm.message.trim(),
        }),
      });
      setBroadcastForm(initialBroadcastForm);
      await load();
      toast({ title: "Broadcast sent", status: "success" });
    } catch (error) {
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "Broadcast failed", description: isUnauthorizedError(error) ? "Please sign in again to continue." : error.message, status: "error" });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const markRead = async (id) => {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, status: "read", readAt: new Date().toISOString() } : item)));
    } catch (error) {
      toast({ title: "Could not update notification", description: error.message, status: "error" });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">Admin Notifications</Heading>
          <Text color={muted}>Send a direct message to one user, broadcast updates to everyone, and track what the admin team still needs to review.</Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "repeat(2, minmax(0, 1fr))" }} gap={6}>
          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Send Direct Notification</Heading>
              <FormControl>
                <FormLabel>User Email</FormLabel>
                <Input
                  value={directForm.recipientEmail}
                  onChange={(e) => setDirectForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="user@example.com"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Audience</FormLabel>
                <Select
                  value={directForm.audience}
                  onChange={(e) => setDirectForm((prev) => ({ ...prev, audience: e.target.value }))}
                >
                  <option value="user">User notification</option>
                  <option value="admin">Admin notification</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  value={directForm.title}
                  onChange={(e) => setDirectForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Support update"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Message</FormLabel>
                <Textarea
                  value={directForm.message}
                  onChange={(e) => setDirectForm((prev) => ({ ...prev, message: e.target.value }))}
                  minH="160px"
                  placeholder="Write the message that should appear in that user's notification panel"
                />
              </FormControl>
              <Button colorScheme="teal" onClick={sendDirect} isLoading={sendingDirect}>Send Message</Button>
            </VStack>
          </Box>

          <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Broadcast Update</Heading>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Platform update"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Message</FormLabel>
                <Textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
                  minH="160px"
                  placeholder="Write the notification for all users"
                />
              </FormControl>
              <Button colorScheme="purple" onClick={sendBroadcast} isLoading={sendingBroadcast}>Broadcast to All Users</Button>
            </VStack>
          </Box>
        </Grid>

        <Box>
          <Heading size="md">Admin Notification Feed</Heading>
          <Text color={muted}>{unreadCount} unread for administrators.</Text>
        </Box>

        {loading ? (
          <Flex justify="center" py={16}><Spinner size="xl" color="teal.500" /></Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {notifications.length === 0 ? (
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={8} textAlign="center">
                <Text color={muted}>No admin notifications yet.</Text>
              </Box>
            ) : notifications.map((notification) => (
              <Box key={notification._id} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="md">
                <Flex justify="space-between" gap={4} align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }}>
                  <Box>
                    <Badge colorScheme={notification.status === "unread" ? "red" : "green"} mb={2}>{notification.status}</Badge>
                    <Heading size="sm" mb={2}>{notification.title}</Heading>
                    <Text mb={2}>{notification.message}</Text>
                    <Text fontSize="sm" color={muted}>
                      {new Date(notification.createdAt).toLocaleString()}
                      {notification.createdByEmail ? ` • sent by ${notification.createdByEmail}` : ""}
                    </Text>
                  </Box>
                  {notification.status === "unread" ? (
                    <Button colorScheme="teal" variant="outline" onClick={() => markRead(notification._id)}>Mark Read</Button>
                  ) : null}
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
