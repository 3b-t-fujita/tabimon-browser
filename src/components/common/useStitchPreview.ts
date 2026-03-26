'use client';

import { useEffect, useState } from 'react';
import type { StitchPreviewData, StitchPreviewScreen } from '@/lib/stitchPreview';

export function useStitchPreview(screen: StitchPreviewScreen, fallback: StitchPreviewData) {
  const [preview, setPreview] = useState<StitchPreviewData>(fallback);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch(`/api/stitch/preview/${screen}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as StitchPreviewData;
        if (!cancelled) {
          setPreview(data);
        }
      } catch {
        // Keep fallback preview
      }
    }

    loadPreview().catch(() => undefined);
    return () => { cancelled = true; };
  }, [screen]);

  return preview;
}
