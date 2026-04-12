import React, { useState, useEffect } from "react";
import {
  Flex,
  Box,
  Text,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Container,
  Heading,
  Icon,
  useColorModeValue,
  Button,
  Skeleton,
} from "@chakra-ui/react";
import { FaBook, FaSearch, FaExternalLinkAlt, FaGlobeAmericas } from "react-icons/fa";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../utils/api";

function Wikipedia() {
  const topics = useSelector((state) => state.chatTopic.topics || []);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const headerBgGradient = useColorModeValue("linear(to-r, blue.600, teal.400)", "linear(to-r, blue.800, teal.700)");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const titleColor = useColorModeValue("blue.700", "blue.300");
  const snippetColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[topics.length - 1]);
    }
  }, [topics, selectedTopic]);

  useEffect(() => {
    const query = (customQuery || selectedTopic).trim();
    if (!query) {
      setResults([]);
      return;
    }

    const fetchWikipediaResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/wikipedia/search?query=${encodeURIComponent(query)}`, { credentials: "include" });
        const data = await response.json();
        setResults(data.success && Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error fetching Wikipedia data:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchWikipediaResults, 500);
    return () => clearTimeout(debounceTimer);
  }, [selectedTopic, customQuery]);

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" bgGradient={headerBgGradient} p={{ base: 6, md: 10 }} borderRadius="2xl" color="white" boxShadow="xl" position="relative" overflow="hidden">
          <Icon as={FaGlobeAmericas} position="absolute" right="-20px" bottom="-20px" boxSize="180px" color="whiteAlpha.100" />
          <VStack align="start" spacing={2} mb={{ base: 6, md: 0 }} zIndex={1}>
            <Heading size="xl" display="flex" alignItems="center"><Icon as={FaBook} mr={4} />Knowledge Base</Heading>
            <Text fontSize="lg" opacity={0.9}>Search reliable starting points for your learning topics.</Text>
          </VStack>
          <VStack w={{ base: "full", md: "40%" }} spacing={4} zIndex={1}>
            <Select placeholder="Select Topic from Chat" value={selectedTopic} onChange={(e) => { setSelectedTopic(e.target.value); setCustomQuery(""); }} bg="white" color="gray.800" borderRadius="lg" size="lg" _focus={{ ring: 2, ringColor: "blue.200" }} iconColor="gray.600">
              {topics.map((topic, index) => <option key={`${topic}-${index}`} value={topic}>{topic}</option>)}
            </Select>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none"><Icon as={FaSearch} color="gray.400" /></InputLeftElement>
              <Input placeholder="Search Wikipedia..." bg="white" color="gray.800" borderRadius="lg" value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} _placeholder={{ color: 'gray.400' }} />
            </InputGroup>
          </VStack>
        </Flex>

        {loading ? (
          <VStack spacing={4}>
            {[1, 2, 3].map(i => <Box key={i} w="full" bg={cardBg} p={6} borderRadius="xl" boxShadow="sm"><Skeleton height="30px" w="40%" mb={4} /><Skeleton height="15px" w="90%" mb={2} /><Skeleton height="15px" w="80%" mb={2} /><Skeleton height="15px" w="60%" /></Box>)}
          </VStack>
        ) : results.length > 0 ? (
          <VStack spacing={6} align="stretch">
            {results.map((article) => (
              <Box key={article.pageid} p={6} bg={cardBg} borderRadius="2xl" boxShadow="md" transition="all 0.2s ease-in-out" _hover={{ transform: "translateY(-4px)", boxShadow: "xl", borderColor: "blue.400" }} borderWidth="1px" borderColor={borderColor} borderLeftWidth="4px" borderLeftColor="blue.500" position="relative">
                <Flex justify="space-between" align="start" gap={4}>
                  <Heading size="md" mb={2} color={titleColor}>{article.title}</Heading>
                  <Button as="a" href={`https://en.wikipedia.org/?curid=${article.pageid}`} target="_blank" rel="noreferrer" rightIcon={<FaExternalLinkAlt />} size="sm" colorScheme="blue" variant="ghost">Read</Button>
                </Flex>
                <Text fontSize="md" color={snippetColor} noOfLines={3} mt={2} lineHeight="tall" dangerouslySetInnerHTML={{ __html: article.snippet }} />
              </Box>
            ))}
          </VStack>
        ) : (
          <Flex direction="column" align="center" justify="center" py={16} bg={cardBg} borderRadius="2xl" borderWidth="1px" borderStyle="dashed" borderColor={borderColor} textAlign="center" px={6}>
            <Icon as={FaBook} boxSize={12} color="gray.300" mb={4} />
            <Text fontSize="lg" color="gray.500" fontWeight="medium">Start exploring by selecting a topic or searching above.</Text>
          </Flex>
        )}
      </VStack>
    </Container>
  );
}

export default Wikipedia;
