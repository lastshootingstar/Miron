import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Textarea,
  Select,
  Input,
  useToast,
  Container,
  Heading,
  Icon,
  Progress,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUpload, FiFile, FiSearch, FiCpu, FiBarChart2, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const BYTAnalyzer = () => {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [analysisType, setAnalysisType] = useState('research');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const glowColor = useColorModeValue('0 0 15px #63B3ED', '0 0 15px #2B6CB0');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setText(text);
        toast({
          title: 'File uploaded successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: 'Error reading file',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const analyzeText = async () => {
    if (!text || !query) {
      toast({
        title: 'Please provide both text and query',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 90));
    }, 100);

    try {
      const response = await fetch('/api/byt-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          query,
          analysis_type: analysisType,
        }),
      });

      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (data.success) {
        setResult(data.analysis);
        toast({
          title: 'Analysis complete',
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Analysis failed',
          description: data.analysis,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      toast({
        title: 'Error',
        description: 'Failed to analyze text',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heading size="lg" mb={2}>
            <Icon as={FiCpu} mr={2} />
            Bring Your Text (BYT) Analyzer
          </Heading>
          <Text color="gray.500">Upload your research paper or paste text for AI-powered analysis</Text>
        </MotionBox>

        <MotionFlex
          direction="column"
          bg={bgColor}
          p={6}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow={glowColor}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <HStack mb={4}>
            <Button
              leftIcon={<FiUpload />}
              onClick={() => fileInputRef.current?.click()}
              colorScheme="blue"
              variant="outline"
            >
              Upload File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
            <Badge colorScheme="blue" variant="subtle" px={3} py={1}>
              <Icon as={FiFile} mr={2} />
              Supported: PDF, DOC, TXT
            </Badge>
          </HStack>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
            size="lg"
            minH="200px"
            mb={4}
            borderColor={borderColor}
          />

          <HStack mb={4}>
            <Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              w="200px"
              borderColor={borderColor}
            >
              <option value="research">Research Analysis</option>
              <option value="statistical">Statistical Analysis</option>
              <option value="critical_appraisal">Critical Appraisal</option>
            </Select>
            <Input
              placeholder="Enter your question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              borderColor={borderColor}
            />
            <IconButton
              aria-label="Analyze"
              icon={<FiSearch />}
              onClick={analyzeText}
              isLoading={isAnalyzing}
              colorScheme="blue"
            />
          </HStack>

          {progress > 0 && (
            <Box mb={4}>
              <Progress
                value={progress}
                size="xs"
                colorScheme="blue"
                hasStripe
                isAnimated
                borderRadius="full"
              />
            </Box>
          )}

          {result && (
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              bg={useColorModeValue('white', 'gray.700')}
              p={6}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="lg"
            >
              <HStack mb={4}>
                <Icon as={FiCheckCircle} color="green.500" />
                <Text fontWeight="bold">Analysis Results</Text>
              </HStack>
              <Text whiteSpace="pre-wrap">{result}</Text>
            </MotionBox>
          )}
        </MotionFlex>
      </VStack>
    </Container>
  );
};

export default BYTAnalyzer; 