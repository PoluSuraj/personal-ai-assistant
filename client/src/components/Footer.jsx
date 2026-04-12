import {
    Box,
    Container,
    Stack,
    SimpleGrid,
    Text,
    Link,
    VisuallyHidden,
    useColorModeValue,
    IconButton,
    Input,
    Button,
    Heading,
    useToast,
} from '@chakra-ui/react';
import { FaLinkedin, FaInstagram, FaYoutube, FaFacebook, FaGithub, FaPaperPlane } from 'react-icons/fa';
import { useState } from 'react';
import { API_BASE_URL } from "../utils/api";

const SocialButton = ({ children, label, href }) => {
    return (
        <Box
            bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
            rounded={'full'}
            w={8}
            h={8}
            cursor={'pointer'}
            as={'a'}
            href={href}
            display={'inline-flex'}
            alignItems={'center'}
            justifyContent={'center'}
            transition={'background 0.3s ease'}
            _hover={{
                bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
            }}>
            <VisuallyHidden>{label}</VisuallyHidden>
            {children}
        </Box>
    );
};

const ListHeader = ({ children }) => {
    return (
        <Text fontWeight={'500'} fontSize={'lg'} mb={2} color={useColorModeValue("brand.600", "brand.300")}>
            {children}
        </Text>
    );
};

export default function Footer() {
    const bg = useColorModeValue('gray.50', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const inputBg = useColorModeValue('white', 'whiteAlpha.100');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSubscribe = async () => {
        if (!email || !email.includes('@')) {
            toast({
                title: 'Invalid email',
                description: 'Please enter a valid email address',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/contact/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: 'You have successfully subscribed!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setEmail('');
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to subscribe',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Network error. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            bg={bg}
            color={useColorModeValue('gray.700', 'gray.200')}
            borderTopWidth={1}
            borderStyle={'solid'}
            borderColor={borderColor}
            mt="auto"
            flexShrink={0}
        >
            <Container as={Stack} maxW={'6xl'} py={10}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
                    <Stack spacing={6}>
                        <Box>
                            <Heading size="md" bgGradient="linear(to-r, brand.400, purple.500)" bgClip="text" display="inline-block">
                                Personal AI Assistant
                            </Heading>
                            <Text fontSize={'sm'} mt={2}>
                                Your Personal AI Learning Assistant.
                                Empowering learners through intelligent, secure, and personalized education.
                            </Text>
                        </Box>
                        {/* <Stack direction={'row'} spacing={4}>
                            <SocialButton label={'YouTube'} href={'https://www.youtube.com/@imaadityajha'}>
                                <FaYoutube />
                            </SocialButton>
                            <SocialButton label={'Instagram'} href={'https://www.instagram.com/imaadityajha/'}>
                                <FaInstagram />
                            </SocialButton>
                            <SocialButton label={'Facebook'} href={'https://www.facebook.com/imaadityajhaa'}>
                                <FaFacebook />
                            </SocialButton>
                            <SocialButton label={'GitHub'} href={'https://github.com/imaadityajha'}>
                                <FaGithub />
                            </SocialButton>
                            <SocialButton label={'LinkedIn'} href={'https://www.linkedin.com/in/imaadityajha/'}>
                                <FaLinkedin />
                            </SocialButton>
                        </Stack> */}
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Product</ListHeader>
                        <Link href={'/chat'} _hover={{ color: 'brand.500' }}>AI Chat</Link>
                        <Link href={'/wikipedia-search'} _hover={{ color: 'brand.500' }}>Knowledge Base</Link>
                        <Link href={'/youtube-recommendation'} _hover={{ color: 'brand.500' }}>Video Recommendations</Link>
                        <Link href={'/quiz'} _hover={{ color: 'brand.500' }}>Quiz</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Support</ListHeader>
                        <Link href={'/contact-us'} _hover={{ color: 'brand.500' }}>Help Center</Link>
                        {/* <Link href={'#'} _hover={{ color: 'brand.500' }}>Help Center</Link> */}
                        <Link href={'/terms'} _hover={{ color: 'brand.500' }}>Terms of Service</Link>
                        <Link href={'#'} _hover={{ color: 'brand.500' }}>Legal</Link>
                        <Link href={'#'} _hover={{ color: 'brand.500' }}>Privacy Policy</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <ListHeader>Stay up to date</ListHeader>
                        <Stack direction={'row'}>
                            <Input
                                placeholder={'Your email address'}
                                bg={inputBg}
                                border={0}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
                                _focus={{
                                    bg: 'whiteAlpha.300',
                                }}
                            />
                            <IconButton
                                bg={'brand.400'}
                                color={'white'}
                                _hover={{
                                    bg: 'brand.500',
                                }}
                                isLoading={isLoading}
                                onClick={handleSubscribe}
                                aria-label="Subscribe"
                                icon={<FaPaperPlane />}
                            />
                        </Stack>
                    </Stack>
                </SimpleGrid>
            </Container>

            <Box
                borderTopWidth={1}
                borderStyle={'solid'}
                borderColor={useColorModeValue('gray.200', 'gray.700')}>
                <Container
                    as={Stack}
                    maxW={'6xl'}
                    py={4}
                    direction={{ base: 'column', md: 'row' }}
                    spacing={4}
                    justify={{ base: 'center', md: 'center' }} // Centered for cleaner look or space-between
                    align={{ base: 'center', md: 'center' }}>
                    <Text fontSize="sm">© {new Date().getFullYear()} Personal AI Assistant. All rights reserved.</Text>
                </Container>
            </Box>
        </Box>
    );
}
