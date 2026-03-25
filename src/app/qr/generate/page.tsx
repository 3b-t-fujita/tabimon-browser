'use client';

/**
 * QR生成ページ。
 * 仲間モンスター一覧を表示し、選択したモンスターのQRを生成する。
 *
 * フロー:
 *   1. セーブデータから ownedMonsters を読み込む
 *   2. モンスターを選択
 *   3. BuildMonsterQrPayloadUseCase → GenerateQrImageUseCase
 *   4. QrPayloadPreview + QrImageView を表示
 *
 * 制約:
 *   - QR生成対象は仲間モンスターのみ（助っ人から生成不可）
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameLayout } from '@/components/common/GameLayout';
import QrPayloadPreview from '@/components/qr/QrPayloadPreview';
import QrImageView from '@/components/qr/QrImageView';
import type { OwnedMonster } from '@/domain/entities/OwnedMonster';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';
import { BuildMonsterQrPayloadUseCase } from '@/application/qr/buildMonsterQrPayloadUseCase';
import { GenerateQrImageUseCase } from '@/application/qr/generateQrImageUseCase';
import { SaveTransactionService } from '@/infrastructure/persistence/transaction/saveTransactionService';

export default function QrGeneratePage() {
  const router = useRouter();

  const [monsters, setMonsters]     = useState<OwnedMonster[]>([]);
  const [selected, setSelected]     = useState<OwnedMonster | null>(null);
  const [payload,  setPayload]      = useState<QrPayloadV1 | null>(null);
  const [dataUrl,  setDataUrl]      = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // ---- 仲間一覧読み込み ----
  useEffect(() => {
    (async () => {
      try {
        const tx = new SaveTransactionService();
        const loadResult = await tx.load();
        if (!loadResult.ok || !loadResult.value) {
          router.replace('/home');
          return;
        }
        setMonsters([...loadResult.value.ownedMonsters]);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- モンスター選択 → QR生成 ----
  const handleSelect = async (monster: OwnedMonster) => {
    setSelected(monster);
    setPayload(null);
    setDataUrl(null);
    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const buildUC = new BuildMonsterQrPayloadUseCase();
      const buildResult = await buildUC.execute(monster);
      if (!buildResult.ok) {
        setErrorMsg(buildResult.message ?? buildResult.errorCode);
        return;
      }

      const genUC = new GenerateQrImageUseCase();
      const genResult = await genUC.execute(buildResult.value);
      if (!genResult.ok) {
        setErrorMsg(genResult.message ?? genResult.errorCode);
        return;
      }

      setPayload(buildResult.value);
      setDataUrl(genResult.value.dataUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- ローディング ----
  if (isLoading) {
    return (
      <GameLayout>
        <div className="flex flex-1 items-center justify-center gap-3 flex-col">
          <span className="text-4xl animate-pulse">📤</span>
          <p className="text-sm text-stone-400 animate-pulse">読み込み中...</p>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col" style={{ background: '#f8fafc' }}>

        {/* ヘッダー */}
        <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-600"
          >
            ← 戻る
          </button>
          <h1 className="mt-2 text-xl font-black text-stone-900">QR生成</h1>
          <p className="text-xs text-stone-400 mt-0.5">QRを生成する仲間を選んでください</p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pb-6">

          {/* 仲間一覧 */}
          {!dataUrl && (
            <>
              {monsters.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
                  <span className="text-4xl">🐾</span>
                  <p className="text-sm text-stone-400">仲間がいません</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {monsters.map((m) => (
                  <button
                    key={m.uniqueId as string}
                    type="button"
                    onClick={() => handleSelect(m)}
                    disabled={isGenerating}
                    className="flex items-center justify-between rounded-2xl border-2 border-stone-200 bg-white px-4 py-3.5 text-sm shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 disabled:opacity-50"
                  >
                    <span className="font-black text-stone-900">{m.displayName as string}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400">Lv.{m.level as number}</span>
                      <span className="text-stone-300">›</span>
                    </div>
                  </button>
                ))}
              </div>
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <span className="text-xl animate-pulse">📤</span>
                  <p className="text-sm text-stone-500 animate-pulse">QR生成中...</p>
                </div>
              )}
            </>
          )}

          {/* QR表示 */}
          {dataUrl && payload && selected && (
            <>
              <div
                className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <span className="text-lg">✅</span>
                <p className="text-sm font-black text-emerald-700">
                  {selected.displayName as string} のQRコード
                </p>
              </div>
              <QrImageView dataUrl={dataUrl} altText={`${selected.displayName as string} QR`} />
              <QrPayloadPreview payload={payload} />
              <button
                type="button"
                onClick={() => { setDataUrl(null); setPayload(null); setSelected(null); }}
                className="w-full rounded-2xl border-2 border-stone-200 bg-white py-3.5 text-sm font-bold text-stone-600 transition hover:bg-stone-50 active:scale-95"
              >
                別のモンスターを選ぶ
              </button>
            </>
          )}

          {/* エラー */}
          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-sm font-bold text-red-600">{errorMsg}</p>
            </div>
          )}

        </div>
      </div>
    </GameLayout>
  );
}
