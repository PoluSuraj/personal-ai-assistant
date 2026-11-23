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
  Textarea,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { FaBookOpen, FaHeart, FaPlay, FaSearch, FaShare, FaStar } from "react-icons/fa";
import { apiFetch } from "../utils/api";
import { useSelector } from "react-redux";

const suggestions = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Coding", "Study skills"];
const SAVED_KEY = "paa_vidyavritta_saved";
const LIKED_KEY = "paa_vidyavritta_liked";
const FEED_SIZE = 6;

const readList = (key) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const readSavedReels = () => readList(SAVED_KEY).filter((item) => item?.id?.videoId && item?.snippet?.title);

const selectFreshFeed = (items, query) => {
  const candidates = [...items];
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }

  const historyKey = `paa_vidyavritta_recent:${query.trim().toLowerCase()}`;
  const previousIds = readList(historyKey);
  const unseen = candidates.filter((item) => !previousIds.includes(item.id?.videoId));
  const ordered = [...unseen, ...candidates.filter((item) => previousIds.includes(item.id?.videoId))];
  const firstBatch = ordered.slice(0, FEED_SIZE);
  try {
    window.localStorage.setItem(historyKey, JSON.stringify(firstBatch.map((item) => item.id.videoId)));
  } catch {
    // A full or disabled local storage should not prevent the feed from loading.
  }
  return { firstBatch, remaining: ordered.slice(FEED_SIZE) };
};

export default function VidyaVritta() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("study tips");
  const [reels, setReels] = useState([]);
  const [savedReels, setSavedReels] = useState(readSavedReels);
  const [likedIds, setLikedIds] = useState(() => readList(LIKED_KEY));
  const [savedOnly, setSavedOnly] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchVersion, setSearchVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsYoutubeKey, setNeedsYoutubeKey] = useState(false);
  const feedRef = useRef(null);
  const pendingReelsRef = useRef([]);
  const seenIdsRef = useRef(new Set());
  const loadingMoreRef = useRef(false);
  const feedRequestIdRef = useRef(0);
  const toast = useToast();
  const user = useSelector((state) => state.authSlice.userData || {});

  const visibleReels = savedOnly ? savedReels : reels;
  const savedIds = savedReels.map((reel) => reel.id.videoId);

  useEffect(() => {
    if (!submittedQuery) return undefined;
    const controller = new AbortController();
    feedRequestIdRef.current += 1;
    pendingReelsRef.current = [];
    seenIdsRef.current = new Set();
    loadingMoreRef.current = false;
    setNextPageToken("");
    setHasMore(false);
    setIsLoading(true);
    setIsLoadingMore(false);
    setErrorMessage("");
    setNeedsYoutubeKey(false);
    apiFetch(`/api/v1/youtube/search?format=study-short&query=${encodeURIComponent(`${submittedQuery} educational short lesson`)}`, { signal: controller.signal })
      .then((result) => {
        const candidates = result.fallback ? [] : (Array.isArray(result.data) ? result.data : []);
        const freshFeed = selectFreshFeed(candidates, submittedQuery);
        freshFeed.firstBatch.forEach((item) => seenIdsRef.current.add(item.id.videoId));
        pendingReelsRef.current = freshFeed.remaining;
        setReels(freshFeed.firstBatch);
        setNextPageToken(result.nextPageToken || "");
        setHasMore(freshFeed.remaining.length > 0 || Boolean(result.nextPageToken));
        setNeedsYoutubeKey(Boolean(result.fallback));
        setActiveIndex(0);
        if (feedRef.current) feedRef.current.scrollTop = 0;
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(error.message || "Could not load study shorts.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [submittedQuery, searchVersion]);

  useEffect(() => {
    setActiveIndex(0);
    if (feedRef.current) feedRef.current.scrollTo({ top: 0 });
  }, [savedOnly]);

  const search = (value = query) => {
    const cleanQuery = value.trim();
    if (!cleanQuery) return;
    setQuery(cleanQuery);
    setSubmittedQuery(cleanQuery);
    setSavedOnly(false);
    if (cleanQuery === submittedQuery) setSearchVersion((version) => version + 1);
    setActiveIndex(0);
    if (feedRef.current) feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadMore = async () => {
    if (savedOnly || loadingMoreRef.current) return;
    const requestId = feedRequestIdRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      let batch = pendingReelsRef.current.splice(0, FEED_SIZE);
      let pageToken = nextPageToken;

      if (!batch.length && pageToken) {
        const result = await apiFetch(`/api/v1/youtube/search?format=study-short&query=${encodeURIComponent(`${submittedQuery} educational short lesson`)}&pageToken=${encodeURIComponent(pageToken)}`);
        if (requestId !== feedRequestIdRef.current) return;
        const candidates = Array.isArray(result.data) ? result.data : [];
        const unseen = candidates.filter((item) => item.id?.videoId && !seenIdsRef.current.has(item.id.videoId));
        for (let index = unseen.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [unseen[index], unseen[swapIndex]] = [unseen[swapIndex], unseen[index]];
        }
        batch = unseen.splice(0, FEED_SIZE);
        pendingReelsRef.current = unseen;
        pageToken = result.nextPageToken || "";
        setNextPageToken(pageToken);
      }

      if (requestId !== feedRequestIdRef.current) return;
      batch.forEach((item) => seenIdsRef.current.add(item.id.videoId));
      if (batch.length) setReels((current) => [...current, ...batch]);
      const moreAvailable = pendingReelsRef.current.length > 0 || Boolean(pageToken);
      setHasMore(moreAvailable);
      if (!moreAvailable && !batch.length) setErrorMessage("You have reached the end of the available lessons for this search. Try another subject for more.");
    } catch (error) {
      if (requestId === feedRequestIdRef.current) setErrorMessage(error.message || "Could not load more lessons.");
    } finally {
      if (requestId === feedRequestIdRef.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  };

  const onFeedScroll = () => {
    if (!feedRef.current) return;
    const nextIndex = Math.round(feedRef.current.scrollTop / feedRef.current.clientHeight);
    setActiveIndex((current) => current === nextIndex ? current : nextIndex);
    const remaining = feedRef.current.scrollHeight - feedRef.current.scrollTop - feedRef.current.clientHeight;
    if (remaining < feedRef.current.clientHeight * 1.5 && hasMore) loadMore();
  };

  const toggleSaved = (reel) => {
    const videoId = reel.id.videoId;
    const next = savedIds.includes(videoId) ? savedReels.filter((item) => item.id.videoId !== videoId) : [reel, ...savedReels];
    setSavedReels(next);
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    toast({ title: next.some((item) => item.id.videoId === videoId) ? "Added to your study shelf" : "Removed from your study shelf", status: "success", duration: 1800, isClosable: true });
  };

  const toggleLike = (videoId) => {
    const next = likedIds.includes(videoId) ? likedIds.filter((id) => id !== videoId) : [...likedIds, videoId];
    setLikedIds(next);
    window.localStorage.setItem(LIKED_KEY, JSON.stringify(next));
  };

  const shareReel = async (reel) => {
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(reel.id.videoId)}`;
    try {
      if (navigator.share) await navigator.share({ title: reel.snippet.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Lesson link copied", status: "success", duration: 1800, isClosable: true });
      }
    } catch (error) {
      if (error.name !== "AbortError") toast({ title: "Could not share this lesson", status: "error", duration: 2000, isClosable: true });
    }
  };

  const sendFeedback = async () => {
    if (feedback.trim().length < 10) {
      toast({ title: "Please add a little more detail", status: "warning", duration: 2200, isClosable: true });
      return;
    }
    if (!user.email) {
      toast({ title: "Sign in to send app feedback", status: "warning", duration: 2200, isClosable: true });
      return;
    }
    setIsSendingFeedback(true);
    try {
      await apiFetch("/api/v1/contact/send", {
        method: "POST",
        body: JSON.stringify({
          name: user.name || "VidyaVritta user",
          email: user.email,
          subject: "VidyaVritta app feedback",
          message: `App rating: ${feedbackRating}/5\n\n${feedback.trim()}`,
        }),
      });
      setFeedback("");
      toast({ title: "Thanks for helping us improve the app", status: "success", duration: 2500, isClosable: true });
    } catch (error) {
      toast({ title: error.message || "Could not send your feedback", status: "error", duration: 2500, isClosable: true });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const moveFeed = (direction) => {
    if (!feedRef.current) return;
    feedRef.current.scrollBy({ top: feedRef.current.clientHeight * direction, behavior: "smooth" });
  };

  return (
    <Box minH="100%" bg="#080b0b" color="white">
      <Container maxW="container.xl" px={{ base: 0, md: 6 }} py={{ base: 3, md: 6 }}>
        <VStack align="stretch" spacing={{ base: 3, md: 5 }}>
          <Flex px={{ base: 4, md: 0 }} justify="space-between" align="center" gap={3}>
            <HStack spacing={2} minW={0}>
              <Icon as={FaBookOpen} color="teal.300" boxSize={5} />
              <Heading size="md" noOfLines={1}>VidyaVritta</Heading>
              <Badge colorScheme="teal" display={{ base: "none", sm: "inline-flex" }}>LEARN IN MOTION</Badge>
            </HStack>
            <Button size="sm" variant={savedOnly ? "solid" : "outline"} colorScheme="pink" borderRadius="full" onClick={() => setSavedOnly((value) => !value)}>
              {savedOnly ? "For you" : `Saved ${savedReels.length}`}
            </Button>
          </Flex>

          <HStack px={{ base: 4, md: 0 }} spacing={2}>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none"><Icon as={FaSearch} color="gray.400" /></InputLeftElement>
              <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="Search lessons: algebra, Python, photosynthesis…" bg="#171b1b" borderColor="whiteAlpha.200" borderRadius="full" aria-label="Search study shorts" _placeholder={{ color: "gray.400" }} />
            </InputGroup>
            <IconButton aria-label="Search lessons" icon={<Icon as={FaSearch} />} colorScheme="teal" borderRadius="full" onClick={() => search()} isDisabled={!query.trim()} />
          </HStack>

          <HStack px={{ base: 4, md: 0 }} spacing={2} overflowX="auto" pb={1} css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {suggestions.map((item) => <Button key={item} size="xs" flexShrink={0} color="whiteAlpha.900" bg="#1a2020" _hover={{ bg: "#253030" }} borderRadius="full" onClick={() => search(item)}>{item}</Button>)}
          </HStack>

          {errorMessage ? <Alert mx={{ base: 4, md: 0 }} status="error" borderRadius="md"><AlertIcon />{errorMessage}</Alert> : null}
          {needsYoutubeKey ? <Alert mx={{ base: 4, md: 0 }} status="info" borderRadius="md"><AlertIcon />Study shorts need YouTube search configured. No unrelated demo videos are shown.</Alert> : null}

          {isLoading ? (
            <Flex minH="55vh" align="center" justify="center" gap={3}><Spinner color="teal.300" /><Text color="whiteAlpha.800">Finding lessons for {submittedQuery}…</Text></Flex>
          ) : visibleReels.length ? (
            <Flex justify="center" align="stretch" gap={4}>
              <Box
                ref={feedRef}
                w="full"
                maxW={{ base: "full", md: "600px" }}
                h={{ base: "calc(100dvh - 276px)", md: "min(76dvh, 780px)" }}
                minH="430px"
                overflowY="auto"
                scrollSnapType="y mandatory"
                overscrollBehaviorY="contain"
                onScroll={onFeedScroll}
                css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
              >
                {visibleReels.map((reel, index) => {
                  const videoId = reel.id.videoId;
                  const title = reel.snippet.title;
                  const thumbnail = reel.snippet.thumbnails?.maxres?.url || reel.snippet.thumbnails?.high?.url || reel.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                  const isActive = index === activeIndex;
                  const isSaved = savedIds.includes(videoId);
                  const isLiked = likedIds.includes(videoId);
                  const playerUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1`;

                  return (
                    <Flex key={videoId} h="full" minH="full" w="full" scrollSnapAlign="start" justify="center" align="stretch" py={0}>
                      <Box
                        position="relative"
                        h="full"
                        w="auto"
                        maxW="full"
                        aspectRatio="9 / 16"
                        bg="#101414"
                        overflow="hidden"
                        borderRadius={{ base: 0, md: "md" }}
                        borderY={{ base: "0", md: "1px" }}
                        borderColor="whiteAlpha.200"
                      >
                        {isActive ? (
                          <Box as="iframe" title={title} src={playerUrl} position="absolute" inset={0} w="100%" h="100%" border={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                        ) : (
                          <>
                            <Box position="absolute" inset={0} bgImage={`url("${thumbnail}")`} bgSize="cover" bgPos="center" />
                            <Box position="absolute" inset={0} bg="linear-gradient(180deg, rgba(0,0,0,.14) 12%, rgba(0,0,0,.04) 42%, rgba(0,0,0,.88) 100%)" />
                            <IconButton aria-label="Play lesson" icon={<Icon as={FaPlay} />} position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" boxSize="62px" borderRadius="full" bg="teal.400" color="gray.900" _hover={{ bg: "teal.300", transform: "translate(-50%, -50%) scale(1.06)" }} onClick={() => feedRef.current?.scrollTo({ top: index * feedRef.current.clientHeight, behavior: "smooth" })} />
                          </>
                        )}

                        <Flex position="absolute" top={3} left={3} right={3} zIndex={2} justify="space-between" align="center" pointerEvents="none">
                          <Badge bg="blackAlpha.700" color="white" px={3} py={1} borderRadius="full">STUDY SHORT</Badge>
                          <Text fontSize="xs" color="white" bg="blackAlpha.600" px={3} py={1} borderRadius="full">LESSON {index + 1}</Text>
                        </Flex>

                        <VStack position="absolute" right={3} bottom="25%" spacing={4} zIndex={3}>
                          <VStack spacing={1}>
                            <IconButton aria-label={isLiked ? "Unlike lesson" : "Like lesson"} icon={<Icon as={FaHeart} />} color={isLiked ? "pink.300" : "white"} bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => toggleLike(videoId)} />
                            <Text fontSize="xs" color="white">{isLiked ? "Liked" : "Like"}</Text>
                          </VStack>
                          <VStack spacing={1}>
                            <IconButton aria-label={isSaved ? "Remove from saved lessons" : "Save lesson"} icon={<Icon as={FaBookOpen} />} color={isSaved ? "teal.200" : "white"} bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => toggleSaved(reel)} />
                            <Text fontSize="xs" color="white">Save</Text>
                          </VStack>
                          <VStack spacing={1}>
                            <IconButton aria-label="Share lesson" icon={<Icon as={FaShare} />} color="white" bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => shareReel(reel)} />
                            <Text fontSize="xs" color="white">Share</Text>
                          </VStack>
                        </VStack>

                        <Box position="absolute" left={4} right={16} bottom={4} zIndex={2} color="white" pointerEvents="none">
                          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.04em" color="teal.200" mb={2}>{reel.snippet.channelTitle || "Education"}</Text>
                          <Heading size="sm" lineHeight="1.35" noOfLines={3}>{title}</Heading>
                          {reel.snippet.description ? <Text mt={2} fontSize="xs" color="whiteAlpha.800" noOfLines={2}>{reel.snippet.description}</Text> : null}
                          <Text mt={3} fontSize="xs" color="whiteAlpha.800">Swipe for the next lesson</Text>
                        </Box>

                      </Box>
                    </Flex>
                  );
                })}
                {!savedOnly && isLoadingMore ? (
                  <Flex h="72px" align="center" justify="center" gap={2} color="whiteAlpha.800">
                    <Spinner size="sm" color="teal.300" />
                    <Text fontSize="sm">Loading more lessons…</Text>
                  </Flex>
                ) : null}
              </Box>
              <VStack display={{ base: "none", md: "flex" }} justify="center" spacing={2}>
                <IconButton aria-label="Previous lesson" icon={<Icon as={FaPlay} transform="rotate(-90deg)" />} variant="outline" onClick={() => moveFeed(-1)} />
                <IconButton aria-label="Next lesson" icon={<Icon as={FaPlay} transform="rotate(90deg)" />} variant="outline" onClick={() => moveFeed(1)} />
              </VStack>
            </Flex>
          ) : submittedQuery || savedOnly ? (
            <Flex minH="48vh" mx={{ base: 4, md: 0 }} bg="#141919" justify="center" align="center" direction="column" textAlign="center" p={6} borderRadius="md">
              <Heading size="md">{savedOnly ? "Your study shelf is empty" : `No study shorts found for “${submittedQuery}”`}</Heading>
              <Text color="whiteAlpha.700" mt={2}>{savedOnly ? "Save a lesson while watching to find it here." : "Try a broader subject or another topic."}</Text>
            </Flex>
          ) : (
            <Flex minH="48vh" mx={{ base: 4, md: 0 }} border="1px dashed" borderColor="whiteAlpha.300" justify="center" align="center" direction="column" textAlign="center" p={6} borderRadius="md">
              <Heading size="md">Choose a subject and start your stream</Heading>
              <Text color="whiteAlpha.700" mt={2}>Quick lessons selected from YouTube’s Education category.</Text>
            </Flex>
          )}

          <Box mx={{ base: 4, md: 0 }} pt={6} borderTop="1px solid" borderColor="whiteAlpha.200">
            <Heading size="md">App feedback</Heading>
            <Text mt={1} color="whiteAlpha.700">Tell us what is working well or what you would improve.</Text>
            <HStack mt={3} spacing={1} aria-label={`App rating: ${feedbackRating} out of 5`}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton key={rating} aria-label={`Rate app ${rating} out of 5`} icon={<Icon as={FaStar} />} color={rating <= feedbackRating ? "yellow.300" : "whiteAlpha.500"} variant="ghost" onClick={() => setFeedbackRating(rating)} />
              ))}
            </HStack>
            <Textarea mt={2} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Share your feedback (at least 10 characters)" maxLength={2000} bg="#171b1b" borderColor="whiteAlpha.200" borderRadius="md" />
            <Button mt={3} colorScheme="teal" onClick={sendFeedback} isLoading={isSendingFeedback} isDisabled={!feedback.trim()}>Send app feedback</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
