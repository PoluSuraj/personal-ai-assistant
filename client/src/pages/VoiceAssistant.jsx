import React from "react";
import { Box, Container, Heading, Text, VStack, Badge } from "@chakra-ui/react";
import ChatBox from "../components/ChatBox";

export default function VoiceAssistant() {
  return (
    <Box h="100%" w="100%">
      <Container maxW="container.xl" py={6} h="100%" display="flex" flexDirection="column">
        <VStack align="start" spacing={3} mb={4}>
          <Badge colorScheme="purple" px={3} py={1} borderRadius="full">Voice assistant</Badge>
          <Heading size="lg">Speak directly and get help instantly</Heading>
          <Text color="gray.500">
            Choose your language, start speaking, and let the assistant help with learning, quizzes, planning, and troubleshooting in a more natural way.
          </Text>
        </VStack>
        <Box flex="1" minH={0} borderRadius="2xl" overflow="hidden">
          <ChatBox voiceMode />
        </Box>
      </Container>
    </Box>
  );
}
