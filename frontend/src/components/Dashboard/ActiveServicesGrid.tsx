import {
  Badge,
  Button,
  Card,
  CardBody,
  Circle,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import type { DisplayedFeature } from "./types"

interface ActiveServicesGridProps {
  features: DisplayedFeature[]
}

const ActiveServicesGrid = ({ features }: ActiveServicesGridProps) => {
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100")
  const descriptionColor = useColorModeValue("rgba(15,23,42,0.76)", "rgba(226,232,240,0.92)")
  const headingColor = useColorModeValue("gray.900", "whiteAlpha.900")
  const badgeBg = useColorModeValue("rgba(255,255,255,0.22)", "rgba(255,255,255,0.16)")
  const buttonHoverBg = useColorModeValue("rgba(255,255,255,0.22)", "rgba(255,255,255,0.24)")
  const cardShadow = useColorModeValue(
    "0 24px 60px -36px rgba(15,23,42,0.48)",
    "0 20px 60px -36px rgba(15,23,42,0.7)",
  )
  const cardHoverShadow = useColorModeValue(
    "0 36px 70px -34px rgba(15,23,42,0.56)",
    "0 34px 80px -38px rgba(15,23,42,0.7)",
  )
  const fallbackBg = useColorModeValue("rgba(148,163,184,0.08)", "rgba(51,65,85,0.45)")
  const fallbackBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100")

  if (features.length === 0) {
    return (
      <Stack
        spacing={3}
        borderWidth="1px"
        borderRadius="xl"
        borderColor={fallbackBorder}
        bg={fallbackBg}
        p={6}
      >
        <Heading size="sm" color={headingColor}>
          No active services yet
        </Heading>
        <Text fontSize="sm" color={descriptionColor}>
          Activate a subscription to see managed assets, renewal windows, and quick access links in this panel.
        </Text>
      </Stack>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
      {features.map((feature) => (
        <Card
          key={feature.slug}
          variant="outline"
          borderRadius="24px"
          borderWidth="1px"
          borderColor={borderColor}
          bgGradient={feature.gradient}
          backdropFilter="blur(16px)"
          boxShadow={cardShadow}
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          _hover={{ transform: "translateY(-6px)", boxShadow: cardHoverShadow }}
          height="100%"
        >
          <CardBody display="flex" flexDirection="column" gap={4}>
            <Circle size="12" bg="rgba(255,255,255,0.2)">
              <Icon as={feature.icon} boxSize={6} color="white" />
            </Circle>
            <Stack spacing={2} flex="1">
              <Heading size="sm" color={headingColor}>
                {feature.name}
              </Heading>
              <Text color={descriptionColor} fontSize="sm">
                {feature.description}
              </Text>
            </Stack>
            <Stack spacing={3}>
              {feature.period ? (
                <Badge
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={3}
                  py={1}
                  bg={badgeBg}
                  color="white"
                  textTransform="none"
                >
                  {feature.period}
                </Badge>
              ) : null}
              <Button
                as={RouterLink}
                to={feature.path}
                variant="outline"
                borderRadius="full"
                colorScheme="whiteAlpha"
                rightIcon={<FiArrowUpRight />}
                _hover={{ bg: buttonHoverBg }}
              >
                Manage service
              </Button>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

export default ActiveServicesGrid
