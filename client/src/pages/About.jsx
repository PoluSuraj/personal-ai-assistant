import React from 'react';
import { Container, Heading, Text, Box, Grid, VStack, HStack, Icon, Link, Avatar, useColorModeValue } from '@chakra-ui/react';
import { FaLinkedin, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';

const TeamMember = ({ name, role, email, github, linkedin, twitter, photo }) => {
  const bgColor = useColorModeValue('white', '#171717');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const roleColor = useColorModeValue('blue.600', 'brand.400');
  const emailColor = useColorModeValue('gray.600', 'whiteAlpha.700');
  const linkedInColor = useColorModeValue('blue.600', 'brand.400');
  const linkedInHover = useColorModeValue('blue.700', 'brand.300');
  const githubColor = useColorModeValue('gray.800', 'whiteAlpha.800');
  const githubHover = useColorModeValue('gray.900', 'white');
  const twitterColor = useColorModeValue('blue.400', 'brand.300');
  const twitterHover = useColorModeValue('blue.500', 'brand.200');

  return (
    <Box bg={bgColor} rounded="lg" shadow="md" p={6} textAlign="center" border="1px" borderColor={borderColor} _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.3s">
      <VStack spacing={4}>
        <Avatar size="2xl" name={name} src={photo} border="4px" borderColor="brand.500" />
        <Box>
          <Heading size="md" mb={2} color={textColor}>{name}</Heading>
          <Text color={roleColor} fontSize="sm" fontWeight="600" mb={4}>{role}</Text>
        </Box>
        <VStack spacing={3} width="100%">
          <HStack color={emailColor} fontSize="sm" justify="center">
            <Icon as={FaEnvelope} />
            <Text>{email}</Text>
          </HStack>
          <HStack justify="center" spacing={4}>
            {linkedin && <Link href={linkedin} isExternal title="LinkedIn"><Icon as={FaLinkedin} w={5} h={5} color={linkedInColor} _hover={{ color: linkedInHover }} /></Link>}
            {github && <Link href={github} isExternal title="GitHub"><Icon as={FaGithub} w={5} h={5} color={githubColor} _hover={{ color: githubHover }} /></Link>}
            {twitter && <Link href={twitter} isExternal title="Twitter"><Icon as={FaTwitter} w={5} h={5} color={twitterColor} _hover={{ color: twitterHover }} /></Link>}
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default function About() {
  const mutedColor = useColorModeValue('gray.600', 'whiteAlpha.700');
  const guideColor = useColorModeValue('blue.600', 'brand.400');
  const teamMembers = [
    { name: 'Aaditya Jha', role: 'Full Stack Developer', email: '22a91a0562@gmail.com', github: 'https://github.com/imaadityajha', linkedin: 'https://www.linkedin.com/in/imaadityajha/', twitter: 'https://twitter.com/imaadityajha', photo: '/me_pp.jpg' },
    { name: 'Abhay Kumar Yadav', role: 'Frontend Developer', email: 'abhay.yadav97719@gmail.com', github: 'https://github.com/Abhay-Kumar-Yadav', linkedin: 'https://www.linkedin.com/in/abhay-kumar-yadav-730806278/', twitter: 'https://x.com/I_am_Aman_yadav', photo: '/501.jpeg' },
    { name: 'Palli Harshavardhan', role: 'Backend Developer', email: 'harshavardhanpalli276@gmail.com', github: 'https://github.com/harshaidiot', linkedin: 'https://www.linkedin.com/in/harsha-vardhan-palli-609549282', twitter: 'https://twitter.com', photo: '/542.jpeg' },
    { name: 'Suraj Kumar', role: 'UI/UX Designer', email: '21a91a0547@gmail.com', github: 'https://github.com/PoluSuraj', linkedin: 'https://linktr.ee/fordailyuse36polusuraj', twitter: 'https://x.com/surajgu92925391?s=21', photo: '/547.jpg' },
  ];
  const projectGuide = { name: 'DR. K NAGARAJU', role: 'Project Guide & Mentor', email: 'nagarajuk@adityauniversity.in', photo: '/guide.jpg' };

  return (
    <Container maxW="container.lg" py={12}>
      <Box mb={12}>
        <Heading mb={4}>About</Heading>
        <VStack align="stretch" spacing={4} color={mutedColor} fontSize="lg">
          <Text textAlign="justify">The AI-Driven Smart Personalized Learning Assistant provides personalized academic guidance with interactive learning support, secure authentication, quiz generation, and smart resource recommendations.</Text>
          <Text fontWeight="bold">Empowering learners through intelligent, secure, and personalized education.</Text>
        </VStack>
      </Box>
      <Box>
        <Heading size="lg" mb={8}>Meet Our Team</Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={10}>
          {teamMembers.map((member) => <TeamMember key={member.email} {...member} />)}
        </Grid>
        <Heading size="md" mb={6} textAlign="center" color={guideColor}>Project Guide</Heading>
        <Box display="flex" justifyContent="center">
          <Box width={{ base: '100%', md: '50%', lg: '33%' }}><TeamMember {...projectGuide} /></Box>
        </Box>
      </Box>
    </Container>
  );
}
