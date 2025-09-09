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
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";

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
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/")({
  component: HostingIndexPage,
});