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
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
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
  FaQrcode,
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
  const certificateBg = useColorModeValue("linear(to-br, #fff7ed, #ffffff 25%, #eff6ff 60%, #f5f3ff)", "linear(to-br, #1f2937, #111827 45%, #172554)");
  const certificatePanel = useColorModeValue("rgba(255,255,255,0.92)", "rgba(15,23,42,0.74)");
  const securityBannerBg = useColorModeValue("orange.50", "rgba(251, 191, 36, 0.18)");
  const securityBannerText = useColorModeValue("orange.900", "orange.100");
  const securityBannerBorder = useColorModeValue("orange.300", "orange.300");
  const securityBadgeBg = useColorModeValue("orange.500", "orange.300");
  const securityBadgeColor = useColorModeValue("white", "gray.900");

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
  const issuedOn = new Date().toLocaleDateString();
  const certificatePayload = `Certificate of Quiz Completion\nLearner: ${user?.name || "Learner"}\nTopic: ${topic}\nScore: ${score}/${questions.length}\nPercentage: ${percentage}%\nGrade: ${grade}\nIssued: ${issuedOn}`;
  const qrValue = encodeURIComponent(certificatePayload);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrValue}`;
  const certificateWatermark = "PAA";
  const certificateSignatories = [
    { role: "Teammate", name: "Er. Suraj Kumar" },
    { role: "Teammate", name: "Er. Aaditya Jha" },
    { role: "Teammate", name: "Er. Abhay Kr Yadav" },
    { role: "Teammate", name: "Er. Harsha Vardhan Palli" },
  ];

  const stopSecurityTimer = () => {
    if (securityTimerRef.current) {
      window.clearInterval(securityTimerRef.current);
      securityTimerRef.current = null;
    }
  };

  const finalizeQuiz = React.useCallback((forcedReason = "") => {
    const newScore = questions.reduce((total, q, index) => total + (answers[index] === q.correct ? 1 : 0), 0);
    setScore(newScore);
    setSubmitted(true);
    setAutoSubmitReason(forcedReason);
    setSavedScores((prev) => [{ topic, score: newScore, total: questions.length }, ...prev].slice(0, 5));
    setSecurityModalOpen(false);
    setSecurityDeadline(null);
    setSecurityCountdown(0);
    stopSecurityTimer();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [answers, questions, topic]);

  const resumeQuiz = () => {
    setSecurityModalOpen(false);
    setSecurityDeadline(null);
    setSecurityCountdown(0);
    stopSecurityTimer();
    toast({
      title: "Quiz resumed",
      description: "You can continue the assessment. Please stay on this tab until you finish.",
      status: "success",
    });
  };

  useEffect(() => {
    if (!quizActive) return undefined;

    const triggerSecurityCountdown = () => {
      if (securityDeadline) return;
      const deadline = Date.now() + 10000;
      setSecurityDeadline(deadline);
      setSecurityCountdown(10);
      setSecurityModalOpen(true);
      toast({
        title: "Tab switch detected",
        description: "Resume now or submit. If the countdown ends, the quiz will auto-submit.",
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
  }, [quizActive, toast, securityDeadline]);

  useEffect(() => {
    if (!securityDeadline || submitted) {
      stopSecurityTimer();
      return undefined;
    }

    const syncCountdown = () => {
      const remaining = Math.max(0, Math.ceil((securityDeadline - Date.now()) / 1000));
      setSecurityCountdown(remaining);
      if (remaining <= 0) {
        stopSecurityTimer();
        finalizeQuiz("Auto-submitted because the quiz window lost focus during the assessment.");
      }
    };

    syncCountdown();
    securityTimerRef.current = window.setInterval(syncCountdown, 250);

    return () => stopSecurityTimer();
  }, [finalizeQuiz, securityDeadline, submitted]);

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
    stopSecurityTimer();

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
    stopSecurityTimer();
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
            body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #fff7ed, #eef2ff); padding: 28px; }
            .certificate { position: relative; max-width: 900px; margin: 0 auto; background: linear-gradient(135deg, #fffef7, #ffffff 32%, #eff6ff 68%, #f5f3ff); border: 14px solid #7c3aed; border-radius: 28px; padding: 40px; box-shadow: 0 24px 70px rgba(76, 29, 149, 0.18); overflow: hidden; }
            .watermark { position: absolute; top: 34px; right: 38px; width: 92px; height: 92px; border-radius: 999px; border: 2px solid rgba(124, 58, 237, 0.18); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; letter-spacing: 0.18em; color: rgba(124, 58, 237, 0.22); text-transform: uppercase; pointer-events: none; background: rgba(255,255,255,0.72); }
            .top-row { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
            .title { font-size: 38px; font-weight: 800; color: #1e1b4b; }
            .subtitle { font-size: 16px; color: #6d28d9; margin-top: 8px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
            .name { font-size: 32px; margin: 22px 0; color: #2b6cb0; font-weight: 700; }
            .meta { font-size: 18px; color: #2d3748; line-height: 1.8; }
            .qr-card { text-align: center; background: #ffffff; border: 1px solid #dbeafe; border-radius: 18px; padding: 14px; min-width: 210px; }
            .qr-label { margin-top: 10px; font-size: 13px; color: #475569; }
            .score-strip { margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .score-box { background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(99, 102, 241, 0.18); border-radius: 16px; padding: 14px; text-align: center; }
            .score-label { font-size: 14px; color: #475569; margin-bottom: 6px; }
            .score-value { font-size: 22px; font-weight: 800; color: #1e293b; }
            .signature-wrap { margin-top: 28px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(59, 130, 246, 0.08)); border: 1px solid rgba(124, 58, 237, 0.16); border-radius: 20px; padding: 18px; }
            .signature-title { text-align: center; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #6d28d9; font-weight: 800; margin-bottom: 12px; }
            .signature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .signature-block { min-height: 112px; text-align: center; background: rgba(255,255,255,0.82); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 18px; padding: 12px 10px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); }
            .signature-mark { font-family: Brush Script MT, cursive; font-size: 24px; line-height: 1; color: #4338ca; min-height: 32px; display: flex; align-items: center; justify-content: center; }
            .signature-name { margin-top: 10px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 13px; color: #0f172a; font-weight: 700; }
            .signature-role { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="watermark">${certificateWatermark}</div>
            <div class="top-row">
              <div>
                <div class="title">Certificate of Quiz Completion</div>
                <div class="subtitle">Personal AI Assistant</div>
              </div>
              <div class="qr-card">
                <img src="${qrUrl}" width="180" height="180" alt="Certificate QR code" />
                <div class="qr-label">Scan to view certificate details</div>
              </div>
            </div>
            <p class="meta" style="margin-top: 26px; position: relative; z-index: 1;">This certificate is presented to</p>
            <div class="name" style="position: relative; z-index: 1;">${user?.name || "Learner"}</div>
            <p class="meta" style="position: relative; z-index: 1;">
              for completing the quiz on <strong>${topic}</strong><br />
              Issued on ${issuedOn}
            </p>
            <div class="score-strip" style="position: relative; z-index: 1;">
              <div class="score-box"><div class="score-label">Score</div><div class="score-value">${score}/${questions.length}</div></div>
              <div class="score-box"><div class="score-label">Percentage</div><div class="score-value">${percentage}%</div></div>
              <div class="score-box"><div class="score-label">Grade</div><div class="score-value">${grade}</div></div>
            </div>
            <div class="signature-wrap" style="position: relative; z-index: 1;">
              <div class="signature-title">Project Team Signatories</div>
              <div class="signature-grid">
                ${certificateSignatories.map((member) => `
                  <div class="signature-block">
                    <div class="signature-mark">${member.name}</div>
                    <div class="signature-name">${member.name}</div>
                    <div class="signature-role">${member.role}</div>
                  </div>
                `).join("")}
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
        <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems="center" bgGradient={headerBgGradient} p={{ base: 6, md: 8 }} borderRadius="2xl" boxShadow="xl" color="white" position="relative" overflow="hidden">
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
            <Box bg={cardBg} p={{ base: 6, md: 10 }} borderRadius="2xl" boxShadow="xl" textAlign="center" borderWidth="1px" borderColor={borderColor}>
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
                <Box bgGradient={certificateBg} p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} boxShadow="lg" position="relative" overflow="hidden">
                  <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center" pointerEvents="none" opacity={0.08}>
                    <Text fontSize={{ base: "5xl", md: "7xl" }} fontWeight="black" letterSpacing="0.18em" textTransform="uppercase" color="purple.500">
                      {certificateWatermark}
                    </Text>
                  </Box>
                  <VStack spacing={6} textAlign="center" position="relative" zIndex={1}>
                    <Badge colorScheme="purple" px={4} py={1} borderRadius="full">Certificate Preview</Badge>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="full" alignItems="start">
                      <VStack spacing={4} align={{ base: "center", lg: "start" }} textAlign={{ base: "center", lg: "left" }}>
                        <Heading size="lg">Certificate of Quiz Completion</Heading>
                        <Text>This is awarded to <strong>{user?.name || "Learner"}</strong></Text>
                        <Text>Topic: <strong>{topic}</strong></Text>
                        <Text color="gray.500">Issued on {issuedOn}</Text>
                      </VStack>
                      <Box bg={certificatePanel} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={4} justifySelf={{ base: "center", lg: "end" }}>
                        <VStack spacing={3}>
                          <HStack color="purple.500"><Icon as={FaQrcode} /><Text fontWeight="semibold">Certificate QR</Text></HStack>
                          <Image src={qrUrl} alt="Certificate QR code" boxSize="160px" borderRadius="lg" />
                          <Text fontSize="sm" color="gray.500">Scan to view certificate details</Text>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Score</Text><Heading size="md">{score}/{questions.length}</Heading></Box>
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Percentage</Text><Heading size="md">{percentage}%</Heading></Box>
                      <Box bg={cardBg} borderRadius="xl" p={4}><Text fontSize="sm" color="gray.500">Grade</Text><Heading size="md">{grade}</Heading></Box>
                    </SimpleGrid>
                    <Divider />
                    <Box w="full" pt={2}>
                      <VStack spacing={4} align="stretch">
                        <Badge alignSelf="center" colorScheme="purple" px={4} py={1} borderRadius="full">Project Team Signatories</Badge>
                        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3} w="full">
                          {certificateSignatories.map((member) => (
                            <Box key={member.role} bg={certificatePanel} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" p={3} textAlign="center" boxShadow="sm">
                              <Text fontSize={{ base: "lg", md: "xl" }} fontFamily="cursive" color="purple.600" lineHeight="1.1">{member.name}</Text>
                              <Box mt={2} borderTop="1px solid" borderColor={borderColor} pt={2}>
                                <Text fontWeight="semibold">{member.name}</Text>
                                <Text fontSize="sm" color="gray.500">{member.role}</Text>
                              </Box>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </Box>
                  </VStack>
                </Box>
              )}

              {questions.map((q, index) => (
                <Box key={`${q.question}-${index}`} bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="2xl" boxShadow="lg" borderWidth="1px" borderColor={submitted ? (answers[index] === q.correct ? "green.400" : "red.400") : borderColor} position="relative" overflow="hidden">
                  {submitted && <Box position="absolute" top={0} left={0} w="6px" h="full" bg={answers[index] === q.correct ? "green.400" : "red.400"} />}
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" mb={6} color={questionColor}><Text as="span" color="teal.500" mr={2}>Q{index + 1}.</Text>{q.question}</Text>
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
              <Alert status="warning" borderRadius="xl" bg={securityBannerBg} color={securityBannerText} borderWidth="1px" borderColor={securityBannerBorder}>
                <AlertIcon color={securityBannerText} />
                <Box>
                  <AlertTitle color={securityBannerText}>Tab switching detected</AlertTitle>
                  <AlertDescription color={securityBannerText}>
                    Resume now or submit the quiz. If the countdown ends, the quiz will auto-submit.
                  </AlertDescription>
                </Box>
              </Alert>
              <Box bg={securityBannerBg} borderRadius="xl" p={4} borderWidth="1px" borderColor={securityBannerBorder}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FaClock} color={securityBannerText} />
                    <Text fontWeight="semibold" color={securityBannerText}>Auto-submit countdown</Text>
                  </HStack>
                  <Badge bg={securityBadgeBg} color={securityBadgeColor} fontSize="md" px={3} py={1}>{securityCountdown}s</Badge>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3} flexWrap="wrap">
            <Button variant="outline" onClick={resumeQuiz}>Resume Quiz</Button>
            <Button colorScheme="orange" onClick={() => finalizeQuiz("Submitted after tab switching during the quiz.")}>
              Submit Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default Quiz;
