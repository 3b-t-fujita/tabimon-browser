'use client';

/**
 * 仲間詳細ページ。
 * 主役設定・手放しを UseCase 経由で実行する。
 * IndexedDB を page 内で直接触らない。
 */
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMonsterStore } from '@/stores/monsterStore';
import { useAppUiStore } from '@/stores/appUiStore';
import { GetOwnedMonsterDetailUseCase } from '@/application/monsters/getOwnedMonsterDetailUseCase';
import { ChangeMainMonsterUseCase } from '@/application/monsters/changeMainMonsterUseCase';
import { ReleaseOwnedMonsterUseCase } from '@/application/monsters/releaseOwnedMonsterUseCase';
import { LoadHomeDataUseCase } from '@/application/home/loadHomeDataUseCase';
import { MonsterErrorCode } from '@/common/errors/AppErrorCode';
import { OwnedMonsterDetail } from '@/components/monsters/OwnedMonsterDetail';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorDialog } from '@/components/common/ErrorDialog';
import { GameLayout } from '@/components/common/GameLayout';
import { ErrorBanner } from '@/components/common/ErrorBanner';

export default function MonsterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id     = params.id;

  const {
    monsterDetail,
    setMonsterDetail,
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    errorDialog,
    openErrorDialog,
    closeErrorDialog,
    clearMonsterCache,
  } = useMonsterStore();

  const { setHomeViewModel } = useAppUiStore();

  useEffect(() => {
    if (!id) return;
    async function load() {
      const result = await new GetOwnedMonsterDetailUseCase().execute(id);
      if (!result.ok) {
        setSaveError('仲間情報の読み込みに失敗しました');
        return;
      }
      setMonsterDetail(result.value);
    }
    load().catch(() => setSaveError('予期しないエラーが発生しました'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 主役設定
  async function handleSetMain() {
    if (!id || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const result = await new ChangeMainMonsterUseCase().execute(id);
    setIsSaving(false);
    if (!result.ok) {
      openErrorDialog('主役設定に失敗しました', result.message ?? '保存に失敗しました');
      return;
    }
    // キャッシュクリア → 再読込
    clearMonsterCache();
    // Home ViewModel を更新
    const homeOutcome = await new LoadHomeDataUseCase().execute();
    if (homeOutcome.ok) setHomeViewModel(homeOutcome.homeViewModel);
    router.back();
  }

  // 手放し確認
  function handleRelease() {
    if (!monsterDetail || !monsterDetail.canRelease) {
      openErrorDialog('手放せません', '主役に設定されている仲間は手放せません');
      return;
    }
    openConfirmDialog({
      title:     'この仲間を手放しますか？',
      message:   `${monsterDetail.displayName} を手放すと元に戻せません。`,
      onConfirm: executeRelease,
      onCancel:  closeConfirmDialog,
    });
  }

  async function executeRelease() {
    if (!id) return;
    closeConfirmDialog();
    setIsSaving(true);
    const result = await new ReleaseOwnedMonsterUseCase().execute(id);
    setIsSaving(false);
    if (!result.ok) {
      if (result.errorCode === MonsterErrorCode.CannotReleaseMain) {
        openErrorDialog('手放せません', '主役に設定されている仲間は手放せません');
      } else {
        openErrorDialog('手放しに失敗しました', result.message ?? '保存に失敗しました');
      }
      return;
    }
    clearMonsterCache();
    const homeOutcome = await new LoadHomeDataUseCase().execute();
    if (homeOutcome.ok) setHomeViewModel(homeOutcome.homeViewModel);
    router.back();
  }

  return (
    <GameLayout>
      {/* ダイアログ */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
      {errorDialog && (
        <ErrorDialog
          title={errorDialog.title}
          message={errorDialog.message}
          onClose={closeErrorDialog}
        />
      )}

      {saveError && !monsterDetail && (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ErrorBanner message={saveError} />
        </div>
      )}
      {!monsterDetail && !saveError && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-stone-400">読み込み中...</p>
        </div>
      )}
      {monsterDetail && (
        <OwnedMonsterDetail
          vm={monsterDetail}
          onSetMain={handleSetMain}
          onRelease={handleRelease}
          onBack={() => router.back()}
          onQrGenerate={() => router.push('/qr/generate')}
          isSaving={isSaving}
        />
      )}
    </GameLayout>
  );
}
