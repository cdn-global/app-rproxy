import { createFileRoute, Link } from "@tanstack/react-router";
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
  IconButton,
  Text,
  useClipboard,
  useToast,
  HStack,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  List,
  ListItem,
  ListIcon,
  VStack,
} from "@chakra-ui/react";
import { CopyIcon, CheckCircleIcon } from "@chakra-ui/icons";

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

// Reusable CopyCell component
const CopyCell = ({ textToCopy, label }: { textToCopy: string; label: string }) => {
  const { onCopy } = useClipboard(textToCopy);
  const toast = useToast();
  const handleCopy = () => {
    onCopy();
    toast({ title: `${label} copied to clipboard!`, status: "success", duration: 2000, isClosable: true });
  };
  return (
    <IconButton
      aria-label={`Copy ${label}`}
      icon={<CopyIcon />}
      size="sm"
      onClick={handleCopy}
      colorScheme="red"
      variant="outline"
    />
  );
};

function HostingIndexPage() {
  return (
    <Container maxW="container.xl" py={10} as="main">
      <Flex align="center" justify="space-between" py={6} mb={6}>
        <VStack align="start" spacing={2}>
          <Heading as="h1" size="xl" color="gray.800">VPS Details</Heading>
          <Text fontSize="lg" color="gray.600">Login details and management for your Debian VPS servers. Fully managed virtual private servers for your needs.</Text>
        </VStack>
        <Button as={Link} to="billing" colorScheme="red" variant="solid" size="md">View Billing</Button>
      </Flex>

      <VStack align="stretch" spacing={8}>
        {/* Servers Table */}
        <Card borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm" bg="gray.50">
          <CardHeader bg="red.100">
            <Heading size="md" color="red.800">Server Credentials</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="md">
              <Thead bg="red.100">
                <Tr>
                  <Th color="red.800">Device Name</Th>
                  <Th color="red.800">IP</Th>
                  <Th color="red.800">Username</Th>
                  <Th color="red.800">Password</Th>
                  <Th color="red.800">OS</Th>
                  <Th color="red.800" isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {servers.map((server) => (
                  <Tr key={server.name}>
                    <Td>{server.name}</Td>
                    <Td>{server.ip}</Td>
                    <Td>{server.username}</Td>
                    <Td>{server.password}</Td>
                    <Td>{server.os ? server.os.charAt(0).toUpperCase() + server.os.slice(1) : "Unknown"}</Td>
                    <Td isNumeric>
                      <HStack spacing={2} justify="flex-end">
                        <CopyCell textToCopy={server.username} label="Username" />
                        <CopyCell textToCopy={server.password} label="Password" />
                        <Button size="sm" as={Link} to={`/hosting/${encodeURIComponent(server.name)}`} colorScheme="red" variant="outline">View Details</Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot bg="red.50">
                <Tr>
                  <Th colSpan={6} color="red.800">Total Servers: {servers.length}</Th>
                </Tr>
              </Tfoot>
            </Table>
          </CardBody>
        </Card>

        {/* Roaming Proxy Features Card */}
        <Card borderWidth="1px" borderRadius="lg" boxShadow="sm" bg="gray.50">
          <CardHeader bg="red.100">
            <Heading size="md" color="red.800">Server Features</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={4}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">Rotating IPs:</Text> {servers.filter(s => s.hasRotatingIP === true).length} servers with rotating IPs for enhanced privacy and geo-targeting.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">Backups:</Text> {servers.filter(s => s.hasBackup === true).length} servers with automated backups for data protection.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">Monitoring:</Text> {servers.filter(s => s.hasMonitoring === true).length} servers with 24/7 monitoring for optimal performance.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">Debian Optimized:</Text> All servers run on Debian for stability, performance, and unlimited bandwidth.
              </ListItem>
            </List>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/")({
  component: HostingIndexPage,
});