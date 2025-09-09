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
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { servers } from "../data/servers";

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
        <Alert status="error">
          <AlertIcon />
          <VStack align="stretch" spacing={2}>
            <Text fontSize="xl">Server not found: {deviceName}</Text>
            <Text fontSize="sm">
              The server name may be incorrect. Return to the{" "}
              <Link to="/hosting" style={{ color: "#3182CE" }}>
                VPS Dashboard
              </Link>{" "}
              to view all servers.
            </Text>
          </VStack>
        </Alert>
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
          to="/hosting"
          colorScheme="blue"
          variant="outline"
          size="md"
          _hover={{ bg: "blue.50" }}
        >
          Back to VPS Dashboard
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px">
          <Heading size="md" mb={4}>
            Basic Information
          </Heading>
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

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px">
          <Heading size="md" mb={4}>
            System Specifications
          </Heading>
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

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px">
          <Heading size="md" mb={4}>
            Credentials
          </Heading>
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

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px">
          <Heading size="md" mb={4}>
            Billing & Features
          </Heading>
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