import {
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

import type { QuickActionLink } from "./types"

interface QuickActionsGridProps {
  actions: QuickActionLink[]
}

const QuickActionsGrid = ({ actions }: QuickActionsGridProps) => {
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100")
  const descriptionColor = useColorModeValue("gray.600", "gray.300")
  const circleBg = useColorModeValue("rgba(99,102,241,0.12)", "rgba(129,140,248,0.24)")
  const circleIcon = useColorModeValue("brand.600", "brand.200")
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(15,23,42,0.78)")
  const cardShadow = useColorModeValue(
    "0 20px 44px -32px rgba(15,23,42,0.42)",
    "0 24px 48px -28px rgba(15,23,42,0.62)",
  )
  const hoverShadow = useColorModeValue(
    "0 32px 60px -30px rgba(15,23,42,0.5)",
    "0 36px 70px -34px rgba(15,23,42,0.66)",
  )
  const fallbackBg = useColorModeValue("rgba(148,163,184,0.08)", "rgba(51,65,85,0.45)")
  const fallbackBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100")

  if (actions.length === 0) {
    return (
      <Stack
        spacing={3}
        borderWidth="1px"
        borderColor={fallbackBorder}
        borderRadius="xl"
        bg={fallbackBg}
        p={6}
      >
        <Heading size="sm">No quick actions available</Heading>
        <Text fontSize="sm" color={descriptionColor}>
          Activate additional products or contact support to enable shortcuts for your workspace.
        </Text>
      </Stack>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
      {actions.map((action) => (
        <Card
          key={action.label}
          variant="outline"
          borderRadius="24px"
          borderWidth="1px"
          borderColor={borderColor}
          bg={cardBg}
          boxShadow={cardShadow}
          backdropFilter="blur(18px)"
          height="100%"
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          _hover={{ transform: "translateY(-6px)", boxShadow: hoverShadow }}
        >
          <CardBody display="flex" flexDirection="column" gap={4}>
            <Circle size="10" bg={circleBg}>
              <Icon as={action.icon} boxSize={5} color={circleIcon} />
            </Circle>
            <Stack spacing={1} flex="1">
              <Heading size="sm">{action.label}</Heading>
              <Text fontSize="sm" color={descriptionColor}>
                {action.description}
              </Text>
            </Stack>
            {renderActionButton(action)}
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  )
}

const renderActionButton = (action: QuickActionLink) => {
  if (action.to) {
    return (
      <Button
        as={RouterLink}
        to={action.to}
        variant="outline"
        borderRadius="full"
        rightIcon={<FiArrowUpRight />}
      >
        Open
      </Button>
    )
  }

  if (action.href) {
    return (
      <Button
        as="a"
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        borderRadius="full"
        rightIcon={<FiArrowUpRight />}
      >
        View docs
      </Button>
    )
  }

  return (
    <Button
      onClick={action.onClick}
      isLoading={action.isLoading}
      variant="outline"
      borderRadius="full"
      rightIcon={<FiArrowUpRight />}
    >
      Launch
    </Button>
  )
}

export default QuickActionsGrid
