export interface StitchProject {
  name: string;
  title?: string;
  visibility?: string;
  projectType?: string;
  origin?: string;
}

export interface StitchFile {
  name?: string;
  downloadUrl?: string;
  mimeType?: string;
}

export interface StitchSuggestion {
  label?: string;
  prompt?: string;
}

export interface StitchScreen {
  id?: string;
  name?: string;
  title?: string;
  prompt?: string;
  generatedBy?: string;
  width?: string;
  height?: string;
  screenType?: string;
  screenshot?: StitchFile;
  htmlCode?: StitchFile;
  screenMetadata?: {
    status?: string;
    summary?: string;
    suggestions?: StitchSuggestion[];
  };
}

export interface StitchSessionOutputComponent {
  design?: {
    screens?: StitchScreen[];
  };
  text?: string;
  suggestion?: string;
}

export interface StitchGenerateScreenResult {
  projectId: string;
  sessionId?: string;
  outputComponents?: StitchSessionOutputComponent[];
}

export interface StitchResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

interface StitchJsonRpcResponse<T> {
  id: number;
  jsonrpc: '2.0';
  result?: {
    structuredContent?: T;
    content?: Array<{ type?: string; text?: string }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

const DEFAULT_MCP_URL = 'https://stitch.googleapis.com/mcp';
const DEFAULT_TIMEOUT_MS = 180000;

let nextRequestId = 1;

function getStitchApiKey(): string {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    throw new Error('STITCH_API_KEY is not set');
  }

  return apiKey;
}

function getMcpUrl(): string {
  return process.env.STITCH_API_BASE_URL ?? DEFAULT_MCP_URL;
}

function extractTextJson<T>(content?: Array<{ type?: string; text?: string }>): T | undefined {
  const textBlock = content?.find((item) => item.type === 'text' && item.text);
  if (!textBlock?.text) return undefined;

  try {
    return JSON.parse(textBlock.text) as T;
  } catch {
    return undefined;
  }
}

async function postToStitch<T>(payload: unknown): Promise<StitchResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(getMcpUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getStitchApiKey(),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });

    const data = await response.json() as StitchJsonRpcResponse<T>;

    if (!response.ok || data.error) {
      return {
        ok: false,
        status: response.status,
        error: data.error?.message ?? `HTTP ${response.status}`,
      };
    }

    const parsed = data.result?.structuredContent ?? extractTextJson<T>(data.result?.content);
    return {
      ok: true,
      status: response.status,
      data: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callTool<T>(name: string, args: Record<string, unknown>): Promise<StitchResponse<T>> {
  return postToStitch<T>({
    jsonrpc: '2.0',
    id: nextRequestId++,
    method: 'tools/call',
    params: {
      name,
      arguments: args,
    },
  });
}

export async function fetchStitchAssetText(downloadUrl?: string): Promise<string | undefined> {
  if (!downloadUrl) return undefined;

  const response = await fetch(downloadUrl, {
    cache: 'no-store',
    headers: {
      'x-goog-api-key': getStitchApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Stitch asset: HTTP ${response.status}`);
  }

  return response.text();
}

export function isStitchConfigured(): boolean {
  return Boolean(process.env.STITCH_API_KEY);
}

export function extractProjectId(name?: string): string | undefined {
  return name?.split('/')[1];
}

export async function createProject(title: string): Promise<StitchResponse<StitchProject>> {
  return callTool<StitchProject>('create_project', { title });
}

export async function generateScreenFromText(args: {
  projectId: string;
  prompt: string;
  deviceType?: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'AGNOSTIC';
  modelId?: 'GEMINI_3_FLASH' | 'GEMINI_3_1_PRO';
}): Promise<StitchResponse<StitchGenerateScreenResult>> {
  return callTool<StitchGenerateScreenResult>('generate_screen_from_text', args);
}
