import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
    const user = useSelector((state) => state.authSlice.userData);
    const bg = useColorModeValue('gray.50', 'gray.900');
    const scrollbarThumb = useColorModeValue('gray.300', 'gray.600');

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <Flex h="100dvh" flexDirection="row" overflow="hidden" position="relative" bg={bg}>
            <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg={bg}
                zIndex={0}
            />
            <Box
                position="absolute"
                top="-50%"
                left="-50%"
                right="-50%"
                bottom="-50%"
                bgGradient="radial(circle at 50% 50%, brand.900 0%, transparent 50%), radial(circle at 100% 0%, accent.600 0%, transparent 50%)"
                filter="blur(100px)"
                opacity={0.18}
                zIndex={0}
                animation="drift 20s infinite alternate"
                sx={{
                    '@keyframes drift': {
                        '0%': { transform: 'translate(0, 0) rotate(0deg)' },
                        '100%': { transform: 'translate(20px, 20px) rotate(2deg)' },
                    }
                }}
                pointerEvents="none"
            />
            <Box display={{ base: 'none', md: 'block' }} zIndex={20} flexShrink={0}>
                <Sidebar />
            </Box>
            <Flex flexDirection="column" flex="1" overflow="hidden" position="relative" zIndex={1} bg="transparent" minW={0} h="100dvh">
                <Navbar />
                <Box
                    flex="1"
                    minH={0}
                    overflowY="auto"
                    overflowX="hidden"
                    position="relative"
                    overscrollBehavior="contain"
                    css={{
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-track': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '24px' },
                    }}
                >
                    <Box minH="calc(100dvh - 60px)" display="flex" flexDirection="column">
                        <Box flex="1 0 auto">
                            <Outlet />
                        </Box>
                        <Footer />
                    </Box>
                </Box>
            </Flex>
        </Flex>
    );
};

export default Layout;
