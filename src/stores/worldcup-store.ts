import { create } from "zustand";
import type { Champion, ChampSession, ChampMatch } from "@/types";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createMatches(champs: Champion[]): ChampMatch[] {
  const matches: ChampMatch[] = [];
  for (let i = 0; i < champs.length; i += 2) {
    if (champs[i + 1]) {
      matches.push({ champA: champs[i], champB: champs[i + 1] });
    }
  }
  return matches;
}

interface ChampStore {
  session: ChampSession | null;
  startChampPick: (champions: Champion[]) => void;
  selectWinner: (winner: Champion) => void;
  reset: () => void;
}

export const useChampStore = create<ChampStore>((set, get) => ({
  session: null,

  startChampPick: (allChampions) => {
    const selected = shuffle(allChampions).slice(0, 16);
    set({
      session: {
        champions: selected,
        currentRound: 16,
        matches: createMatches(selected),
        currentMatchIndex: 0,
        winners: [],
      },
    });
  },

  selectWinner: (winner) => {
    const { session } = get();
    if (!session) return;
    const newWinners = [...session.winners, winner];
    const nextMatchIndex = session.currentMatchIndex + 1;
    if (nextMatchIndex >= session.matches.length) {
      if (newWinners.length === 1) {
        set({
          session: {
            ...session,
            winners: newWinners,
            champion: newWinners[0],
            currentMatchIndex: nextMatchIndex,
          },
        });
        return;
      }
      const nextMatches = createMatches(newWinners);
      set({
        session: {
          ...session,
          currentRound: newWinners.length,
          matches: nextMatches,
          currentMatchIndex: 0,
          winners: [],
        },
      });
    } else {
      set({
        session: {
          ...session,
          winners: newWinners,
          currentMatchIndex: nextMatchIndex,
        },
      });
    }
  },

  reset: () => set({ session: null }),
}));
