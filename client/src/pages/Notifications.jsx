import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Notifications() {
  const user = useSelector((state) => state.authSlice.userData);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    apiFetch("/api/v1/notifications")
      .then((data) => setNotifications(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <Navigate to="/authentication/login" replace />;

  const markRead = async (id) => {
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((item) => item._id === id ? { ...item, status: "read", readAt: new Date().toISOString() } : item));
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">Notifications</Heading>
          <Text color={muted}>Replies from the admin team and product updates for your account appear here.</Text>
        </Box>
        {loading ? <Flex justify="center" py={16}><Spinner size="xl" color="brand.500" /></Flex> : (
          <VStack align="stretch" spacing={4}>
            {notifications.length === 0 ? (
              <Box bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={8} textAlign="center">
                <Text color={muted}>No notifications yet.</Text>
              </Box>
            ) : notifications.map((notification) => (
              <Box key={notification._id} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="md">
                <Flex justify="space-between" gap={4} align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }}>
                  <Box>
                    <Badge colorScheme={notification.status === "unread" ? "red" : "green"} mb={2}>{notification.status}</Badge>
                    <Heading size="sm" mb={2}>{notification.title}</Heading>
                    <Text mb={2}>{notification.message}</Text>
                    <Text fontSize="sm" color={muted}>{new Date(notification.createdAt).toLocaleString()}</Text>
                  </Box>
                  {notification.status === "unread" && <Button colorScheme="teal" variant="outline" onClick={() => markRead(notification._id)}>Mark Read</Button>}
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
