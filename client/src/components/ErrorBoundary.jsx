import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box textAlign="center" py={10} px={6}>
                    <Heading as="h2" size="xl" mt={6} mb={2} color="red.500">
                        Something went wrong
                    </Heading>
                    <Text color={'gray.500'} mb={6}>
                        {this.state.error?.message || "An unexpected error occurred."}
                    </Text>
                    <Button
                        colorScheme="teal"
                        bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
                        color="white"
                        variant="solid"
                        onClick={() => window.location.href = '/'}
                    >
                        Go to Home
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
