import type { BondRank } from '@/domain/entities/OwnedMonster';
import { GameConstants } from '@/common/constants/GameConstants';

export function bondThreshold(rank: BondRank): number {
  switch (rank) {
    case 0: return 0;
    case 1: return GameConstants.BOND_THRESHOLD_1;
    case 2: return GameConstants.BOND_THRESHOLD_2;
    case 3: return GameConstants.BOND_THRESHOLD_3;
    case 4: return GameConstants.BOND_THRESHOLD_4;
  }
}

export function calculateBondRank(points: number): BondRank {
  if (points >= GameConstants.BOND_THRESHOLD_4) return 4;
  if (points >= GameConstants.BOND_THRESHOLD_3) return 3;
  if (points >= GameConstants.BOND_THRESHOLD_2) return 2;
  if (points >= GameConstants.BOND_THRESHOLD_1) return 1;
  return 0;
}

export function nextBondThreshold(points: number): number | null {
  const rank = calculateBondRank(points);
  if (rank >= 4) return null;
  return bondThreshold((rank + 1) as BondRank);
}
