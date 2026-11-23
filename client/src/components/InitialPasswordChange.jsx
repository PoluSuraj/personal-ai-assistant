import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertIcon, Box, Button, Container, FormControl, FormLabel, Heading, Input, Text, VStack, useColorModeValue, useToast } from "@chakra-ui/react";
import { apiFetch } from "../utils/api";

export default function InitialPasswordChange() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(location.state?.email || "");
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");

  const submit = async (event) => {
    event.preventDefault();
    if (!email) {
      toast({ title: "Account email is missing", description: "Return to sign in and enter the email that received the setup message.", status: "error" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Passwords do not match", status: "error" });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/v1/users/complete-initial-password", {
        method: "POST",
        body: JSON.stringify({ email, ...form }),
      });
      toast({ title: "Password updated", description: "Sign in with your new password to continue.", status: "success", duration: 5000, isClosable: true });
      navigate("/authentication/login", { replace: true });
    } catch (error) {
      toast({ title: "Could not update password", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" minH="100dvh" display="flex" alignItems="center" py={8}>
      <Box as="form" onSubmit={submit} w="full" bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl" p={{ base: 6, md: 8 }} boxShadow="xl">
        <VStack align="stretch" spacing={5}>
          <Box>
            <Text color="teal.500" fontWeight="bold" fontSize="sm" textTransform="uppercase">First sign-in</Text>
            <Heading size="lg" mt={2}>Choose a new password</Heading>
            <Text mt={2} color="gray.500">Your administrator’s temporary password can only be used for this setup step.</Text>
          </Box>
          <Alert status="info" borderRadius="md"><AlertIcon />Use at least 8 characters with uppercase, lowercase, a number, and one of @$!%*?&.</Alert>
          <FormControl isRequired>
            <FormLabel>Account email</FormLabel>
            <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Temporary password</FormLabel>
            <Input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>New password</FormLabel>
            <Input type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Confirm new password</FormLabel>
            <Input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          </FormControl>
          <Button type="submit" colorScheme="teal" isLoading={loading}>Update password</Button>
        </VStack>
      </Box>
    </Container>
  );
}
