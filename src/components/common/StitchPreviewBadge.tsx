'use client';

interface Props {
  title: string;
  status: 'live' | 'fallback';
  source: string;
}

export function StitchPreviewBadge({ title, status, source }: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 backdrop-blur-sm">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Stitch Compare</p>
        <p className="mt-1 text-sm font-bold text-stone-800">{title}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
          {status === 'live' ? 'LIVE' : 'LOCAL'}
        </p>
        <p className="mt-1 text-xs font-semibold text-stone-600">{source}</p>
      </div>
    </div>
  );
}
