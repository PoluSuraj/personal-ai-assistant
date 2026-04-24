import React from 'react';
import {
  Badge,
  Box,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCertificate, FaComments, FaMicrophoneAlt, FaClipboardList, FaWikipediaW, FaYoutube } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Features() {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardHover = useColorModeValue('gray.50', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const heroBg = useColorModeValue('linear(to-br, purple.50, white, teal.50)', 'linear(to-br, gray.900, purple.900, teal.900)');

  const sections = [
    { label: 'AI Chat', icon: FaComments, to: '/chat', description: 'Talk with the assistant, ask follow-up questions, and keep a guided learning conversation moving.', color: 'purple.500' },
    { label: 'Voice Assistant', icon: FaMicrophoneAlt, to: '/voice-assistant', description: 'Speak naturally in your language and get fast help without typing every question.', color: 'teal.500' },
    { label: 'Knowledge Base', icon: FaWikipediaW, to: '/wikipedia-search', description: 'Search quick summaries, topic explainers, and research-friendly reference material.', color: 'blue.500' },
    { label: 'YouTube Learning', icon: FaYoutube, to: '/youtube-recommendation', description: 'Open curated learning videos for the exact topic you are studying.', color: 'red.500' },
    { label: 'Protected Quiz', icon: FaClipboardList, to: '/quiz', description: 'Generate topic-based quizzes, stay inside the assessment flow, and submit with confidence.', color: 'orange.500' },
    { label: 'Certificates', icon: FaCertificate, to: '/quiz', description: 'Turn completed quizzes into colorful certificates and downloadable answer packs.', color: 'green.500' },
  ];

  return (
    <Container maxW="container.xl" py={12}>
      <VStack align="stretch" spacing={8}>
        <Box bgGradient={heroBg} borderRadius="3xl" p={{ base: 6, md: 10 }} borderWidth="1px" borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')} boxShadow="xl">
          <VStack align="start" spacing={4}>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">Platform capabilities</Badge>
            <Heading size="xl">Features built for learning, practice, voice help, and achievement</Heading>
            <Text fontSize="lg" color={muted} maxW="3xl">
              Explore the main experiences inside Personal AI Assistant. Each section is designed to help learners move from understanding, to testing, to proof of progress.
            </Text>
            <HStack spacing={6} flexWrap="wrap">
              <Text fontWeight="semibold">AI chat</Text>
              <Text fontWeight="semibold">Voice assistant</Text>
              <Text fontWeight="semibold">Secure quiz flow</Text>
              <Text fontWeight="semibold">Certificates</Text>
            </HStack>
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {sections.map((s) => (
            <Box
              key={s.label}
              bg={cardBg}
              borderWidth="1px"
              borderRadius="2xl"
              p={6}
              cursor="pointer"
              _hover={{ bg: cardHover, transform: 'translateY(-4px)', boxShadow: 'xl' }}
              transition="all 0.18s ease"
              onClick={() => navigate(s.to)}
            >
              <VStack align="start" spacing={4}>
                <Box boxSize="48px" borderRadius="xl" bg={s.color} color="white" display="flex" alignItems="center" justifyContent="center">
                  <Icon as={s.icon} boxSize={5} />
                </Box>
                <Heading size="md">{s.label}</Heading>
                <Text color={muted}>{s.description}</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
