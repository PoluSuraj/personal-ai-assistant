import React, { useEffect, useMemo, useState } from "react";
import { Badge, HStack, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { getHealth } from "../utils/api";

const requiredServices = ["database", "ai", "youtube", "email", "cloudinary", "auth"];

export default function BackendStatus({ compact = false, adminView = false }) {
  const [health, setHealth] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const data = await getHealth();
        if (mounted) {
          setHealth(data);
          setIsOnline(true);
        }
      } catch {
        if (mounted) {
          setHealth(null);
          setIsOnline(false);
        }
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const launchReady = useMemo(() => {
    if (!health || health.mode !== "database") return false;
    return requiredServices.every((service) => {
      const value = health.services?.[service];
      return value === "configured" || value === "mongodb";
    });
  }, [health]);

  const bg = useColorModeValue(isOnline ? (launchReady ? "green.50" : adminView ? "orange.50" : "blue.50") : "red.50", isOnline ? (launchReady ? "green.900" : adminView ? "orange.900" : "blue.900") : "red.900");
  const color = useColorModeValue(isOnline ? (launchReady ? "green.700" : adminView ? "orange.700" : "blue.700") : "red.700", isOnline ? (launchReady ? "green.100" : adminView ? "orange.100" : "blue.100") : "red.100");
  const label = !isOnline ? "Offline" : adminView ? (health?.mode === "demo" ? "Admin demo" : launchReady ? "Admin ready" : "Admin setup") : "User ready";
  const tooltip = !adminView
    ? "Your workspace is ready."
    : isOnline
      ? `Database: ${health?.services?.database || "unknown"}. AI: ${health?.services?.ai || "unknown"}. YouTube: ${health?.services?.youtube || "unknown"}. Email: ${health?.services?.email || "unknown"}. Cloudinary: ${health?.services?.cloudinary || "unknown"}.`
      : "Start the backend with npm run start inside the server folder.";

  return (
    <Tooltip label={tooltip} hasArrow>
      <HStack borderWidth="1px" borderColor={borderColor} borderRadius="full" px={compact ? 2 : 3} py={1} spacing={2} bg={bg} color={color}>
        <Badge colorScheme={!isOnline ? "red" : launchReady ? "green" : adminView ? "orange" : "blue"} borderRadius="full" boxSize="8px" p={0} />
        {!compact && <Text fontSize="xs" fontWeight="bold">{label}</Text>}
      </HStack>
    </Tooltip>
  );
}
