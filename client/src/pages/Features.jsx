import React from 'react';
import {
  Container,
  Heading,
  Text,
  Grid,
  Box,
  Icon,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaComments, FaWikipediaW, FaYoutube, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Features() {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardHover = useColorModeValue('gray.50', 'gray.700');

  const sections = [
    { label: 'Chat', icon: FaComments, to: '/chat', description: 'Talk with the AI assistant in a conversational chat.' },
    { label: 'Knowledge Base', icon: FaWikipediaW, to: '/wikipedia-search', description: 'Search quick facts and summaries from Wikipedia.' },
    { label: 'YouTube', icon: FaYoutube, to: '/youtube-recommendation', description: 'Get curated video recommendations for study topics.' },
    { label: 'Quiz', icon: FaClipboardList, to: '/quiz', description: 'Practice with quick quizzes to test your knowledge.' },
  ];

  return (
    <Container maxW="container.lg" py={12}>
      <Heading mb={4}>Features</Heading>
      <Text fontSize="lg" color="gray.600" mb={8}>
        Explore the main sections of the Personal AI Assistant. Click any card to go there.
      </Text>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        {sections.map((s) => (
          <Box
            key={s.label}
            bg={cardBg}
            borderWidth="1px"
            borderRadius="md"
            p={6}
            cursor="pointer"
            _hover={{ bg: cardHover, transform: 'translateY(-4px)', boxShadow: 'md' }}
            transition="all 0.15s ease"
            onClick={() => navigate(s.to)}
          >
            <VStack align="start" spacing={3}>
              <Icon as={s.icon} boxSize={8} color="brand.500" />
              <Heading size="md">{s.label}</Heading>
              <Text color="gray.500">{s.description}</Text>
            </VStack>
          </Box>
        ))}
      </Grid>
    </Container>
  );
}
