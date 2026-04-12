import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Select,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { apiFetch, isUnauthorizedError } from "../utils/api";

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");

  const load = async () => {
    const data = await apiFetch("/api/v1/users/manage-users");
    setUsers(data.data || []);
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
          <Text color={muted}>Administrators can add users manually, create admins, and remove users from here.</Text>
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
        <VStack align="stretch" spacing={4}>
          {users.map((user) => (
            <Box key={user.email} bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={4}>
              <HStack justify="space-between" align={{ base: "start", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
                <Box>
                  <Text fontWeight="bold">{user.name || "User"}</Text>
                  <Text fontSize="sm" color={muted}>{user.email}</Text>
                </Box>
                <HStack>
                  <Badge colorScheme={user.isAdmin ? "green" : "blue"}>{user.isAdmin ? "admin" : "user"}</Badge>
                  <Button size="sm" colorScheme="red" variant="outline" onClick={() => removeUser(user.email)} isLoading={loading}>Remove</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}
