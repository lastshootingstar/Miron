import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import Sidebar from '../components/Sidebar';

const IndexPage = () => {
  return (
    <Box display="flex">
      <Sidebar />
      <Box
        ml="60"
        w="calc(100% - 15rem)"
        minH="100vh"
        bg={useColorModeValue('gray.50', 'gray.900')}
      >
        {/* Add your search component here */}
      </Box>
    </Box>
  );
};

export default IndexPage; 