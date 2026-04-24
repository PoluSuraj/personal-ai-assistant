import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  IconButton,
  Input,
  Flex,
  useColorModeValue,
  Heading,
  Text,
  UnorderedList,
  Icon,
  Button,
  useToast,
  Switch,
  Tooltip,
  Select,
  Badge,
} from "@chakra-ui/react";
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaTrash, FaRobot, FaLightbulb, FaVolumeUp, FaVolumeMute, FaGlobe } from "react-icons/fa";
import { addTopic, deleteTopic } from "../store/chatTopicSlice";
import { useDispatch, useSelector } from "react-redux";
import { deleteChat, setChat } from "../store/prevChatSlice";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { apiFetch, isUnauthorizedError } from "../utils/api";
import { useNavigate } from "react-router-dom";

const starterPrompts = [
  "Create a 7-day study plan for JavaScript",
  "Explain operating systems with examples",
  "Quiz me on database normalization",
  "Summarize machine learning basics",
];

const languageOptions = [
  { value: "en-US", label: "English" },
  { value: "hi-IN", label: "Hindi" },
  { value: "te-IN", label: "Telugu" },
  { value: "ta-IN", label: "Tamil" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "mr-IN", label: "Marathi" },
  { value: "bn-IN", label: "Bengali" },
  { value: "gu-IN", label: "Gujarati" },
  { value: "pa-IN", label: "Punjabi" },
  { value: "ur-PK", label: "Urdu" },
  { value: "ar-SA", label: "Arabic" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "ru-RU", label: "Russian" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese" },
];

const markdownComponents = {
  h1: (props) => <Heading as="h1" size="xl" my={2} {...props} />,
  h2: (props) => <Heading as="h2" size="lg" my={2} {...props} />,
  h3: (props) => <Heading as="h3" size="md" my={2} {...props} />,
  p: (props) => <Text fontSize="md" my={2} {...props} />,
  ul: ({ children, ...props }) => (
    <UnorderedList pl={5} my={2} {...props}>{children}</UnorderedList>
  ),
  li: ({ children, ...props }) => <Box as="li" mb={1} ml={4} {...props}>{children}</Box>,
  code: (props) => (
    <Box as="code" bg="gray.100" color="purple.600" px={2} py={1} borderRadius="md" fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap" fontWeight="semibold" {...props} />
  ),
  pre: (props) => (
    <Box as="pre" bg="gray.900" color="white" p={4} borderRadius="md" overflowX="auto" fontSize="sm" fontFamily="mono" mb={4} border="1px solid" borderColor="gray.700" boxShadow="md" {...props} />
  ),
};

function ChatBox({ autoStartVoice = false, voiceMode = false }) {
  const preferredBrowserLanguage = typeof window !== "undefined" ? window.navigator.language : "en-US";
  const normalizedDefaultLanguage = languageOptions.some((option) => option.value === preferredBrowserLanguage)
    ? preferredBrowserLanguage
    : preferredBrowserLanguage?.split?.("-")?.[0] === "hi"
      ? "hi-IN"
      : "en-US";

  const [messages, setMessages] = useState([]);
  const [botTyping, setBotTyping] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(normalizedDefaultLanguage);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const prevChats = useSelector((state) => state.chatHistory.chats);
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();

  const botBg = useColorModeValue("white", "whiteAlpha.200");
  const botColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const scrollbarThumb = useColorModeValue("gray.200", "whiteAlpha.200");
  const inputShellBg = useColorModeValue("white", "rgba(20, 20, 30, 0.6)");
  const inputBorder = useColorModeValue("gray.100", "whiteAlpha.100");
  const inputColor = useColorModeValue("gray.800", "white");
  const emptyBg = useColorModeValue("whiteAlpha.800", "whiteAlpha.100");
  const starterBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const controlBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");

  const speechRecognitionSupported = useMemo(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );
  const speechSynthesisSupported = useMemo(
    () => typeof window !== "undefined" && !!window.speechSynthesis,
    []
  );

  useEffect(() => {
    if (prevChats?.length) {
      setMessages(prevChats);
    }
  }, [prevChats]);

  useEffect(() => {
    dispatch(setChat(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dispatch, messages]);

  useEffect(() => {
    if (!speechSynthesisSupported) return undefined;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices?.() || [];
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechSynthesisSupported]);

  const getSpeechVoice = useCallback(() => {
    if (!speechSynthesisSupported) return null;
    const baseLanguage = selectedLanguage.split("-")[0];
    const exactVoices = availableVoices.filter((voice) => voice.lang === selectedLanguage);
    const familyVoices = availableVoices.filter((voice) => voice.lang?.startsWith(baseLanguage));
    const rankedVoices = [...exactVoices, ...familyVoices, ...availableVoices].filter(Boolean);

    return (
      rankedVoices.find((voice) => voice.localService && /google|microsoft|samantha|zira|veena|lekha|ravi/i.test(voice.name)) ||
      rankedVoices.find((voice) => voice.localService) ||
      rankedVoices[0] ||
      null
    );
  }, [availableVoices, selectedLanguage, speechSynthesisSupported]);

  const speakText = useCallback((text, forcePlay = false) => {
    if ((!voiceReplies && !forcePlay) || !speechSynthesisSupported || !text) return;
    const plainText = text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#$>*_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!plainText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    const matchingVoice = getSpeechVoice();
    if (matchingVoice) utterance.voice = matchingVoice;
    window.speechSynthesis.speak(utterance);
  }, [availableVoices, selectedLanguage, speechSynthesisSupported, voiceReplies]);

  const handleSendMessage = useCallback(async (messageText = input) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || botTyping) return;

    const newMessage = { text: trimmedInput, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setBotTyping(true);

    try {
      const data = await apiFetch("/api/v1/chat/getResponse", {
        method: "POST",
        body: JSON.stringify({
          question: `Reply in a clear, helpful way. If the user wrote in ${selectedLanguage}, respond naturally for that language when appropriate: ${trimmedInput}`,
        }),
      });

      const aiText = data?.data?.ai_response || "I could not generate a useful answer for that. Try asking in a different way.";
      setMessages((prevMessages) => [...prevMessages, { text: aiText, sender: "bot" }]);
      speakText(aiText);

      if (data?.data?.topic) dispatch(addTopic(data.data.topic));
    } catch (error) {
      console.error("Error fetching response:", error);
      const description = isUnauthorizedError(error)
        ? "Your session expired. Please sign in again to keep chatting."
        : error.message || "Please try again.";
      toast({ title: isUnauthorizedError(error) ? "Session expired" : "AI request failed", description, status: "error", duration: 3500, isClosable: true });
      if (isUnauthorizedError(error)) {
        navigate("/authentication/login");
      }
      const fallbackText = isUnauthorizedError(error)
        ? "Your session expired. Please sign in again and resend your message."
        : "I could not reach the AI service. Please check the backend and try again.";
      setMessages((prevMessages) => [...prevMessages, { text: fallbackText, sender: "bot" }]);
    } finally {
      setBotTyping(false);
    }
  }, [botTyping, dispatch, input, navigate, selectedLanguage, speakText, toast]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    dispatch(deleteChat());
    dispatch(deleteTopic());
    if (speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    toast({ title: "Chat cleared", status: "info", duration: 2000 });
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const handleVoiceInput = useCallback((quiet = false) => {
    if (!speechRecognitionSupported) {
      toast({ title: "Voice input is not supported", description: "Try Chrome or Edge, or type your question instead.", status: "warning", duration: 3000 });
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setIsListening(true);

    if (!quiet) {
      toast({ title: "Voice assistant listening", description: `Speak in ${languageOptions.find((item) => item.value === selectedLanguage)?.label || "your selected language"}.`, status: "info", duration: 2200 });
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setInput(transcript);

      const finalResult = Array.from(event.results).find((result) => result.isFinal);
      if (finalResult) {
        const finalTranscript = finalResult[0]?.transcript?.trim();
        if (finalTranscript) {
          setInput(finalTranscript);
          handleSendMessage(finalTranscript);
        }
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast({ title: "Voice input failed", description: event.error, status: "error", duration: 3000 });
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [handleSendMessage, isListening, selectedLanguage, speechRecognitionSupported, toast]);

  useEffect(() => {
    if (!autoStartVoice || !speechRecognitionSupported) return;
    const timer = window.setTimeout(() => {
      handleVoiceInput(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [autoStartVoice, handleVoiceInput, speechRecognitionSupported]);

  const toggleVoiceReplies = () => {
    const nextValue = !voiceReplies;
    setVoiceReplies(nextValue);

    if (!nextValue && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }

    if (nextValue) {
      const lastBotMessage = [...messages].reverse().find((message) => message.sender === "bot");
      if (lastBotMessage) {
        window.setTimeout(() => speakText(lastBotMessage.text, true), 120);
      }
    }

    toast({
      title: nextValue ? "Voice reading turned on" : "Voice reading turned off",
      description: nextValue ? "The assistant will now read the latest answer and future answers aloud." : "The assistant will stay silent until you turn voice reading on again.",
      status: "info",
      duration: 2400,
    });
  };

  return (
    <Flex direction="column" h="100%" w="full" position="relative">
      <Box px={6} pt={6} pb={0}>
        <Flex direction="column" bgGradient="linear(to-r, brand.600, accent.600)" p={5} borderRadius="2xl" color="white" boxShadow="xl" position="relative" overflow="hidden" gap={4}>
          <Box position="absolute" top="-50px" right="-50px" boxSize="150px" bg="whiteAlpha.200" borderRadius="full" />
          <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} zIndex={1}>
            <HStack spacing={4}>
              <Box p={2} bg="whiteAlpha.200" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.300">
                <Icon as={FaRobot} boxSize={6} color="white" />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="md" fontWeight="bold">{voiceMode ? "Voice Assistant" : "AI Knowledge Hub"}</Heading>
                <Text fontSize="xs" opacity={0.9} fontWeight="medium" letterSpacing="wide">{voiceMode ? "SPEAK DIRECTLY IN YOUR LANGUAGE" : "PROFESSIONAL ASSISTANT"}</Text>
              </VStack>
            </HStack>
            <HStack spacing={3} align="center" flexWrap="wrap">
              <HStack spacing={2} bg="whiteAlpha.200" borderRadius="full" px={3} py={1.5}>
                <Icon as={voiceReplies ? FaVolumeUp : FaVolumeMute} boxSize={3.5} />
                <Text fontSize="xs" fontWeight="semibold">Voice replies</Text>
                <Switch size="sm" colorScheme="green" isChecked={voiceReplies} onChange={toggleVoiceReplies} />
              </HStack>
            </HStack>
          </Flex>
          <HStack spacing={3} zIndex={1} flexWrap="wrap" align="center">
            <HStack bg="whiteAlpha.200" borderRadius="xl" px={3} py={2} spacing={3} minW={{ base: "full", md: "260px" }}>
              <Icon as={FaGlobe} />
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                variant="unstyled"
                color="white"
                iconColor="white"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value} style={{ color: '#111827' }}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </HStack>
            {voiceMode ? (
              <Badge colorScheme="whiteAlpha" px={3} py={2} borderRadius="full">
                Speak naturally. The assistant will listen and respond.
              </Badge>
            ) : null}
          </HStack>
        </Flex>
      </Box>

      <Box flex={1} overflowY="auto" p={6} scrollBehavior="smooth" css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '24px' } }}>
        <VStack spacing={6} align="stretch" pb={4}>
          {messages.length === 0 && (
            <VStack spacing={4} bg={emptyBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={6} align="stretch">
              <HStack>
                <Icon as={FaLightbulb} color="brand.500" />
                <Heading size="sm">{voiceMode ? "Start with your voice" : "Start with a training goal"}</Heading>
              </HStack>
              <Text color="gray.500">
                {voiceMode
                  ? "Choose your language, tap the microphone, and explain your issue directly. The assistant will understand the spoken prompt and answer in text and voice when available."
                  : "Ask for an explanation, a plan, examples, or practice questions. You can speak your prompt and the assistant can read the answer back."}
              </Text>
              <HStack flexWrap="wrap" spacing={2}>
                {starterPrompts.map((prompt) => (
                  <Button key={prompt} size="sm" bg={starterBg} variant="ghost" onClick={() => handleSendMessage(prompt)} whiteSpace="normal" h="auto" py={2}>
                    {prompt}
                  </Button>
                ))}
              </HStack>
              {voiceMode ? (
                <Button colorScheme="purple" size="md" alignSelf="start" onClick={() => handleVoiceInput()} leftIcon={<Icon as={isListening ? FaMicrophoneSlash : FaMicrophone} boxSize={3.5} />}>
                  {isListening ? "Stop listening" : "Start voice assistant"}
                </Button>
              ) : null}
            </VStack>
          )}

          {messages.map((msg, index) => (
            <HStack key={`${msg.sender}-${index}`} justify={msg.sender === "user" ? "flex-end" : "flex-start"} align="flex-start" spacing={3}>
              {msg.sender === "bot" && <Box p={1} bg="brand.500" borderRadius="full" boxShadow="0 0 10px var(--chakra-colors-brand-500)"><Text fontSize="xs">AI</Text></Box>}
              <Box bg={msg.sender === "user" ? "transparent" : botBg} bgGradient={msg.sender === "user" ? "linear(to-r, brand.500, brand.600)" : undefined} color={msg.sender === "user" ? "white" : botColor} backdropFilter={msg.sender === "bot" ? "blur(10px)" : undefined} border="1px solid" borderColor={msg.sender === "bot" ? borderColor : "transparent"} px={5} py={3} borderRadius="2xl" borderBottomRightRadius={msg.sender === "user" ? "none" : "2xl"} borderBottomLeftRadius={msg.sender === "bot" ? "none" : "2xl"} maxW={{ base: "92%", md: "80%" }} boxShadow={msg.sender === "user" ? "lg" : "sm"}>
                <ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeRaw, rehypeHighlight]}>{msg.text}</ReactMarkdown>
              </Box>
              {msg.sender === "bot" && speechSynthesisSupported ? (
                <Tooltip label="Read aloud" hasArrow>
                  <IconButton icon={<FaVolumeUp />} aria-label="Read aloud" size="sm" variant="ghost" onClick={() => speakText(msg.text)} />
                </Tooltip>
              ) : null}
              {msg.sender === "user" && <Box p={1} bg="accent.500" borderRadius="full" boxShadow="lg"><Text fontSize="xs">You</Text></Box>}
            </HStack>
          ))}

          {botTyping && (
            <HStack align="center" spacing={3}>
              <Box p={1} bg="brand.500" borderRadius="full"><Text fontSize="xs">AI</Text></Box>
              <Box bg={botBg} color={botColor} px={5} py={3} borderRadius="2xl" borderBottomLeftRadius="none" fontStyle="italic" fontSize="sm" boxShadow="sm" border="1px solid" borderColor={borderColor}>Thinking...</Box>
            </HStack>
          )}
          <div ref={chatEndRef}></div>
        </VStack>
      </Box>

      <Box p={4} pb={6}>
        <VStack align="stretch" spacing={3}>
          {voiceMode ? (
            <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} bg={controlBg} border="1px solid" borderColor={inputBorder} borderRadius="2xl" px={4} py={3}>
              <Text fontSize="sm" color={inputColor}>
                {speechRecognitionSupported
                  ? `Voice assistant is ready for ${languageOptions.find((item) => item.value === selectedLanguage)?.label || "your selected language"}.`
                  : "Voice assistant needs a browser with speech recognition support."}
              </Text>
              <Button colorScheme={isListening ? "red" : "purple"} size="md" onClick={() => handleVoiceInput()} leftIcon={<Icon as={isListening ? FaMicrophoneSlash : FaMicrophone} boxSize={3.5} />}>
                {isListening ? "Stop listening" : "Start voice assistant"}
              </Button>
            </Flex>
          ) : null}
          <HStack w="full" bg={inputShellBg} backdropFilter="blur(20px)" p={2} borderRadius="full" boxShadow="xl" border="1px solid" borderColor={inputBorder} spacing={2}>
            <Tooltip label={speechRecognitionSupported ? (isListening ? "Stop voice assistant" : "Speak to ask") : "Voice input not supported"} hasArrow>
              <IconButton icon={<Icon as={isListening ? FaMicrophoneSlash : FaMicrophone} boxSize={4} />} aria-label="Voice Input" colorScheme={isListening ? "red" : "brand"} variant={isListening ? "solid" : "ghost"} rounded="full" size="sm" onClick={() => handleVoiceInput()} />
            </Tooltip>
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isListening ? "Listening... say your question" : voiceMode ? "Or type your issue here..." : "Ask anything..."} flex={1} variant="unstyled" px={4} fontSize="md" color={inputColor} />
            <IconButton icon={<FaPaperPlane />} onClick={() => handleSendMessage()} aria-label="Send" colorScheme="brand" rounded="full" size="md" boxShadow="lg" isDisabled={!input.trim() || botTyping} isLoading={botTyping} />
            <IconButton icon={<FaTrash />} onClick={handleClearChat} aria-label="Clear Chat" colorScheme="red" variant="ghost" rounded="full" size="sm" />
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}

export default ChatBox;
