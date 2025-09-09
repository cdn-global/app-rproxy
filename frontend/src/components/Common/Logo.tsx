import React from 'react';
import { Link, Image, ResponsiveValue, BoxProps } from '@chakra-ui/react';
import { Link as RouterLink } from '@tanstack/react-router';

interface LogoProps extends BoxProps {
  src: string;
  alt?: string;
  href?: string;
}

const Logo: React.FC<LogoProps> = ({ href = '/', src, alt = 'Company Logo', width, boxSize, ...rest }) => {
  return (
    <Link
      as={RouterLink}
      to={href}
      transition="opacity 0.2s ease-in-out"
      _hover={{
        opacity: 0.8,
      }}
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        width={width || boxSize || '110px'} // Fallback to 110px if neither width nor boxSize is provided
        height="auto"
        objectFit="contain"
      />
    </Link>
  );
};

export default Logo;