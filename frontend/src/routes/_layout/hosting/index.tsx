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
import { CopyIcon } from "@chakra-ui/icons";
import { FaCheckCircle } from "react-icons/fa";

// Hardcoded servers with pricing
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
    />
  );
};

function HostingIndexPage() {
  return (
    <Container maxW="container.xl" py={10}>
      <Flex align="center" py={6} mb={6}>
        <Flex direction="column">
          <Heading as="h1" size="xl" color="gray.800">Web Hosting Credentials</Heading>
          <Text fontSize="lg" color="gray.600">Login details for hosting devices</Text>
        </Flex>
        <Button ml="auto" as={Link} to="billing" colorScheme="orange" variant="solid">View Billing</Button>
      </Flex>

      <VStack align="stretch" spacing={8}>
        {/* API Key Card */}
        <Card borderWidth="1px" borderRadius="lg" boxShadow="sm">
          <CardHeader>
            <Heading size="md" color="gray.700">Active API Key</Heading>
          </CardHeader>
          <CardBody>
            <Text fontWeight="bold" mb={2}>API Key: <Text as="span" color="gray.600">sk_1S5MosLqozOkbqR8Bx8H7FYy</Text></Text>
            <HStack spacing={2}>
              <CopyCell textToCopy="sk_1S5MosLqozOkbqR8Bx8H7FYy" label="API Key" />
              <Button size="sm" colorScheme="orange" variant="outline">Regenerate Key</Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Servers Table */}
        <Card borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="sm">
          <CardHeader>
            <Heading size="md" color="gray.700">Server Credentials</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="md">
              <Thead bg="orange.100">
                <Tr>
                  <Th color="orange.800">Device Name</Th>
                  <Th color="orange.800">IP</Th>
                  <Th color="orange.800">Username</Th>
                  <Th color="orange.800">Password</Th>
                  <Th color="orange.800">OS</Th>
                  <Th color="orange.800" isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {servers.map((server) => (
                  <Tr key={server.name}>
                    <Td>{server.name}</Td>
                    <Td>{server.ip}</Td>
                    <Td>{server.username}</Td>
                    <Td>{server.password}</Td>
                    <Td>{server.os}</Td>
                    <Td isNumeric>
                      <HStack spacing={2} justify="flex-end">
                        <CopyCell textToCopy={server.username} label="Username" />
                        <CopyCell textToCopy={server.password} label="Password" />
                        <Button size="sm" as={Link} to={server.name} colorScheme="orange" variant="outline">View Details</Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot bg="orange.50">
                <Tr>
                  <Th colSpan={6} color="orange.800">Total Servers: {servers.length}</Th>
                </Tr>
              </Tfoot>
            </Table>
          </CardBody>
        </Card>

        {/* Roaming Proxy Features Card */}
        <Card borderWidth="1px" borderRadius="lg" boxShadow="sm">
          <CardHeader>
            <Heading size="md" color="gray.700">Roaming Proxy Features</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                <strong>Rotating IPs:</strong> {servers.filter(s => s.hasRotatingIP).length} servers with rotating IPs for enhanced privacy and geo-targeting.
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                <strong>Backups:</strong> {servers.filter(s => s.hasBackup).length} servers with automated backups for data protection.
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                <strong>Monitoring:</strong> {servers.filter(s => s.hasMonitoring).length} servers with 24/7 monitoring for optimal performance.
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />
                <strong>Debian Optimized:</strong> All servers run on Debian for stability and performance, with unlimited bandwidth.
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