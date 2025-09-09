import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Container,
  Flex,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Heading,
  Button,
  Link as ChakraLink,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
  useToast,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { FaCreditCard, FaCheckCircle } from "react-icons/fa";
import { useState } from "react";

// Hardcoded servers with pricing (updated to Debian)
interface Server {
  name: string;
  email: string;
  ip: string;
  version: string;
  kernel: string;
  status: string;
  type: string;
  os: string;
  username: string;
  password: string;
  monthlyComputePrice: number;
  storageSizeGB: number;
  activeSince: string; // YYYY-MM-DD
  hasRotatingIP?: boolean;
  hasBackup?: boolean;
  hasMonitoring?: boolean;
}

const servers: Server[] = [
  {
    name: "riv1-nyc-mini5",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.59",
    version: "1.82.0",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 15,
    storageSizeGB: 120,
    activeSince: "2025-07-01",
    hasRotatingIP: false,
    hasBackup: true,
    hasMonitoring: true,
  },
  {
    name: "riv2-nyc-mini5",
    email: "apis.popov@gmail.com",
    ip: "100.114.242.51",
    version: "1.86.2",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 50,
    storageSizeGB: 240,
    activeSince: "2025-07-01",
    hasRotatingIP: true,
    hasBackup: false,
    hasMonitoring: false,
  },
  {
    name: "riv3-nyc-mini6",
    email: "apis.popov@gmail.com",
    ip: "100.91.158.116",
    version: "1.82.5",
    kernel: "Linux 6.8.0-59-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 50,
    storageSizeGB: 240,
    activeSince: "2025-08-01",
    hasRotatingIP: true,
    hasBackup: true,
    hasMonitoring: true,
  },
  {
    name: "riv4-nyc-mini5",
    email: "apis.popov@gmail.com",
    ip: "100.100.106.3",
    version: "1.80.2",
    kernel: "Linux 6.8.0-55-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 45,
    storageSizeGB: 120,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
  },
  {
    name: "riv5-nyc-mini7",
    email: "apis.popov@gmail.com",
    ip: "100.120.30.40",
    version: "1.85.0",
    kernel: "Linux 6.8.0-60-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 60,
    storageSizeGB: 500,
    activeSince: "2025-08-01",
    hasRotatingIP: true,
    hasBackup: true,
    hasMonitoring: true,
  },
  {
    name: "riv6-nyc-mini8",
    email: "apis.popov@gmail.com",
    ip: "100.130.40.50",
    version: "1.87.0",
    kernel: "Linux 6.8.0-61-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 30,
    storageSizeGB: 200,
    activeSince: "2025-09-01",
    hasRotatingIP: true,
    hasBackup: false,
    hasMonitoring: false,
  },
];

const ELASTIC_IP_FEE_PER_MONTH = 3.6; // $0.005 per hour * 24 * 30 = $3.60 per IP per month
const STORAGE_COST_PER_GB_MONTH = 0.10; // Approximate EBS gp2 cost: $0.10/GB-month
const ROTATING_IP_FEE_PER_MONTH = 10.0;
const BACKUP_FEE_PER_MONTH = 5.0;
const MONITORING_FEE_PER_MONTH = 8.0;

interface Service {
  name: string;
  getMonthlyCost: (server: Server) => number;
}

const services: Service[] = [
  { name: "Compute", getMonthlyCost: (s) => s.monthlyComputePrice },
  { name: "Storage", getMonthlyCost: (s) => s.storageSizeGB * STORAGE_COST_PER_GB_MONTH },
  { name: "Elastic IP", getMonthlyCost: () => ELASTIC_IP_FEE_PER_MONTH },
  { name: "Rotating IP", getMonthlyCost: (s) => (s.hasRotatingIP ? ROTATING_IP_FEE_PER_MONTH : 0) },
  { name: "Backup", getMonthlyCost: (s) => (s.hasBackup ? BACKUP_FEE_PER_MONTH : 0) },
  { name: "Monitoring", getMonthlyCost: (s) => (s.hasMonitoring ? MONITORING_FEE_PER_MONTH : 0) },
];

interface Month {
  name: string;
  start: Date;
  end: Date;
}

const months: Month[] = [
  { name: "August 2025", start: new Date(2025, 7, 1), end: new Date(2025, 7, 31) },
  { name: "September 2025", start: new Date(2025, 8, 1), end: new Date(2025, 8, 30) },
];

function calculateTotalsForMonth(month: Month) {
  const activeServers = servers.filter((s) => new Date(s.activeSince) <= month.end);
  const totals = services.reduce((acc, service) => {
    const count = activeServers.filter((server) => service.getMonthlyCost(server) > 0).length;
    acc[service.name] = { total: activeServers.reduce((sum, server) => sum + service.getMonthlyCost(server), 0), count };
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
  const perServerTotals = activeServers.reduce((acc, server) => {
    acc[server.name] = services.reduce((sum, svc) => sum + svc.getMonthlyCost(server), 0);
    return acc;
  }, {} as Record<string, number>);
  const grandTotal = Object.values(totals).reduce((sum, { total }) => sum + total, 0);
  return { totals, grandTotal, activeServers, perServerTotals };
}

// Helper function for fetching billing portal URL
const fetchBillingPortal = async (token: string) => {
  const response = await fetch("https://api.thedataproxy.com/v2/customer-portal", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch portal: ${response.status}`);
  }
  const data = await response.json();
  if (!data.portal_url) {
    throw new Error("No portal URL received");
  }
  return data.portal_url;
};

function PaymentDetailsTab() {
  const [token] = useState<string | null>(localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleBillingClick = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please log in to manage your billing information.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const portalUrl = await fetchBillingPortal(token);
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error accessing customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to access billing portal. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated to match transaction data
  const hasSavedCard = true;
  const cardLast4 = "3007";
  const cardBrand = "American Express";
  const cardExp = "11/2027";
  const billingAddress = {
    name: "Nik Popov",
    email: "nik@iconluxurygroup.com",
    line1: "599 Broadway, floor 3",
    city: "New York",
    state: "NY",
    postalCode: "10012",
    country: "US",
    phone: "(212) 595-3915",
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Heading size="md" color="gray.700">Payment Method</Heading>
      <Text color="gray.600">View or update your payment method used for billing.</Text>
      {hasSavedCard ? (
        <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
          <Text fontWeight="bold">{cardBrand} ending in {cardLast4}</Text>
          <Text>Expires: {cardExp}</Text>
        </Box>
      ) : (
        <Text color="gray.600">No payment method saved. Add a payment method in Stripe to continue.</Text>
      )}
      <Heading size="md" color="gray.700">Billing Address</Heading>
      <Text color="gray.600">Manage your billing address for invoices and payments.</Text>
      <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
        <Text>{billingAddress.name}</Text>
        <Text>{billingAddress.email}</Text>
        <Text>{billingAddress.line1}</Text>
        <Text>{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</Text>
        <Text>{billingAddress.country}</Text>
        <Text>{billingAddress.phone}</Text>
      </Box>
      <Button
        variant="link"
        onClick={handleBillingClick}
        isLoading={isLoading}
        leftIcon={<Icon as={FaCreditCard} />}
        colorScheme="orange"
        fontWeight="medium"
        justifyContent="flex-start"
      >
        Billing Portal
      </Button>
    </VStack>
  );
}

function BillingPage() {
  const currentMonth = months[months.length - 1];
  const { totals: currentTotals, activeServers: currentActiveServers, perServerTotals, grandTotal } = calculateTotalsForMonth(currentMonth);
  const [token] = useState<string | null>(localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Updated history to only include $449 transaction for Sep 9, 2025
  const history = [
    {
      month: months[1], // September 2025
      total: 449.00,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FYy",
      paymentDate: "September 9, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "Debian Unlimited Bandwidth VPS with Floating IP",
    },
  ];

  const allTimeTotal = history.reduce((sum, { total }) => sum + total, 0);
  const averageMonthly = allTimeTotal / history.length; // Average over number of invoices
  const previousMonthTotal = history.filter(({ month }) => month.name === "August 2025").reduce((sum, { total }) => sum + total, 0);
  const monthOverMonthChange = previousMonthTotal ? ((grandTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

  const handleBillingClick = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please log in to manage your billing information.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const portalUrl = await fetchBillingPortal(token);
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error accessing customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to access billing portal. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={10} as="main">
      <Flex align="center" justify="space-between" py={6} mb={6}>
        <Heading as="h1" size="xl" color="gray.800">VPS Billing Details</Heading>
        <Text fontSize="lg" color="gray.600">Manage your hosting costs and review billing history</Text>
      </Flex>

      <Tabs variant="enclosed" colorScheme="orange" isFitted>
        <TabList>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Current Billing</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Service Details</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Billing History</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Invoices</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Payment Details</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "orange.600", borderTopColor: "orange.400" }}>Pricing Details</Tab>
        </TabList>
        <TabPanels bg="gray.50" borderRadius="0 0 md md">
          <TabPanel>
            <Heading size="md" mb={6} color="gray.700">Costs for {currentMonth.name}</Heading>
            <VStack align="stretch" spacing={6}>
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Table variant="simple" size="md">
                  <Thead bg="orange.100">
                    <Tr>
                      <Th color="orange.800">Server Name</Th>
                      <Th color="orange.800">IP Address</Th>
                      <Th color="orange.800" isNumeric>Total Cost (USD)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentActiveServers.map((server) => (
                      <Tr key={server.name}>
                        <Td>{server.name}</Td>
                        <Td>{server.ip}</Td>
                        <Td isNumeric>${perServerTotals[server.name].toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot bg="orange.50">
                    <Tr>
                      <Th colSpan={2} color="orange.800">Total</Th>
                      <Th isNumeric color="orange.800">${grandTotal.toFixed(2)}</Th>
                    </Tr>
                  </Tfoot>
                </Table>
              </Box>
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Table variant="simple" size="md">
                  <Thead bg="orange.100">
                    <Tr>
                      <Th color="orange.800">Service</Th>
                      <Th color="orange.800">Quantity</Th>
                      <Th color="orange.800" isNumeric>Cost (USD)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {services.map((s) => (
                      <Tr key={s.name}>
                        <Td>{s.name}</Td>
                        <Td>x {currentTotals[s.name].count}</Td>
                        <Td isNumeric>${currentTotals[s.name].total.toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot bg="orange.50">
                    <Tr>
                      <Th colSpan={2} color="orange.800">Total</Th>
                      <Th isNumeric color="orange.800">${grandTotal.toFixed(2)}</Th>
                    </Tr>
                  </Tfoot>
                </Table>
              </Box>
              <Text color="gray.600" fontStyle="italic">
                Note: The billed transaction for September 2025 ($449.00) reflects a premium Debian Unlimited Bandwidth VPS with Floating IP plan, which may differ from the computed server totals above.
              </Text>
            </VStack>
          </TabPanel>
          <TabPanel>
            <Heading size="md" mb={6} color="gray.700">Service Details for {currentMonth.name}</Heading>
            <Accordion allowMultiple>
              {services.map((s) => {
                const relevantServers = currentActiveServers.filter((server) => s.getMonthlyCost(server) > 0);
                const total = currentTotals[s.name].total;
                return (
                  <AccordionItem key={s.name} borderWidth="1px" borderRadius="md" mb={4}>
                    <h2>
                      <AccordionButton bg="orange.50" _hover={{ bg: "orange.100" }}>
                        <Box as="span" flex="1" textAlign="left" fontWeight="semibold" color="orange.800">
                          {s.name} - ${total.toFixed(2)} (x {relevantServers.length} {relevantServers.length !== 1 ? "servers" : "server"})
                        </Box>
                        <AccordionIcon color="orange.600" />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      {relevantServers.length > 0 ? (
                        <Table variant="simple" size="sm">
                          <Thead bg="orange.100">
                            <Tr>
                              <Th color="orange.800">Server Name</Th>
                              <Th color="orange.800" isNumeric>Cost (USD)</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {relevantServers.map((server) => (
                              <Tr key={server.name}>
                                <Td>{server.name}</Td>
                                <Td isNumeric>${s.getMonthlyCost(server).toFixed(2)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text color="gray.600">No servers using this service.</Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabPanel>
          <TabPanel>
            <Heading size="md" mb={6} color="gray.700">Billing History</Heading>
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
              <Table variant="simple" size="md">
                <Thead bg="orange.100">
                  <Tr>
                    <Th color="orange.800">Month</Th>
                    <Th color="orange.800" isNumeric>Total Cost (USD)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {history.map(({ month, total, invoiceId }) => (
                    <Tr key={invoiceId}>
                      <Td>{month.name}</Td>
                      <Td isNumeric>${total.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            <Box mt={6} p={4} borderWidth="1px" borderRadius="lg" bg="orange.50" boxShadow="sm">
              <VStack align="stretch" spacing={3}>
                <Flex justify="space-between">
                  <Text fontWeight="semibold" color="orange.800">Total Spent to Date</Text>
                  <Text fontWeight="bold" color="orange.800">${allTimeTotal.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold" color="orange.800">Average Monthly Cost</Text>
                  <Text fontWeight="bold" color="orange.800">${averageMonthly.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold" color="orange.800">Month-over-Month Change</Text>
                  <Text fontWeight="bold" color="orange.800">{monthOverMonthChange.toFixed(2)}%</Text>
                </Flex>
              </VStack>
            </Box>
          </TabPanel>
          <TabPanel>
            <Heading size="md" mb={6} color="gray.700">Invoices</Heading>
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
              <Table variant="simple" size="md">
                <Thead bg="orange.100">
                  <Tr>
                    <Th color="orange.800">Month</Th>
                    <Th color="orange.800">Invoice Number</Th>
                    <Th color="orange.800">Payment Date</Th>
                    <Th color="orange.800">Payment Method</Th>
                    <Th color="orange.800">Description</Th>
                    <Th color="orange.800"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {history.map(({ month, total, invoiceId, paymentDate, paymentMethod, description }) => (
                    <Tr key={invoiceId}>
                      <Td>{month.name}</Td>
                      <Td>{invoiceId}</Td>
                      <Td>{paymentDate}</Td>
                      <Td>{paymentMethod}</Td>
                      <Td>{description}</Td>
                      <Td>
                        <Flex justify="center" gap={2}>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={handleBillingClick}
                            isLoading={isLoading}
                            leftIcon={<Icon as={FaCreditCard} />}
                            colorScheme="orange"
                            fontWeight="medium"
                          >
                            View Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={handleBillingClick}
                            isLoading={isLoading}
                            leftIcon={<Icon as={FaCreditCard} />}
                            colorScheme="orange"
                            fontWeight="medium"
                          >
                            View Receipt
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </TabPanel>
          <TabPanel>
            <PaymentDetailsTab />
          </TabPanel>
          <TabPanel>
            <Heading size="md" mb={6} color="gray.700">Pricing Details</Heading>
            <Box borderWidth="1px" borderRadius="lg" p={6} bg="gray.50" boxShadow="sm">
              <Text fontSize="lg" mb={4}>
                <strong>Product:</strong> Debian Unlimited Bandwidth VPS with Floating IP
              </Text>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  <strong>Monthly Pricing:</strong> Priced at $449/month as a single transaction, competitive with OVHcloud and Vultr for high-end specs (8 vCPUs, 32GB RAM, 1TB SSD, 2-5 floating IPs, unlimited bandwidth). Includes managed services: OS updates, security, and backups with Debian optimization. Reduce to $399/month to further undercut competitors.
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  <strong>Annual Pricing:</strong> If $449 is annual, it’s highly competitive (~$37.42/month). Keep at $449/year or offer $429/year for early sign-ups. Bundles 2-3 floating IPs and 24/7 priority support.
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  <strong>Value-Add:</strong> Free setup, DDoS protection, and 1-hour response support included. Ideal for multi-device use (10-50 clients) with scalable unlimited bandwidth and floating IPs for failover/geo-targeting.
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  <strong>Billing for Multiple Devices:</strong>
                  <List pl={6} spacing={2}>
                    <ListItem>
                      Base VPS (1 unit): $399-$449/month. Add $2-5 per additional floating IP for unique device IPs. Example: 10 devices (1 VPS, 10 IPs) = $399 (VPS) + $20 (10 IPs @ $2) = $419/month.
                    </ListItem>
                    <ListItem>
                      Avoid per-device billing unless CPU/RAM is heavily segmented to maintain competitiveness.
                    </ListItem>
                    <ListItem>
                      Reseller tiers: $449 (up to 20 devices), $599 (up to 50 devices) with proportional IP allocations.
                    </ListItem>
                  </List>
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  <strong>Invoice Description:</strong>
                  <List pl={6} spacing={2}>
                    <ListItem>
                      <strong>Details:</strong> Debian Unlimited Bandwidth VPS with Floating IP: High-performance managed VPS with 8 vCPUs, 32GB RAM, 1TB SSD, unlimited bandwidth, and 2-5 floating IPs for seamless migrations and geo-flexible hosting.
                    </ListItem>
                    <ListItem>
                      <strong>Invoice Line Items:</strong>
                      <List pl={6}>
                        <ListItem>Debian Managed VPS (Unlimited BW): $399</ListItem>
                        <ListItem>Floating IP (x2): $10 ($5 each)</ListItem>
                        <ListItem>Managed Support: $40</ListItem>
                        <ListItem><strong>Total:</strong> $449/month (single transaction)</ListItem>
                      </List>
                    </ListItem>
                  </List>
                </ListItem>
              </List>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Button as={ChakraLink} href=".." mt={6} colorScheme="orange" variant="outline" size="md">
        Back to Hosting
      </Button>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/billing")({
  component: BillingPage,
});