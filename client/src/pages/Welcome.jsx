import React from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaArrowRight, FaBrain, FaCertificate, FaShieldAlt, FaUserGraduate } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const highlights = [
  {
    title: "Adaptive learning",
    description: "Build lessons, chat sessions, and revision paths around each learner's pace.",
    icon: FaBrain,
    color: "teal.500",
  },
  {
    title: "Protected assessments",
    description: "Keep quizzes focused with countdowns, instant review, and secure completion flow.",
    icon: FaShieldAlt,
    color: "orange.500",
  },
  {
    title: "Certificates and proof",
    description: "Turn completed quizzes into polished certificates and answer packs you can download anytime.",
    icon: FaCertificate,
    color: "purple.500",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.authSlice.userData);
  const pageBg = useColorModeValue("gray.50", "gray.950");
  const panelBg = useColorModeValue("rgba(255,255,255,0.88)", "rgba(17, 25, 40, 0.76)");
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(255,255,255,0.06)");
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.160");
  const muted = useColorModeValue("gray.600", "gray.300");
  const statBg = useColorModeValue("whiteAlpha.800", "blackAlpha.300");

  return (
    <Box minH="100dvh" bg={pageBg} overflow="hidden">
      <Box position="absolute" inset="0" pointerEvents="none">
        <Box position="absolute" top="-10%" left="-10%" boxSize={{ base: "240px", md: "420px" }} bg="teal.300" opacity="0.18" filter="blur(120px)" />
        <Box position="absolute" bottom="-10%" right="-10%" boxSize={{ base: "260px", md: "460px" }} bg="purple.300" opacity="0.18" filter="blur(140px)" />
      </Box>

      <SimpleGrid columns={{ base: 1, xl: 2 }} minH="100dvh" position="relative">
        <Flex position="relative" align="stretch" justify="center" overflow="hidden" minH={{ base: "58vh", xl: "100vh" }}>
          <Image
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1800&auto=format&fit=crop"
            alt="Focused student learning with digital resources"
            objectFit="cover"
            w="full"
            h="full"
            position="absolute"
            inset="0"
          />
          <Box position="absolute" inset="0" bg="linear-gradient(135deg, rgba(12,18,30,0.88), rgba(76,29,149,0.62))" />
          <Container maxW="2xl" position="relative" zIndex={1} py={{ base: 12, md: 20 }} px={{ base: 5, md: 10 }}>
            <VStack align="start" spacing={{ base: 5, md: 7 }} color="white" h="full" justify="center">
              <Badge colorScheme="whiteAlpha" px={4} py={1} borderRadius="full" fontSize="0.85rem">
                Personal AI Assistant
              </Badge>
              <VStack align="start" spacing={2} maxW="4xl">
                <Heading fontSize={{ base: "5xl", md: "7xl", xl: "8xl" }} lineHeight="0.92" maxW="3xl">
                  Welcome
                </Heading>
                <Heading fontSize={{ base: "md", md: "xl", xl: "2xl" }} lineHeight="1.1" fontWeight="700" color="whiteAlpha.900" maxW="2xl">
                  AI-Driven Smart Personalized Learning Assistant
                </Heading>
              </VStack>
              <Text fontSize={{ base: "md", md: "xl" }} color="whiteAlpha.900" maxW="2xl">
                Learn with guided AI support, practice with secure quizzes, and leave every session with sharper skills and visible progress.
              </Text>
              <HStack spacing={4} flexWrap="wrap">
                <Button
                  size="lg"
                  colorScheme="purple"
                  rightIcon={<FaArrowRight />}
                  px={8}
                  onClick={() => navigate(user ? "/dashboard" : "/authentication/signup")}
                >
                  {user ? "Open Dashboard" : "Sign Up"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="whiteAlpha.500"
                  color="white"
                  px={8}
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={() => navigate(user ? "/dashboard" : "/authentication/login")}
                >
                  {user ? "Continue Learning" : "Sign In"}
                </Button>
              </HStack>
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} w="full" pt={2}>
                <Box bg={statBg} borderRadius="2xl" p={4} backdropFilter="blur(16px)">
                  <Text fontSize="sm" color="whiteAlpha.700">Smart sessions</Text>
                  <Heading size="md">AI guided</Heading>
                </Box>
                <Box bg={statBg} borderRadius="2xl" p={4} backdropFilter="blur(16px)">
                  <Text fontSize="sm" color="whiteAlpha.700">Assessments</Text>
                  <Heading size="md">Protected</Heading>
                </Box>
                <Box bg={statBg} borderRadius="2xl" p={4} backdropFilter="blur(16px)">
                  <Text fontSize="sm" color="whiteAlpha.700">Progress</Text>
                  <Heading size="md">Certified</Heading>
                </Box>
              </SimpleGrid>
            </VStack>
          </Container>
        </Flex>

        <Flex align="center" justify="center" px={{ base: 5, md: 8, xl: 10 }} py={{ base: 10, xl: 16 }}>
          <Container maxW="lg">
            <VStack align="stretch" spacing={5}>
              <Box
                bg={panelBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="3xl"
                boxShadow="2xl"
                backdropFilter="blur(18px)"
                p={{ base: 4, md: 5 }}
              >
                <Stack direction={{ base: "column", md: "row" }} spacing={{ base: 4, md: 4 }} align="center" justify="space-between">
                  <VStack align={{ base: "center", md: "start" }} textAlign={{ base: "center", md: "left" }} spacing={2} maxW="sm">
                    <Badge colorScheme="purple" borderRadius="full" px={3} py={1} fontSize="0.68rem">Start here</Badge>
                    <Heading fontSize={{ base: "lg", md: "xl" }} lineHeight="1.14">
                      One workspace for learning, testing, and achievement.
                    </Heading>
                    <Text color={muted} fontSize={{ base: "sm", md: "sm" }} lineHeight="1.65">
                      Create your account for a personal training space, or sign in to continue with saved chats, secure quizzes, notifications, and downloadable certificates.
                    </Text>
                  </VStack>
                  <Box
                    boxSize={{ base: "56px", md: "64px" }}
                    borderRadius="xl"
                    bg="purple.500"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="xl"
                    flexShrink={0}
                  >
                    <Icon as={FaUserGraduate} boxSize={5} />
                  </Box>
                </Stack>
                <HStack spacing={3} flexWrap="wrap" mt={4}>
                  <Button colorScheme="purple" size="sm" onClick={() => navigate("/authentication/signup")}>
                    Create account
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/authentication/login")}>
                    Sign in
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(user ? "/voice-assistant" : "/authentication/login")}>
                    Voice assistant
                  </Button>
                </HStack>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {highlights.map((item) => (
                  <Box
                    key={item.title}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={cardBorder}
                    borderRadius="2xl"
                    p={{ base: 4, md: 4 }}
                    boxShadow="lg"
                  >
                    <VStack align="start" spacing={3}>
                      <Box
                        boxSize="40px"
                        borderRadius="xl"
                        bg={item.color}
                        color="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="lg"
                      >
                        <item.icon size={16} />
                      </Box>
                      <Heading fontSize={{ base: "sm", md: "md" }} lineHeight="1.25">{item.title}</Heading>
                      <Text color={muted} fontSize="xs" lineHeight="1.65">{item.description}</Text>
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
