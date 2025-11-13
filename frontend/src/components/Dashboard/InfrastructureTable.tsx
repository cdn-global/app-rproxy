import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tag,
  useColorModeValue,
} from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import type { ServerNode } from "./types"

interface InfrastructureTotals {
  totalCount: number
  totalVCPUs: number
  totalRAM: number
  totalStorage: number
  totalMonthlySpend: number
}

interface InfrastructureTableProps {
  servers: ServerNode[]
  totals: InfrastructureTotals
  formatCurrency: (value: number) => string
  ctaTo: string
}

const InfrastructureTable = ({ servers, totals, formatCurrency, ctaTo }: InfrastructureTableProps) => {
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100")
  const background = useColorModeValue("rgba(255,255,255,0.94)", "rgba(15,23,42,0.82)")
  const headerBg = useColorModeValue("rgba(148,163,184,0.16)", "rgba(71,85,105,0.26)")
  const headerColor = useColorModeValue("gray.600", "gray.300")
  const rowHover = useColorModeValue("rgba(148,163,184,0.12)", "rgba(71,85,105,0.32)")
  const metaColor = useColorModeValue("gray.500", "gray.400")

  return (
    <Card
      variant="outline"
      borderRadius="28px"
      borderWidth="1px"
      borderColor={borderColor}
      bg={background}
      backdropFilter="blur(18px)"
      boxShadow={useColorModeValue("0 26px 60px -34px rgba(15,23,42,0.42)", "0 26px 60px -30px rgba(15,23,42,0.62)")}
    >
      <CardHeader borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md">Infrastructure footprint</Heading>
        <Text fontSize="sm" color={metaColor} mt={1.5}>
          Managed VPS instances across your RoamingProxy regions.
        </Text>
      </CardHeader>
      <CardBody>
        <TableContainer borderRadius="24px" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <Table variant="simple" size="sm">
            <Thead bg={headerBg}>
              <Tr>
                <Th color={headerColor}>Server</Th>
                <Th color={headerColor}>IP</Th>
                <Th color={headerColor}>Status</Th>
                <Th color={headerColor}>Specs</Th>
                <Th color={headerColor}>Features</Th>
                <Th isNumeric color={headerColor}>
                  Monthly
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {servers.length === 0 ? (
                <Tr>
                  <Td colSpan={6} py={8}>
                    <Stack spacing={2} align="center" color={metaColor}>
                      <Heading size="sm">No managed nodes yet</Heading>
                      <Text fontSize="sm">
                        Provision your first server to track availability, spend, and feature coverage.
                      </Text>
                    </Stack>
                  </Td>
                </Tr>
              ) : (
                servers.map((server) => (
                  <Tr key={server.name} _hover={{ bg: rowHover }} transition="background 0.15s ease">
                    <Td fontWeight="medium">
                      <Text>{server.name}</Text>
                      <Text fontSize="xs" color={metaColor} mt={1}>
                        Active since {formatDate(server.activeSince)}
                      </Text>
                    </Td>
                    <Td>
                      <Text>{server.ip}</Text>
                      <Text fontSize="xs" color={metaColor} mt={1}>
                        {server.os} · v{server.version}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={server.status === "Connected" ? "green" : "orange"}
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {server.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Stack spacing={1}>
                        <Text fontSize="sm" color={metaColor}>
                          {server.vCPUs ?? "-"} vCPU · {server.ramGB} GB RAM · {server.storageSizeGB} GB SSD
                        </Text>
                        <Text fontSize="xs" color={metaColor}>
                          Kernel {server.kernel}
                        </Text>
                      </Stack>
                    </Td>
                    <Td>
                      <FeatureTags server={server} />
                    </Td>
                    <Td isNumeric fontWeight="semibold">
                      {formatCurrency(server.monthlyComputePrice)}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
        <Flex justify="space-between" align="center" mt={8} wrap="wrap" gap={4}>
          <Stack spacing={1} color={metaColor}>
            <Text fontSize="sm">
              Network total: {totals.totalCount} servers · {totals.totalVCPUs} vCPUs · {totals.totalRAM} GB RAM · {totals.totalStorage} GB SSD
            </Text>
            <Text fontSize="sm">
              Monthly run rate {formatCurrency(totals.totalMonthlySpend)} across active nodes.
            </Text>
          </Stack>
          <Button
            as={RouterLink}
            to={ctaTo}
            variant="outline"
            borderRadius="full"
            rightIcon={<FiArrowUpRight />}
          >
            Open infrastructure view
          </Button>
        </Flex>
      </CardBody>
    </Card>
  )
}

const FeatureTags = ({ server }: { server: ServerNode }) => {
  const tags: string[] = []
  if (server.hasRotatingIP) tags.push("Rotating IPs")
  if (server.hasBackup) tags.push("Backups")
  if (server.hasMonitoring) tags.push("Monitoring")
  if (server.hasManagedSupport) tags.push("Managed support")

  if (tags.length === 0) {
    return (
      <Tag size="sm" variant="subtle" colorScheme="gray" borderRadius="full">
        Standard
      </Tag>
    )
  }

  return (
    <HStack spacing={2} wrap="wrap">
      {tags.map((label) => (
        <Tag key={label} size="sm" variant="subtle" colorScheme="blue" borderRadius="full">
          {label}
        </Tag>
      ))}
    </HStack>
  )
}

const formatDate = (isoDate: string) => {
  try {
    const date = new Date(isoDate)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  } catch (error) {
    return isoDate
  }
}

export default InfrastructureTable
