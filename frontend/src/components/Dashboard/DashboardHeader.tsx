import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

interface DashboardHeaderProps {
  servicesCount: number
  nextRenewalLabel: string
  apiKeyCount: number
  averageRequestsPerKey: number
  onBillingClick: () => void
  isBillingLoading: boolean
  apiConsoleTo: string
}

const DashboardHeader = ({
  servicesCount,
  nextRenewalLabel,
  apiKeyCount,
  averageRequestsPerKey,
  onBillingClick,
  isBillingLoading,
  apiConsoleTo,
}: DashboardHeaderProps) => {
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(15,23,42,0.82)")
  const badgeBg = useColorModeValue("rgba(99,102,241,0.12)", "rgba(99,102,241,0.24)")
  const badgeColor = useColorModeValue("brand.600", "brand.200")
  const detailBg = useColorModeValue("rgba(255,255,255,0.6)", "rgba(15,23,42,0.5)")
  const detailBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100")

  return (
    <Card
      position="relative"
      overflow="hidden"
      borderRadius="28px"
      borderWidth="1px"
      borderColor={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}
      bg={cardBg}
      backdropFilter="blur(18px)"
      boxShadow={useColorModeValue("0 24px 60px -32px rgba(15,23,42,0.36)", "0 20px 50px -32px rgba(148,163,184,0.35)")}
    >
      <CardBody position="relative" zIndex={1} p={{ base: 8, md: 10 }}>
        <Stack spacing={8}>
          <Stack spacing={5} maxW={{ base: "full", xl: "2xl" }}>
            <Badge
              alignSelf="flex-start"
              px={4}
              py={1.5}
              borderRadius="full"
              bg={badgeBg}
              color={badgeColor}
              textTransform="none"
              letterSpacing="0.08em"
            >
              {servicesCount} active services · next renewal {nextRenewalLabel}
            </Badge>
            <Stack spacing={3}>
              <Heading size="lg" lineHeight="1.2">
                Welcome back. Everything is synced and ready for your next crawl.
              </Heading>
              <Text
                fontSize="md"
                color={useColorModeValue("gray.600", "gray.300")}
                lineHeight="1.7"
              >
                Track infrastructure health, monitor usage trends, and launch new workloads from a single, refined workspace.
              </Text>
            </Stack>
          </Stack>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
            <StatBadge label="API keys" value={apiKeyCount.toString()} bg={detailBg} borderColor={detailBorder} />
            <StatBadge
              label="Avg requests / key"
              value={averageRequestsPerKey.toLocaleString()}
              bg={detailBg}
              borderColor={detailBorder}
            />
            <StatBadge label="Active services" value={servicesCount.toString()} bg={detailBg} borderColor={detailBorder} />
            <StatBadge label="Next renewal" value={nextRenewalLabel} bg={detailBg} borderColor={detailBorder} />
          </SimpleGrid>

          <ButtonGroup flexWrap="wrap" gap={3}>
            <Button
              as={RouterLink}
              to={apiConsoleTo}
              colorScheme="brand"
              rightIcon={<FiArrowUpRight />}
              borderRadius="full"
              size="lg"
            >
              Open API console
            </Button>
            <Button
              variant="outline"
              rightIcon={<FiArrowUpRight />}
              onClick={onBillingClick}
              isLoading={isBillingLoading}
              borderRadius="full"
              size="lg"
            >
              Customer billing
            </Button>
          </ButtonGroup>
        </Stack>
      </CardBody>

      <BackgroundAura />
    </Card>
  )
}

const BackgroundAura = () => (
  <Box
    position="absolute"
    inset={0}
    pointerEvents="none"
    zIndex={0}
    opacity={{ base: 0.45, md: 0.6 }}
  >
    <Box
      position="absolute"
      top="-120px"
      right="-140px"
      w="320px"
      h="320px"
      bgGradient="radial(rgba(99,102,241,0.32), transparent 60%)"
      filter="blur(10px)"
      transform="rotate(8deg)"
    />
    <Box
      position="absolute"
      bottom="-160px"
      left="-120px"
      w="360px"
      h="360px"
      bgGradient="radial(rgba(14,165,233,0.28), transparent 65%)"
      filter="blur(14px)"
    />
  </Box>
)

interface StatBadgeProps {
  label: string
  value: string
  bg: string
  borderColor: string
}

const StatBadge = ({ label, value, bg, borderColor }: StatBadgeProps) => (
  <Stack
    spacing={1.5}
    p={4}
    borderRadius="xl"
    bg={bg}
    borderWidth="1px"
    borderColor={borderColor}
    backdropFilter="blur(12px)"
  >
    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.16em" color="gray.500">
      {label}
    </Text>
    <Text fontWeight="semibold" fontSize="lg">
      {value}
    </Text>
  </Stack>
)

export default DashboardHeader
