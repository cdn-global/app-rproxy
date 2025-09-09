import React from 'react';
import { Link, Image } from '@chakra-ui/react';
import { Link as RouterLink } from '@tanstack/react-router';

interface LogoProps {
  src: string;
  alt?: string;
  href?: string;
}

const Logo: React.FC<LogoProps> = ({ href = '/', src, alt = 'Company Logo', ...rest }) => {
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
      <Image src={src} alt={alt} width="110px" height="auto" objectFit="contain" />
    </Link>
  );
};

export default Logo;