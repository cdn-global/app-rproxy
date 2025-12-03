
export interface LanguageModel {
  name: string;
  speed: number;
  inputTokenPrice: number;
  outputTokenPrice: number;
  tokensPerDollarInput: string;
  tokensPerDollarOutput: string;
}

export const languageModels: LanguageModel[] = [
  {
    name: "GPT OSS 20B 128k",
    speed: 1000,
    inputTokenPrice: 0.075,
    outputTokenPrice: 0.30,
    tokensPerDollarInput: "13.3M / $1",
    tokensPerDollarOutput: "3.33M / $1",
  },
  {
    name: "GPT OSS Safeguard 20B",
    speed: 1000,
    inputTokenPrice: 0.075,
    outputTokenPrice: 0.30,
    tokensPerDollarInput: "13.3M / $1",
    tokensPerDollarOutput: "3.33M / $1",
  },
  {
    name: "GPT OSS 120B 128k",
    speed: 500,
    inputTokenPrice: 0.15,
    outputTokenPrice: 0.60,
    tokensPerDollarInput: "6.67M / $1",
    tokensPerDollarOutput: "1.66M / $1",
  },
  {
    name: "Kimi K2-0905 1T 256k",
    speed: 200,
    inputTokenPrice: 1.00,
    outputTokenPrice: 3.00,
    tokensPerDollarInput: "1M / $1",
    tokensPerDollarOutput: "333,333 / $1",
  },
  {
    name: "Llama 4 Scout (17Bx16E) 128k",
    speed: 594,
    inputTokenPrice: 0.11,
    outputTokenPrice: 0.34,
    tokensPerDollarInput: "9.09M / $1",
    tokensPerDollarOutput: "2.94M / $1",
  },
  {
    name: "Llama 4 Maverick (17Bx128E) 128k",
    speed: 562,
    inputTokenPrice: 0.20,
    outputTokenPrice: 0.60,
    tokensPerDollarInput: "5M / $1",
    tokensPerDollarOutput: "1.6M / $1",
  },
  {
    name: "Llama Guard 4 12B 128k",
    speed: 325,
    inputTokenPrice: 0.20,
    outputTokenPrice: 0.20,
    tokensPerDollarInput: "5M / $1",
    tokensPerDollarOutput: "5M / $1",
  },
  {
    name: "Qwen3 32B 131k",
    speed: 662,
    inputTokenPrice: 0.29,
    outputTokenPrice: 0.59,
    tokensPerDollarInput: "3.44M / $1",
    tokensPerDollarOutput: "1.69M / $1",
  },
  {
    name: "Llama 3.3 70B Versatile 128k",
    speed: 394,
    inputTokenPrice: 0.59,
    outputTokenPrice: 0.79,
    tokensPerDollarInput: "1.69M / $1",
    tokensPerDollarOutput: "1.27M / $1",
  },
  {
    name: "Llama 3.1 8B Instant 128k",
    speed: 840,
    inputTokenPrice: 0.05,
    outputTokenPrice: 0.08,
    tokensPerDollarInput: "20M / $1",
    tokensPerDollarOutput: "12.5M / $1",
  },
];
