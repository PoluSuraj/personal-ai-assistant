import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Progress,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { apiFetch, getHealth, isUnauthorizedError } from "../utils/api";
import { useNavigate } from "react-router-dom";

function StatCard({ label, value, tone = "teal" }) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  return (
    <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={5} boxShadow="md">
      <Stat>
        <StatLabel>{label}</StatLabel>
        <StatNumber color={`${tone}.500`}>{value}</StatNumber>
      </Stat>
    </Box>
  );
}

export default function AdminDashboard() {
  const [health, setHealth] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const panelBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const itemBg = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    let active = true;
    Promise.allSettled([getHealth(), apiFetch("/api/v1/contact/all")])
      .then(([healthResult, inboxResult]) => {
        if (!active) return;
        if (healthResult.status === "fulfilled") {
          setHealth(healthResult.value);
        }
        if (inboxResult.status === "fulfilled") {
          setMessages(inboxResult.value.data || []);
        } else if (isUnauthorizedError(inboxResult.reason)) {
          navigate("/authentication/login", { replace: true });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <Flex justify="center" py={20}><Spinner size="xl" color="teal.500" /></Flex>;
  }

  const newCount = messages.filter((m) => m.status === "new").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const readinessKeys = ["database", "ai", "youtube", "email", "cloudinary", "auth"];
  const readyCount = readinessKeys.filter((key) => {
    const value = health?.services?.[key];
    return value === "configured" || value === "mongodb";
  }).length;
  const readiness = Math.round((readyCount / readinessKeys.length) * 100);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="lg">Admin Dashboard</Heading>
          <Text color={muted}>A separate launch and operations view for administrators.</Text>
        </Box>
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
          <StatCard label="Launch readiness" value={`${readiness}%`} />
          <StatCard label="Total messages" value={messages.length} tone="blue" />
          <StatCard label="New messages" value={newCount} tone="red" />
          <StatCard label="Replied" value={repliedCount} tone="green" />
        </Grid>
        <Grid templateColumns={{ base: "1fr", xl: "1.2fr 0.8fr" }} gap={6}>
          <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Heading size="md">Launch Ready State</Heading>
                <Badge colorScheme={readiness === 100 ? "green" : "orange"}>{readiness === 100 ? "Ready" : "In progress"}</Badge>
              </HStack>
              <Progress value={readiness} colorScheme={readiness === 100 ? "green" : "orange"} borderRadius="full" />
              {readinessKeys.map((key) => (
                <HStack key={key} justify="space-between" p={3} bg={itemBg} borderRadius="lg">
                  <Text textTransform="capitalize">{key}</Text>
                  <Badge colorScheme={(health?.services?.[key] === "configured" || health?.services?.[key] === "mongodb") ? "green" : "orange"}>{health?.services?.[key] || "unknown"}</Badge>
                </HStack>
              ))}
            </VStack>
          </Box>
          <Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={6} boxShadow="md">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Latest Queries</Heading>
              {messages.length === 0 ? <Text color={muted}>No contact messages yet.</Text> : messages.slice(0, 5).map((message) => (
                <Box key={message._id} p={3} bg={itemBg} borderRadius="lg">
                  <Text fontWeight="bold" noOfLines={1}>{message.subject}</Text>
                  <Text fontSize="sm" color={muted} noOfLines={1}>{message.name} • {message.email}</Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </Grid>
      </VStack>
    </Container>
  );
}
