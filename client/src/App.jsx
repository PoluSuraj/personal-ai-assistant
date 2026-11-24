import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { login, logout } from './store/authSlice';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import ErrorBoundary from './components/ErrorBoundary';
import { apiFetch, clearStoredAccessToken, getStoredAccessToken, getStoredSessionExpiry } from "./utils/api";
import { activateDeviceSession, clearDeviceSession, getDeviceProfile, hasDeviceSession, isDeviceStorageEnabled } from "./utils/deviceStorage";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.authSlice.userData);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    const cachedProfile = isDeviceStorageEnabled() ? getDeviceProfileFromTokenlessCache() : null;
    if (cachedProfile && hasDeviceSession(cachedProfile.email)) {
      dispatch(login(cachedProfile));
      setIsLoading(false);
      return;
    }
    if (isDeviceStorageEnabled()) {
      clearStoredAccessToken();
      if (cachedProfile && window.location.pathname !== "/") {
        navigate('/authentication/login', { replace: true, state: { sessionExpired: true } });
      }
      setIsLoading(false);
      return;
    }
    const hadSession = Boolean(getStoredAccessToken() || getStoredSessionExpiry());
    try {
      const data = await apiFetch('/api/v1/users/getCurrentUser', {
        method: 'GET',
      });
      if (isDeviceStorageEnabled()) activateDeviceSession(data.data);
      dispatch(login(data.data));
    } catch (error) {
      clearStoredAccessToken();
      console.error('Unable to fetch current user:', error);
      if (hadSession) navigate('/authentication/login', { replace: true, state: { sessionExpired: true } });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  useEffect(() => {
    if (!user?.email) return undefined;
    const checkSession = () => {
      const expired = isDeviceStorageEnabled()
        ? !hasDeviceSession(user.email)
        : !getStoredSessionExpiry() || getStoredSessionExpiry() <= Date.now();
      if (!expired) return;
      clearDeviceSession(user.email);
      clearStoredAccessToken();
      dispatch(logout());
      navigate('/authentication/login', { replace: true, state: { sessionExpired: true } });
    };
    checkSession();
    const interval = window.setInterval(checkSession, 5000);
    return () => window.clearInterval(interval);
  }, [dispatch, navigate, user?.email]);

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

function getDeviceProfileFromTokenlessCache() {
  const profileIndex = window.localStorage.getItem("paa_device_last_email");
  return profileIndex ? getDeviceProfile(profileIndex) : null;
}

export default App;
