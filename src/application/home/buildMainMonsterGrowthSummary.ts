import levelExpTable from '../../../public/masters/level_exp.json';
import { GameConstants } from '@/common/constants/GameConstants';
import { calculateBondRank, bondThreshold, nextBondThreshold } from '@/domain/policies/bondPolicy';

interface SummaryInput {
  level: number | null;
  currentExp: number | null;
  bondPoints: number | null;
}

interface SummaryOutput {
  expToNextLevel: number | null;
  expProgressRatio: number | null;
  bondRank: 0 | 1 | 2 | 3 | 4 | null;
  bondToNextRank: number | null;
  bondProgressRatio: number | null;
}

const LEVEL_ENTRIES = levelExpTable.items;

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function findRequiredExpForNextLevel(level: number): number | null {
  const nextEntry = LEVEL_ENTRIES.find((entry) => entry.level === level + 1);
  return nextEntry?.requiredExp ?? null;
}

export function buildMainMonsterGrowthSummary({
  level,
  currentExp,
  bondPoints,
}: SummaryInput): SummaryOutput {
  const safeCurrentExp = currentExp ?? null;
  const safeBondPoints = bondPoints ?? 0;
  const bondRank = level === null ? null : calculateBondRank(safeBondPoints);

  if (level === null || safeCurrentExp === null) {
    return {
      expToNextLevel: null,
      expProgressRatio: null,
      bondRank,
      bondToNextRank: bondRank === null ? null : nextBondThreshold(safeBondPoints) === null ? 0 : (nextBondThreshold(safeBondPoints)! - safeBondPoints),
      bondProgressRatio: bondRank === null ? null : 0,
    };
  }

  const nextRequiredExp = level >= GameConstants.MAX_LEVEL
    ? null
    : findRequiredExpForNextLevel(level);
  const expProgressRatio = nextRequiredExp === null
    ? 1
    : clampRatio(safeCurrentExp / Math.max(1, nextRequiredExp));
  const expToNextLevel = nextRequiredExp === null
    ? 0
    : Math.max(0, nextRequiredExp - safeCurrentExp);

  if (bondRank === null) {
    return {
      expToNextLevel,
      expProgressRatio,
      bondRank: null,
      bondToNextRank: null,
      bondProgressRatio: null,
    };
  }

  const nextBond = nextBondThreshold(safeBondPoints);
  const currentBondFloor = bondThreshold(bondRank);
  const bondProgressRatio = nextBond === null
    ? 1
    : clampRatio((safeBondPoints - currentBondFloor) / Math.max(1, nextBond - currentBondFloor));

  return {
    expToNextLevel,
    expProgressRatio,
    bondRank,
    bondToNextRank: nextBond === null ? 0 : Math.max(0, nextBond - safeBondPoints),
    bondProgressRatio,
  };
}
