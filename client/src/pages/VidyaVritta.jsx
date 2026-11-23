import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FaBookOpen, FaChevronDown, FaHeart, FaPlay, FaSearch } from "react-icons/fa";
import { apiFetch } from "../utils/api";

const suggestions = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Coding", "Study skills"];
const SAVED_KEY = "paa_vidyavritta_saved";

const readSaved = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((item) => item?.id?.videoId && item?.snippet?.title) : [];
  } catch {
    return [];
  }
};

export default function VidyaVritta() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [reels, setReels] = useState([]);
  const [savedReels, setSavedReels] = useState(readSaved);
  const [savedOnly, setSavedOnly] = useState(false);
  const [playingId, setPlayingId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsYoutubeKey, setNeedsYoutubeKey] = useState(false);
  const feedRef = useRef(null);
  const toast = useToast();
  const textColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.600", "gray.300");
  const panel = useColorModeValue("gray.100", "#171a1d");
  const dashedBorder = useColorModeValue("gray.300", "whiteAlpha.300");

  useEffect(() => {
    if (!submittedQuery) return undefined;
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");
    setNeedsYoutubeKey(false);
    setPlayingId("");
    apiFetch(`/api/v1/youtube/search?format=study-short&query=${encodeURIComponent(`${submittedQuery} educational short lesson`)}`, { signal: controller.signal })
      .then((result) => {
        setReels(result.fallback ? [] : (Array.isArray(result.data) ? result.data : []));
        setNeedsYoutubeKey(Boolean(result.fallback));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message || "Could not load study videos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [submittedQuery]);

  const savedIds = savedReels.map((reel) => reel.id.videoId);
  const visibleReels = savedOnly ? savedReels : reels;

  const search = (value = query) => {
    const cleanQuery = value.trim();
    if (!cleanQuery) return;
    setQuery(cleanQuery);
    setSubmittedQuery(cleanQuery);
    setSavedOnly(false);
    feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSaved = (reel) => {
    const videoId = reel.id.videoId;
    const next = savedIds.includes(videoId) ? savedReels.filter((item) => item.id.videoId !== videoId) : [reel, ...savedReels];
    setSavedReels(next);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    toast({ title: next.includes(videoId) ? "Saved to your study shelf" : "Removed from your study shelf", status: "success", duration: 1800, isClosable: true });
  };

  const moveNext = () => feedRef.current?.scrollBy({ top: feedRef.current.clientHeight * 0.8, behavior: "smooth" });

  return (
    <Box minH="100%" bg={useColorModeValue("gray.50", "#101214")} color={textColor}>
      <Container maxW="container.xl" py={{ base: 5, md: 8 }}>
        <VStack align="stretch" spacing={5}>
          <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <HStack spacing={3} mb={1}>
                <Icon as={FaBookOpen} color="teal.400" boxSize={5} />
                <Heading size="lg">VidyaVritta</Heading>
                <Badge colorScheme="teal">Study shorts</Badge>
              </HStack>
              <Text color={muted}>A stream of quick lessons, chosen for learning.</Text>
            </Box>
            <Button variant={savedOnly ? "solid" : "outline"} colorScheme="pink" leftIcon={<Icon as={FaHeart} />} onClick={() => setSavedOnly((value) => !value)}>
              {savedOnly ? "All lessons" : `Study shelf (${savedIds.length})`}
            </Button>
          </Flex>

          <HStack spacing={3} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none"><Icon as={FaSearch} color={muted} /></InputLeftElement>
              <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="Find a short lesson: algebra, photosynthesis, Python…" bg={panel} borderRadius="md" aria-label="Search study shorts" />
            </InputGroup>
            <Button colorScheme="teal" onClick={() => search()} isDisabled={!query.trim()}>Search</Button>
          </HStack>

          <HStack spacing={2} overflowX="auto" pb={1}>
            {suggestions.map((item) => <Button key={item} size="sm" flexShrink={0} variant="outline" borderRadius="full" onClick={() => search(item)}>{item}</Button>)}
          </HStack>

          {errorMessage ? <Alert status="error" borderRadius="md"><AlertIcon />{errorMessage}</Alert> : null}
          {needsYoutubeKey ? <Alert status="info" borderRadius="md"><AlertIcon />Study shorts need YouTube search configured on the service. No unrelated demo clips are shown.</Alert> : null}

          {isLoading ? (
            <Flex minH="380px" align="center" justify="center" gap={3}><Spinner color="teal.400" /><Text>Finding study shorts for {submittedQuery}…</Text></Flex>
          ) : visibleReels.length ? (
            <Flex gap={{ base: 3, md: 6 }} align="stretch" justify="center">
              <Box ref={feedRef} flex="1" maxW="760px" maxH={{ base: "70dvh", md: "76dvh" }} minH="430px" overflowY="auto" scrollSnapType="y mandatory" overscrollBehaviorY="contain" onScroll={() => setPlayingId("")}>
                <VStack align="stretch" spacing={4}>
                  {visibleReels.map((reel) => {
                    const videoId = reel.id.videoId;
                    const title = reel.snippet.title;
                    const thumbnail = reel.snippet.thumbnails?.high?.url || reel.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    const isSaved = savedIds.includes(videoId);
                    return (
                      <Flex key={videoId} minH={{ base: "70dvh", md: "76dvh" }} maxH={{ base: "70dvh", md: "76dvh" }} scrollSnapAlign="start" justify="center" align="stretch" gap={4}>
                        <Box position="relative" w="full" maxW="430px" h="full" aspectRatio="9 / 16" bg="#101214" overflow="hidden" borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
                          {playingId === videoId ? (
                            <Box as="iframe" title={title} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`} position="absolute" inset={0} w="100%" h="100%" border={0} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                          ) : (
                            <>
                              <Box position="absolute" inset={0} bgImage={`url("${thumbnail}")`} bgSize="cover" bgPosition="center" />
                              <Box position="absolute" inset={0} bg="linear-gradient(180deg, rgba(0,0,0,.08) 35%, rgba(0,0,0,.88) 100%)" />
                              <IconButton aria-label={isSaved ? "Remove from study shelf" : "Save to study shelf"} icon={<Icon as={FaHeart} />} position="absolute" top={3} right={3} color={isSaved ? "pink.300" : "white"} bg="blackAlpha.600" _hover={{ bg: "blackAlpha.800" }} onClick={() => toggleSaved(reel)} />
                              <Button aria-label={`Play ${title}`} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" w="64px" h="64px" minW="64px" borderRadius="full" color="white" bg="teal.500" _hover={{ bg: "teal.400", transform: "translate(-50%, -50%) scale(1.06)" }} onClick={() => setPlayingId(videoId)}><Icon as={FaPlay} /></Button>
                              <Box position="absolute" left={4} right={4} bottom={4} color="white">
                                <Badge colorScheme="teal" mb={2}>EDUCATION</Badge>
                                <Heading size="sm" noOfLines={3}>{title}</Heading>
                                <Text mt={2} fontSize="xs" noOfLines={2} color="whiteAlpha.800">{reel.snippet.description || "A quick lesson for your study session."}</Text>
                              </Box>
                            </>
                          )}
                        </Box>
                        <IconButton display={{ base: "none", sm: "flex" }} alignSelf="end" aria-label="Next lesson" icon={<Icon as={FaChevronDown} />} variant="outline" onClick={moveNext} />
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
              <VStack display={{ base: "none", lg: "flex" }} align="stretch" w="250px" spacing={4} pt={2}>
                <Heading size="sm">For your next study break</Heading>
                <Text color={muted} fontSize="sm">Search another school topic or save a lesson to your study shelf. Videos are supplied by YouTube.</Text>
                <Badge alignSelf="start" colorScheme="purple">{submittedQuery}</Badge>
              </VStack>
            </Flex>
          ) : submittedQuery && !needsYoutubeKey && !errorMessage ? (
            <Flex minH="300px" bg={panel} justify="center" align="center" direction="column" textAlign="center" p={6} borderRadius="md">
              <Heading size="md">No study shorts found for “{submittedQuery}”</Heading>
              <Text color={muted} mt={2}>Try a broader subject or another topic.</Text>
            </Flex>
          ) : !submittedQuery ? (
            <Flex minH="300px" border="1px dashed" borderColor={dashedBorder} justify="center" align="center" direction="column" textAlign="center" p={6} borderRadius="md">
              <Heading size="md">Choose a subject to begin</Heading>
              <Text color={muted} mt={2}>Short-form lessons from YouTube’s Education category, searched for your topic.</Text>
            </Flex>
          ) : null}
        </VStack>
      </Container>
    </Box>
  );
}
