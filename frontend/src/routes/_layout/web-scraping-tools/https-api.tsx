import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Flex,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  Link,
  Code,
  IconButton,
  Button,
  useClipboard,
  useToast,
  Spinner,
  useDisclosure,
  HStack,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import ProtectedComponent from "../../../components/Common/ProtectedComponent";
import PlaygroundHttpsProxy from "../../../components/ScrapingTools/PlaygroundHttps";
import ApiKeyModule from "../../../components/ScrapingTools/ApiKey";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- Interfaces and Helper Functions ---
interface Subscription {
  id: string;
  status: string;
}

interface ProxyApiAccess {
  has_access: boolean;
  message: string | null;
}

const API_URL = "https://api.ROAMINGPROXY.com/v2";

// --- API Fetching Functions ---

async function fetchFromApi(endpoint: string, token: string, options: RequestInit = {}) {
  if (!token) {
    throw new Error("No access token found. Please log in again.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `API request failed: ${response.status}`
    );
  }
  return response.json();
}

const fetchSubscriptions = (token: string): Promise<Subscription[]> =>
  fetchFromApi("/customer/subscriptions", token);

const fetchProxyApiAccess = (token: string): Promise<ProxyApiAccess> =>
  fetchFromApi("/proxy-api/access", token);


// --- CodeBlock Component (from serp-api) ---
const CodeBlock = ({ code, language, bg = "gray.800", ...rest }: { code: string; language: string; bg?: string; [key: string]: any }) => {
  const { onCopy } = useClipboard(code.trim());
  const toast = useToast();

  const handleCopy = () => {
    onCopy();
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Box position="relative" bg={bg} borderRadius="md" overflow="hidden" {...rest}>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '2rem 1rem 1rem 1rem',
          fontSize: '0.9rem',
          backgroundColor: 'transparent',
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--chakra-fonts-mono)",
          }
        }}
        showLineNumbers
      >
        {code.trim()}
      </SyntaxHighlighter>
      <IconButton
        aria-label="Copy Code"
        icon={<CopyIcon />}
        size="sm"
        position="absolute"
        top="0.5rem"
        right="0.5rem"
        onClick={handleCopy}
        variant="ghost"
        color="gray.400"
        _hover={{ bg: "whiteAlpha.200", color: "white" }}
      />
    </Box>
  );
};


// --- Constants for GetStartedTab ---
const TARGET_URL_EXAMPLE = "https://api.ipify.org?format=json";
const PROXY_ENDPOINT = "https://api.ROAMINGPROXY.com/v2/proxy";

const CODE_EXAMPLES = {
  curl: `curl -X GET "${PROXY_ENDPOINT}?url=${encodeURIComponent(TARGET_URL_EXAMPLE)}" \\
  -H "x-api-key: YOUR_API_KEY"`,
  python: `import requests
import urllib.parse

api_key = "YOUR_API_KEY"
target_url = "${TARGET_URL_EXAMPLE}"
proxy_endpoint = "${PROXY_ENDPOINT}"

params = {"url": target_url}
headers = {"x-api-key": api_key}

# The target URL is automatically encoded by the requests library
response = requests.get(proxy_endpoint, params=params, headers=headers)

if response.status_code == 200:
    print("Successfully fetched URL through proxy.")
    print("Response Body:", response.json())
else:
    print(f"Error: {response.status_code}")
    print(response.text)`,
  javascript: `// Using node-fetch, or native fetch in browser/deno/node 18+
import fetch from 'node-fetch';

const apiKey = 'YOUR_API_KEY';
const targetUrl = '${TARGET_URL_EXAMPLE}';
const proxyEndpoint = new URL('${PROXY_ENDPOINT}');

// Append the target URL as a search parameter
proxyEndpoint.searchParams.append('url', targetUrl);

const options = {
    method: 'GET',
    headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
    }
};

fetch(proxyEndpoint, options)
    .then(res => {
        if (!res.ok) {
            throw new Error(\`HTTP error! status: \${res.status}\`);
        }
        return res.json();
    })
    .then(json => console.log(json))
    .catch(err => console.error('error:' + err));`
};

const codeTabs = [
  { id: 'javascript', label: 'JavaScript', code: CODE_EXAMPLES.javascript, language: 'javascript' },
  { id: 'python', label: 'Python', code: CODE_EXAMPLES.python, language: 'python' },
  { id: 'curl', label: 'cURL', code: CODE_EXAMPLES.curl, language: 'bash' },
];

// --- Get Started Tab Component ---
const GetStartedTab = () => {
  return (
    <Box>
      <Text fontSize="lg" mb={2} color="gray.700">
        This tool allows you to programmatically route any HTTP/S request through our premium proxy network.
      </Text>
      <Text fontSize="lg" mb={4} color="gray.700">
        To get started, create an API key in the API Keys tab and use it in your requests. Remember to replace <Code fontSize="sm">YOUR_API_KEY</Code> with your actual key.
      </Text>
    <Divider mb={4}></Divider>
      <Tabs variant="enclosed" colorScheme="red">
        <TabList>
          {codeTabs.map((tab) => (
            <Tab
              key={tab.id}
              fontWeight="semibold"
              fontSize="lg"
              color="gray.400"
              _selected={{ bg: "gray.800", color: "red.400", borderColor: "inherit", borderBottomColor: "gray.800" }}
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {codeTabs.map((tab) => (
            <TabPanel key={tab.id} p={0}>
              <CodeBlock code={tab.code} language={tab.language} bg="gray.800" />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <Box mt={8}>
        <Box p={4} borderWidth="1px" borderRadius="md" bg="red.50" borderColor="red.200">
            <Heading size="md" mb={2} color="gray.800">Need Help?</Heading>
            <Text fontSize="md" color="gray.700">
              Check our detailed{" "}
              <Link color="red.600" fontWeight="bold" href="/documentation/https-api" isExternal>
                API Documentation
              </Link>{" "}
              for more examples. For further assistance, contact our{" "}
              <Link color="red.600" fontWeight="bold" href="/support" isExternal>
                Support Center
              </Link>.
            </Text>
        </Box>
      </Box>
    </Box>
  );
};


const pageTabsData = [
  { id: "get-started", label: "Get Started" },
  { id: "keys", label: "Keys" },
  { id: "playground", label: "Playground" },
];

// --- Main Page Component ---
const HttpsProxyApiPage = () => {
  const token = localStorage.getItem("access_token") || "";

  const { data: subscriptions, isLoading: isSubscriptionsLoading, error: subscriptionsError } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => fetchSubscriptions(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: proxyApiAccess, isLoading: isAccessLoading, error: accessError } = useQuery({
    queryKey: ["proxyApiAccess"],
    queryFn: () => fetchProxyApiAccess(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const hasActiveSubscription = subscriptions?.some(
    (sub) => sub.status === "active" || sub.status === "trialing"
  ) || false;

  const isLoading = isSubscriptionsLoading || isAccessLoading;
  const error = subscriptionsError || accessError;

  return (
    <ProtectedComponent>
      <Container maxW="full" py={9}>
        <Flex align="center" justify="space-between" py={6}>
                     <Heading as="h1" size="xl" color="gray.800"> HTTPS Proxy API</Heading>
            <Text fontSize="lg" color="gray.600">Route HTTP/S requests through our proxy network</Text>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" h="50vh"><Spinner /></Flex>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">
              Error: {error.message || "Failed to load user details. Please try again later."}
            </Text>
          </Alert>
        ) : !hasActiveSubscription ? (
          <Alert status="warning">
            <AlertIcon />
            <Text fontSize="sm">No active subscription found. Please subscribe to a plan to use the HTTPS Proxy API.</Text>
          </Alert>
        ) : (
          <>
            {!proxyApiAccess?.has_access && (
              <Alert status="warning" mb={4}>
                <AlertIcon />
                <Text fontSize="sm">
                  {proxyApiAccess?.message || "Your current plan does not include HTTPS Proxy API access. Please upgrade to an eligible plan."}
                </Text>
              </Alert>
            )}
            <Tabs isLazy variant="enclosed-colored" colorScheme="red">
              <TabList>
                {pageTabsData.map((tab) => (
                  <Tab
                    key={tab.id}
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
                  </Tab>
                ))}
              </TabList>

              <TabPanels bg="gray.50" pt={4} borderRadius="0 0 md md">
                <TabPanel><GetStartedTab /></TabPanel>
                <TabPanel>
                  <ApiKeyModule token={token} />
                </TabPanel>
                <TabPanel><PlaygroundHttpsProxy /></TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}
      </Container>
    </ProtectedComponent>
  );
};

export const Route = createFileRoute("/_layout/web-scraping-tools/https-api")({
  component: HttpsProxyApiPage,
});

export default HttpsProxyApiPage;