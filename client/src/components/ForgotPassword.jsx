import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from "../utils/api";
import {
  Box,
  VStack,
  Text,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useColorModeValue,
  FormErrorMessage,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()

  const validateEmail = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    setError(null)
    return true
  }

  const validateUserId = () => {
    if (!userId || userId.trim().length === 0) {
      setError('Please enter your user ID')
      return false
    }
    setError(null)
    return true
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail()) return
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/forgotPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const contentType = res.headers.get('content-type') || ''
      let parsed
      if (contentType.includes('application/json')) {
        parsed = await res.json()
      } else {
        parsed = { message: await res.text() }
      }

      if (!res.ok) {
        throw new Error(parsed.message || 'Request failed')
      }

      setMessage(parsed.message || 'If this email exists, a reset link has been sent.')
      setEmail('')
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserIdSubmit = async (e) => {
    e.preventDefault()
    if (!validateUserId()) return
    setIsLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/forgotPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const contentType = res.headers.get('content-type') || ''
      let parsed
      if (contentType.includes('application/json')) {
        parsed = await res.json()
      } else {
        parsed = { message: await res.text() }
      }

      if (!res.ok) {
        throw new Error(parsed.message || 'Request failed')
      }

      setMessage(parsed.message || 'If this user ID exists, a reset link has been sent.')
      setUserId('')
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="100vw" h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack
        spacing={6}
        w="full"
        maxW="md"
        p={8}
        borderRadius="xl"
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow="lg"
      >
        <VStack spacing={2} align="flex-start" w="full">
          <Text color="brand.600" fontSize="xs" fontWeight="bold">Secure Access</Text>
          <Heading size="lg">Forgot Password</Heading>
          <Text color="gray.500">Enter your email or user ID to receive password reset instructions.</Text>
        </VStack>

        {message && (
          <Box p={3} bg="green.50" color="green.700" borderRadius="md" w="full" textAlign="center">
            {message}
          </Box>
        )}

        <Tabs w="full" index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Email</Tab>
            <Tab>User ID</Tab>
          </TabList>

          <TabPanels>
            {/* Email Tab */}
            <TabPanel>
              <VStack as="form" onSubmit={handleEmailSubmit} spacing={4}>
                <FormControl isInvalid={error && activeTab === 0}>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                  {error && activeTab === 0 && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>

                <Button type="submit" colorScheme="purple" isLoading={isLoading} w="full">
                  Send Reset Link
                </Button>
              </VStack>
            </TabPanel>

            {/* User ID Tab */}
            <TabPanel>
              <VStack as="form" onSubmit={handleUserIdSubmit} spacing={4}>
                <FormControl isInvalid={error && activeTab === 1}>
                  <FormLabel>User ID</FormLabel>
                  <Input
                    placeholder="Enter your user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  {error && activeTab === 1 && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>

                <Button type="submit" colorScheme="purple" isLoading={isLoading} w="full">
                  Send Reset Link
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Button variant="link" onClick={() => navigate('/authentication/signin')}>
          Back to Sign In
        </Button>
      </VStack>
    </Box>
  )
}
