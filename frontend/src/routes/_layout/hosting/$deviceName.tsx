// src/routes/_layout/hosting/$deviceName.tsx
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

function DeviceDetailsPage() {
  const { deviceName } = useParams({ from: "/_layout/hosting/$deviceName" });
  const device = devices.find((d) => d.name === deviceName);

  if (!device) {
    return <Text>Device not found</Text>;
  }

  return (
    <Container maxW="full" py={9}>
      <Flex align="center" justify="space-between" py={6}>
        <Heading size="xl">Device Details: {device.name}</Heading>
        <Button as={Link} to="..">Back to List</Button>
      </Flex>
      <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50">
        <VStack align="stretch" spacing={2}>
          <Flex justify="space-between">
            <Text fontWeight="bold">Name:</Text>
            <Text>{device.name}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Email:</Text>
            <Text>{device.email}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">IP:</Text>
            <Text>{device.ip}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Version:</Text>
            <Text>{device.version}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Kernel:</Text>
            <Text>{device.kernel}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Status:</Text>
            <Text>{device.status}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Type:</Text>
            <Text>{device.type}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">OS:</Text>
            <Text>{device.os}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Username:</Text>
            <Text>{device.username}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text fontWeight="bold">Password:</Text>
            <Text>{device.password}</Text>
          </Flex>
        </VStack>
      </Box>
    </Container>
  );
}

export const Route = createFileRoute("/_layout/hosting/$deviceName")({
  component: DeviceDetailsPage,
});