'use client';

import { HomeScreenPatternStitch } from '@/components/home/HomeScreenPatternStitch';
import { StageListPatternStitch } from '@/components/adventure/StageListPatternStitch';
import { QrMenuPatternStitch } from '@/components/qr/QrMenuPatternStitch';
import { OwnedMonsterDetailPatternStitch } from '@/components/monsters/OwnedMonsterDetailPatternStitch';
import { OwnedMonsterList } from '@/components/monsters/OwnedMonsterList';
import { PartyEditPanel } from '@/components/party/PartyEditPanel';
import ResultSummaryView from '@/components/result/ResultSummaryView';
import { AdventureConfirmPanelB } from '@/components/adventure/AdventureConfirmPanelB';
import { AdventureNodeView } from '@/components/adventure/AdventureNodeView';
import { BranchSelectPanel } from '@/components/adventure/BranchSelectPanel';
import { EventPanel } from '@/components/adventure/EventPanel';
import QrReceiveActionPanel from '@/components/qr/QrReceiveActionPanel';
import QrPayloadPreview from '@/components/qr/QrPayloadPreview';
import CandidateActionPanel from '@/components/result/CandidateActionPanel';
import type { HomeViewModel } from '@/application/viewModels/homeViewModel';
import type { StageSelectViewModel } from '@/application/viewModels/stageSelectViewModel';
import type { OwnedMonsterDetailViewModel } from '@/application/viewModels/ownedMonsterDetailViewModel';
import type { OwnedMonsterListViewModel } from '@/application/viewModels/ownedMonsterListViewModel';
import type { PartyEditViewModel } from '@/application/viewModels/partyEditViewModel';
import type { AdventureConfirmViewModel } from '@/application/viewModels/adventureConfirmViewModel';
import { GameConstants } from '@/common/constants/GameConstants';
import { AdventureResultType, NodeType } from '@/common/constants/enums';
import type { QrPayloadV1 } from '@/domain/entities/QrPayload';

const homeVm: HomeViewModel = {
  playerName: 'タロウ',
  mainMonsterName: 'グリーニョ',
  mainMonsterLevel: 12,
  mainMonsterId: 'owned_001',
  mainMonsterMasterId: 'MON_GRASS_001',
  ownedCount: 8,
  ownedCapacity: 20,
  supportCount: 2,
  supportCapacity: 10,
  canContinue: true,
  continueStageId: 'ミドリの森 Stage 2',
  continueType: 'ACTIVE',
};

const stagesVm: StageSelectViewModel = {
  stages: [
    { stageId: 'stage_w1_01', stageName: 'ミドリの森 Stage 1', worldLabel: 'ミドリの森', difficulty: 'やさしい', recommendedLevel: 1, isUnlocked: true },
    { stageId: 'stage_w1_02', stageName: 'ミドリの森 Stage 2', worldLabel: 'ミドリの森', difficulty: 'ふつう', recommendedLevel: 3, isUnlocked: true },
    { stageId: 'stage_w1_03', stageName: 'ミドリの森 Stage 3', worldLabel: 'ミドリの森', difficulty: 'むずかしい', recommendedLevel: 5, isUnlocked: false },
    { stageId: 'stage_w2_01', stageName: 'ホノオ火山 Stage 1', worldLabel: 'ホノオ火山', difficulty: 'ふつう', recommendedLevel: 6, isUnlocked: false },
    { stageId: 'stage_w3_01', stageName: 'コオリ氷原 Stage 1', worldLabel: 'コオリ氷原', difficulty: 'むずかしい', recommendedLevel: 10, isUnlocked: false },
  ],
};

const detailVm: OwnedMonsterDetailViewModel = {
  uniqueId: 'owned_001',
  displayName: 'グリーニョ',
  monsterMasterId: 'MON_GRASS_001',
  level: 12,
  exp: 340,
  worldLabel: 'ミドリの森',
  roleLabel: 'アタック',
  personalityLabel: 'やさしい',
  skillIds: ['skill_1', 'skill_2'],
  skills: [
    { skillId: 'skill_1', displayName: 'リーフスラッシュ', skillType: 'SKILL_ATTACK' },
    { skillId: 'skill_2', displayName: 'もりのいぶき', skillType: 'SKILL_BUFF' },
  ],
  isMain: true,
  canRelease: false,
  stats: { hp: 42, atk: 18, def: 14, spd: 16 },
};

const listVm: OwnedMonsterListViewModel = {
  count: 8,
  capacity: 20,
  monsters: [
    { uniqueId: 'owned_001', displayName: 'グリーニョ', level: 12, worldLabel: 'ミドリの森', roleLabel: 'アタック', isMain: true, monsterMasterId: 'MON_GRASS_001' },
    { uniqueId: 'owned_002', displayName: 'ミドリウルフ', level: 9, worldLabel: 'ミドリの森', roleLabel: 'アタック', isMain: false, monsterMasterId: 'mon_002' },
    { uniqueId: 'owned_003', displayName: 'フレイム', level: 10, worldLabel: 'ホノオ火山', roleLabel: 'アタック', isMain: false, monsterMasterId: 'MON_FIRE_001' },
  ],
};

const partyVm: PartyEditViewModel = {
  main: { uniqueId: 'owned_001', displayName: 'グリーニョ', level: 12, roleLabel: 'アタック', monsterMasterId: 'MON_GRASS_001' },
  selectedSupports: [
    { supportId: 'sup_001', displayName: 'フロスト', level: 11, monsterMasterId: 'MON_ICE_001' },
  ],
  supportCandidates: [
    { supportId: 'sup_001', displayName: 'フロスト', level: 11, roleLabel: 'サポート', worldLabel: 'コオリ氷原', isSelected: true, monsterMasterId: 'MON_ICE_001' },
    { supportId: 'sup_002', displayName: 'マグマロック', level: 8, roleLabel: 'ガード', worldLabel: 'ホノオ火山', isSelected: false, monsterMasterId: 'mon_006' },
  ],
  canAddSupport: true,
};

const confirmVm: AdventureConfirmViewModel = {
  stageId: 'stage_w1_02',
  stageName: 'ミドリの森 Stage 2',
  difficulty: 'ふつう',
  recommendedLevel: 3,
  main: { displayName: 'グリーニョ', level: 12, monsterMasterId: 'MON_GRASS_001' },
  supports: [
    { supportId: 'sup_001', displayName: 'フロスト', level: 11, monsterMasterId: 'MON_ICE_001' },
  ],
  canStart: true,
  cannotStartReason: null,
};

const previewPayload: QrPayloadV1 = {
  payloadVersion: GameConstants.QR_PAYLOAD_VERSION,
  sourceUniqueMonsterIdFromQr: 'qr_monster_001',
  monsterMasterId: 'MON_ICE_001',
  displayName: 'フロスト',
  level: 11,
  worldId: 'WORLD_ICE',
  roleId: 'ROLE_SUPPORT',
  personalityId: 'PERSONALITY_KIND',
  skillSnapshot: 'skill_ice_shard|skill_guard_mist',
  checksumHash: 'abcdef1234567890abcdef1234567890',
};

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-black text-[#1f3528]">{title}</h2>
      <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </section>
  );
}

export default function UiPreviewPage() {
  return (
    <div className="min-h-screen bg-[#e9efe6] px-6 py-8 text-[#2c302b]">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-[clamp(26px,7vw,30px)] font-black tracking-tight text-[#1f3528]">タビモン UI プレビュー</h1>
        <p className="mt-2 text-sm text-[#595c57]">
          セーブデータや起動処理を通さず、新しいデザインをモックデータで確認するための静的プレビューです。
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Frame title="ホーム">
            <HomeScreenPatternStitch vm={homeVm} onContinue={() => undefined} />
          </Frame>
          <Frame title="ステージ選択">
            <StageListPatternStitch vm={stagesVm} onBack={() => undefined} onSelect={() => undefined} />
          </Frame>
          <Frame title="QRメニュー">
            <QrMenuPatternStitch />
          </Frame>
          <Frame title="モンスター詳細">
            <OwnedMonsterDetailPatternStitch
              vm={detailVm}
              onSetMain={() => undefined}
              onRelease={() => undefined}
              onBack={() => undefined}
              onQrGenerate={() => undefined}
              isSaving={false}
            />
          </Frame>
          <Frame title="仲間一覧">
            <OwnedMonsterList vm={listVm} />
          </Frame>
          <Frame title="編成">
            <PartyEditPanel vm={partyVm} onAddSupport={() => undefined} onRemoveSupport={() => undefined} onBack={() => undefined} />
          </Frame>
          <Frame title="冒険確認">
            <AdventureConfirmPanelB vm={confirmVm} onStart={() => undefined} onBack={() => undefined} isStarting={false} startError={null} />
          </Frame>
          <Frame title="探索中">
            <div className="bg-[#f5f7f0] p-5">
              <AdventureNodeView
                currentNode={{ nodeIndex: 1, nodeType: NodeType.Branch, branchOptions: [{ label: 'ひだりの小道', nextNodeIndex: 2 }, { label: 'まっすぐ進む', nextNodeIndex: 3 }] }}
                explorePhase="BRANCH_SELECTING"
                stageId="stage_w1_02"
                nodeTotal={7}
              />
              <div className="mt-4">
                <BranchSelectPanel options={[{ label: 'ひだりの小道', nextNodeIndex: 2 }, { label: 'まっすぐ進む', nextNodeIndex: 3 }]} onSelect={() => undefined} isSaving={false} />
              </div>
              <div className="mt-4">
                <EventPanel message="木漏れ日の奥で、なにかが光っている……。" onConfirm={() => undefined} isSaving={false} />
              </div>
            </div>
          </Frame>
          <Frame title="リザルト">
            <div className="bg-[#f5f7f0] p-5">
              <ResultSummaryView
                resultType={AdventureResultType.Success}
                stageId="stage_w1_02"
                expGained={90}
                newLevel={13}
                leveledUp
                stageUnlocked
                statGains={{ hp: 2, atk: 1, def: 1, spd: 1 }}
                evolved={false}
                evolvedName={null}
              />
            </div>
          </Frame>
          <Frame title="QR受取確認">
            <div className="bg-[#f5f7f0] p-5">
              <QrPayloadPreview payload={previewPayload} />
              <div className="mt-4">
                <QrReceiveActionPanel onAcceptOwned={() => undefined} onAcceptSupport={() => undefined} onSkip={() => undefined} disabled={false} />
              </div>
            </div>
          </Frame>
          <Frame title="候補受取">
            <div className="bg-[#f5f7f0] p-5">
              <CandidateActionPanel onAccept={() => undefined} onSkip={() => undefined} disabled={false} />
            </div>
          </Frame>
        </div>
      </div>
    </div>
  );
}
