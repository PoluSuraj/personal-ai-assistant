import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  HStack,
  useColorModeValue,
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { getHealth } from "../utils/api";
import { API_BASE_URL } from "../utils/api";

function LoginSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const userdata = useSelector((state) => state.authSlice.userData);
  const { type } = useParams();
  const [isSignUp, setIsSignUp] = useState(type === "signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [backendInfo, setBackendInfo] = useState(null);

  useEffect(() => {
    if (userdata) {
      navigate("/");
    }
  }, [userdata, navigate]);

  useEffect(() => {
    setIsSignUp(type === "signup");
  }, [type]);

  useEffect(() => {
    getHealth()
      .then(setBackendInfo)
      .catch(() => setBackendInfo(null));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (isSignUp && !formData.name.trim()) {
      newErrors.name = "Full Name is required";
    }
    if (isSignUp) {
      if (!formData.email.includes("@") || !formData.email.includes(".")) {
        newErrors.email = "Invalid email format";
      }
    } else if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = "Email or Username is required";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const fillDemoAccount = () => {
    setIsSignUp(false);
    setFormData({ name: "Demo Learner", email: "demo@local.test", password: "Password@123" });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const endpoint = isSignUp ? `${API_BASE_URL}/api/v1/users/register` : `${API_BASE_URL}/api/v1/users/login`;
    const body = isSignUp
      ? { name: formData.name, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        setErrors({ general: data.message || "Operation failed" });
        return;
      }

      navigate(`/otpVerification/${data.data?.email || formData.email}`, {
        state: { devOtp: data.data?.devOtp, message: data.message },
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const inputBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const panelBg = useColorModeValue("rgba(255, 255, 255, 0.88)", "rgba(26, 32, 44, 0.88)");
  const panelBorder = useColorModeValue("whiteAlpha.500", "whiteAlpha.100");

  return (
    <Flex w="100%" minH="100dvh" overflow="hidden" direction={{ base: "column", lg: "row" }}>
      <Box
        display={{ base: "flex", lg: "flex" }}
        w={{ base: "100%", lg: "50%" }}
        minH={{ base: "220px", lg: "100dvh" }}
        bgImage="url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop')"
        bgSize="cover"
        bgPos="center"
        position="relative"
        alignItems="center"
        justifyContent="center"
        px={{ base: 4, md: 8 }}
        py={{ base: 8, lg: 12 }}
      >
        <Box position="absolute" inset="0" bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <VStack position="relative" zIndex={1} spacing={{ base: 4, md: 8 }} textAlign="center" color="white" w="full" maxW="lg">
          <Box
            p={{ base: 5, md: 8 }}
            bg="whiteAlpha.100"
            backdropFilter="blur(20px)"
            borderRadius="2xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="2xl"
          >
            <Heading fontSize={{ base: "3xl", md: "5xl" }} fontWeight="800" lineHeight="1.1" mb={4}>
              {isSignUp ? "Join the Future." : "Welcome Back."}
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.800" fontWeight="medium">
              {isSignUp
                ? "Create your account and start your professional journey with AI-powered training."
                : "Sign in to access your personalized dashboard and continue your progress."}
            </Text>
          </Box>
        </VStack>
      </Box>

      <Flex
        w={{ base: "100%", lg: "50%" }}
        minH={{ base: "calc(100dvh - 220px)", lg: "100dvh" }}
        align="center"
        justify="center"
        px={{ base: 4, sm: 6, md: 8 }}
        py={{ base: 6, md: 10 }}
        bg={useColorModeValue("linear(to-br, gray.50, brand.50)", "gray.900")}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-10%" right="-10%" w={{ base: "260px", md: "500px" }} h={{ base: "260px", md: "500px" }} bgGradient="radial(brand.200, transparent 60%)" opacity={0.4} filter="blur(80px)" animation="pulse 10s infinite alternate" />
        <Box position="absolute" bottom="-10%" left="-10%" w={{ base: "220px", md: "400px" }} h={{ base: "220px", md: "400px" }} bgGradient="radial(accent.200, transparent 60%)" opacity={0.3} filter="blur(80px)" animation="pulse 15s infinite alternate-reverse" />

        <VStack
          w="full"
          maxW="520px"
          p={{ base: 5, sm: 7, md: 10 }}
          spacing={{ base: 6, md: 8 }}
          bg={panelBg}
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          boxShadow="2xl"
          border="1px solid"
          borderColor={panelBorder}
          as="form"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          zIndex={1}
          align="stretch"
        >
          <VStack spacing={3} w="full" align="flex-start">
            <Text color="brand.600" fontWeight="bold" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
              {isSignUp ? "Start for free" : "Secure Access"}
            </Text>
            <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="900" letterSpacing="tight">
              {isSignUp ? "Create Account" : "Sign In to Personal AI Assistant"}
            </Heading>
            <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>
              {isSignUp ? "Enter your details below to create your account" : "Enter your email and password to access your account"}
            </Text>
          </VStack>

          {backendInfo?.mode === "demo" && (
            <VStack w="full" align="stretch" spacing={3} p={4} bg="green.50" color="green.800" border="1px solid" borderColor="green.100" borderRadius="xl">
              <HStack justify="space-between" flexWrap="wrap">
                <Text fontWeight="bold">Demo mode is ready</Text>
                <Badge colorScheme="green">OTP 123456</Badge>
              </HStack>
              <Text fontSize="sm">MongoDB is not reachable from this network yet, so the app is running locally with a demo account.</Text>
              <Button size="sm" colorScheme="green" variant="outline" onClick={fillDemoAccount}>Use demo login</Button>
            </VStack>
          )}

          {errors.general && (
            <Box w="full" p={4} bg="red.50" color="red.600" borderRadius="xl" textAlign="center" fontSize="sm" fontWeight="medium" border="1px solid" borderColor="red.100">
              {errors.general}
            </Box>
          )}

          <VStack spacing={5} w="full" align="stretch">
            {isSignUp && (
              <FormControl isInvalid={errors.name}>
                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Full Name</FormLabel>
                <Input name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} bg={inputBg} border="1px solid" borderColor={inputBorder} fontSize="md" h="50px" borderRadius="xl" _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }} _hover={{ borderColor: "gray.300" }} />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
            )}

            <FormControl isInvalid={errors.email}>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">{isSignUp ? "Email Address" : "Email or Username"}</FormLabel>
              <Input name="email" placeholder={isSignUp ? "name@example.com" : "you@example.com"} value={formData.email} onChange={handleChange} bg={inputBg} border="1px solid" borderColor={inputBorder} fontSize="md" h="50px" borderRadius="xl" _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }} _hover={{ borderColor: "gray.300" }} />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.password}>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Password</FormLabel>
              <Input name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} bg={inputBg} border="1px solid" borderColor={inputBorder} fontSize="md" h="50px" borderRadius="xl" _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }} _hover={{ borderColor: "gray.300" }} />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>
          </VStack>

          <VStack spacing={4} align="stretch">
            {!isSignUp && (
              <Text textAlign="right" color="brand.500" fontWeight="semibold" cursor="pointer" fontSize="sm" onClick={() => navigate("/forgot-password")}>Forgot Password?</Text>
            )}
            <Button type="submit" isLoading={isLoading} colorScheme="purple" size="lg" h="52px" borderRadius="xl">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </VStack>

          <Divider />

          <HStack justify="center" spacing={1} flexWrap="wrap">
            <Text color="gray.500" fontSize="sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <Text color="brand.500" fontWeight="bold" cursor="pointer" onClick={() => navigate(`/authentication/${isSignUp ? "login" : "signup"}`)}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </HStack>
        </VStack>
      </Flex>
    </Flex>
  );
}

export default LoginSignup;
