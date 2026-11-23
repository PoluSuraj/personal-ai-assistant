import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FaBolt, FaDownload, FaGraduationCap, FaMobileAlt, FaShareSquare } from "react-icons/fa";

export default function InstallAppButton({ size = "sm", variant = "outline", fullWidth = false }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    setInstalled(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
      onClose();
    }
    setInstallEvent(null);
  };

  if (installed) return null;

  return (
    <>
      <Button size={size} width={fullWidth ? "full" : undefined} variant={variant} leftIcon={<FaDownload />} onClick={onOpen}>
        {fullWidth ? "Get the learning app" : "Get the app"}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.700" />
        <ModalContent mx={{ base: 0, sm: 4 }} overflow="hidden" borderRadius={{ base: 0, sm: "xl" }} bg="gray.900" color="white" border="1px solid" borderColor="whiteAlpha.200">
          <Box bg="linear-gradient(120deg, #5136d8 0%, #177d85 100%)" px={{ base: 6, sm: 8 }} pt={{ base: 10, sm: 8 }} pb={7}>
            <ModalCloseButton color="white" top={4} right={4} />
            <Flex boxSize={14} borderRadius="lg" bg="whiteAlpha.200" align="center" justify="center" mb={5}>
              <Icon as={FaGraduationCap} boxSize={7} />
            </Flex>
            <Badge color="white" bg="blackAlpha.300" borderRadius="full" px={3} py={1} mb={3}>YOUR LEARNING SPACE</Badge>
            <Heading size="lg" lineHeight="1.2">Learning, one tap away.</Heading>
            <Text mt={2} color="whiteAlpha.900">Add your study tools to your home screen for a focused, app-like experience.</Text>
          </Box>
          <ModalHeader pb={0}>Ready whenever you are</ModalHeader>
          <ModalBody pt={3}>
            <VStack align="stretch" spacing={3}>
              <HStack align="start" spacing={3}>
                <Icon as={FaMobileAlt} color="teal.200" mt={1} />
                <Box><Text fontWeight="semibold">A place on your home screen</Text><Text fontSize="sm" color="whiteAlpha.700">Open your learning space without searching for the browser tab.</Text></Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Icon as={FaBolt} color="yellow.300" mt={1} />
                <Box><Text fontWeight="semibold">Quick, app-like access</Text><Text fontSize="sm" color="whiteAlpha.700">Launch straight into your lessons, chat, and quizzes.</Text></Box>
              </HStack>
              {showInstructions ? (
                <Box p={4} borderRadius="md" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200">
                  <Text fontWeight="bold" mb={1}>{isIos ? "Add on iPhone or iPad" : "Add from your browser"}</Text>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    {isIos
                      ? "Tap Share in Safari, then choose Add to Home Screen and confirm."
                      : "Open your browser menu and choose Add to Home screen or the browser’s installation option. The exact wording may vary."}
                  </Text>
                  {isIos ? <Icon as={FaShareSquare} color="teal.200" mt={3} boxSize={5} /> : null}
                </Box>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter gap={3} pb={{ base: "calc(env(safe-area-inset-bottom) + 5)", sm: 5 }}>
            <Button variant="ghost" onClick={onClose}>Maybe later</Button>
            <Button colorScheme="teal" leftIcon={<FaDownload />} onClick={install}>{installEvent ? "Add to home screen" : "Show me how"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
