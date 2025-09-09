import React from 'react';
import { Image, Box, BoxProps } from '@chakra-ui/react';
import { Link as RouterLink } from '@tanstack/react-router';

interface LogoProps extends BoxProps {
  src: string;
  alt?: string;
  to?: string;
}

const Logo: React.FC<LogoProps> = ({ to = '/', src, alt = 'Company Logo', width, boxSize, ...rest }) => {
  return (
    <Box
      as={RouterLink}
      to={to}
      transition="opacity 0.2s ease-in-out"
      _hover={{ opacity: 0.8 }}
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        width={width || boxSize || '110px'}
        height="auto"
        objectFit="contain"
      />
    </Box>
  );
};

export default Logo;