import { useState, useEffect, useRef } from "react";
import {
	Box,
	Button,
	Input,
	Text,
	Flex,
	VStack,
	Heading,
	useColorModeValue,
	HStack,
	Badge,
	useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login as authLogin } from "../store/authSlice.js";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { API_BASE_URL } from "../utils/api";

export default function OtpVerification() {
	const { email } = useParams();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();

	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [timer, setTimer] = useState(10 * 60); // 10 minutes
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const devOtp = location.state?.devOtp;

	const firstInputRef = useRef(null);

	// Theme colors
	const inputBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const inputBorder = useColorModeValue("gray.200", "whiteAlpha.100");
	const brandGradient = "linear(to-r, brand.600, brand.400)";
	const bgPage = useColorModeValue("linear(to-br, gray.50, brand.50)", "gray.900");
	const otpTextColor = useColorModeValue("gray.800", "white");
	const formBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.8)");
	const formBorder = useColorModeValue("whiteAlpha.500", "whiteAlpha.100");
	const backHoverBg = useColorModeValue("brand.50", "whiteAlpha.100");

	useEffect(() => {
		firstInputRef.current?.focus();
	}, []);

	const handleChange = (index, value) => {
		setError("");
		const digits = value.replace(/\D/g, "");
		if (!digits) {
			const nextOtp = [...otp];
			nextOtp[index] = "";
			setOtp(nextOtp);
			return;
		}

		const nextOtp = [...otp];
		digits.slice(0, 6 - index).split("").forEach((digit, offset) => {
			nextOtp[index + offset] = digit;
		});
		setOtp(nextOtp);

		const nextIndex = Math.min(index + digits.length, 5);
		document.getElementById(`otp-input-${nextIndex}`)?.focus();
	};

	const handleKeyDown = (index, event) => {
		if (event.key === "Backspace" && !otp[index] && index > 0) {
			document.getElementById(`otp-input-${index - 1}`)?.focus();
		}
	};

	const useDevOtp = () => {
		if (!devOtp) return;
		setOtp(String(devOtp).slice(0, 6).padEnd(6, "").split(""));
		toast({ title: "OTP filled", description: "Using the development OTP from the server response.", status: "info", duration: 2500 });
	};

	const handleNext = async () => {
		if (timer === 0) {
			setError("Time expired. Please request a new OTP.");
			return;
		}

		setLoading(true);
		const completeOtp = otp.join("");

		try {
			const response = await fetch(`${API_BASE_URL}/api/v1/users/verifyOTP`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ otp: completeOtp, email }),
				credentials: "include"
			});

			if (!response.ok) {
				setError("Verification failed. Please try again.");
				return;
			}

			const data = await response.json();
			if (data.message === "Verified Success") {
				dispatch(authLogin(data.data));
				navigate("/");
			} else {
				setError("Incorrect OTP. Please check and try again.");
			}
		} catch (err) {
			console.error(err);
			setError("Server error. Try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (timer > 0) {
			const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
			return () => clearInterval(interval);
		}
	}, [timer]);

	const handleBack = () => {
		navigate(-1);
	};

	return (
		<Flex w="100vw" minH="100dvh" overflowY={{ base: "auto", lg: "hidden" }} direction={{ base: "column", lg: "row" }}>
			{/* Left Side - Premium Image & Glass Overlay */}
			<Box
				display={{ base: "none", lg: "flex" }}
				w="50%"
				h="full"
				bgImage="url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop')"
				bgSize="cover"
				bgPos="center"
				position="relative"
				alignItems="center"
				justifyContent="center"
			>
				{/* Dark Overlay for Readability */}
				<Box
					position="absolute"
					top="0"
					left="0"
					w="full"
					h="full"
					bg="blackAlpha.600"
					backdropFilter="blur(5px)"
				/>

				{/* Content Overlay */}
				<VStack
					position="relative"
					zIndex={1}
					spacing={8}
					textAlign="center"
					color="white"
					p={12}
					maxW="lg"
				>
					<Box
						p={8}
						bg="whiteAlpha.100"
						backdropFilter="blur(20px)"
						borderRadius="3xl"
						border="1px solid"
						borderColor="whiteAlpha.200"
						boxShadow="2xl"
					>
						<Heading
							fontSize="5xl"
							fontWeight="800"
							lineHeight="1.1"
							mb={4}
							letterSpacing="tight"
						>
							Verify Your Identity
						</Heading>
						<Text fontSize="lg" color="whiteAlpha.800" fontWeight="medium">
							Enter the one-time password sent to your email to continue securely.
						</Text>
					</Box>
				</VStack>
			</Box>

			{/* Right Side - Clean Premium Form */}
			<Flex
				w={{ base: "100%", lg: "50%" }}
				minH={{ base: "100dvh", lg: "100vh" }}
				align="center"
				justify="center"
				bg={bgPage}
				position="relative"
			>
				{/* Decorative Background Elements on Form Side */}
				<Box
					position="absolute"
					top="-10%"
					right="-10%"
					w="500px"
					h="500px"
					bgGradient="radial(brand.200, transparent 60%)"
					opacity={0.4}
					filter="blur(80px)"
					animation="pulse 10s infinite alternate"
				/>
				<Box
					position="absolute"
					bottom="-10%"
					left="-10%"
					w="400px"
					h="400px"
					bgGradient="radial(accent.200, transparent 60%)"
					opacity={0.3}
					filter="blur(80px)"
					animation="pulse 15s infinite alternate-reverse"
				/>

				{/* Premium Glass/Card Form Container */}
				<VStack
					w="calc(100% - 32px)"
					maxW="md"
					p={{ base: 6, sm: 8, md: 10 }}
					spacing={8}
					bg={formBg}
					backdropFilter="blur(20px)"
					borderRadius="3xl"
					boxShadow="2xl"
					border="1px solid"
					borderColor={formBorder}
					zIndex={1}
				>
					{/* Header */}
					<VStack spacing={3} w="full" align="flex-start">
						<Text
							color="brand.600"
							fontWeight="bold"
							textTransform="uppercase"
							fontSize="xs"
							letterSpacing="wider"
						>
							Secure Access
						</Text>
						<Heading fontSize="3xl" fontWeight="900" letterSpacing="tight">
							OTP Verification
						</Heading>
						<Text color="gray.500" fontSize="md">
							Enter the OTP sent to <strong>{email}</strong>
						</Text>
						{devOtp && (
							<HStack bg="green.50" color="green.800" border="1px solid" borderColor="green.100" borderRadius="lg" p={3} w="full" justify="space-between">
								<Text fontSize="sm">Development OTP</Text>
								<Badge colorScheme="green" fontSize="sm">{devOtp}</Badge>
							</HStack>
						)}
					</VStack>

					{/* Error Message */}
					{error && (
						<Box
							w="full"
							p={4}
							bg="red.50"
							color="red.600"
							borderRadius="xl"
							textAlign="center"
							fontSize="sm"
							fontWeight="medium"
							border="1px solid"
							borderColor="red.100"
						>
							{error}
						</Box>
					)}

					{/* OTP Input Fields */}
					<VStack spacing={6} w="full">
						<HStack spacing={{ base: 2, sm: 3 }} justify="center" w="full" flexWrap="wrap">
							{otp.map((value, index) => (
								<Input
									key={index}
									id={`otp-input-${index}`}
									ref={index === 0 ? firstInputRef : null}
									type="text"
									maxLength="1"
									textAlign="center"
									fontSize="2xl"
									fontWeight="bold"
									w={{ base: "42px", sm: "50px" }}
									h={{ base: "52px", sm: "60px" }}
									borderRadius="xl"
									bg={inputBg}
									border="2px solid"
									borderColor={inputBorder}
									_focus={{
										borderColor: "brand.500",
										boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)"
									}}
									_hover={{
										borderColor: "gray.300"
									}}
									onChange={(e) => handleChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									inputMode="numeric"
									autoComplete="one-time-code"
									value={value}
									placeholder="•"
									color={otpTextColor}
								/>
							))}
						</HStack>

						{/* Timer */}
						<Text fontSize="sm" fontWeight="600" color="brand.600">
							Time remaining: {`${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`}
						</Text>

						{/* Verify Button */}
						{devOtp && (
							<Button variant="ghost" colorScheme="green" size="sm" onClick={useDevOtp}>
								Fill development OTP
							</Button>
						)}

						<Button
							bgGradient={brandGradient}
							color="white"
							size="lg"
							w="full"
							h="50px"
							isLoading={loading}
							loadingText="Verifying..."
							onClick={handleNext}
							isDisabled={otp.includes("") || loading}
							borderRadius="xl"
							boxShadow="lg"
							_hover={{
								bgGradient: "linear(to-r, brand.500, brand.300)",
								transform: "translateY(-2px)",
								boxShadow: "xl"
							}}
							_active={{
								transform: "translateY(0)"
							}}
							fontSize="md"
							fontWeight="bold"
							mt={4}
						>
							Verify OTP
						</Button>
					</VStack>

					{/* Back Button */}
					<Button
						leftIcon={<ArrowBackIcon />}
						variant="outline"
						colorScheme="brand"
						w="full"
						borderRadius="xl"
						onClick={handleBack}
						_hover={{
							bg: backHoverBg
						}}
					>
						Back
					</Button>
				</VStack>
			</Flex>
		</Flex>
	);
}
