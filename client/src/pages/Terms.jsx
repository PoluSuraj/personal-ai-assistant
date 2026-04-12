import React from 'react'
import { Box, Container, Heading, Text, Stack, List, ListItem } from '@chakra-ui/react'

export default function Terms() {
  return (
    <Box py={10} px={4}>
      <Container maxW={'4xl'}>
        <Heading as="h1" size="lg" mb={4}>
          AI-Driven Smart Personalized Learning Assistant — Terms of Service
        </Heading>

        <Stack spacing={4}>
          <Box>
            <Heading as="h2" size="md" mb={2}>
              1. Acceptance of Terms
            </Heading>
            <Text>
              By accessing and using this platform, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use the platform.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              2. Description of Service
            </Heading>
            <Text mb={2}>The AI-Driven Smart Personalized Learning Assistant provides:</Text>
            <List spacing={1} pl={6}>
              <ListItem>AI-based learning assistance</ListItem>
              <ListItem>Quiz generation and evaluation</ListItem>
              <ListItem>Educational resource recommendations</ListItem>
              <ListItem>Secure OTP-based authentication</ListItem>
              <ListItem>Personalized learning features</ListItem>
            </List>
            <Text mt={2}>This platform is intended for educational purposes only.</Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              3. User Responsibilities
            </Heading>
            <Text>
              Users agree to provide accurate registration information, maintain the confidentiality of their login credentials, use the platform for lawful and educational purposes only, not attempt unauthorized access to system resources, and not misuse AI features for harmful or unethical purposes.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              4. Account Security
            </Heading>
            <Text>
              Users are responsible for maintaining the security of their account. The platform uses OTP-based authentication and JWT session management to enhance security; however, users must also ensure their credentials are protected.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              5. Intellectual Property
            </Heading>
            <Text>
              All content, design, and functionality of this platform are the intellectual property of the project developers. Users may not copy, reproduce, or redistribute platform content without permission.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              6. Limitation of Liability
            </Heading>
            <Text>
              The platform provides AI-generated responses for educational assistance. While efforts are made to ensure accuracy, the system does not guarantee complete correctness of information. Users are advised to verify critical information independently.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              7. Data Usage
            </Heading>
            <Text>
              User data is stored securely for authentication and personalization purposes. The platform does not sell or share user data with third parties.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              8. Modifications to Service
            </Heading>
            <Text>
              The developers reserve the right to modify or update features, functionality, or these terms at any time.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              9. Termination
            </Heading>
            <Text>
              The platform reserves the right to suspend or terminate accounts that violate these terms or engage in misuse of the system.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="md" mb={2}>
              10. Contact Information
            </Heading>
            <Text>
              For any questions regarding these Terms of Service, users may contact the development team through the Contact page.
            </Text>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
