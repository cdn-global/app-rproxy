import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Box,
  Container,
  Flex,
  Text,
  Button,
  VStack,
  Heading,
} from "@chakra-ui/react";

// Hardcoded servers
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
  activeSince: string;
  hasRotatingIP?: boolean;
  hasBackup?: boolean;
  hasMonitoring?: boolean;
  hasManagedSupport?: boolean;
  vCPUs?: number;
  ramGB?: number;
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
    name: "riv8-nyc-mini9",
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
];

function DeviceDetailsPage() {
  const { deviceName } = useParams({ from: "/_layout/hosting/$deviceName" });
  const server = servers.find((s) => s.name === deviceName);

  if (!server) {
    return <Text>Server not found</Text>;
  }

  return (
    <Container maxW="full" py={9}>
      <Flex align="center" justify="space-between" py={6}>
        <Heading size="xl">Server Details: {server.name}</Heading>
        <Button as={Link} to="..">Back to List</Button>
      </Flex>
      <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50">
        <VStack align="stretch" spacing={2}>
          <Flex justify="space-between">
            <Text fontWeight="bold">Name:</Text>
            <Text>{server.name}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Email:</Text>
            <Text>{server.email}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">IP:</Text>
            <Text>{server.ip}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Version:</Text>
            <Text>{server.version}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Kernel:</Text>
            <Text>{server.kernel}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Status:</Text>
            <Text>{server.status}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Type:</Text>
            <Text>{server.type}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">OS:</Text>
            <Text>{server.os}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Username:</Text>
            <Text>{server.username}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Password:</Text>
            <Text>{server.password}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Monthly Compute Price:</Text>
            <Text>${server.monthlyComputePrice.toFixed(2)}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Storage Size:</Text>
            <Text>{server.storageSizeGB} GB</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Active Since:</Text>
            <Text>{server.activeSince}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Rotating IP:</Text>
            <Text>{server.hasRotatingIP ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Backup:</Text>
            <Text>{server.hasBackup ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Monitoring:</Text>
            <Text>{server.hasMonitoring ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Managed Support:</Text>
            <Text>{server.hasManagedSupport ? "Yes" : "No"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">vCPUs:</Text>
            <Text>{server.vCPUs ?? "N/A"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">RAM:</Text>
            <Text>{server.ramGB ? `${server.ramGB} GB` : "N/A"}</Text>
          </Flex>
        </VStack>
      </Box>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/$deviceName")({
  component: DeviceDetailsPage,
});