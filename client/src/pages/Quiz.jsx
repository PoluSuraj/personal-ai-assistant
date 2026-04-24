import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  ScaleFade,
  SimpleGrid,
  Tag,
  TagLabel,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  FaAward,
  FaBrain,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaPlay,
  FaRedo,
  FaShieldAlt,
  FaTimesCircle,
  FaTrophy,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../utils/api";

function Quiz() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [savedScores, setSavedScores] = useState([]);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityDeadline, setSecurityDeadline] = useState(null);
  const [securityCountdown, setSecurityCountdown] = useState(0);
  const [autoSubmitReason, setAutoSubmitReason] = useState("");
  const toast = useToast();
  const savedTopics = useSelector((state) => state.chatTopic.topics);
  const user = useSelector((state) => state.authSlice.userData);
  const securityTimerRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBgGradient = useColorModeValue("linear(to-r, teal.500, green.400)", "linear(to-r, teal.700, green.600)");
  const mutedHeadingColor = useColorModeValue("gray.600", "gray.300");
  const selectBorder = useColorModeValue("teal.200", "teal.700");
  const questionColor = useColorModeValue("gray.700", "gray.200");
  const optionDefaultBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const optionHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const reviewBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const certificateBg = useColorModeValue("linear(to-br, white, teal.50)", "linear(to-br, gray.800, gray.900)");

  const topics = useMemo(() => Array.from(new Set((savedTopics || []).filter(Boolean))), [savedTopics]);
  const filteredTopics = useMemo(() => {
    const query = topic.trim().toLowerCase();
    if (!query) return topics.slice(0, 8);
    return topics.filter((item) => item.toLowerCase().includes(query)).slice(0, 8);
  }, [topic, topics]);
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const grade = percentage >= 90 ? "Distinction" : percentage >= 75 ? "Merit" : percentage >= 50 ? "Pass" : "Participation";
  const quizActive = questions.length > 0 && !submitted;

  const finalizeQuiz = (forcedReason = "") => {
    const newScore = questions.reduce((total, q, index) => total + (answers[index] === q.correct ? 1 : 0), 0);
    setScore(newScore);
    setSubmitted(true);
    setAutoSubmitReason(forcedReason);
    setSavedScores((prev) => [{ topic, score: newScore, total: questions.length }, ...prev].slice(0, 5));
    setSecurityModalOpen(false);
    setSecurityDeadline(null);
    setSecurityCountdown(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!quizActive) return undefined;

    const triggerSecurityCountdown = () => {
      const deadline = Date.now() + 10000;
      setSecurityDeadline(deadline);
      setSecurityCountdown(10);
      setSecurityModalOpen(true);
      toast({
        title: "Tab switch detected",
        description: "Return to the quiz now. It will auto-submit after the countdown.",
        status: "warning",
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerSecurityCountdown();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizActive, toast]);

  useEffect(() => {
    if (!securityDeadline || submitted) {
      if (securityTimerRef.current) {
        window.clearInterval(securityTimerRef.current);
        securityTimerRef.current = null;
      }
      return undefined;
    }

    const syncCountdown = () => {
      const remaining = Math.max(0, Math.ceil((securityDeadline - Date.now()) / 1000));
      setSecurityCountdown(remaining);
      if (remaining <= 0) {
        if (securityTimerRef.current) {
          window.clearInterval(securityTimerRef.current);
          securityTimerRef.current = null;
        }
        finalizeQuiz("Auto-submitted because the quiz window lost focus during the assessment.");
      }
    };

    syncCountdown();
    securityTimerRef.current = window.setInterval(syncCountdown, 250);

    return () => {
      if (securityTimerRef.current) {
        window.clearInterval(securityTimerRef.current);
        securityTimerRef.current = null;
      }
    };
  }, [securityDeadline, submitted]);

  const fetchAIQuestions = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please select or enter a topic first.", status: "warning" });
      return;
    }

    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setAutoSubmitReason("");
    setSecurityModalOpen(false);
    setSecurityDeadline(null);
    setSecurityCountdown(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/generateQuestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: [topic.trim()] }),
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

    finalizeQuiz();
  };

  const startNewTest = () => {
    setTopic("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setAutoSubmitReason("");
    setSecurityModalOpen(false);
    setSecurityDeadline(null);
    setSecurityCountdown(0);
  };

  const downloadFile = (filename, content, type = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadCertificate = () => {
    const certificateHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quiz Certificate</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f3f7fb; padding: 32px; }
            .certificate { max-width: 900px; margin: 0 auto; background: white; border: 8px solid #6b46c1; padding: 48px; text-align: center; }
            .title { font-size: 42px; font-weight: 800; color: #1a202c; }
            .subtitle { font-size: 18px; color: #4a5568; margin-top: 8px; }
            .name { font-size: 34px; margin: 24px 0; color: #2b6cb0; font-weight: 700; }
            .meta { font-size: 18px; color: #2d3748; line-height: 1.8; }
            .signature-wrap { margin-top: 42px; display: flex; justify-content: flex-end; }
            .signature-block { min-width: 240px; text-align: center; }
            .signature-mark { font-family: Brush Script MT, cursive; font-size: 46px; line-height: 1; color: #4338ca; }
            .signature-name { margin-top: 10px; padding-top: 10px; border-top: 1px solid #94a3b8; font-size: 16px; color: #0f172a; font-weight: 700; }
            .signature-role { font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="title">Certificate of Quiz Completion</div>
            <div class="subtitle">Personal AI Assistant</div>
            <p class="meta">This certificate is presented to</p>
            <div class="name">${user?.name || "Learner"}</div>
            <p class="meta">
              for completing the quiz on <strong>${topic}</strong><br />
              with a score of <strong>${score}/${questions.length}</strong> (${percentage}%)<br />
              Grade: <strong>${grade}</strong><br />
              Issued on ${new Date().toLocaleDateString()}
            </p>
            <div class="signature-wrap">
              <div class="signature-block">
                <div class="signature-mark">Er. Suraj Kumar</div>
                <div class="signature-name">Er. Suraj Kumar</div>
                <div class="signature-role">CEO & Director</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    downloadFile(`${topic.replace(/\s+/g, "-").toLowerCase()}-certificate.html`, certificateHtml, "text/html;charset=utf-8");
  };

  const downloadAnswers = () => {
    const content = questions.map((q, index) => {
      const selected = answers[index];
      const selectedLabel = selected ? `${selected}. ${q.options?.[selected] || ""}` : "Not answered";
      const correctLabel = `${q.correct}. ${q.options?.[q.correct] || ""}`;
      return [
        `Q${index + 1}. ${q.question}`,
        `Your answer: ${selectedLabel}`,
        `Correct answer: ${correctLabel}`,
        q.explanation ? `Explanation: ${q.explanation}` : "",
        "",
      ].filter(Boolean).join("\n");
    }).join("\n");

    downloadFile(`${topic.replace(/\s+/g, "-").toLowerCase()}-quiz-answers.txt`, content);
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems="center" bgGradient={headerBgGradient} p={8} borderRadius="2xl" boxShadow="xl" color="white" position="relative" overflow="hidden">
          <Icon as={FaBrain} position="absolute" right="-20px" bottom="-30px" boxSize="150px" color="whiteAlpha.200" transform="rotate(15deg)" />
          <VStack align="start" spacing={2} zIndex={1}>
            <Heading size="xl" display="flex" alignItems="center"><Icon as={FaBrain} mr={3} />AI Knowledge Quiz</Heading>
            <Text fontSize="lg" opacity={0.9}>Practice from your own topics, stay inside the quiz window, and download your results after each attempt.</Text>
          </VStack>
          {topic && !loading && questions.length === 0 && (
            <Button size="lg" bg="white" color="teal.600" onClick={fetchAIQuestions} isLoading={loading} loadingText="Generating..." boxShadow="md" _hover={{ transform: "translateY(-2px)", boxShadow: "lg", bg: "gray.50" }} leftIcon={<FaPlay />} zIndex={1} mt={{ base: 4, md: 0 }}>Generate Quiz</Button>
          )}
        </Flex>

        {!questions.length && !loading && (
          <ScaleFade initialScale={0.9} in>
            <Box bg={cardBg} p={10} borderRadius="2xl" boxShadow="xl" textAlign="center" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={6}>
                <Heading size="md" color={mutedHeadingColor}>Choose or Search Any Topic</Heading>
                <Text color="gray.500" maxW="lg">
                  Type your own topic or pick one from your saved chat history. The quiz will be generated for the exact topic you enter.
                </Text>
                <Input
                  placeholder="Search or enter a custom quiz topic"
                  size="lg"
                  maxW="xl"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  borderColor={selectBorder}
                  _focus={{ ring: 2, ringColor: "teal.300", borderColor: "teal.500" }}
                />
                {filteredTopics.length > 0 && (
                  <Wrap justify="center">
                    {filteredTopics.map((suggestion) => (
                      <WrapItem key={suggestion}>
                        <Tag
                          size="lg"
                          borderRadius="full"
                          variant={topic === suggestion ? "solid" : "subtle"}
                          colorScheme="teal"
                          cursor="pointer"
                          onClick={() => setTopic(suggestion)}
                        >
                          <TagLabel>{suggestion}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                <Alert status="info" borderRadius="xl" maxW="xl" textAlign="left">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Quiz security is active</AlertTitle>
                    <AlertDescription>
                      If you switch tabs during the quiz, a countdown will start and the quiz will auto-submit.
                    </AlertDescription>
                  </Box>
                </Alert>
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
                <HStack justify="space-between" mb={3} flexWrap="wrap">
                  <Text fontWeight="bold">{answeredCount} of {questions.length} answered</Text>
                  <HStack>
                    <Badge colorScheme={submitted ? "green" : "teal"}>{submitted ? "Review" : `${progress}%`}</Badge>
                    {quizActive ? <Badge colorScheme="orange">Protected quiz</Badge> : null}
                  </HStack>
                </HStack>
                <Progress value={submitted ? 100 : progress} colorScheme="teal" borderRadius="full" />
              </Box>

              {submitted && (
                <Box bgGradient={score === questions.length ? "linear(to-r, green.400, teal.500)" : "linear(to-r, blue.400, teal.500)"} p={8} borderRadius="2xl" color="white" textAlign="center" boxShadow="2xl">
                  <Icon as={FaTrophy} w={12} h={12} mb={4} color="yellow.300" />
                  <Heading size="2xl" mb={2}>{score} / {questions.length}</Heading>
                  <Text fontSize="xl" fontWeight="medium" mb={3}>{score === questions.length ? "Perfect score. You are ready for the next level." : "Good effort. Review the highlighted answers and download your result pack."}</Text>
                  {autoSubmitReason ? (
                    <Text fontSize="sm" color="whiteAlpha.900" mb={6}>{autoSubmitReason}</Text>
                  ) : (
                    <Text fontSize="sm" color="whiteAlpha.900" mb={6}>Completion status: {grade}</Text>
                  )}
                  <HStack spacing={3} justify="center" flexWrap="wrap">
                    <Button size="md" bg="whiteAlpha.200" color="white" _hover={{ bg: "whiteAlpha.400" }} leftIcon={<FaRedo />} onClick={startNewTest}>Try Another Topic</Button>
                    <Button size="md" bg="white" color="teal.700" leftIcon={<FaAward />} onClick={downloadCertificate}>Download Certificate</Button>
                    <Button size="md" variant="outline" borderColor="whiteAlpha.600" color="white" leftIcon={<FaDownload />} onClick={downloadAnswers}>Download Answers</Button>
                  </HStack>
                </Box>
              )}

              {submitted && (
                <Box bgGradient={certificateBg} p={8} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} boxShadow="lg">
                  <VStack spacing={4} textAlign="center">
                    <Badge colorScheme="purple" px={4} py={1} borderRadius="full">Certificate Preview</Badge>
                    <Heading size="lg">Certificate of Quiz Completion</Heading>
                    <Text>This is awarded to <strong>{user?.name || "Learner"}</strong></Text>
                    <Text>Topic: <strong>{topic}</strong></Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Score</Text><Heading size="md">{score}/{questions.length}</Heading></Box>
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Percentage</Text><Heading size="md">{percentage}%</Heading></Box>
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Grade</Text><Heading size="md">{grade}</Heading></Box>
                    </SimpleGrid>
                    <Box w="full" pt={6}>
                      <Flex justify="flex-end">
                        <Box textAlign="center" minW="240px">
                          <Text fontSize="4xl" fontFamily="cursive" color="purple.600" lineHeight="1">Er. Suraj Kumar</Text>
                          <Box mt={2} borderTop="1px solid" borderColor={borderColor} pt={2}>
                            <Text fontWeight="semibold">Er. Suraj Kumar</Text>
                            <Text fontSize="sm" color="gray.500">CEO & Director</Text>
                          </Box>
                        </Box>
                      </Flex>
                    </Box>
                  </VStack>
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

      <Modal isOpen={securityModalOpen} onClose={() => {}} isCentered closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaShieldAlt} color="orange.400" />
              <Text>Quiz Security Notice</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <Box>
                  <AlertTitle>Tab switching detected</AlertTitle>
                  <AlertDescription>
                    This quiz will auto-submit to your quiz panel if you leave the window during the active assessment.
                  </AlertDescription>
                </Box>
              </Alert>
              <Box bg="orange.50" borderRadius="xl" p={4}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FaClock} color="orange.500" />
                    <Text fontWeight="semibold">Auto-submit countdown</Text>
                  </HStack>
                  <Badge colorScheme="orange" fontSize="md" px={3} py={1}>{securityCountdown}s</Badge>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="orange" onClick={() => finalizeQuiz("Auto-submitted after tab switching during the quiz.")}>
              Submit Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default Quiz;
