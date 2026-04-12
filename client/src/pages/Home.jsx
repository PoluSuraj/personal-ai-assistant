import React, { useEffect, useState } from "react";
import { Box, Text, VStack, HStack, Icon, SimpleGrid, useColorModeValue, Container, Heading, Flex, Badge, Button, Progress } from "@chakra-ui/react";
import {
	FaWikipediaW,
	FaComments,
	FaYoutube,
	FaClipboardList,
	FaUserCircle,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getHealth } from "../utils/api";


const ServiceCommandCenter = ({ onStart }) => {
	const [health, setHealth] = useState(null);
	const [loading, setLoading] = useState(true);
	const panelBg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const mutedColor = useColorModeValue("gray.600", "gray.400");

	useEffect(() => {
		let mounted = true;
		getHealth()
			.then((data) => mounted && setHealth(data))
			.catch(() => mounted && setHealth(null))
			.finally(() => mounted && setLoading(false));
		return () => { mounted = false; };
	}, []);

	const services = health?.services || {};
	const readyCount = Object.values(services).filter((value) => ["configured", "mongodb"].includes(value)).length;
	const total = Math.max(Object.keys(services).length, 1);
	const readiness = Math.round((readyCount / total) * 100);

	return (
		<Box bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl" boxShadow="xl" p={{ base: 5, md: 7 }} w="full">
			<Flex direction={{ base: "column", lg: "row" }} gap={6} justify="space-between" align={{ base: "stretch", lg: "center" }}>
				<VStack align="start" spacing={3} maxW="2xl">
					<HStack>
						<Badge colorScheme={health?.mode === "demo" ? "orange" : "green"} borderRadius="full" px={3}>
							{loading ? "Checking" : health ? `${health.mode} mode` : "Offline"}
						</Badge>
						<Badge colorScheme="teal" borderRadius="full" px={3}>{readiness}% configured</Badge>
					</HStack>
					<Heading size="lg">AI command center</Heading>
					<Text color={mutedColor}>Chat, quiz, resources, video recommendations, auth, email, and uploads all report their status here. Missing keys use fallback mode so the product remains usable.</Text>
					<Progress value={health ? readiness : 0} colorScheme={health?.mode === "demo" ? "orange" : "green"} borderRadius="full" w="full" />
				</VStack>
				<SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} minW={{ lg: "420px" }}>
					{["database", "ai", "youtube", "email", "cloudinary", "auth"].map((name) => (
						<Box key={name} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
							<Text fontSize="xs" textTransform="uppercase" color={mutedColor} fontWeight="bold">{name}</Text>
							<Text fontWeight="bold">{services[name] || "checking"}</Text>
						</Box>
					))}
				</SimpleGrid>
			</Flex>
			<Button mt={6} colorScheme="teal" onClick={onStart}>Start AI chat</Button>
		</Box>
	);
};

const FeatureCard = ({ icon, label, onClick, color, description }) => {
	// Premium Glassmorphism Card with enhanced interactions
	const bg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.6)");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
	const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);

	return (
		<VStack
			bg={bg}
			backdropFilter="blur(20px)"
			p={8}
			borderRadius="3xl"
			borderWidth="1px"
			borderColor={borderColor}
			cursor="pointer"
			transition="all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
			position="relative"
			overflow="hidden"
			align="flex-start"
			spacing={6}
			h="full"
			role="group"
			_hover={{
				transform: "translateY(-12px)",
				boxShadow: "2xl",
				borderColor: `${color}.500`,
			}}
			onClick={onClick}
		>
			{/* Subtle Gradient Overlay on Hover */}
			<Box
				position="absolute"
				top={0}
				left={0}
				right={0}
				bottom={0}
				bgGradient={`linear(to-br, ${color}.500, transparent)`}
				opacity={0}
				_groupHover={{ opacity: 0.08 }}
				transition="opacity 0.4s"
			/>

			{/* Glowing Icon Container */}
			<Flex
				p={5}
				borderRadius="2xl"
				bg={iconBg}
				color={iconColor}
				boxShadow="lg"
				transition="all 0.3s"
				_groupHover={{
					scale: 1.1,
					boxShadow: `0 10px 20px -5px ${color}.300`, // Colored shadow 
					bg: `${color}.500`,
					color: "white"
				}}
			>
				<Icon as={icon} boxSize={8} />
			</Flex>

			<VStack align="flex-start" spacing={3} zIndex={1}>
				<Text
					fontWeight="800"
					fontSize="2xl"
					letterSpacing="tight"
					_groupHover={{ color: `${color}.600` }}
					transition="color 0.2s"
				>
					{label}
				</Text>
				<Text fontSize="md" color="gray.500" lineHeight="tall" noOfLines={3}>
					{description}
				</Text>
			</VStack>

			{/* Arrow Icon for interaction hint */}
			<Box
				position="absolute"
				bottom={8}
				right={8}
				opacity={0}
				transform="translateX(-20px)"
				_groupHover={{ opacity: 1, transform: "translateX(0)" }}
				transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
				color={`${color}.500`}
			>
				<Icon viewBox="0 0 24 24" boxSize={6} fill="currentColor">
					<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
				</Icon>
			</Box>
		</VStack>
	);
};

function Home() {
	const navigate = useNavigate();
	const userData = useSelector((state) => state.authSlice.userData);

	useEffect(() => {
		if (!userData) {
			navigate("/authentication/login");
		}
	}, [userData, navigate]);

	const headingGradient = useColorModeValue(
		"linear(to-r, brand.600, purple.600)",
		"linear(to-r, brand.400, purple.400)"
	);

	return (
		<Box w="100vw" minH="100vh" overflowX="hidden" position="relative">
			{/* Premium Mesh Gradient Background */}
			<Box
				position="absolute"
				top="0"
				left="0"
				right="0"
				bottom="0"
				zIndex={-1}
				bg={useColorModeValue("gray.50", "gray.900")}
				overflow="hidden"
			>
				{/* Subtle Noise Texture for Premium Feel */}
				<Box
					position="absolute"
					top="0"
					left="0"
					w="100%"
					h="100%"
					opacity={useColorModeValue(0.4, 0.1)}
					backgroundImage="url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
					filter="contrast(120%) brightness(100%)"
				/>

				<Box
					position="absolute"
					top="-20%"
					right="-10%"
					w="70vw"
					h="70vw"
					bgGradient="radial(brand.400, transparent 60%)"
					filter="blur(120px)"
					opacity={0.15}
					animation="pulse 10s infinite alternate"
				/>
				<Box
					position="absolute"
					bottom="-10%"
					left="-10%"
					w="60vw"
					h="60vw"
					bgGradient="radial(accent.400, transparent 60%)" // Using accent color for contrast
					filter="blur(120px)"
					opacity={0.1}
					animation="pulse 15s infinite alternate-reverse"
				/>
			</Box>

			<Container maxW="container.xl" pt={{ base: 20, lg: 32 }} pb={20}>
				<VStack spacing={16} align="center" w="full">
					{/* Header Content - Centered and Premium */}
					<VStack align="center" spacing={4} textAlign="center" maxW="3xl" zIndex={1} position="relative">
						{/* Decorative Glow behind text */}
						<Box
							position="absolute"
							top="50%"
							left="50%"
							transform="translate(-50%, -50%)"
							w="300px"
							h="300px"
							bgGradient="radial(brand.400, transparent 70%)"
							filter="blur(70px)"
							opacity={0.3}
							zIndex={-1}
						/>

						<Text
							textTransform="uppercase"
							color="brand.600"
							fontWeight="bold"
							fontSize="sm"
							letterSpacing="wider"
						>
							Professional Training Assistant
						</Text>
						<Heading
							as="h1"
							size="3xl"
							fontWeight="800"
							bgGradient={headingGradient}
							bgClip="text"
							lineHeight="1.1"
							letterSpacing="tight"
							pb={2}
						>
							Hello, {userData?.name?.split(" ")[0] || "User"}
						</Heading>
						<Text
							fontSize="2xl"
							color="gray.500"
							fontWeight="medium"
							lineHeight="tall"
						>
							Everything you need to succeed, all in one place.
						</Text>
					</VStack>

					<ServiceCommandCenter onStart={() => navigate("/chat")} />

					{/* Cards Grid - Spread out professionally */}
					<SimpleGrid
						columns={{ base: 1, md: 2, lg: 4 }}
						spacing={8}
						w="full"
						px={{ base: 4, lg: 0 }}
					>
						<FeatureCard
							icon={FaComments}
							label="AI Chat"
							description="Instant answers and natural conversations."
							color="brand"
							onClick={() => navigate("/chat")}
						/>
						<FeatureCard
							icon={FaWikipediaW}
							label="Knowledge Base"
							description="Access vast information instantly."
							color="blue"
							onClick={() => navigate("/wikipedia-search")}
						/>
						<FeatureCard
							icon={FaYoutube}
							label="Video Insights"
							description="Curated educational video content."
							color="red"
							onClick={() => navigate("/youtube-recommendation")}
						/>
						<FeatureCard
							icon={FaClipboardList}
							label="Skill Quiz"
							description="Test and improve your knowledge."
							color="green"
							onClick={() => navigate("/quiz")}
						/>
					</SimpleGrid>
				</VStack>

				{/* CSS Animation for Floating Effect */}
				<style>
					{`
						@keyframes float {
							0% { transform: translateY(0px); }
							50% { transform: translateY(-20px); }
							100% { transform: translateY(0px); }
						}
						@keyframes pulse {
							0% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
							50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
							100% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
						}
					`}
				</style>
			</Container>
		</Box>
	);
}

export default Home;
