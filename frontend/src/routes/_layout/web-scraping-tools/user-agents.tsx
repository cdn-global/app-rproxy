import { useState, useRef, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Box,
  Button,
  Container,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  SimpleGrid,
  TableContainer,
  Th,
  Td,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useClipboard,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Divider,
  Tabs,
  TabList,
  Tab,
  Badge,
  VStack,
} from "@chakra-ui/react";
import { CopyIcon, ChevronDownIcon, EditIcon, DeleteIcon, AddIcon, RepeatIcon } from "@chakra-ui/icons";
import type { UserPublic } from "../../../client";

// --- API Configuration & Types (No changes) ---
const API_BASE_URL = "https://api.roamingproxy.com/v2";

interface UserAgentPublic {
  id: string;
  user_agent: string;
  created_at: string;
  device?: string;
  browser?: string;
  os?: string;
}

interface UserAgentsPublic {
  data: UserAgentPublic[];
  count: number;
}

interface UserAgentCreate {
    user_agent: string;
}

interface UserAgentUpdate {
    user_agent?: string;
}

interface UpdateSourceResponse {
    status: string;
    new_agents_added: number;
    [key: string]: any;
}

// --- Utility & API Functions (No changes) ---
function convertToCSV(data: UserAgentPublic[]): string {
    if (data.length === 0) return "";
    const headers = "id,user_agent,created_at,device,browser,os";
    const rows = data.map(row => {
        const id = `"${row.id}"`;
        const userAgent = `"${row.user_agent.replace(/"/g, '""')}"`;
        const createdAt = `"${row.created_at}"`;
        const device = `"${row.device ?? ''}"`;
        const browser = `"${row.browser ?? ''}"`;
        const os = `"${row.os ?? ''}"`;
        return [id, userAgent, createdAt, device, browser, os].join(',');
    });
    return [headers, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const getAuthToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.warn("No access token found. Using a mock token for demonstration. Please log in for a real application.")
        return "mock-jwt-token-for-testing";
    }
    return token;
};

async function fetchPaginatedUserAgents(skip: number, limit: number): Promise<UserAgentsPublic> {
    const response = await fetch(`${API_BASE_URL}/user-agents/?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch user agents" }));
        throw new Error(errorData.detail);
    }
    return response.json();
}

async function fetchAllUserAgents(): Promise<UserAgentPublic[]> {
    const response = await fetch(`${API_BASE_URL}/user-agents/?limit=10000`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch all user agents" }));
        throw new Error(errorData.detail);
    }
    const result: UserAgentsPublic = await response.json();
    return result.data;
}

async function updateUserAgentsFromSource(): Promise<UpdateSourceResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/user-agents/update-from-source/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update from source" }));
        throw new Error(errorData.detail);
    }
    return response.json();
}

async function createUserAgent(data: UserAgentCreate): Promise<UserAgentPublic> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/user-agents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to create user agent" }));
        throw new Error(errorData.detail);
    }
    return response.json();
}

async function updateUserAgent({ id, data }: { id: string, data: UserAgentUpdate }): Promise<UserAgentPublic> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/user-agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to update user agent" }));
        throw new Error(errorData.detail);
    }
    return response.json();
}

async function deleteUserAgent(id: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/user-agents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok && response.status !== 204) {
         const errorData = await response.json().catch(() => ({ detail: "Failed to delete user agent" }));
        throw new Error(errorData.detail);
    }
}

// --- Reusable Components ---
const CopyCell = ({ textToCopy }: { textToCopy: string }) => {
    const { onCopy } = useClipboard(textToCopy);
    const toast = useToast();
    const handleCopy = () => {
        onCopy();
        toast({ title: "Copied to clipboard!", status: "success", duration: 2000, isClosable: true });
    };
    return (<IconButton aria-label="Copy user agent" icon={<CopyIcon />} size="sm" onClick={handleCopy} />);
};

const AddEditUserAgentModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: { isOpen: boolean; onClose: () => void; onSubmit: (data: UserAgentCreate | UserAgentUpdate) => void; initialData?: UserAgentPublic | null; isLoading: boolean; }) => {
  const [userAgent, setUserAgent] = useState(initialData?.user_agent || "");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ user_agent: userAgent }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{initialData ? 'Edit User Agent' : 'Add New User Agent'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>User Agent String</FormLabel>
            <Textarea defaultValue={initialData?.user_agent} onChange={(e) => setUserAgent(e.target.value)} placeholder="e.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." rows={5} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" type="submit" isLoading={isLoading}>{initialData ? 'Save Changes' : 'Create'}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, isLoading }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, isLoading: boolean, }) => {
    const cancelRef = useRef<HTMLButtonElement>(null);
    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete User Agent</AlertDialogHeader>
                    <AlertDialogBody>Are you sure you want to delete this user agent? This action cannot be undone.</AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="red" onClick={onConfirm} ml={3} isLoading={isLoading}>Delete</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

const UserAgentTable = ({
  agents,
  isSuperuser,
  handleOpenEditModal,
  handleOpenDeleteAlert,
  isPlaceholderData,
}: {
  agents: UserAgentPublic[];
  isSuperuser: boolean;
  handleOpenEditModal: (agent: UserAgentPublic) => void;
  handleOpenDeleteAlert: (id: string) => void;
  isPlaceholderData: boolean;
}) => {
  if (agents.length === 0) {
    return (
      <Flex justify="center" align="center" p={10}>
        <Text color="gray.500">No user agents to display in this category on this page.</Text>
      </Flex>
    );
  }

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th color="black">User Agent String</Th>
            {/* START: UPDATED HEADERS */}
            <Th color="black">Device</Th>
            <Th color="black">OS</Th>
            <Th color="black">Browser</Th>
            {/* END: UPDATED HEADERS */}
            <Th color="black" isNumeric>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {agents.map((agent) => (
            <Tr key={agent.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Td maxW="500px" whiteSpace="normal" wordBreak="break-all">{agent.user_agent}</Td>
              {/* START: UPDATED CELLS */}
              <Td>
                {agent.device ? (
                  <Badge colorScheme={
                    agent.device.toLowerCase() === 'desktop' ? 'green' : 
                    agent.device.toLowerCase() === 'mobile' ? 'orange' : 'gray'
                  }>
                    {agent.device}
                  </Badge>
                ) : (
                  '-'
                )}
              </Td>
              <Td>{agent.os || '-'}</Td>
              <Td>{agent.browser || '-'}</Td>
              {/* END: UPDATED CELLS */}
              <Td isNumeric>
                <HStack spacing={1} justify="flex-end">
                  <CopyCell textToCopy={agent.user_agent} />
                  {isSuperuser && (
                    <>
                      <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={() => handleOpenEditModal(agent)} />
                      <IconButton aria-label="Delete" icon={<DeleteIcon />} colorScheme="red" size="sm" onClick={() => handleOpenDeleteAlert(agent.id)} />
                    </>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

// --- Main Page Component ---
function UserAgentsPage() {
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [editingAgent, setEditingAgent] = useState<UserAgentPublic | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  const { isOpen: isAddEditModalOpen, onOpen: onAddEditModalOpen, onClose: onAddEditModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();

  const toast = useToast();
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])


  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: ["userAgents", page, limit],
    queryFn: () => fetchPaginatedUserAgents(page * limit, limit),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.ceil(data.count / limit) : 0;

  // --- Mutations ---
  const handleMutationError = (e: Error) => {
    toast({ title: "An error occurred", description: e.message, status: "error", duration: 5000, isClosable: true });
  };
  const handleCRUDSuccess = (message: string) => {
    toast({ title: message, status: "success", duration: 3000, isClosable: true });
    queryClient.invalidateQueries({ queryKey: ["userAgents"] });
    onAddEditModalClose();
    onDeleteAlertClose();
  };
  const createMutation = useMutation({ mutationFn: createUserAgent, onSuccess: () => handleCRUDSuccess("User agent created."), onError: handleMutationError });
  const updateMutation = useMutation({ mutationFn: updateUserAgent, onSuccess: () => handleCRUDSuccess("User agent updated."), onError: handleMutationError });
  const deleteMutation = useMutation({ mutationFn: deleteUserAgent, onSuccess: () => handleCRUDSuccess("User agent deleted."), onError: handleMutationError });
  const updateFromSourceMutation = useMutation({
    mutationFn: updateUserAgentsFromSource,
    onSuccess: (res) => {
        toast({
            title: "Update from source complete",
            description: `${res.new_agents_added} new agents were added.`,
            status: "success",
            duration: 5000,
            isClosable: true,
        });
        queryClient.invalidateQueries({ queryKey: ["userAgents"] });
    },
    onError: handleMutationError,
  });
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
        const allAgents = await fetchAllUserAgents();
        if (format === 'csv') {
            const csvContent = convertToCSV(allAgents);
            downloadFile(csvContent, 'user-agents.csv', 'text/csv');
        } else {
            const jsonContent = JSON.stringify(allAgents, null, 2);
            downloadFile(jsonContent, 'user-agents.json', 'application/json');
        }
    },
    onSuccess: () => { toast({ title: "Export started.", description: "Your file is downloading.", status: "success", duration: 3000, isClosable: true, }); },
    onError: (e: Error) => { toast({ title: "Export Failed", description: e.message, status: "error", duration: 5000, isClosable: true, }); }
  });

  // --- Event Handlers ---
  const handleOpenAddModal = () => { setEditingAgent(null); onAddEditModalOpen(); };
  const handleOpenEditModal = (agent: UserAgentPublic) => { setEditingAgent(agent); onAddEditModalOpen(); };
  const handleOpenDeleteAlert = (id: string) => { setDeletingAgentId(id); onDeleteAlertOpen(); }
  const handleFormSubmit = (formData: UserAgentCreate | UserAgentUpdate) => {
    if (editingAgent) { updateMutation.mutate({ id: editingAgent.id, data: formData }); }
    else { createMutation.mutate(formData as UserAgentCreate); }
  };
  const handleDeleteConfirm = () => { if(deletingAgentId) { deleteMutation.mutate(deletingAgentId); } }

  // --- Data filtering logic ---
  const allAgents = data?.data ?? [];
  const desktopAgents = useMemo(() => allAgents.filter(agent => agent.device?.toLowerCase() === 'desktop'), [allAgents]);
  const mobileAgents = useMemo(() => allAgents.filter(agent => agent.device?.toLowerCase() === 'mobile'), [allAgents]);
  const otherAgents = useMemo(() => allAgents.filter(agent => !['desktop', 'mobile'].includes(agent.device?.toLowerCase() ?? '')), [allAgents]);

  const displayedAgents = useMemo(() => {
    switch (tabIndex) {
      case 1: return desktopAgents;
      case 2: return mobileAgents;
      case 3: return otherAgents;
      default: return allAgents;
    }
  }, [tabIndex, allAgents, desktopAgents, mobileAgents, otherAgents]);


  return (
    <>
      <Container maxW="full" py={9}>
        <Flex align="center" justify="space-between" py={6}>
            <Text fontSize="3xl" color="black">User Agents</Text>
            <Text fontSize="lg" color="gray.600">A dynamic list of user agents for web scraping</Text>
        </Flex>

        <Tabs isLazy variant="enclosed-colored" colorScheme="orange" onChange={(index) => setTabIndex(index)}>
            <TabList>
                {[
                  { label: "All", count: allAgents.length, color: "orange" },
                  { label: "Desktop", count: desktopAgents.length, color: "orange" },
                  { label: "Mobile", count: mobileAgents.length, color: "orange" },
                  { label: "Other", count: otherAgents.length, color: "gray" },
                ].map((tab, idx) => (
                    <Tab
                      key={idx}
                      bg="white"
                      fontWeight="semibold"
                      fontSize="lg"
                      color="gray.400"
                      _selected={{
                        bg: "gray.50",
                        color: "red.600",
                        borderColor: "inherit",
                        borderBottomColor: "gray.50",
                        borderTopWidth: "2px",
                        borderTopColor: "red.400",
                        marginTop: "-1px",
                      }}
                    >
                      {tab.label} 
                      <Badge ml='2' colorScheme={tab.color}>{tab.count}</Badge>
                    </Tab>
                ))}
            </TabList>
        </Tabs>

        <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            py={6}
        >
            <Box p={4} mb={{ base: 4, md: 0 }}>
                <Text fontSize="lg" mb={2} color="gray.700">
                  Reflect the most prevalent browsers and devices.
                </Text>
                <Text fontSize="lg" mb={4} color="gray.700">
                Updated Daily
                </Text>
            </Box>

            <VStack
                spacing={3}
                align={{ base: "stretch", md: "flex-end" }}
                w={{ base: "full", md: "auto" }}
            >
               {currentUser?.is_superuser && (
                    <SimpleGrid
                        columns={{ base: 1, sm: 2 }}
                        spacing={3}
                        w="full"
                    >
                        <Button
                            leftIcon={<RepeatIcon />}
                            onClick={() => updateFromSourceMutation.mutate()}
                            isLoading={updateFromSourceMutation.isPending}
                            loadingText="Updating..."
                        >
                            Refresh Source
                        </Button>
                        <Button
                            leftIcon={<AddIcon />}
                            colorScheme="teal"
                            onClick={handleOpenAddModal}
                        >
                            Add New
                        </Button>
                    </SimpleGrid>
                )}
                <Menu>
                    <MenuButton
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                        isLoading={exportMutation.isPending}
                        loadingText="Exporting"
                        w="full"
                    >
                        Export All
                    </MenuButton>
                    <MenuList>
                        <MenuItem onClick={() => exportMutation.mutate('csv')}>Export as CSV</MenuItem>
                        <MenuItem onClick={() => exportMutation.mutate('json')}>Export as JSON</MenuItem>
                    </MenuList>
                </Menu>
            </VStack>
        </Flex>

        <Divider mb={4} />


        {isLoading && !data && (
          <Flex justify="center" align="center" height="300px"><Spinner size="xl" /></Flex>
        )}
        {error && (
          <Alert status="error" borderRadius="md"><AlertIcon />{error.message}</Alert>
        )}
        {data && (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            <UserAgentTable
                agents={displayedAgents}
                isSuperuser={currentUser?.is_superuser || false}
                handleOpenEditModal={handleOpenEditModal}
                handleOpenDeleteAlert={handleOpenDeleteAlert}
                isPlaceholderData={isPlaceholderData}
            />
            <Flex justify="space-between" p={4} align="center" borderTopWidth="1px" bg="gray.50">
                <Text fontSize="sm" color="gray.600">
                    Showing <strong>{displayedAgents.length}</strong> results on this page
                </Text>
                <HStack>
                    <Button onClick={() => setPage(p => Math.max(0, p - 1))} isDisabled={page === 0}>
                        Previous
                    </Button>
                    <Text fontSize="sm" mx={4} whiteSpace="nowrap">Page {page + 1} of {totalPages || 1}</Text>
                    <Button onClick={() => setPage(p => p + 1)} isDisabled={page + 1 >= totalPages || isPlaceholderData}>
                        Next
                    </Button>
                </HStack>
            </Flex>
          </Box>
        )}
      </Container>

      {currentUser?.is_superuser && (
        <>
            <AddEditUserAgentModal isOpen={isAddEditModalOpen} onClose={onAddEditModalClose} onSubmit={handleFormSubmit} initialData={editingAgent} isLoading={createMutation.isPending || updateMutation.isPending}/>
            <DeleteConfirmationDialog isOpen={isDeleteAlertOpen} onClose={onDeleteAlertClose} onConfirm={handleDeleteConfirm} isLoading={deleteMutation.isPending} />
        </>
      )}
    </>
  );
}

// --- Route Definition ---
export const Route = createFileRoute("/_layout/web-scraping-tools/user-agents")({
  component: UserAgentsPage,
});