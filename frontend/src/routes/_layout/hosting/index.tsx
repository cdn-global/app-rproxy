// src/routes/_layout/hosting/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Container,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Text,
  useClipboard,
  useToast,
  HStack,
  Button,
  Heading,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { CopyIcon, CheckCircleIcon } from "@chakra-ui/icons";

// Hardcoded devices
interface Device {
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
}

const devices: Device[] = [
  {
    name: "riv1-nyc-mini5",
    email: "nik@popov.cloud",
    ip: "100.100.95.59",
    version: "1.82.0",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
  },
  {
    name: "riv2-nyc-mini5",
    email: "nik@popov.cloud",
    ip: "100.114.242.51",
    version: "1.86.2",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
  },
  {
    name: "riv3-nyc-mini6",
    email: "nik@popov.cloud",
    ip: "100.91.158.116",
    version: "1.82.5",
    kernel: "Linux 6.8.0-59-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
  },
  {
    name: "riv4-nyc-mini5",
    email: "nik@popov.cloud",
    ip: "100.100.106.3",
    version: "1.80.2",
    kernel: "Linux 6.8.0-55-generic",
    status: "Connected",
    type: "VPS",
    os: "ubuntu",
    username: "user",
    password: "5660",
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
    <Container maxW="full" py={9}>
      <Flex align="center" py={6}>
        <Flex direction="column">
          <Text fontSize="3xl" color="black">Web Hosting Credentials</Text>
          <Text fontSize="lg" color="gray.600">Login details for hosting devices</Text>
        </Flex>
        <Button ml="auto" as={Link} to="billing">View Billing</Button>
      </Flex>

      <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Device Name</Th>
              <Th>IP</Th>
              <Th>Username</Th>
              <Th>Password</Th>
              <Th isNumeric>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {devices.map((device) => (
              <Tr key={device.name}>
                <Td>{device.name}</Td>
                <Td>{device.ip}</Td>
                <Td>{device.username}</Td>
                <Td>{device.password}</Td>
                <Td isNumeric>
                  <HStack spacing={2} justify="flex-end">
                    <CopyCell textToCopy={device.username} label="Username" />
                    <CopyCell textToCopy={device.password} label="Password" />
                    <Button size="sm" as={Link} to={device.name}>View Details</Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* New Pricing Section */}
      <Box mt={8} p={6} borderWidth="1px" borderRadius="lg" bg="gray.50">
        <Heading as="h2" size="lg" mb={4}>Suggested Competitive Pricing</Heading>
        <Text fontSize="lg" mb={4}>
          Product: <strong>Debian Unlimited Bandwidth VPS with Floating IP</strong>
        </Text>
        <List spacing={3}>
          <ListItem>
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <strong>Monthly Pricing ($449):</strong> Reduce to $399/month to undercut competitors like OVHcloud and Vultr for similar specs (8 vCPUs, 32GB RAM, 1TB SSD, 2-5 floating IPs, unlimited bandwidth). Includes managed services: OS updates, security, and backups with Debian optimization.
          </ListItem>
          <ListItem>
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <strong>Annual Pricing ($449):</strong> Highly competitive at ~$37.42/month. Keep at $449/year or offer $429/year for early sign-ups. Bundles 2-3 floating IPs and 24/7 priority support.
          </ListItem>
          <ListItem>
            <ListIcon as={CheckCircleIcon} color="green.500" />
            <strong>Value-Add:</strong> Free setup, DDoS protection, and 1-hour response support included. Ideal for multi-device use (10-50 clients) with scalable unlimited bandwidth and floating IPs for failover/geo-targeting.
          </ListItem>
          <ListItem>
            <ListIcon as={CheckCircleIcon} color="green.500" />
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
            <ListIcon as={CheckCircleIcon} color="green.500" />
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
                  <ListItem><strong>Total:</strong> $449/month (or $449/year if annual)</ListItem>
                </List>
              </ListItem>
            </List>
          </ListItem>
        </List>
      </Box>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/")({
  component: HostingIndexPage,
});