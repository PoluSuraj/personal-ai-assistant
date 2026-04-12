import React, { useState, useEffect } from "react";
import {
  Flex,
  Box,
  Select,
  Button,
  Text,
  Heading,
  Container,
  VStack,
  HStack,
  Icon,
  Progress,
  Badge,
  useColorModeValue,
  ScaleFade,
  useToast,
} from "@chakra-ui/react";
import { FaTrophy, FaRedo, FaBrain, FaCheckCircle, FaTimesCircle, FaPlay } from "react-icons/fa";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../utils/api";

function Quiz() {
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [savedScores, setSavedScores] = useState([]);
  const toast = useToast();
  const savedTopics = useSelector(state => state.chatTopic.topics);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBgGradient = useColorModeValue("linear(to-r, teal.500, green.400)", "linear(to-r, teal.700, green.600)");
  const mutedHeadingColor = useColorModeValue("gray.600", "gray.300");
  const selectBorder = useColorModeValue("teal.200", "teal.700");
  const questionColor = useColorModeValue("gray.700", "gray.200");
  const optionDefaultBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const optionHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const reviewBg = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    setTopics(savedTopics || []);
  }, [savedTopics]);

  const fetchAIQuestions = async () => {
    if (!topic) {
      toast({ title: "Topic required", description: "Please select a topic first.", status: "warning" });
      return;
    }

    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/generateQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: [topic] }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const generatedQuestions = data.topics?.[0]?.questions;
      if (Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
      } else {
        toast({ title: "No questions generated", description: "Try another topic or ask the chat about this topic first.", status: "info" });
      }
    } catch (error) {
      console.error("Error fetching AI questions:", error);
      toast({ title: "Could not create quiz", description: error.message || "Please try again.", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast({ title: "Finish all questions", description: "Answer every question before submitting.", status: "warning" });
      return;
    }

    const newScore = questions.reduce((total, q, index) => total + (answers[index] === q.correct ? 1 : 0), 0);
    setScore(newScore);
    setSubmitted(true);
    setSavedScores((prev) => [{ topic, score: newScore, total: questions.length }, ...prev].slice(0, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNewTest = () => {
    setTopic("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems="center" bgGradient={headerBgGradient} p={8} borderRadius="2xl" boxShadow="xl" color="white" position="relative" overflow="hidden">
          <Icon as={FaBrain} position="absolute" right="-20px" bottom="-30px" boxSize="150px" color="whiteAlpha.200" transform="rotate(15deg)" />
          <VStack align="start" spacing={2} zIndex={1}>
            <Heading size="xl" display="flex" alignItems="center"><Icon as={FaBrain} mr={3} />AI Knowledge Quiz</Heading>
            <Text fontSize="lg" opacity={0.9}>Practice from your own chat topics and track your progress.</Text>
          </VStack>
          {topic && !loading && questions.length === 0 && (
            <Button size="lg" bg="white" color="teal.600" onClick={fetchAIQuestions} isLoading={loading} loadingText="Generating..." boxShadow="md" _hover={{ transform: "translateY(-2px)", boxShadow: "lg", bg: "gray.50" }} leftIcon={<FaPlay />} zIndex={1} mt={{ base: 4, md: 0 }}>Generate Quiz</Button>
          )}
        </Flex>

        {!questions.length && !loading && (
          <ScaleFade initialScale={0.9} in>
            <Box bg={cardBg} p={10} borderRadius="2xl" boxShadow="xl" textAlign="center" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={6}>
                <Heading size="md" color={mutedHeadingColor}>Choose a Topic to Start</Heading>
                <Select placeholder="Select from your chat history" size="lg" maxW="md" value={topic} onChange={(e) => setTopic(e.target.value)} borderColor={selectBorder} _focus={{ ring: 2, ringColor: "teal.300", borderColor: "teal.500" }}>
                  {topics.length > 0 ? topics.map((t, index) => <option key={`${t}-${index}`} value={t}>{t}</option>) : <option disabled>No topics found</option>}
                </Select>
                {savedScores.length > 0 && <Text fontSize="sm" color="gray.500">Latest score: {savedScores[0].score}/{savedScores[0].total} on {savedScores[0].topic}</Text>}
              </VStack>
            </Box>
          </ScaleFade>
        )}

        {loading && (
          <VStack spacing={6} py={10} align="center">
            <Box w="full" maxW="md"><Progress size="sm" isIndeterminate colorScheme="teal" borderRadius="full" hasStripe /></Box>
            <Text color="teal.500" fontWeight="bold" fontSize="lg">Crafting questions for you...</Text>
          </VStack>
        )}

        {questions.length > 0 && (
          <ScaleFade initialScale={0.95} in>
            <VStack spacing={8} align="stretch">
              <Box bg={cardBg} p={5} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="bold">{answeredCount} of {questions.length} answered</Text>
                  <Badge colorScheme={submitted ? "green" : "teal"}>{submitted ? "Review" : `${progress}%`}</Badge>
                </HStack>
                <Progress value={submitted ? 100 : progress} colorScheme="teal" borderRadius="full" />
              </Box>

              {submitted && (
                <Box bgGradient={score === questions.length ? "linear(to-r, green.400, teal.500)" : "linear(to-r, blue.400, teal.500)"} p={8} borderRadius="2xl" color="white" textAlign="center" boxShadow="2xl">
                  <Icon as={FaTrophy} w={12} h={12} mb={4} color="yellow.300" />
                  <Heading size="2xl" mb={2}>{score} / {questions.length}</Heading>
                  <Text fontSize="xl" fontWeight="medium" mb={6}>{score === questions.length ? "Perfect score. You are ready for the next level." : "Good effort. Review the highlighted answers and try again."}</Text>
                  <Button size="md" bg="whiteAlpha.200" color="white" _hover={{ bg: "whiteAlpha.400" }} leftIcon={<FaRedo />} onClick={startNewTest}>Try Another Topic</Button>
                </Box>
              )}

              {questions.map((q, index) => (
                <Box key={`${q.question}-${index}`} bg={cardBg} p={8} borderRadius="2xl" boxShadow="lg" borderWidth="1px" borderColor={submitted ? (answers[index] === q.correct ? "green.400" : "red.400") : borderColor} position="relative" overflow="hidden">
                  {submitted && <Box position="absolute" top={0} left={0} w="6px" h="full" bg={answers[index] === q.correct ? "green.400" : "red.400"} />}
                  <Text fontSize="xl" fontWeight="bold" mb={6} color={questionColor}><Text as="span" color="teal.500" mr={2}>Q{index + 1}.</Text>{q.question}</Text>
                  <VStack align="stretch" spacing={3}>
                    {Object.entries(q.options || {}).map(([key, option]) => {
                      const isSelected = answers[index] === key;
                      const isCorrect = key === q.correct;
                      let optionBg = optionDefaultBg;
                      let optionBorder = "transparent";
                      let textColor = "inherit";

                      if (submitted && isCorrect) {
                        optionBg = "green.100";
                        optionBorder = "green.400";
                        textColor = "green.800";
                      } else if (submitted && isSelected) {
                        optionBg = "red.100";
                        optionBorder = "red.400";
                        textColor = "red.800";
                      } else if (isSelected) {
                        optionBg = "teal.50";
                        optionBorder = "teal.500";
                        textColor = "teal.700";
                      }

                      return (
                        <HStack key={key} as="button" onClick={() => handleAnswerSelect(index, key)} p={4} borderRadius="xl" bg={optionBg} border="2px solid" borderColor={optionBorder} justifyContent="space-between" _hover={!submitted ? { bg: optionHoverBg, transform: "translateX(4px)" } : undefined} disabled={submitted} transition="all 0.2s" textAlign="left" color={textColor}>
                          <HStack align="start">
                            <Badge colorScheme={isSelected ? "teal" : "gray"} variant="solid" borderRadius="full" boxSize={8} display="flex" alignItems="center" justifyContent="center" fontSize="sm">{key}</Badge>
                            <Text fontSize="md" fontWeight="medium">{option}</Text>
                          </HStack>
                          {submitted && isCorrect && <Icon as={FaCheckCircle} color="green.500" boxSize={5} />}
                          {submitted && isSelected && !isCorrect && <Icon as={FaTimesCircle} color="red.500" boxSize={5} />}
                        </HStack>
                      );
                    })}
                  </VStack>
                  {submitted && q.explanation && <Box mt={5} p={4} bg={reviewBg} borderRadius="lg"><Text fontWeight="semibold">Why:</Text><Text>{q.explanation}</Text></Box>}
                </Box>
              ))}

              {!submitted && <Button size="lg" colorScheme="teal" onClick={handleSubmit} boxShadow="xl" alignSelf="center" w="full" maxW="sm" height="60px" fontSize="xl" borderRadius="xl" _hover={{ transform: "translateY(-4px)", boxShadow: "2xl" }}>Submit Quiz</Button>}
            </VStack>
          </ScaleFade>
        )}
      </VStack>
    </Container>
  );
}

export default Quiz;
