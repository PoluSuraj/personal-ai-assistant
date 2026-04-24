import React from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowRight, FaBrain, FaCertificate, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const highlights = [
  {
    title: "Adaptive learning",
    description: "Build lessons, chat sessions, and revision paths around each learner's pace.",
    icon: FaBrain,
  },
  {
    title: "Protected assessments",
    description: "Keep quizzes focused with countdowns, instant review, and secure completion flow.",
    icon: FaShieldAlt,
  },
  {
    title: "Proof of progress",
    description: "Turn completed quizzes into downloadable certificates and answer packs.",
    icon: FaCertificate,
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.authSlice.userData);
  const pageBg = useColorModeValue("gray.50", "gray.950");
  const panelBg = useColorModeValue("rgba(255,255,255,0.86)", "rgba(17, 25, 40, 0.72)");
  const cardBg = useColorModeValue("white", "whiteAlpha.120");
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.160");
  const muted = useColorModeValue("gray.600", "gray.300");

  return (
    <Box minH="100dvh" bg={pageBg}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} minH="100dvh">
        <Flex position="relative" align="stretch" justify="center" overflow="hidden" minH={{ base: "52vh", lg: "100vh" }}>
          <Image
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop"
            alt="Learners collaborating with digital tools"
            objectFit="cover"
            w="full"
            h="full"
            position="absolute"
            inset="0"
          />
          <Box position="absolute" inset="0" bg="blackAlpha.600" />
          <Container maxW="lg" position="relative" zIndex={1} py={{ base: 12, lg: 20 }}>
            <VStack align="start" spacing={6} color="white" h="full" justify="center">
              <Text fontSize="sm" fontWeight="bold" letterSpacing="0.12em" textTransform="uppercase" color="whiteAlpha.800">
                Personal AI Assistant
              </Text>
              <Heading fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.05">
                Welcome to AI-Driven Smart Personalized Learning Assistant
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" maxW="md">
                Study, revise, test, and collect proof of progress from one focused workspace built around each learner.
              </Text>
              <HStack spacing={4} flexWrap="wrap">
                <Button
                  size="lg"
                  colorScheme="purple"
                  rightIcon={<FaArrowRight />}
                  onClick={() => navigate(user ? "/dashboard" : "/authentication/signup")}
                >
                  {user ? "Open dashboard" : "Sign Up"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="whiteAlpha.500"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={() => navigate(user ? "/dashboard" : "/authentication/login")}
                >
                  {user ? "Continue learning" : "Sign In"}
                </Button>
              </HStack>
            </VStack>
          </Container>
        </Flex>

        <Flex align="center" justify="center" px={{ base: 5, md: 10 }} py={{ base: 10, lg: 16 }}>
          <Container maxW="xl">
            <VStack align="stretch" spacing={8}>
              <Box
                bg={panelBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="2xl"
                boxShadow="xl"
                backdropFilter="blur(18px)"
                p={{ base: 6, md: 8 }}
              >
                <VStack align="start" spacing={4}>
                  <Heading size="lg">Start with the experience that fits you.</Heading>
                  <Text color={muted}>
                    Create an account for your own learning space or sign in to continue with saved chats, quizzes, certificates, and notifications.
                  </Text>
                  <HStack spacing={4} flexWrap="wrap">
                    <Button colorScheme="purple" onClick={() => navigate("/authentication/signup")}>
                      Create account
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/authentication/login")}>
                      Sign in
                    </Button>
                  </HStack>
                </VStack>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                {highlights.map((item) => (
                  <Box
                    key={item.title}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={cardBorder}
                    borderRadius="2xl"
                    p={6}
                    boxShadow="lg"
                  >
                    <VStack align="start" spacing={4}>
                      <Box
                        boxSize="48px"
                        borderRadius="xl"
                        bg="purple.500"
                        color="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <item.icon />
                      </Box>
                      <Heading size="sm">{item.title}</Heading>
                      <Text color={muted}>{item.description}</Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </Container>
        </Flex>
      </SimpleGrid>
    </Box>
  );
}
