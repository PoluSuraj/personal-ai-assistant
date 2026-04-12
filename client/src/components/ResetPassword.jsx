import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  useToast,
} from '@chakra-ui/react'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const toast = useToast()

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const validate = () => {
    const errors = {}

    if (!newPassword) {
      errors.password = 'Password is required'
    } else if (newPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.password = 'Password must include uppercase letter'
    } else if (!/[a-z]/.test(newPassword)) {
      errors.password = 'Password must include lowercase letter'
    } else if (!/[0-9]/.test(newPassword)) {
      errors.password = 'Password must include a number'
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      errors.password = 'Password must include special character (!@#$%^&*)'
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm your password'
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match'
    }

    setError(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || !token) return

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/resetPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const contentType = res.headers.get('content-type') || ''
      let parsed
      if (contentType.includes('application/json')) {
        parsed = await res.json()
      } else {
        parsed = { message: await res.text() }
      }

      if (!res.ok) {
        throw new Error(parsed.message || 'Password reset failed')
      }

      setMessage('Password reset successful! Redirecting to login...')
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setTimeout(() => {
        navigate('/authentication/signin')
      }, 2000)
    } catch (err) {
      setError({ submit: err.message || 'Network error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="100vw" h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack
        as="form"
        onSubmit={handleSubmit}
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
          <Heading size="lg">Reset Password</Heading>
          <Text color="gray.500">Enter your new password to regain access to your account.</Text>
        </VStack>

        {message && (
          <Box p={3} bg="green.50" color="green.700" borderRadius="md" w="full" textAlign="center">
            {message}
          </Box>
        )}

        {error?.submit && (
          <Box p={3} bg="red.50" color="red.700" borderRadius="md" w="full" textAlign="center">
            {error.submit}
          </Box>
        )}

        {!token && (
          <Box p={3} bg="red.50" color="red.700" borderRadius="md" w="full" textAlign="center">
            Invalid reset link. Please try again.
          </Box>
        )}

        <FormControl isInvalid={!!error?.password}>
          <FormLabel>New Password</FormLabel>
          <Input
            placeholder="Enter new password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            isDisabled={!token}
          />
          {error?.password && <FormErrorMessage>{error.password}</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={!!error?.confirm}>
          <FormLabel>Confirm Password</FormLabel>
          <Input
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isDisabled={!token}
          />
          {error?.confirm && <FormErrorMessage>{error.confirm}</FormErrorMessage>}
        </FormControl>

        <Button
          type="submit"
          colorScheme="purple"
          isLoading={isLoading}
          w="full"
          isDisabled={!token}
        >
          Reset Password
        </Button>

        <Button variant="link" onClick={() => navigate('/authentication/signin')}>
          Back to Sign In
        </Button>
      </VStack>
    </Box>
  )
}
