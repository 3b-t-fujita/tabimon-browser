'use client';

/**
 * 編成ページ。
 * 主役表示 + 助っ人選択（最大2・重複不可）。
 * 選択状態は Zustand（selectedSupportIds）で管理する。
 * DB 書き込みは冒険開始時（フェーズ5）に行う。
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonsterStore } from '@/stores/monsterStore';
import { GetPartyEditStateUseCase } from '@/application/party/getPartyEditStateUseCase';
import { SelectSupportMonsterUseCase } from '@/application/party/selectSupportMonsterUseCase';
import { RemoveSelectedSupportUseCase } from '@/application/party/removeSelectedSupportUseCase';
import { PartyEditPanel } from '@/components/party/PartyEditPanel';
import { ErrorDialog } from '@/components/common/ErrorDialog';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

const selectUseCase = new SelectSupportMonsterUseCase();
const removeUseCase = new RemoveSelectedSupportUseCase();

export default function PartyPage() {
  const router = useRouter();
  const {
    partyEdit,
    setPartyEdit,
    selectedSupportIds,
    setSelectedSupportIds,
    saveError,
    setSaveError,
    errorDialog,
    openErrorDialog,
    closeErrorDialog,
  } = useMonsterStore();

  // 初回ロード（選択中IDも渡して候補の isSelected フラグを設定する）
  async function loadParty(ids: string[] = selectedSupportIds) {
    const result = await new GetPartyEditStateUseCase().execute(ids);
    if (!result.ok) { setSaveError('編成データの読み込みに失敗しました'); return; }
    setPartyEdit(result.value);
  }

  useEffect(() => {
    loadParty().catch(() => setSaveError('予期しないエラーが発生しました'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAddSupport(supportId: string) {
    const availableIds = (partyEdit?.supportCandidates ?? []).map((s) => s.supportId);
    const result = selectUseCase.execute(selectedSupportIds, supportId, availableIds);
    if (!result.ok) {
      openErrorDialog('助っ人を追加できません', result.message ?? '追加に失敗しました');
      return;
    }
    const newIds = result.value;
    setSelectedSupportIds(newIds);
    loadParty(newIds).catch(() => {});
  }

  function handleRemoveSupport(supportId: string) {
    const result = removeUseCase.execute(selectedSupportIds, supportId);
    if (!result.ok) return;
    const newIds = result.value;
    setSelectedSupportIds(newIds);
    loadParty(newIds).catch(() => {});
  }

  return (
    <GameLayout>
      {errorDialog && (
        <ErrorDialog
          title={errorDialog.title}
          message={errorDialog.message}
          onClose={closeErrorDialog}
        />
      )}

      {saveError && !partyEdit && (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ErrorBanner message={saveError} />
        </div>
      )}
      {!partyEdit && !saveError && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}
      {partyEdit && (
        <PartyEditPanel
          vm={partyEdit}
          onAddSupport={handleAddSupport}
          onRemoveSupport={handleRemoveSupport}
          onBack={() => router.back()}
        />
      )}
    </GameLayout>
  );
}
