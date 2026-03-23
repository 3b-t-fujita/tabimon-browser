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
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse font-bold">読み込み中...</p>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="text-stone-500 text-sm">← 戻る</button>
          <h1 className="text-lg font-bold">QR生成</h1>
        </div>

        {/* 仲間一覧 */}
        {!dataUrl && (
          <>
            <p className="text-sm text-stone-500">QRを生成する仲間を選んでください</p>
            {monsters.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">仲間がいません</p>
            )}
            <div className="flex flex-col gap-2">
              {monsters.map((m) => (
                <button
                  key={m.uniqueId as string}
                  type="button"
                  onClick={() => handleSelect(m)}
                  disabled={isGenerating}
                  className="flex justify-between items-center rounded-xl border border-stone-200 bg-white p-3 text-sm hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50 transition"
                >
                  <span className="font-medium">{m.displayName}</span>
                  <span className="text-stone-400">Lv.{m.level}</span>
                </button>
              ))}
            </div>
            {isGenerating && <p className="text-center text-sm text-stone-500 animate-pulse">QR生成中...</p>}
          </>
        )}

        {/* QR表示 */}
        {dataUrl && payload && selected && (
          <>
            <div className="text-center">
              <p className="font-bold text-emerald-700">{selected.displayName} の QRコード</p>
            </div>
            <QrImageView dataUrl={dataUrl} altText={`${selected.displayName} QR`} />
            <QrPayloadPreview payload={payload} />
            <button
              type="button"
              onClick={() => { setDataUrl(null); setPayload(null); setSelected(null); }}
              className="w-full rounded-xl border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50"
            >
              別のモンスターを選ぶ
            </button>
          </>
        )}

        {/* エラー */}
        {errorMsg && (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        )}
      </div>
    </GameLayout>
  );
}
