import React from 'react';
// Import the Image component from Chakra UI
import { Link, LinkProps, Image } from '@chakra-ui/react';

// The props interface is updated to include `src` for the image
// and an optional `alt` tag for accessibility.
interface LogoProps extends LinkProps {
  src: string;
  alt?: string;
}

// We destructure the new props `src` and `alt` along with the existing ones.
// `alt` has a default value for good practice.
const Logo: React.FC<LogoProps> = ({ 
  href = "/", 
  src, 
  alt = "Company Logo", 
  ...rest 
}) => {
  return (
    <Link
      // The href prop works the same as before.
      href={href}
      // --- Style Props ---
      // A subtle opacity change on hover is a nice effect for image links.
      transition="opacity 0.2s ease-in-out"
      _hover={{
        opacity: 0.8,
      }}
      // Spread the rest of the props onto the Link wrapper.
      // This is powerful, as you can now pass props like `boxSize`, `m`, etc.
      // e.g., <Logo src="..." boxSize="40px" />
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        // 'contain' ensures the logo image scales correctly without being
        // stretched or cropped, preserving its aspect ratio.
        objectFit="contain"
      />
    </Link>
  );
};

export default Logo;