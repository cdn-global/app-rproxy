import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  IconButton,
  Alert,
  AlertIcon,
  useToast,
  VStack,
  Divider,
  Code,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, AddIcon } from "@chakra-ui/icons";

// --- Interfaces ---
interface ApiKey {
  key_preview: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  request_count?: number;
}

interface ApiKeyProps {
  token: string | null;
}

const API_URL = "https://api.roamingproxy.com/v2/proxy";

// --- START: New helper function to truncate the key display ---
/**
 * Truncates a long string by showing the start and end characters,
 * separated by an ellipsis.
 * @param {string} key The API key to truncate.
 * @param {number} startChars Number of characters to show from the start.
 * @param {number} endChars Number of characters to show from the end.
 * @returns {string} The truncated key.
 */
const truncateApiKey = (key: string | null, startChars = 12, endChars = 8): string => {
  if (!key || key.length <= startChars + endChars) {
    return key || "";
  }
  const start = key.substring(0, startChars);
  const end = key.substring(key.length - endChars);
  return `${start}...${end}`;
};
// --- END: New helper function ---

const ApiKeyModule: React.FC<ApiKeyProps> = ({ token }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [hasProxyApiAccess, setHasProxyApiAccess] = useState<boolean | null>(null);
  
  // --- START: New state for modal and countdown ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  // --- END: New state ---
  
  const toast = useToast();

  // --- START: New handler to close the modal ---
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setFullKey(null); // Clear the key so the modal doesn't re-open
  }, []);
  // --- END: New handler ---

  // --- START: New useEffect for countdown timer ---
  useEffect(() => {
    if (!isModalOpen) return;

    if (countdown <= 0) {
      handleCloseModal();
      return;
    }

    const timerId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isModalOpen, countdown, handleCloseModal]);
  // --- END: New useEffect ---

  useEffect(() => {
    if (token) {
      setApiKeys([]);
      setFullKey(null);
      setError(null);
      setLoading(true);
      
      const fetchInitialData = async () => {
        await fetchProxyApiAccess();
        await fetchApiKeys();
        setLoading(false);
      };
      fetchInitialData();
    }
  }, [token]);

  const fetchProxyApiAccess = async () => {
    if (!token) return;
    try {
      const response = await fetch("https://api.roamingproxy.com/v2/proxy-api/access", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch subscription status.");
      const data = await response.json();
      setHasProxyApiAccess(data.has_access);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setHasProxyApiAccess(false);
    }
  };

  const fetchApiKeys = async () => {
    if (!token) return;
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api-keys`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch API keys: ${response.status}`);
      const data: ApiKey[] = await response.json();
      const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setApiKeys(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred fetching keys.");
    }
  };

  const generateKey = async () => {
    if (!token) return;
    setIsGenerating(true);
    setFullKey(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/generate-api-key`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to generate API key: ${response.status}`);
      }
      const newKeyData = await response.json();
      
      // --- START: Modified key generation success logic ---
      setFullKey(newKeyData.api_key);
      setCountdown(15); // Reset countdown
      setIsModalOpen(true); // Open the modal
      await fetchApiKeys(); 
      // --- END: Modified key generation success logic ---

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during key generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteApiKey = async (key: ApiKey) => {
    if (!token) return;
    setKeyToDelete(key.key_preview);
    setError(null);

    try {
      const parts = key.key_preview.split("...");
      if (parts.length !== 2 || parts[1].length !== 8) throw new Error("Invalid key preview format.");
      
      const response = await fetch(`${API_URL}/api-keys/${parts[1]}`, {
        method: "DELETE",
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete API key: ${response.status}`);
      }
      toast({ title: "API Key Deleted", status: "success", duration: 3000, isClosable: true });
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during key deletion.");
    } finally {
      setKeyToDelete(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Full API key copied to clipboard.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  if (!token) {
    return (
      <Box p={6} width="100%">
        <Alert status="warning"><AlertIcon />Please log in to manage your API keys.</Alert>
      </Box>
    );
  }

  return (
    <Box>
       {/* --- START: New Key Generated Modal --- */}
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Key Generated Successfully!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm">
                For your security, this key will not be shown again. Copy and store it in a safe place.
              </Text>
              <Flex
                align="center"
                justify="space-between"
                p={3}
                bg="teal.50"
                borderRadius="md"
                border="1px solid"
                borderColor="teal.200"
                width="100%"
              >
                <Code bg="transparent" fontWeight="bold" noOfLines={1}>
                  {truncateApiKey(fullKey)}
                </Code>
                <IconButton
                  aria-label="Copy full key"
                  icon={<CopyIcon />}
                  size="sm"
                  onClick={() => copyToClipboard(fullKey!)}
                />
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
             <Flex justify="space-between" align="center" width="100%">
                <Text fontSize="sm" color="gray.500">
                    Auto-closing in {countdown}s...
                </Text>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* --- END: New Key Generated Modal --- */}

      <VStack spacing={2} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center">
          <Box>
            <Text fontSize="lg" mb={2} color="gray.700">
            Manage and generate API keys for programmatic access
            </Text>
            <Text fontSize="lg" mb={4} color="gray.700">
              Expiration is set to 365 days by default
            </Text>
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="teal"
            onClick={generateKey}
            isLoading={isGenerating}
            loadingText="Generating..."
            isDisabled={isGenerating || hasProxyApiAccess === false}
          >
            Generate Key
          </Button>
        </Flex>
        <Divider mb={4}></Divider>

        {hasProxyApiAccess === false && (
          <Alert status="warning" borderRadius="md"><AlertIcon />Your current plan does not include Proxy API features. Please upgrade to use this feature.</Alert>
        )}
        {error && (
          <Alert status="error" borderRadius="md"><AlertIcon />{error}</Alert>
        )}
        
        {/* The old key display block has been removed from here */}

        <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
          {loading ? (
             <Flex justify="center" align="center" h="200px"><Spinner size="xl" /></Flex>
          ) : (
            <Table variant="simple">
              
              <Thead bg="gray.50">
                <Tr>
                  <Th color="black">Key Preview</Th>
                  <Th color="black">Created At</Th>
                  <Th color="black">Expires At</Th>
                  <Th color="black">Requests</Th>
                  <Th color="black">Status</Th>
                  <Th color="black" isNumeric>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {apiKeys.length === 0 && !loading && (
                    <Tr>
                        <Td colSpan={6}>
                            <Text textAlign="center" color="gray.500" py={10}>
                                No API keys found. Generate one to get started.
                            </Text>
                        </Td>
                    </Tr>
                )}
                {apiKeys.map((key) => (
                  <Tr key={key.key_preview}>
                    <Td><Code fontSize="xs">{key.key_preview}</Code></Td>
                    <Td>{new Date(key.created_at).toLocaleDateString()}</Td>
                    <Td>{new Date(key.expires_at).toLocaleDateString()}</Td>
                    <Td>{key.request_count ?? 0}</Td>
                    <Td>
                      <Text color={key.is_active ? "green.500" : "red.500"} fontWeight="medium">
                        {key.is_active ? "Active" : "Inactive"}
                      </Text>
                    </Td>
                    <Td isNumeric>
                      <Tooltip
                        label={ key.request_count && key.request_count > 0 ? "Cannot delete a key with usage." : "Delete API key"}
                        hasArrow
                      >
                        <IconButton
                          aria-label="Delete key"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => deleteApiKey(key)}
                          isLoading={keyToDelete === key.key_preview}
                          isDisabled={key.request_count != null && key.request_count > 0}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default ApiKeyModule;