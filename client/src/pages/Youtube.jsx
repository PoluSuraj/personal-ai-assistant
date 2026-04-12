import React, { useEffect, useState } from "react";
import {
  Flex,
  Box,
  Text,
  Select,
  Container,
  Heading,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  VStack,
  useColorModeValue,
  Badge,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { FaYoutube, FaSearch, FaPlayCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../utils/api";

const YouTube = () => {
  const [topic, setTopic] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const savedTopics = useSelector(state => state.chatTopic.topics || []);

  const cardBg = useColorModeValue("white", "gray.800");
  const headerBgGradient = useColorModeValue("linear(to-r, red.500, accent.600)", "linear(to-r, red.700, accent.700)");
  const cardBorder = useColorModeValue("gray.100", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const descColor = useColorModeValue("gray.600", "gray.400");
  const emptyBorder = useColorModeValue("gray.200", "gray.700");
  const emptyText = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    if (savedTopics.length > 0 && !topic) {
      setTopic(savedTopics[savedTopics.length - 1]);
    }
  }, [savedTopics, topic]);

  useEffect(() => {
    const query = (customQuery || topic).trim();
    if (!query) {
      setVideos([]);
      return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/youtube/search?query=${encodeURIComponent(`${query} education`)}`, { credentials: "include" });
        const data = await response.json();
        setVideos(data.success && Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchVideos, 500);
    return () => clearTimeout(debounceTimer);
  }, [topic, customQuery]);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" bgGradient={headerBgGradient} p={{ base: 6, md: 10 }} borderRadius="2xl" color="white" boxShadow="xl" position="relative" overflow="hidden">
          <Box position="absolute" top="-20px" right="-20px" boxSize="150px" bg="whiteAlpha.200" borderRadius="full" />
          <VStack align="start" spacing={2} mb={{ base: 6, md: 0 }} zIndex={1}>
            <Heading size="xl" display="flex" alignItems="center"><Icon as={FaYoutube} mr={4} />Video Learning Hub</Heading>
            <Text fontSize="lg" opacity={0.9} maxW="container.sm">Find practical lessons connected to your chat topics.</Text>
          </VStack>
          <VStack w={{ base: "full", md: "350px" }} spacing={4} zIndex={1}>
            <Select placeholder="Select Topic from Chat" value={topic} onChange={(e) => { setTopic(e.target.value); setCustomQuery(""); }} bg="white" color="gray.800" borderRadius="lg" size="lg" _focus={{ ring: 2, ringColor: "red.200" }} iconColor="gray.600">
              {savedTopics.map((t, index) => <option key={`${t}-${index}`} value={t}>{t}</option>)}
            </Select>
            <Flex align="center" width="100%" color="whiteAlpha.800"><Box flex={1} h="1px" bg="whiteAlpha.400" /><Text px={2} fontSize="xs" fontWeight="bold" textTransform="uppercase">OR Search</Text><Box flex={1} h="1px" bg="whiteAlpha.400" /></Flex>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none"><Icon as={FaSearch} color="gray.400" /></InputLeftElement>
              <Input placeholder="Search for any topic..." bg="white" color="gray.800" borderRadius="lg" value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} _placeholder={{ color: 'gray.400' }} />
            </InputGroup>
          </VStack>
        </Flex>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>{[1, 2, 3, 4, 5, 6].map((i) => <Box key={i} bg={cardBg} borderRadius="xl" overflow="hidden" boxShadow="md" p={4}><Skeleton height="200px" borderRadius="lg" mb={4} /><SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" /></Box>)}</SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {videos.length > 0 ? videos.map((video) => (
              <Box key={video.id?.videoId || video.etag} bg={cardBg} borderRadius="2xl" overflow="hidden" boxShadow="lg" transition="all 0.3s cubic-bezier(.25,.8,.25,1)" _hover={{ transform: "translateY(-8px)", boxShadow: "2xl" }} position="relative" role="group" borderWidth="1px" borderColor={cardBorder}>
                <Box position="relative" paddingBottom="56.25%" height="0"><iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} src={`https://www.youtube.com/embed/${video.id.videoId}`} title={video.snippet.title} frameBorder="0" allowFullScreen></iframe></Box>
                <Box p={5}>
                  <Badge colorScheme="red" mb={3} borderRadius="full" px={3} py={0.5} textTransform="uppercase" fontSize="xs" letterSpacing="wide">YouTube</Badge>
                  <Heading size="md" noOfLines={2} lineHeight="1.4" mb={2} color={titleColor}>{video.snippet.title}</Heading>
                  <Text fontSize="sm" color={descColor} noOfLines={3}>{video.snippet.description}</Text>
                </Box>
              </Box>
            )) : (
              <Flex direction="column" justify="center" align="center" gridColumn="1 / -1" h="300px" bg={cardBg} borderRadius="2xl" borderWidth="2px" borderStyle="dashed" borderColor={emptyBorder} textAlign="center" px={6}>
                <Icon as={FaPlayCircle} color="gray.300" mb={4} w={16} h={16} />
                <Heading size="md" color={emptyText} mb={2}>No videos found</Heading>
                <Text color="gray.500">Try selecting a different topic or searching for something new.</Text>
              </Flex>
            )}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default YouTube;
