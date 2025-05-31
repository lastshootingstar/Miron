import React from 'react';
import {
  Box,
  VStack,
  Icon,
  Text,
  Flex,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiBook,
  FiCpu,
  FiBarChart2,
  FiFileText,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import { IconType } from 'react-icons';

interface MenuItemProps {
  icon: IconType;
  children: React.ReactNode;
  path: string;
  isActive: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, children, path, isActive }) => {
  const router = useRouter();
  const activeColor = useColorModeValue('blue.500', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const bg = isActive ? useColorModeValue('blue.50', 'blue.900') : 'transparent';

  return (
    <Tooltip label={children} placement="right" hasArrow>
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={bg}
        color={isActive ? activeColor : undefined}
        _hover={{
          bg: hoverBg,
          color: activeColor,
        }}
        onClick={() => router.push(path)}
      >
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
          _groupHover={{
            color: activeColor,
          }}
        />
        <Text fontSize="sm">{children}</Text>
      </Flex>
    </Tooltip>
  );
};

const Sidebar = () => {
  const router = useRouter();
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="100vh"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg={useColorModeValue('white', 'gray.800')}
      borderRight="1px"
      borderRightColor={borderColor}
      w="60"
    >
      <VStack spacing={2} align="stretch" mt="8">
        <MenuItem
          icon={FiSearch}
          path="/"
          isActive={router.pathname === '/'}
        >
          Search Papers
        </MenuItem>
        <MenuItem
          icon={FiBook}
          path="/library"
          isActive={router.pathname === '/library'}
        >
          My Library
        </MenuItem>
        <MenuItem
          icon={FiCpu}
          path="/byt"
          isActive={router.pathname === '/byt'}
        >
          BYT Analyzer
        </MenuItem>
        <MenuItem
          icon={FiBarChart2}
          path="/systematic-review"
          isActive={router.pathname === '/systematic-review'}
        >
          Systematic Review
        </MenuItem>
        <MenuItem
          icon={FiFileText}
          path="/saved-analyses"
          isActive={router.pathname === '/saved-analyses'}
        >
          Saved Analyses
        </MenuItem>
      </VStack>
    </Box>
  );
};

export default Sidebar; 