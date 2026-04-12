import { extendTheme } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const styles = {
    global: (props) => ({
        body: {
            bg: mode('gray.50', '#050505')(props), // Deeper black for dark mode
            color: mode('gray.800', 'whiteAlpha.900')(props),
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'background-color 0.2s',
            lineHeight: 'base',
        },
    }),
};

const colors = {
    gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },
    brand: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6', // Violet
        600: '#7c3aed', // Primary Brand Color
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
    },
    accent: {
        50: '#fff1f2',
        100: '#ffe4e6',
        500: '#f43f5e', // Rose
        600: '#e11d48',
    }
};

const components = {
    Button: {
        baseStyle: {
            fontWeight: 'bold',
            borderRadius: '12px',
        },
        variants: {
            solid: (props) => ({
                bg: mode('brand.500', 'brand.400')(props),
                color: 'white',
                _hover: {
                    bg: mode('brand.600', 'brand.500')(props),
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                },
                _active: {
                    bg: mode('brand.700', 'brand.600')(props),
                },
            }),
            outline: (props) => ({
                borderColor: mode('brand.500', 'brand.400')(props),
                color: mode('brand.500', 'brand.400')(props),
                _hover: {
                    bg: mode('brand.50', 'whiteAlpha.100')(props),
                },
            }),
            ghost: (props) => ({
                color: mode('brand.500', 'brand.400')(props),
                _hover: {
                    bg: mode('brand.50', 'whiteAlpha.100')(props),
                },
            }),
        },
    },
    Card: {
        baseStyle: (props) => ({
            container: {
                bg: mode('white', '#171717')(props),
                borderColor: mode('gray.200', 'whiteAlpha.100')(props),
                borderWidth: '1px',
                boxShadow: mode('md', 'none')(props),
                borderRadius: 'xl',
            },
        }),
    },
    Input: {
        variants: {
            filled: (props) => ({
                field: {
                    bg: mode('gray.100', 'whiteAlpha.50')(props),
                    _hover: {
                        bg: mode('gray.200', 'whiteAlpha.100')(props),
                    },
                    _focus: {
                        bg: mode('white', '#0a0a0a')(props),
                        borderColor: 'brand.500',
                    },
                },
            }),
        },
    },
};

const config = {
    initialColorMode: 'system',
    useSystemColorMode: true,
};

const theme = extendTheme({ config, styles, colors, components });

export default theme;
