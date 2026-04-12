import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Textarea,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Container,
  Flex,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from "../utils/api";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const inputBorder = useColorModeValue('gray.200', 'whiteAlpha.100');
  const brandGradient = 'linear(to-r, brand.600, brand.400)';
  const bgPage = useColorModeValue('linear(to-br, gray.50, brand.50)', 'gray.900');

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Failed to send message' });
        return;
      }

      setSuccessMessage('Thank you! Your message has been sent successfully. We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
            subject: '',
        message: '',
      });

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const ContactInfoCard = ({ icon, title, description }) => (
    <VStack
      bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
      backdropFilter="blur(20px)"
      p={6}
      borderRadius="2xl"
      border="1px solid"
      borderColor={useColorModeValue('whiteAlpha.500', 'whiteAlpha.100')}
      spacing={3}
      align="flex-start"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
    >
      <HStack spacing={3}>
        <Box color="brand.600" fontSize="lg">
          <Icon as={icon} boxSize={6} />
        </Box>
        <Heading size="sm">{title}</Heading>
      </HStack>
      <Text color="gray.500" fontSize="sm">
        {description}
      </Text>
    </VStack>
  );

  return (
    <Box w="100%" minH="100vh" bg={bgPage} pt={{ base: 6, lg: 12 }} pb={12}>
      {/* Back Button */}
      <Container maxW="6xl" mb={8} px={{ base: 4, md: 6 }}>
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          onClick={() => navigate('/')}
          _hover={{
            bg: useColorModeValue('brand.50', 'whiteAlpha.100'),
          }}
        >
          Back to Home
        </Button>
      </Container>

      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        {/* Header Section */}
        <VStack spacing={4} mb={12} textAlign="center">
          <Heading
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="900"
            letterSpacing="tight"
          >
            Get In Touch
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.500" maxW="xl">
            Have a question or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </Text>
        </VStack>

        {/* Main Content - Two Columns */}
        <Flex
          gap={8}
          mb={12}
          direction={{ base: 'column', lg: 'row' }}
          align="flex-start"
        >
          {/* Left - Contact Information */}
          <VStack
            flex={1}
            spacing={6}
            align="stretch"
          >
            <Heading size="lg" mb={4}>
              Contact Information
            </Heading>
            <ContactInfoCard
              icon={FaEnvelope}
              title="Email"
              description="21a91a0547@gmail.com"
            />
            <ContactInfoCard
              icon={FaMapMarkerAlt}
              title="Address"
              description="Aditya University, ADB Road, East Godavari, 533437 (AP State), India"
            />

            {/* Additional Info */}
            <Box
              bg={useColorModeValue('brand.50', 'whiteAlpha.100')}
              p={6}
              borderRadius="2xl"
              borderLeft="4px solid"
              borderColor="brand.600"
            >
              <Heading size="sm" mb={2}>
                Response Time
              </Heading>
              <Text color="gray.600" fontSize="sm">
                We typically respond to inquiries within 24-48 hours during business days.
              </Text>
            </Box>
          </VStack>

          {/* Right - Contact Form */}
          <VStack
            flex={1}
            as="form"
            onSubmit={handleSubmit}
            spacing={6}
            bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
            backdropFilter="blur(20px)"
            p={{ base: 5, md: 8 }}
            borderRadius="3xl"
            border="1px solid"
            borderColor={useColorModeValue('whiteAlpha.500', 'whiteAlpha.100')}
            boxShadow="lg"
            w="full"
          >
            {/* Success Message */}
            {successMessage && (
              <Box
                w="full"
                p={4}
                bg="green.50"
                color="green.700"
                borderRadius="xl"
                textAlign="center"
                fontSize="sm"
                fontWeight="medium"
                border="1px solid"
                borderColor="green.100"
              >
                {successMessage}
              </Box>
            )}

            {/* General Error */}
            {errors.general && (
              <Box
                w="full"
                p={4}
                bg="red.50"
                color="red.600"
                borderRadius="xl"
                textAlign="center"
                fontSize="sm"
                fontWeight="medium"
                border="1px solid"
                borderColor="red.100"
              >
                {errors.general}
              </Box>
            )}

            <Heading size="md" w="full">
              Send us a Message
            </Heading>

            {/* Name */}
            <FormControl isInvalid={errors.name} w="full">
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
                Full Name
              </FormLabel>
              <Input
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorder}
                fontSize="md"
                h="50px"
                borderRadius="xl"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                _hover={{
                  borderColor: 'gray.300',
                }}
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            {/* Email */}
            <FormControl isInvalid={errors.email} w="full">
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
                Email Address
              </FormLabel>
              <Input
                name="email"
                placeholder="name@example.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorder}
                fontSize="md"
                h="50px"
                borderRadius="xl"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                _hover={{
                  borderColor: 'gray.300',
                }}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            {/* Subject */}
            <FormControl isInvalid={errors.subject} w="full">
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
                Subject
              </FormLabel>
              <Input
                name="subject"
                placeholder="How can we help?"
                value={formData.subject}
                onChange={handleChange}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorder}
                fontSize="md"
                h="50px"
                borderRadius="xl"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                _hover={{
                  borderColor: 'gray.300',
                }}
              />
              <FormErrorMessage>{errors.subject}</FormErrorMessage>
            </FormControl>

            {/* Message */}
            <FormControl isInvalid={errors.message} w="full">
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">
                Message
              </FormLabel>
              <Textarea
                name="message"
                placeholder="Tell us what's on your mind..."
                value={formData.message}
                onChange={handleChange}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorder}
                fontSize="md"
                minH="150px"
                borderRadius="xl"
                _focus={{
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                }}
                _hover={{
                  borderColor: 'gray.300',
                }}
              />
              <FormErrorMessage>{errors.message}</FormErrorMessage>
            </FormControl>

            {/* Submit Button */}
            <Button
              type="submit"
              bgGradient={brandGradient}
              color="white"
              size="lg"
              w="full"
              h="50px"
              isLoading={isLoading}
              loadingText="Sending..."
              borderRadius="xl"
              boxShadow="lg"
              _hover={{
                bgGradient: 'linear(to-r, brand.500, brand.300)',
                transform: 'translateY(-2px)',
                boxShadow: 'xl',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              fontSize="md"
              fontWeight="bold"
              mt={4}
            >
              Send Message
            </Button>
          </VStack>
        </Flex>
      </Container>
    </Box>
  );
}
