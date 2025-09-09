import React from 'react';
import { Image, BoxProps } from '@chakra-ui/react';
import { Link as RouterLink } from '@tanstack/react-router';

interface LogoProps extends BoxProps {
  src: string;
  alt?: string;
  to?: string; // Changed from href to to for TanStack Router
}

const Logo: React.FC<LogoProps> = ({ to = '/', src, alt = 'Company Logo', width, boxSize, ...rest }) => {
  return (
    <RouterLink
      to={to}
      style={{ transition: 'opacity 0.2s ease-in-out' }}
      _hover={{ opacity: 0.8 }}
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        width={width || boxSize || '110px'} // Fallback to 110px
        height="auto"
        objectFit="contain"
      />
    </RouterLink>
  );
};

export default Logo;