import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { login } from './store/authSlice';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import ErrorBoundary from './components/ErrorBoundary';
import { API_BASE_URL } from "./utils/api";

function App() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/getCurrentUser`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) return;

      const data = await res.json();
      dispatch(login(data.data));
    } catch (error) {
      console.error('Unable to fetch current user:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  if (isLoading) {
    return (
      <Flex h="100vh" w="100vw" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="xl" fontWeight="semibold">Preparing your workspace...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}

export default App;
