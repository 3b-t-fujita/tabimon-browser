import { NextResponse } from 'next/server';
import {
  createProject,
  extractProjectId,
  fetchStitchAssetText,
  generateScreenFromText,
  isStitchConfigured,
  type StitchGenerateScreenResult,
  type StitchScreen,
} from '@/lib/stitch';
import {
  getStitchPreviewDefinition,
  getStitchPreviewFallback,
  type StitchPreviewData,
  type StitchPreviewScreen,
} from '@/lib/stitchPreview';

type CacheEntry = {
  projectId?: string;
  data?: StitchPreviewData;
  promise?: Promise<StitchPreviewData>;
};

declare global {
  // eslint-disable-next-line no-var
  var __tabimonStitchPreviewCache: Partial<Record<StitchPreviewScreen, CacheEntry>> | undefined;
}

function getCache() {
  if (!global.__tabimonStitchPreviewCache) {
    global.__tabimonStitchPreviewCache = {};
  }
  return global.__tabimonStitchPreviewCache;
}

function collectTextComponents(result?: StitchGenerateScreenResult): string[] {
  const texts = (result?.outputComponents ?? [])
    .flatMap((component) => [component.text, component.suggestion])
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return Array.from(new Set(texts));
}

function findPrimaryScreen(result?: StitchGenerateScreenResult): StitchScreen | undefined {
  for (const component of result?.outputComponents ?? []) {
    const screen = component.design?.screens?.find((item) => item.htmlCode?.downloadUrl || item.screenshot?.downloadUrl);
    if (screen) return screen;
  }

  return undefined;
}

async function buildLivePreview(screen: StitchPreviewScreen): Promise<StitchPreviewData> {
  const definition = getStitchPreviewDefinition(screen);
  const fallback = getStitchPreviewFallback(screen);
  const cache = getCache();
  const entry = cache[screen] ?? {};

  let projectId = entry.projectId;
  if (!projectId) {
    const project = await createProject(definition.projectTitle);
    if (!project.ok || !project.data) {
      throw new Error(project.error ?? 'Failed to create Stitch project');
    }

    projectId = extractProjectId(project.data.name);
    if (!projectId) {
      throw new Error('Failed to resolve Stitch project id');
    }
    entry.projectId = projectId;
    cache[screen] = entry;
  }

  const generated = await generateScreenFromText({
    projectId,
    prompt: definition.prompt,
    deviceType: 'MOBILE',
    modelId: 'GEMINI_3_FLASH',
  });

  if (!generated.ok || !generated.data) {
    throw new Error(generated.error ?? 'Failed to generate Stitch screen');
  }

  const primaryScreen = findPrimaryScreen(generated.data);
  const notes = collectTextComponents(generated.data);
  const highlights = notes.slice(1, 4);

  let html: string | undefined;
  try {
    html = await fetchStitchAssetText(primaryScreen?.htmlCode?.downloadUrl);
  } catch {
    html = undefined;
  }

  return {
    status: 'live',
    source: 'stitch-mcp',
    headline: primaryScreen?.title ?? fallback.headline,
    summary: notes[0] ?? primaryScreen?.prompt ?? fallback.summary,
    highlights: highlights.length > 0 ? highlights : fallback.highlights,
    rawPreview: primaryScreen?.generatedBy ?? notes.join(' / ').slice(0, 400),
    html,
    screenshotUrl: primaryScreen?.screenshot?.downloadUrl,
    projectId,
    sessionId: generated.data.sessionId,
    screenId: primaryScreen?.id,
  };
}

async function getOrGeneratePreview(screen: StitchPreviewScreen): Promise<StitchPreviewData> {
  const cache = getCache();
  const existing = cache[screen];
  if (existing?.data) return existing.data;
  if (existing?.promise) return existing.promise;

  const promise = buildLivePreview(screen)
    .then((data) => {
      cache[screen] = { ...cache[screen], data };
      return data;
    })
    .finally(() => {
      if (cache[screen]) {
        cache[screen] = { ...cache[screen], promise: undefined };
      }
    });

  cache[screen] = { ...existing, promise };
  return promise;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ screen: string }> },
) {
  const { screen } = await context.params;
  if (!['home', 'stages', 'qr', 'monster-detail'].includes(screen)) {
    return NextResponse.json({ error: 'Unsupported screen' }, { status: 404 });
  }

  const typedScreen = screen as StitchPreviewScreen;
  const fallback = getStitchPreviewFallback(typedScreen);

  if (!isStitchConfigured()) {
    return NextResponse.json(fallback);
  }

  try {
    const preview = await getOrGeneratePreview(typedScreen);
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ...fallback,
      summary: `STITCH生成に失敗したため、ローカル比較案を表示しています。${message}`.trim(),
      rawPreview: message,
    });
  }
}
