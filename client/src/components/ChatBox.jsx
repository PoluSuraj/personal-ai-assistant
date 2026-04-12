import React, { useEffect, useRef, useState } from "react";
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
} from "@chakra-ui/react";
import { FaMicrophone, FaPaperPlane, FaTrash, FaRobot, FaLightbulb } from "react-icons/fa";
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

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [botTyping, setBotTyping] = useState(false);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
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

  useEffect(() => {
    if (prevChats?.length) {
      setMessages(prevChats);
    }
  }, [prevChats]);

  useEffect(() => {
    dispatch(setChat(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dispatch, messages]);

  const handleSendMessage = async (messageText = input) => {
    const trimmedInput = messageText.trim();
    if (!trimmedInput || botTyping) return;

    const newMessage = { text: trimmedInput, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
    setBotTyping(true);

    try {
      const data = await apiFetch("/api/v1/chat/getResponse", {
        method: "POST",
        body: JSON.stringify({ question: `Teach this clearly with examples and next steps: ${trimmedInput}` }),
      });

      const aiText = data?.data?.ai_response || "I could not generate a useful answer for that. Try asking in a different way.";
      setMessages((prevMessages) => [...prevMessages, { text: aiText, sender: "bot" }]);

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
      setMessages((prevMessages) => [...prevMessages, { text: isUnauthorizedError(error) ? "Your session expired. Please sign in again and resend your message." : "I could not reach the AI service. Please check the backend and try again.", sender: "bot" }]);
    } finally {
      setBotTyping(false);
    }
  };

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
    toast({ title: "Chat cleared", status: "info", duration: 2000 });
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice input is not supported", description: "Try Chrome or type your question instead.", status: "warning", duration: 3000 });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onerror = (event) => toast({ title: "Voice input failed", description: event.error, status: "error", duration: 3000 });
    recognition.start();
  };

  return (
    <Flex direction="column" h="100%" w="full" position="relative">
      <Box px={6} pt={6} pb={0}>
        <Flex direction="row" align="center" bgGradient="linear(to-r, brand.600, accent.600)" p={5} borderRadius="2xl" color="white" boxShadow="xl" position="relative" overflow="hidden">
          <Box position="absolute" top="-50px" right="-50px" boxSize="150px" bg="whiteAlpha.200" borderRadius="full" />
          <HStack spacing={4} zIndex={1}>
            <Box p={2} bg="whiteAlpha.200" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.300">
              <Icon as={FaRobot} boxSize={6} color="white" />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" fontWeight="bold">AI Knowledge Hub</Heading>
              <Text fontSize="xs" opacity={0.9} fontWeight="medium" letterSpacing="wide">PROFESSIONAL ASSISTANT</Text>
            </VStack>
          </HStack>
        </Flex>
      </Box>

      <Box flex={1} overflowY="auto" p={6} scrollBehavior="smooth" css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '24px' } }}>
        <VStack spacing={6} align="stretch" pb={4}>
          {messages.length === 0 && (
            <VStack spacing={4} bg={emptyBg} border="1px solid" borderColor={borderColor} borderRadius="2xl" p={6} align="stretch">
              <HStack>
                <Icon as={FaLightbulb} color="brand.500" />
                <Heading size="sm">Start with a training goal</Heading>
              </HStack>
              <Text color="gray.500">Ask for an explanation, a plan, examples, or practice questions. I will save useful topics for quizzes and resources.</Text>
              <HStack flexWrap="wrap" spacing={2}>
                {starterPrompts.map((prompt) => (
                  <Button key={prompt} size="sm" bg={starterBg} variant="ghost" onClick={() => handleSendMessage(prompt)} whiteSpace="normal" h="auto" py={2}>
                    {prompt}
                  </Button>
                ))}
              </HStack>
            </VStack>
          )}

          {messages.map((msg, index) => (
            <HStack key={`${msg.sender}-${index}`} justify={msg.sender === "user" ? "flex-end" : "flex-start"} align="flex-start" spacing={3}>
              {msg.sender === "bot" && <Box p={1} bg="brand.500" borderRadius="full" boxShadow="0 0 10px var(--chakra-colors-brand-500)"><Text fontSize="xs">AI</Text></Box>}
              <Box bg={msg.sender === "user" ? "transparent" : botBg} bgGradient={msg.sender === "user" ? "linear(to-r, brand.500, brand.600)" : undefined} color={msg.sender === "user" ? "white" : botColor} backdropFilter={msg.sender === "bot" ? "blur(10px)" : undefined} border="1px solid" borderColor={msg.sender === "bot" ? borderColor : "transparent"} px={5} py={3} borderRadius="2xl" borderBottomRightRadius={msg.sender === "user" ? "none" : "2xl"} borderBottomLeftRadius={msg.sender === "bot" ? "none" : "2xl"} maxW={{ base: "92%", md: "80%" }} boxShadow={msg.sender === "user" ? "lg" : "sm"}>
                <ReactMarkdown components={markdownComponents} rehypePlugins={[rehypeRaw, rehypeHighlight]}>{msg.text}</ReactMarkdown>
              </Box>
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
        <HStack w="full" bg={inputShellBg} backdropFilter="blur(20px)" p={2} borderRadius="full" boxShadow="xl" border="1px solid" borderColor={inputBorder} spacing={2}>
          <IconButton icon={<FaMicrophone />} aria-label="Voice Input" colorScheme="brand" variant="ghost" rounded="full" onClick={handleVoiceInput} />
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything..." flex={1} variant="unstyled" px={4} fontSize="md" color={inputColor} />
          <IconButton icon={<FaPaperPlane />} onClick={() => handleSendMessage()} aria-label="Send" colorScheme="brand" rounded="full" size="md" boxShadow="lg" isDisabled={!input.trim() || botTyping} isLoading={botTyping} />
          <IconButton icon={<FaTrash />} onClick={handleClearChat} aria-label="Clear Chat" colorScheme="red" variant="ghost" rounded="full" size="sm" />
        </HStack>
      </Box>
    </Flex>
  );
}

export default ChatBox;
