import {
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

import type { DashboardStat } from "./types"

const accentTokens = {
  brand: {
    light: {
      gradient: "linear(to-br, rgba(99,102,241,0.18), rgba(14,165,233,0.12))",
      iconBg: "rgba(99,102,241,0.16)",
      iconColor: "brand.600",
    },
    dark: {
      gradient: "linear(to-br, rgba(129,140,248,0.24), rgba(45,212,191,0.16))",
      iconBg: "rgba(129,140,248,0.24)",
      iconColor: "brand.200",
    },
  },
  success: {
    light: {
      gradient: "linear(to-br, rgba(16,185,129,0.16), rgba(59,130,246,0.1))",
      iconBg: "rgba(16,185,129,0.16)",
      iconColor: "green.600",
    },
    dark: {
      gradient: "linear(to-br, rgba(34,197,94,0.22), rgba(96,165,250,0.14))",
      iconBg: "rgba(34,197,94,0.26)",
      iconColor: "green.200",
    },
  },
  warning: {
    light: {
      gradient: "linear(to-br, rgba(251,191,36,0.22), rgba(245,158,11,0.12))",
      iconBg: "rgba(251,191,36,0.22)",
      iconColor: "orange.600",
    },
    dark: {
      gradient: "linear(to-br, rgba(245,158,11,0.25), rgba(226,232,240,0.1))",
      iconBg: "rgba(245,158,11,0.28)",
      iconColor: "orange.200",
    },
  },
  ocean: {
    light: {
      gradient: "linear(to-br, rgba(6,182,212,0.2), rgba(56,189,248,0.12))",
      iconBg: "rgba(6,182,212,0.18)",
      iconColor: "cyan.600",
    },
    dark: {
      gradient: "linear(to-br, rgba(56,189,248,0.26), rgba(6,182,212,0.18))",
      iconBg: "rgba(56,189,248,0.28)",
      iconColor: "cyan.200",
    },
  },
} as const

interface StatHighlightsProps {
  stats: DashboardStat[]
}

const StatHighlights = ({ stats }: StatHighlightsProps) => {
  const mode = useColorModeValue("light", "dark")
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100")
  const baseShadow = useColorModeValue(
    "0 18px 40px -28px rgba(15,23,42,0.45)",
    "0 16px 28px -20px rgba(148,163,184,0.45)",
  )
  const hoverShadow = useColorModeValue(
    "0 32px 60px -32px rgba(15,23,42,0.55)",
    "0 28px 60px -35px rgba(148,163,184,0.55)",
  )
  const metaColor = useColorModeValue("gray.500", "gray.400")
  const labelColor = useColorModeValue("gray.600", "gray.300")
  const fallbackBg = useColorModeValue("rgba(148,163,184,0.08)", "rgba(51,65,85,0.45)")

  if (stats.length === 0) {
    return (
      <Stack
        spacing={3}
        borderWidth="1px"
        borderRadius="xl"
        borderColor={borderColor}
        p={6}
        bg={fallbackBg}
      >
        <Heading size="sm">No metrics to display</Heading>
        <Text fontSize="sm" color={labelColor}>
          Usage statistics will populate once requests start flowing through your account.
        </Text>
      </Stack>
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={6}>
      {stats.map((stat) => {
        const palette = accentTokens[stat.accent][mode]

        return (
          <Card
            key={stat.label}
            variant="outline"
            borderRadius="24px"
            borderWidth="1px"
            borderColor={borderColor}
            bgGradient={palette.gradient}
            backdropFilter="blur(14px)"
            boxShadow={baseShadow}
            transition="transform 0.2s ease, box-shadow 0.2s ease"
            _hover={{ transform: "translateY(-4px)", boxShadow: hoverShadow }}
          >
            <CardBody display="flex" flexDirection="column" gap={6}>
              <Stack direction="row" justify="space-between" align="flex-start">
                <Circle size="12" bg={palette.iconBg}>
                  <Icon as={stat.icon} boxSize={6} color={palette.iconColor} />
                </Circle>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.18em" color={metaColor}>
                  {stat.description}
                </Text>
              </Stack>
              <Stack spacing={1}>
                <Heading size="lg">{stat.value}</Heading>
                <Text fontSize="sm" color={labelColor}>
                  {stat.label}
                </Text>
              </Stack>
            </CardBody>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}

export default StatHighlights
