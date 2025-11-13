import { CopyIcon, DownloadIcon, ViewIcon } from "@chakra-ui/icons"
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Code,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Heading,
  IconButton,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import type React from "react"
import { useState } from "react"
import { FaTrash } from "react-icons/fa"
import { FiSend } from "react-icons/fi"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// --- (START) TYPE DEFINITIONS ---

interface CodeBlockProps {
  code: string
  language: string
  maxHeight?: string
}

interface ResultsData {
  requestInfo: {
    url: string
    region: string
  }
  jsonResponse: string
  htmlPreview: string
  headers: string
}

// FIX: Renamed to follow convention and applied to the component below
interface ResultsModalProps {
  isOpen: boolean
  onClose: () => void
  data: ResultsData | null
}

// --- (END) TYPE DEFINITIONS ---

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  maxHeight = "60vh",
}) => {
  const customStyle = {
    margin: 0,
    borderRadius: "0.375rem",
    padding: "1rem",
    maxHeight,
    overflow: "auto",
  }

  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      customStyle={customStyle}
      wrapLongLines={true}
    >
      {code}
    </SyntaxHighlighter>
  )
}

const handleDownload = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// FIX: Applied the ResultsModalProps interface
const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null
  const toast = useToast()
  const { requestInfo, jsonResponse, htmlPreview, headers } = data

  // FIX: Added types to the parameters
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${type} copied!`,
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    })
  }

  const iframeStyle = {
    width: "100%",
    height: "65vh",
    border: "1px solid",
    borderColor: "var(--chakra-colors-gray-200)",
    borderRadius: "var(--chakra-radii-md)",
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4} maxH="90vh" borderRadius="lg">
        <ModalHeader
          bg="gray.50"
          borderBottomWidth="1px"
          fontWeight="semibold"
          borderTopRadius="lg"
        >
          API Call Results
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6} overflowY="auto">
          <Tabs variant="line" colorScheme="blue">
            <TabList>
              <Tab>Response</Tab>
              <Tab>Request & Headers</Tab>
            </TabList>
            <TabPanels mt={4}>
              {/* RESPONSE TAB */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">JSON Response</Heading>
                      <Flex gap={2}>
                        <Tooltip label="Copy JSON">
                          <IconButton
                            aria-label="Copy JSON"
                            icon={<CopyIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() =>
                              handleCopy(jsonResponse, "JSON Response")
                            }
                          />
                        </Tooltip>
                        <Tooltip label="Download JSON">
                          <IconButton
                            aria-label="Download JSON"
                            icon={<DownloadIcon />}
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                jsonResponse,
                                "response.json",
                                "application/json",
                              )
                            }
                          />
                        </Tooltip>
                      </Flex>
                    </Flex>
                    <CodeBlock
                      code={jsonResponse}
                      language="json"
                      maxHeight="40vh"
                    />
                  </Box>
                  <Divider />
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">HTML Preview</Heading>
                      <Flex gap={2}>
                        <Tooltip label="Copy HTML">
                          <IconButton
                            aria-label="Copy HTML"
                            icon={<CopyIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleCopy(htmlPreview, "HTML")}
                          />
                        </Tooltip>
                        <Tooltip label="Download HTML">
                          <IconButton
                            aria-label="Download HTML"
                            icon={<DownloadIcon />}
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                htmlPreview,
                                "preview.html",
                                "text/html",
                              )
                            }
                          />
                        </Tooltip>
                      </Flex>
                    </Flex>
                    <iframe
                      srcDoc={htmlPreview}
                      style={iframeStyle}
                      title="HTML Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </Box>
                </VStack>
              </TabPanel>

              {/* REQUEST & HEADERS TAB */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="sm" mb={4}>
                      Request Sent
                    </Heading>
                    <SimpleGrid
                      columns={{ base: 1, md: 2 }}
                      spacingX={4}
                      spacingY={2}
                      maxW="lg"
                    >
                      <Text fontWeight="bold">URL:</Text>
                      <Code p={2} borderRadius="md">
                        {requestInfo.url}
                      </Code>
                      <Text fontWeight="bold">Region:</Text>
                      <Code p={2} borderRadius="md">
                        {requestInfo.region}
                      </Code>
                      <Text fontWeight="bold">Method:</Text>
                      <Code p={2} borderRadius="md">
                        POST
                      </Code>
                    </SimpleGrid>
                  </Box>
                  <Divider />
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">Response Headers</Heading>
                      <Tooltip label="Copy Headers">
                        <IconButton
                          aria-label="Copy Headers"
                          icon={<CopyIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleCopy(headers, "Headers")}
                        />
                      </Tooltip>
                    </Flex>
                    <CodeBlock code={headers} language="json" />
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

// --- Constants ---
const REGIONS = [
  "us-east",
  "us-west",
  "us-central",
  "northamerica-northeast",
  "southamerica",
  "asia",
  "australia",
  "europe",
  "middle-east",
]
const API_URL = "https://api.ROAMINGPROXY.com/v2/proxy"

const PlaygroundGSerp: React.FC = () => {
  // --- State ---
  const [url, setUrl] = useState<string>(
    "https://www.google.com/search?q=flowers&udm=2",
  )
  const [region, setRegion] = useState<string>(REGIONS[0])
  const [apiKey, setApiKey] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const toast = useToast()

  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure()
  // FIX: Used the specific ResultsData type instead of 'any'
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)

  const displayApiKey = apiKey.trim() || "YOUR_API_KEY"

  const codeTabs = [
    {
      id: "curl",
      label: "cURL",
      language: "bash",
      code: `curl -X POST "${API_URL}/fetch?region=${region}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${displayApiKey}" \\\n  -d '{"url": "${url}"}'`,
    },
    {
      id: "python",
      label: "Python",
      language: "python",
      code: `import requests\nimport json\n\napi_key = '${displayApiKey}'\nregion = '${region}'\nurl_to_fetch = '${url}'\n\napi_url = f'${API_URL}/fetch?region={region}'\n\nheaders = {\n    'Content-Type': 'application/json',\n    'x-api-key': api_key\n}\npayload = {'url': url_to_fetch}\n\nresponse = requests.post(api_url, headers=headers, data=json.dumps(payload))\n\nif response.status_code == 200:\n    print(json.dumps(response.json(), indent=2))\nelse:\n    print(f"Error: {response.status_code}")\n    print(response.text)`,
    },
    {
      id: "nodejs",
      label: "Node.js",
      language: "javascript",
      code: `const axios = require('axios');\n\nconst apiKey = '${displayApiKey}';\nconst region = '${region}';\nconst searchUrl = '${url}';\n\nconst apiUrl = \`${API_URL}/fetch?region=\${region}\`;\n\nconst headers = {\n    'Content-Type': 'application/json',\n    'x-api-key': apiKey\n};\nconst payload = { url: searchUrl };\n\naxios.post(apiUrl, payload, { headers })\n    .then(response => {\n        console.log(JSON.stringify(response.data, null, 2));\n    })\n    .catch(error => {\n        console.error('Error:', error.response ? error.response.data : error.message);\n    });`,
    },
  ]

  // FIX: Added types to the parameters
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${type} copied!`,
        description: "The code has been copied to your clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    })
  }

  const handleTestRequest = async () => {
    setIsLoading(true)
    setError("")
    setResponseTime(null)

    try {
      const startTime = performance.now()
      const res = await fetch(`${API_URL}/fetch?region=${region}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ url }),
      })
      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))

      const responseHeaders: { [key: string]: string } = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseBody = await res.json()
      if (!res.ok) {
        throw new Error(
          responseBody.detail || `HTTP error! status: ${res.status}`,
        )
      }

      setResultsData({
        requestInfo: { url, region },
        jsonResponse: JSON.stringify(responseBody, null, 2),
        htmlPreview:
          responseBody.result || "<!-- No HTML content in response -->",
        headers: JSON.stringify(responseHeaders, null, 2),
      })
      onModalOpen()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setResultsData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box width="100%">
      {/* Intro */}
      <Box mb={6}>
        <Text fontSize="lg" mb={2} color="gray.700">
          This tool allows you to programmatically fetch search engine results
          pages.
        </Text>
        <Text fontSize="lg" mb={4} color="gray.700">
          Build your request below. Results will open in a new window for
          review.
        </Text>
        <Divider mb={4} />
      </Box>

      {/* Live Test */}
      <Box mb={8}>
        <Heading
          as="h2"
          size="md"
          fontWeight="semibold"
          mb={6}
          color="gray.700"
        >
          Live Test
        </Heading>
        <Flex direction="column" gap={4}>
          <FormControl>
            <FormLabel fontSize="sm">Search URL</FormLabel>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://www.google.com/search?q=flowers&udm=2"
              size="sm"
            />
          </FormControl>
          <Grid
            templateColumns={{ base: "1fr", md: "2fr 1fr auto" }}
            gap={4}
            alignItems="flex-end"
          >
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">API Key</FormLabel>
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  size="sm"
                  type="password"
                />
              </FormControl>
            </GridItem>
            <GridItem>
              <FormControl>
                <FormLabel fontSize="sm">Region</FormLabel>
                <Select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  size="sm"
                >
                  {REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            <GridItem>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleTestRequest}
                isLoading={isLoading}
                isDisabled={!url.trim() || !apiKey.trim() || !region}
                leftIcon={<FiSend />}
              >
                Test Request
              </Button>
            </GridItem>
          </Grid>

          {error && (
            <Alert status="error" mt={4} variant="subtle" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          )}

          {resultsData && !isModalOpen && !isLoading && !error && (
            <Alert
              status="success"
              variant="subtle"
              mt={4}
              borderRadius="md"
              p={3}
            >
              <AlertIcon />
              <Flex justify="space-between" align="center" w="100%">
                <Box>
                  <Text fontWeight="bold">Request Success</Text>
                  <Text fontSize="sm">Response Time: {responseTime} ms</Text>
                </Box>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="teal"
                    leftIcon={<FaTrash />}
                    onClick={() => setResultsData(null)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="red"
                    leftIcon={<ViewIcon />}
                    onClick={onModalOpen}
                  >
                    Response
                  </Button>
                </HStack>
              </Flex>
            </Alert>
          )}
        </Flex>
      </Box>

      {/* Dynamic Code Snippets */}
      <Box mb={8}>
        <Heading
          as="h2"
          size="md"
          fontWeight="semibold"
          mb={4}
          color="gray.700"
        >
          Your Request Code
        </Heading>
        <Text fontSize="md" color="gray.600" mb={6}>
          The code below updates automatically as you change parameters in the
          Live Test section.
        </Text>
        <Box position="relative">
          <Tooltip label="Copy Code" placement="left">
            <IconButton
              aria-label="Copy code"
              icon={<CopyIcon />}
              size="sm"
              variant="ghost"
              color="red.400"
              position="absolute"
              top="0.6rem"
              right="0.5rem"
              zIndex={1}
              _hover={{ bg: "whiteAlpha.200", color: "red.300" }}
              onClick={() =>
                handleCopy(
                  codeTabs[activeTabIndex].code,
                  `${codeTabs[activeTabIndex].label} Code`,
                )
              }
            />
          </Tooltip>
          <Tabs
            variant="enclosed"
            colorScheme="red"
            onChange={(index) => setActiveTabIndex(index)}
          >
            <TabList>
              {codeTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  fontWeight="semibold"
                  fontSize="md"
                  color="gray.400"
                  _selected={{ bg: "gray.800", color: "red.400" }}
                >
                  {tab.label}
                </Tab>
              ))}
            </TabList>
            <TabPanels bg="gray.800" borderRadius="0 0 md md">
              {codeTabs.map((tab) => (
                <TabPanel key={tab.id} p={0}>
                  <CodeBlock
                    code={tab.code}
                    language={tab.language}
                    maxHeight="none"
                  />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>
      </Box>

      {/* Need Help Section */}
      <Box pt={8} mt={8} borderTopWidth="1px" borderColor="gray.200">
        <Box
          p={4}
          borderWidth="1px"
          borderRadius="md"
          bg="red.50"
          borderColor="red.200"
        >
          <Heading size="md" mb={2} color="gray.800">
            Need Help?
          </Heading>
          <Text fontSize="md" color="gray.700">
            Check our detailed{" "}
            <Link
              color="red.600"
              fontWeight="bold"
              href="/documentation/serp-api"
              isExternal
            >
              API Documentation
            </Link>{" "}
            for more examples. For further assistance, contact our{" "}
            <Link color="red.600" fontWeight="bold" href="/support" isExternal>
              Support Center
            </Link>
            .
          </Text>
        </Box>
      </Box>

      {/* Render the Modal */}
      <ResultsModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        data={resultsData}
      />
    </Box>
  )
}

export default PlaygroundGSerp
