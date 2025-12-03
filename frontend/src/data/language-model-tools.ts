
export interface BuiltInTool {
  name: string;
  price: string;
  parameter: string;
}

export const compoundTools: BuiltInTool[] = [
  {
    name: "Basic Search",
    price: "$6 / 1000 requests",
    parameter: "web_search",
  },
  {
    name: "Advanced Search",
    price: "$9.60 / 1000 requests",
    parameter: "web_search",
  },
  {
    name: "Visit Website",
    price: "$1.20 / 1000 requests",
    parameter: "visit_website",
  },
  {
    name: "Code Execution",
    price: "$0.216 / hour",
    parameter: "code_interpreter",
  },
  {
    name: "Browser Automation",
    price: "$0.096 / hour",
    parameter: "browser_automation",
  },
];

export const gptOssTools: BuiltInTool[] = [
  {
    name: "Browser Search - Basic Search",
    price: "$6 / 1000 requests",
    parameter: "browser_search - browser.search",
  },
  {
    name: "Browser Search - Visit Website",
    price: "$1.20 / 1000 requests",
    parameter: "browser_search - browser.open",
  },
  {
    name: "Code Execution - Python",
    price: "$0.216 / hour",
    parameter: "code_interpreter - python",
  },
];
