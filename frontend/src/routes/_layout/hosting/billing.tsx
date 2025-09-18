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
  Alert,
  AlertIcon,
  Divider,
} from "@chakra-ui/react";
import { FaCreditCard, FaCheckCircle } from "react-icons/fa";
import { useState } from "react";

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
  fullMonthlyComputePrice: number;
  storageSizeGB: number;
  activeSince: string;
  hasRotatingIP: boolean;
  hasBackup: boolean;
  hasMonitoring: boolean;
  hasManagedSupport?: boolean;
  vCPUs: number;
  ramGB: number;
  isTrial: boolean;
}

const servers: Server[] = [
  {
    name: "01-NYC-FID-8core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.59",
    version: "1.82.0",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 11.40,
    fullMonthlyComputePrice: 11.40,
    storageSizeGB: 120,
    activeSince: "2025-07-01",
    hasRotatingIP: false,
    hasBackup: true,
    hasMonitoring: true,
    hasManagedSupport: false,
    vCPUs: 1,
    ramGB: 2,
    isTrial: false,
  },
  {
    name: "02-NYC-MTM-16core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.140.50.60",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 449,
      fullMonthlyComputePrice: 449,
    storageSizeGB: 100,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 16,
    ramGB: 64,
        isTrial: false,
  },
  {
    name: "03-NYC-BKN-4core-hdd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.61",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 40.1,
    fullMonthlyComputePrice:40.1,
    storageSizeGB: 468,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 4,
    ramGB: 4,
        isTrial: false,
  },
  {
    name: "04-NJ-SEC-4core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.62",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 45.3,
    fullMonthlyComputePrice:45.3,
    storageSizeGB: 110,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 4,
    ramGB: 16,
        isTrial: false,
  },
  {
    name: "05-NYC-FID-8core-hdd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.63",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 43.1,
    fullMonthlyComputePrice: 43.1,
    storageSizeGB: 932,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 8,
    ramGB: 4,
        isTrial: true,
  },
  {
    name: "06-NYC-MTM-2core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.64",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 40.1,
    fullMonthlyComputePrice: 40.1,
    storageSizeGB: 240,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 2,
    ramGB: 8,
        isTrial: false,
  },
];


const ELASTIC_IP_FEE_PER_MONTH = 5;
const STORAGE_COST_PER_GB_MONTH = 0.20;
const ROTATING_IP_FEE_PER_MONTH = 7.0;
const BACKUP_FEE_PER_MONTH = 7.0;
const MONITORING_FEE_PER_MONTH = 11.0;
const MANAGED_SUPPORT_FEE_PER_MONTH = 40.0;
const SUBSCRIPTION_COST_PER_MONTH = 299;


interface Service {
  name: string;
  getMonthlyCost: (server: Server) => number;
}

const services: Service[] = [
  { name: "Compute", getMonthlyCost: (s) => s.monthlyComputePrice },
  { name: "Storage", getMonthlyCost: (s) => s.storageSizeGB * STORAGE_COST_PER_GB_MONTH },
  { name: "Elastic IP", getMonthlyCost: () => ELASTIC_IP_FEE_PER_MONTH },
  { name: "Rotating IP", getMonthlyCost: (s) => (s.hasRotatingIP ? ROTATING_IP_FEE_PER_MONTH * 2 : 0) },
  { name: "Backup", getMonthlyCost: (s) => (s.hasBackup ? BACKUP_FEE_PER_MONTH : 0) },
  { name: "Monitoring", getMonthlyCost: (s) => (s.hasMonitoring ? MONITORING_FEE_PER_MONTH : 0) },
  { name: "Managed Support", getMonthlyCost: (s) => (s.hasManagedSupport ? MANAGED_SUPPORT_FEE_PER_MONTH : 0) },
];

interface Month {
  name: string;
  start: Date;
  end: Date;
}

const months: Month[] = [
  { name: "April 2025", start: new Date(2025, 3, 1), end: new Date(2025, 3, 30) },
  { name: "May 2025", start: new Date(2025, 4, 1), end: new Date(2025, 4, 31) },
  { name: "June 2025", start: new Date(2025, 5, 1), end: new Date(2025, 5, 30) },
  { name: "July 2025", start: new Date(2025, 6, 1), end: new Date(2025, 6, 31) },
  { name: "August 2025", start: new Date(2025, 7, 1), end: new Date(2025, 7, 31) },
  { name: "September 2025", start: new Date(2025, 8, 1), end: new Date(2025, 8, 30) },
];

function calculateTotalsForMonth(month: Month) {
  const activeServers = servers.filter((s) => new Date(s.activeSince) <= month.end);
  const totals = services.reduce((acc, service) => {
    const count = activeServers.filter((server) => !server.isTrial && service.getMonthlyCost(server) > 0).length;
    acc[service.name] = { total: activeServers.reduce((sum, server) => sum + (server.isTrial ? 0 : service.getMonthlyCost(server)), 0), count };
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const fullPriceTotals = services.reduce((acc, service) => {
    const getCost = (server: Server) => {
      if (service.name === "Compute" && server.isTrial) {
        return server.fullMonthlyComputePrice;
      }
      return service.getMonthlyCost(server);
    };
    const count = activeServers.filter((server) => getCost(server) > 0).length;
    acc[service.name] = { total: activeServers.reduce((sum, server) => sum + getCost(server), 0), count };
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const perServerTotals = activeServers.reduce((acc, server) => {
    acc[server.name] = server.isTrial ? 0 : services.reduce((sum, svc) => sum + svc.getMonthlyCost(server), 0);
    return acc;
  }, {} as Record<string, number>);

  const fullPricePerServerTotals = activeServers.reduce((acc, server) => {
    acc[server.name] = services.reduce((sum, svc) => {
      if (svc.name === "Compute" && server.isTrial) {
        return sum + server.fullMonthlyComputePrice;
      }
      return sum + svc.getMonthlyCost(server);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const subscriptionStart = new Date(2025, 3, 1); // April 2025
  const isSubscriptionActive = month.start >= subscriptionStart;
  const subscriptionCost = isSubscriptionActive ? SUBSCRIPTION_COST_PER_MONTH : 0;

  const grandTotal = Object.values(totals).reduce((sum, { total }) => sum + total, 0) + subscriptionCost;
  const fullGrandTotal = Object.values(fullPriceTotals).reduce((sum, { total }) => sum + total, 0) + subscriptionCost;

  return { totals, grandTotal, fullPriceTotals, fullGrandTotal, activeServers, perServerTotals, fullPricePerServerTotals };
}


const fetchBillingPortal = async (token: string) => {
  try {
    const response = await fetch("https://api.ROAMINGPROXY.com/v2/customer-portal", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.portal_url) {
      throw new Error("No portal URL received in response");
    }
    return data.portal_url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch billing portal: ${errorMessage}`);
  }
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
        description: error instanceof Error ? error.message : "Failed to access billing portal. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasSavedCard = true;
  const cardLast4 = "3007";
  const cardBrand = "American Express";
  const cardExp = "11/2027";
  const billingAddress = {
    name: "Nik Popov",
    email: "apispopov@gmail.com",
    line1: "599 Broadway, floor 3",
    city: "New York",
    state: "NY",
    postalCode: "10012",
    country: "US",
    phone: "(212) 595-3915",
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Text color="gray.600">View or update your payment method used for billing.</Text>
      {hasSavedCard ? (
        <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
          <Text fontWeight="bold">{cardBrand} ending in {cardLast4}</Text>
          <Text>Expires: {cardExp}</Text>
        </Box>
      ) : (
        <Text color="gray.600">No payment method saved. Add a payment method in Stripe to continue.</Text>
      )}
      <Button
        colorScheme="blue"
        onClick={handleBillingClick}
        isLoading={isLoading}
        loadingText="Redirecting..."
        isDisabled={isLoading}
        leftIcon={<Icon as={FaCreditCard} />}
      >
        Manage Payment Method
      </Button>
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
        colorScheme="blue"
        onClick={handleBillingClick}
        isLoading={isLoading}
        loadingText="Redirecting..."
        isDisabled={isLoading}
        leftIcon={<Icon as={FaCreditCard} />}
      >
        Manage Billing Address
      </Button>
    </VStack>
  );
}

const BillingPage = () => {
  const currentMonth = months[months.length - 1] || { name: "Current Month", start: new Date(), end: new Date() };
  const {
    totals: currentTotals,
    activeServers: currentActiveServers,
    perServerTotals,
    grandTotal,
    fullPriceTotals,
    fullGrandTotal,
    fullPricePerServerTotals,
  } = calculateTotalsForMonth(currentMonth);
  const [token] = useState<string | null>(localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

interface PaymentRecord {
  month: Month;
  total: number;
  invoiceId: string;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  status: string;
}

const history: PaymentRecord[] = [
      {
      month: months[5],
      total: 299.00,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZc",
      paymentDate: "June 10, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",
        status: "Succeeded",
    },
  {
    month: months[5], // September 2025
    total: 193.70,
    invoiceId: "pm_1Rihl8LqozOkbqR8mWtaIvNZ",
    paymentDate: "September 10, 2025",
    paymentMethod: "American Express •••• 3007",
    description: "Unlimited IP Rotation VPS - Multi-Region",
    status: "Succeeded",
  },
    {
      month: months[5],
      total: 449.00,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FYy",
      paymentDate: "September 9, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "Unlimited IP Rotation VPS - Multi-Region ",
     status: "Succeeded",
    },
    {
       month: months[4],
      total: 318.81,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZa",
      paymentDate: "August 15, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",
        status: "Succeeded",
    },
    {
   month: months[3],
      total: 318.81,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZb",
      paymentDate: "July 15, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",
        status: "Succeeded",
    },
    {
      month: months[2],
      total: 299.00,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZc",
      paymentDate: "June 10, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",
        status: "Succeeded",
    },
    {
      month: months[1],
      total: 299.00,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZd",
      paymentDate: "May 10, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",
        status: "Succeeded",
    },
    {
      month: months[0],
      total: 322.92,
      invoiceId: "in_1S5MosLqozOkbqR8Bx8H7FZe",
      paymentDate: "April 10, 2025",
      paymentMethod: "American Express •••• 3007",
      description: "HTTPs Request API - Plus Tier Subscription",  status: "Succeeded",
    },
  ];

  const allTimeTotal = history.reduce((sum, { total }) => sum + total, 0) + (SUBSCRIPTION_COST_PER_MONTH * 6); // 6 months (April to September)
  const averageMonthly = allTimeTotal / months.length;
  const previousMonthTotal = history
    .filter(({ month }) => month.name === "August 2025")
    .reduce((sum, { total }) => sum + total, 0) + SUBSCRIPTION_COST_PER_MONTH;
  const monthOverMonthChange = previousMonthTotal ? ((grandTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;
  const invoicedAmount = history
    .filter(({ month, status }) => month.name === "September 2025" && status === "Succeeded")
    .reduce((sum, { total }) => sum + total, 0);
  const outstandingBalance = grandTotal + history
    .filter(({ month, status }) => month.name === "August 2025" && status === "Pending")
    .reduce((sum, { total }) => sum + total, 0) - invoicedAmount;

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
        description: error instanceof Error ? error.message : "Failed to access billing portal. Please try again later.",
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
             <Heading size="xl" mb={6} color="red.700">{currentMonth.name} - Billing Cycle</Heading>
        <Text fontSize="lg" color="red.600">Manage your hosting costs and review billing history</Text>
      </Flex>
      <Tabs variant="enclosed" colorScheme="orange" isFitted>
        <TabList>
          <Tab fontWeight="semibold" _selected={{ color: "red.600", borderTopColor: "red.400" }}>Current Usage</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "red.600", borderTopColor: "red.400" }}>Service Details</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "red.600", borderTopColor: "red.400" }}>Invoices</Tab>
          <Tab fontWeight="semibold" _selected={{ color: "red.600", borderTopColor: "red.400" }}>Payment Details</Tab>
        </TabList>
        <TabPanels bg="red.50" borderRadius="0 0 md md">
          <TabPanel>
            <VStack align="stretch" spacing={6}>
        
              {outstandingBalance > 0 && (
                <Box borderWidth="1px" borderRadius="lg" p={4} bg="red.50" boxShadow="sm">
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="semibold" color="red.800">Balance</Text>
                    
                    <Flex justify="space-between">
                      <Text>Invoiced Amount (September 2025):</Text>
                      <Text fontWeight="bold">${invoicedAmount.toFixed(2)}</Text>
                    </Flex>
                    {history
                      .filter(({ month, status }) => month.name === "August 2025" && status === "Pending")
                      .map((invoice) => (
                        <Flex key={invoice.invoiceId} justify="space-between">
                          <Text>{invoice.description} (August 2025):</Text>
                          <Text fontWeight="bold">${invoice.total.toFixed(2)}</Text>
                        </Flex>
                      ))}
                    <Flex justify="space-between">
                      <Text>Outstanding Balance:</Text>
                      <Text fontWeight="bold" color="red.600">${outstandingBalance.toFixed(2)}</Text>
                    </Flex>
                    <Text fontStyle="italic" color="red.600">
                      Note: The outstanding balance includes unpaid invoices from previous months, current server costs, and subscription costs not yet invoiced. 
                    </Text>
                    <Button
                      colorScheme="orange"
                      onClick={handleBillingClick}
                      isLoading={isLoading}
                      loadingText="Redirecting..."
                      isDisabled={isLoading}
                    >
                      Manage Billing
                    </Button>
                  </VStack>
                </Box>
              )}
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Table variant="simple" size="md">
                  <Thead bg="red.100">
                    <Tr>
                      <Th color="red.800">Server Name</Th>
                      <Th color="red.800">IP Address</Th>
                      <Th color="red.800">Status</Th>
                      <Th color="red.800" isNumeric>Charged Cost (USD)</Th>
                      <Th color="red.800" isNumeric>Full Cost (USD)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentActiveServers.map((server) => (
                      <Tr key={server.name}>
                        <Td>{server.name}</Td>
                        <Td>{server.ip}</Td>
                        <Td>{server.isTrial ? "Trial" : "Active"}</Td>
                        <Td isNumeric>${perServerTotals[server.name].toFixed(2)}</Td>
                        <Td isNumeric>${fullPricePerServerTotals[server.name].toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot bg="red.50">
                    <Tr>
                      <Th colSpan={3} color="red.800">Server Total</Th>
                      <Th isNumeric color="red.800">${(grandTotal - SUBSCRIPTION_COST_PER_MONTH).toFixed(2)}</Th>
                      <Th isNumeric color="red.800">${(fullGrandTotal - SUBSCRIPTION_COST_PER_MONTH).toFixed(2)}</Th>
                    </Tr>
                    <Tr>
                      <Th colSpan={3} color="red.800">Subscription</Th>
                      <Th isNumeric color="red.800">${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Th>
                      <Th isNumeric color="red.800">${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Th>
                    </Tr>
                    <Tr>
                      <Th colSpan={3} color="red.800">Grand Total</Th>
                      <Th isNumeric color="red.800">${grandTotal.toFixed(2)}</Th>
                      <Th isNumeric color="red.800">${fullGrandTotal.toFixed(2)}</Th>
                    </Tr>
                  </Tfoot>
                </Table>
              </Box>
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
                <Table variant="simple" size="md">
                  <Thead bg="red.100">
                    <Tr>
                      <Th color="red.800">Service</Th>
                      <Th color="red.800">Quantity</Th>
                      <Th color="red.800" isNumeric>Charged Cost (USD)</Th>
                      <Th color="red.800" isNumeric>Full Cost (USD)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {services.map((s) => (
                      <Tr key={s.name}>
                        <Td>{s.name}</Td>
                        <Td>x {currentTotals[s.name].count}</Td>
                        <Td isNumeric>${currentTotals[s.name].total.toFixed(2)}</Td>
                        <Td isNumeric>${fullPriceTotals[s.name].total.toFixed(2)}</Td>
                      </Tr>
                    ))}
                    <Tr>
                      <Td>Unlimited HTTPS API Request - Plus Tier</Td>
                      <Td>x 1</Td>
                      <Td isNumeric>${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Td>
                      <Td isNumeric>${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Td>
                    </Tr>
                  </Tbody>
                  <Tfoot bg="red.50">
                    <Tr>
                      <Th colSpan={2} color="red.800">Total</Th>
                      <Th isNumeric color="red.800">${grandTotal.toFixed(2)}</Th>
                      <Th isNumeric color="red.800">${fullGrandTotal.toFixed(2)}</Th>
                    </Tr>
                  </Tfoot>
                </Table>
              </Box>
                  <Box borderWidth="1px" borderRadius="lg" p={4} bg="red.50" boxShadow="sm">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="semibold" color="red.800">Current Subscription</Text>
                  <Text>Unlimited HTTPS API Request - Plus Tier</Text>
                  <Text fontWeight="bold">${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)} per month</Text>
                  <Text>Your subscription renews on September 17, 2025.</Text>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onClick={handleBillingClick}
                    isLoading={isLoading}
                    loadingText="Redirecting..."
                    isDisabled={isLoading}
                  >
                    View Details
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
          <TabPanel>
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem borderWidth="1px" borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg="red.50" _hover={{ bg: "red.100" }}>
                    <Box as="span" flex="1" textAlign="left" fontWeight="semibold" color="red.800">
                      Server Resources
                    </Box>
                    <AccordionIcon color="red.600" />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Table variant="simple" size="sm">
                    <Thead bg="red.100">
                      <Tr>
                        <Th color="red.800">Server Name</Th>
                        <Th color="red.800">vCPUs</Th>
                        <Th color="red.800">RAM (GB)</Th>
                        <Th color="red.800">Storage (GB)</Th>
                        <Th color="red.800">Floating IPs</Th>
                        <Th color="red.800">Features</Th>
                        <Th color="red.800">Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentActiveServers.map((server) => (
                        <Tr key={server.name}>
                          <Td>{server.name}</Td>
                          <Td>{server.vCPUs}</Td>
                          <Td>{server.ramGB}</Td>
                          <Td>{server.storageSizeGB}</Td>
                          <Td>{server.hasRotatingIP ? 1 : 0}</Td>
                          <Td>
                            <List spacing={1}>
                              {server.hasManagedSupport && <ListItem><ListIcon as={FaCheckCircle} color="green.500" />Managed Services (OS updates, security, backups)</ListItem>}
                              {server.hasBackup && <ListItem><ListIcon as={FaCheckCircle} color="green.500" />Backup</ListItem>}
                              {server.hasMonitoring && <ListItem><ListIcon as={FaCheckCircle} color="green.500" />Monitoring</ListItem>}
                            </List>
                          </Td>
                          <Td>{server.isTrial ? "Trial" : "Active"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </AccordionPanel>
              </AccordionItem>
              {services.map((s) => {
                const relevantServers = currentActiveServers.filter((server) => s.getMonthlyCost(server) > 0 || (s.name === "Compute" && server.isTrial));
                const total = currentTotals[s.name].total;
                const fullTotal = fullPriceTotals[s.name].total;
                return (
                  <AccordionItem key={s.name} borderWidth="1px" borderRadius="md" mb={4}>
                    <h2>
                      <AccordionButton bg="red.50" _hover={{ bg: "red.100" }}>
                        <Box as="span" flex="1" textAlign="left" fontWeight="semibold" color="red.800">
                          {s.name} - ${total.toFixed(2)} (x {relevantServers.length})
                        </Box>
                        <AccordionIcon color="red.600" />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      {relevantServers.length > 0 ? (
                        <Table variant="simple" size="sm">
                          <Thead bg="red.100">
                            <Tr>
                              <Th color="red.800">Server Name</Th>
                              <Th color="red.800">Status</Th>
                              <Th color="red.800" isNumeric>Charged Cost (USD)</Th>
                              <Th color="red.800" isNumeric>Full Cost (USD)</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {relevantServers.map((server) => (
                              <Tr key={server.name}>
                                <Td>{server.name}</Td>
                                <Td>{server.isTrial ? "Trial" : "Active"}</Td>
                                <Td isNumeric>${server.isTrial ? "0.00" : s.getMonthlyCost(server).toFixed(2)}</Td>
                                <Td isNumeric>
                                  ${s.name === "Compute" && server.isTrial ? server.fullMonthlyComputePrice.toFixed(2) : s.getMonthlyCost(server).toFixed(2)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text color="red.600">No servers using this service.</Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
              <AccordionItem borderWidth="1px" borderRadius="md" mb={4}>
                <h2>
                  <AccordionButton bg="red.50" _hover={{ bg: "red.100" }}>
                    <Box as="span" flex="1" textAlign="left" fontWeight="semibold" color="red.800">
                      Unlimited HTTPS API Request - Plus Tier - ${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)} (x 1)
                    </Box>
                    <AccordionIcon color="red.600" />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={4}>
                    <Text>Subscription for Unlimited HTTPS API Requests (Plus Tier).</Text>
                    <Text>Cost: ${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)} per month</Text>
                    <Text>Renews on: September 17, 2025</Text>
                    <Divider />
                    <Text fontWeight="semibold" color="red.800">Compute Costs</Text>
                    <Table variant="simple" size="sm">
                      <Thead bg="red.100">
                        <Tr>
                          <Th color="red.800">Server Name</Th>
                          <Th color="red.800">Status</Th>
                          <Th color="red.800" isNumeric>Charged Compute Cost (USD)</Th>
                          <Th color="red.800" isNumeric>Full Compute Cost (USD)</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {currentActiveServers.map((server) => {
                          const computeService = services.find((s) => s.name === "Compute");
                          const chargedCost = computeService ? (server.isTrial ? 0 : computeService.getMonthlyCost(server)) : 0;
                          const fullCost = computeService ? (server.isTrial ? server.fullMonthlyComputePrice : computeService.getMonthlyCost(server)) : 0;
                          return (
                            <Tr key={server.name}>
                              <Td>{server.name}</Td>
                              <Td>{server.isTrial ? "Trial" : "Active"}</Td>
                              <Td isNumeric>${chargedCost.toFixed(2)}</Td>
                              <Td isNumeric>${fullCost.toFixed(2)}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                      <Tfoot bg="red.50">
                        <Tr>
                          <Th colSpan={2} color="red.800">Total Compute Cost</Th>
                          <Th isNumeric color="red.800">${currentTotals["Compute"].total.toFixed(2)}</Th>
                          <Th isNumeric color="red.800">${fullPriceTotals["Compute"].total.toFixed(2)}</Th>
                        </Tr>
                        <Tr>
                          <Th colSpan={2} color="red.800">Subscription Cost</Th>
                          <Th isNumeric color="red.800">${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Th>
                          <Th isNumeric color="red.800">${SUBSCRIPTION_COST_PER_MONTH.toFixed(2)}</Th>
                        </Tr>
                      </Tfoot>
                    </Table>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </TabPanel>
          <TabPanel>
          
            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
              <Table variant="simple" size="md">
                <Thead bg="red.100">
                  <Tr>
                    <Th color="red.800">Month</Th>
                    <Th color="red.800">Invoice Number</Th>
                    <Th color="red.800">Payment Date</Th>
                    <Th color="red.800">Payment Method</Th>
                    <Th color="red.800">Description</Th>
                    <Th color="red.800"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {history.map(({ month, total, invoiceId, paymentDate, paymentMethod, description }) => (
                    <Tr key={invoiceId}>
                      <Td>{month.name}</Td>
                      <Td>{invoiceId.slice(0, 12)}...</Td>
                      <Td>{paymentDate}</Td>
                      <Td>{paymentMethod}</Td>
                      <Td>{description}</Td>
                      <Td>
                        <Flex justify="center" gap={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={handleBillingClick}
                            isLoading={isLoading}
                            loadingText="Redirecting..."
                            isDisabled={isLoading}
                            leftIcon={<Icon as={FaCreditCard} />}
                          >
                            View Invoice
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={handleBillingClick}
                            isLoading={isLoading}
                            loadingText="Redirecting..."
                            isDisabled={isLoading}
                            leftIcon={<Icon as={FaCreditCard} />}
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
            <Box mt={4}>
              <Button
                colorScheme="blue"
                onClick={handleBillingClick}
                isLoading={isLoading}
                loadingText="Redirecting..."
                isDisabled={isLoading}
                leftIcon={<Icon as={FaCreditCard} />}
              >
                Manage Invoices in Stripe
              </Button>
            </Box>
          </TabPanel>
          <TabPanel>
            <PaymentDetailsTab />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Button as={ChakraLink} href=".." mt={6} colorScheme="red" variant="outline" size="md">
        Back to Hosting
      </Button>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/billing")({
  component: BillingPage,
});