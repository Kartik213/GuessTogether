import type { PlayerSnapshot } from "../types/game";

export function sortPlayers(players: PlayerSnapshot[]) {
  return [...players].sort((left, right) => right.score - left.score);
}
