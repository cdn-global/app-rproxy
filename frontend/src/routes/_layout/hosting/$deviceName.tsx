import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  VStack,
  Heading,
  SimpleGrid,
  Badge,
  IconButton,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";


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
  hasManagedSupport?: boolean;
  vCPUs?: number;
  ramGB?: number;
}

const servers: Server[] = [
  {
    name: "lowermanhattan-nyc-8core-ssd",
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
    storageSizeGB: 120,
    activeSince: "2025-07-01",
    hasRotatingIP: false,
    hasBackup: true,
    hasMonitoring: true,
    hasManagedSupport: false,
    vCPUs: 1,
    ramGB: 2,
  },
  {
    name: "midtown-nyc-16core-ssd",
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
    storageSizeGB: 100,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 16,
    ramGB: 64,
  },
  {
    name: "bk-nyc-4core-hdd",
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
    storageSizeGB: 468,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 4,
    ramGB: 4,
  },
  {
    name: "jersey-nyc-4core-ssd",
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
    storageSizeGB: 110,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 4,
    ramGB: 16,
  },
  {
    name: "lowermanhattan-nyc-8core-hdd",
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
    storageSizeGB: 932,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 8,
    ramGB: 4,
  },
  {
    name: "midtown-nyc-2core-ssd",
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
    storageSizeGB: 240,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 2,
    ramGB: 8,
  },
];

function DeviceDetailsPage() {
  const { deviceName } = useParams({ from: "/_layout/hosting/$deviceName" });
  const server = servers.find((s) => s.name === deviceName);
  const toast = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied!`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  if (!server) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text fontSize="xl" color="red.500">Server not found</Text>
      </Container>
    );
  }

  const statusColor = server.status === "Connected" ? "green" : "red";

  return (
    <Container maxW="container.xl" py={8}>
      <Flex align="center" justify="space-between" mb={6}>
        <HStack>
          <Heading size="lg">Server: {server.name}</Heading>
          <Badge colorScheme={statusColor} fontSize="md" px={2} py={1}>
            {server.status}
          </Badge>
        </HStack>
        <Button
          as={Link}
          to=".."
          colorScheme="blue"
          variant="outline"
          size="md"
          _hover={{ bg: "blue.50" }}
        >
          Back to List
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Basic Information */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
        >
          <Heading size="md" mb={4}>Basic Information</Heading>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">Name:</Text>
              <Text>{server.name}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">Email:</Text>
              <HStack>
                <Text>{server.email}</Text>
                <IconButton
                  aria-label="Copy email"
                  icon={<CopyIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(server.email, "Email")}
                />
              </HStack>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">IP:</Text>
              <HStack>
                <Text>{server.ip}</Text>
                <IconButton
                  aria-label="Copy IP"
                  icon={<CopyIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(server.ip, "IP")}
                />
              </HStack>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Type:</Text>
              <Text>{server.type}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">OS:</Text>
              <Text>{server.os}</Text>
            </Flex>
          </VStack>
        </Box>

        {/* System Specifications */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
        >
          <Heading size="md" mb={4}>System Specifications</Heading>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between">
              <Text fontWeight="medium">Version:</Text>
              <Text>{server.version}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Kernel:</Text>
              <Text>{server.kernel}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">vCPUs:</Text>
              <Text>{server.vCPUs ?? "N/A"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">RAM:</Text>
              <Text>{server.ramGB ? `${server.ramGB} GB` : "N/A"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Storage Size:</Text>
              <Text>{server.storageSizeGB} GB</Text>
            </Flex>
          </VStack>
        </Box>

        {/* Credentials */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
        >
          <Heading size="md" mb={4}>Credentials</Heading>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">Username:</Text>
              <HStack>
                <Text>{server.username}</Text>
                <IconButton
                  aria-label="Copy username"
                  icon={<CopyIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(server.username, "Username")}
                />
              </HStack>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontWeight="medium">Password:</Text>
              <HStack>
                <Text>{server.password}</Text>
                <IconButton
                  aria-label="Copy password"
                  icon={<CopyIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(server.password, "Password")}
                />
              </HStack>
            </Flex>
          </VStack>
        </Box>

        {/* Billing & Features */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
        >
          <Heading size="md" mb={4}>Billing & Features</Heading>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between">
              <Text fontWeight="medium">Monthly Compute Price:</Text>
              <Text>${server.monthlyComputePrice.toFixed(2)}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Active Since:</Text>
              <Text>{server.activeSince}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Rotating IP:</Text>
              <Text>{server.hasRotatingIP ? "Yes" : "No"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Backup:</Text>
              <Text>{server.hasBackup ? "Yes" : "No"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Monitoring:</Text>
              <Text>{server.hasMonitoring ? "Yes" : "No"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontWeight="medium">Managed Support:</Text>
              <Text>{server.hasManagedSupport ? "Yes" : "No"}</Text>
            </Flex>
          </VStack>
        </Box>
      </SimpleGrid>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/$deviceName")({
  component: DeviceDetailsPage,
});