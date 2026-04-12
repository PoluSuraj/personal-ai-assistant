import React from "react";
import {
	Flex,
	Box,
	useColorModeValue,
	VStack,
	Text,
	Icon,
	Heading,
} from "@chakra-ui/react";
import ChatBox from "../components/ChatBox";
import { useSelector } from "react-redux";
import { FaClock } from "react-icons/fa";

function Chat() {
	const topic = useSelector((state) => state.chatTopic.topics);

	// Theme hooks
	const historyBoxBg = useColorModeValue("whiteAlpha.900", "rgba(10, 12, 20, 0.4)");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
	const historyItemBg = useColorModeValue("gray.50", "whiteAlpha.100");
	const historyItemHoverBg = useColorModeValue("brand.50", "whiteAlpha.200");
	const textColor = useColorModeValue("gray.800", "white");
	const mutedColor = useColorModeValue("gray.500", "gray.400");
	const scrollbarThumb = useColorModeValue("gray.200", "whiteAlpha.200");

	return (
		<Flex h="100%" width="100%" overflow="hidden">
			{/* Main Chat Area */}
			<Flex flex={1} flexDirection="column" position="relative">
				<ChatBox />
			</Flex>

			{/* Topic History Sidebar (Right) */}
			<Flex
				display={{ base: "none", lg: "flex" }}
				flexDirection="column"
				w="300px"
				borderLeftWidth="1px"
				borderColor={borderColor}
				bg={historyBoxBg}
				backdropFilter="blur(10px)"
				p={4}
				maxH="calc(100vh - 60px)"
			>
				<VStack spacing={4} align="stretch" h="full">
					<Flex align="center" gap={2} mb={2}>
						<Icon as={FaClock} color="brand.500" />
						<Heading size="sm" color={textColor}>Topic History</Heading>
					</Flex>

					<Box flex={1} overflowY="auto" pr={1} css={{
						'&::-webkit-scrollbar': { width: '4px' },
						'&::-webkit-scrollbar-track': { width: '6px' },
						'&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '24px' },
					}}>
						{topic && topic.length > 0 ? (
							<VStack spacing={2} align="stretch">
								{topic.map((item, i) => (
									<Flex
										key={i}
										p={3}
										borderRadius="xl"
										bg={historyItemBg}
										align="center"
										_hover={{ bg: historyItemHoverBg, transform: "translateX(2px)", borderColor: "brand.400", boxShadow: "0 0 10px var(--chakra-colors-brand-500)" }}
										transition="all 0.2s"
										cursor="pointer"
										borderWidth="1px"
										borderColor="transparent"
									>
										<Text fontSize="sm" color={textColor} noOfLines={2}>
											{item}
										</Text>
									</Flex>
								))}
							</VStack>
						) : (
							<Flex direction="column" align="center" justify="center" h="200px" color={mutedColor} textAlign="center">
								<Text fontStyle="italic">No history yet</Text>
								<Text fontSize="xs">Start a conversation to see topics here</Text>
							</Flex>
						)}
					</Box>
				</VStack>
			</Flex>
		</Flex>
	);
}

export default Chat;
