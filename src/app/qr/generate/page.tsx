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
      <div className="flex flex-1 flex-col bg-[#f5f7f0] text-[#2c302b]">

        <header className="shrink-0 border-b border-emerald-950/5 bg-white/70 px-5 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full bg-[#e6e9e1] px-4 py-2 text-sm font-semibold text-[#29664c]"
          >
            ← 戻る
          </button>
          <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-[#6c4324]/70">コードを作る</p>
          <h1 className="mt-1 text-[clamp(26px,7vw,30px)] font-black leading-tight tracking-tight text-[#1f3528]">コードを作る</h1>
          <p className="mt-2 text-sm text-[#595c57]">コードを作る仲間を選んでください。</p>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">

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
                    className="flex items-center justify-between rounded-[24px] bg-white px-4 py-4 text-sm shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <span className="font-black text-[#2c302b]">{m.displayName as string}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#eff2ea] px-3 py-1 text-[11px] font-black text-[#29664c]">Lv.{m.level as number}</span>
                      <span className="text-[#757872]">›</span>
                    </div>
                  </button>
                ))}
              </div>
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <span className="text-xl animate-pulse">📤</span>
                  <p className="text-sm text-stone-500 animate-pulse">コードを作成中...</p>
                </div>
              )}
            </>
          )}

          {/* QR表示 */}
          {dataUrl && payload && selected && (
            <>
              <div
                className="flex items-center gap-2 rounded-[24px] bg-[#eff2ea] px-4 py-4"
              >
                <span className="text-lg">✅</span>
                <p className="text-sm font-black text-[#29664c]">
                  {selected.displayName as string} のコード
                </p>
              </div>
              <QrImageView dataUrl={dataUrl} altText={`${selected.displayName as string} QR`} />
              <QrPayloadPreview payload={payload} />
              <button
                type="button"
                onClick={() => { setDataUrl(null); setPayload(null); setSelected(null); }}
                className="w-full rounded-full bg-white py-4 text-sm font-black text-[#2c302b] shadow-sm transition active:scale-95"
              >
                別のモンスターを選ぶ
              </button>
            </>
          )}

          {/* エラー */}
          {errorMsg && (
            <div className="rounded-[24px] bg-[#fff1ec] px-4 py-4 text-center">
              <p className="text-sm font-bold text-[#b02500]">{errorMsg}</p>
            </div>
          )}

        </div>
      </div>
    </GameLayout>
  );
}
