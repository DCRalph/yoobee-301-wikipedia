// import { diffWordsWithSpace, type Change } from "diff";

export interface DiffResult {
  changes: string[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

export function generateTextDiff(oldText: string, newText: string): DiffResult {
  // const changes = diffLines(oldText, newText);

  // Calculate stats
  const stats = {
    additions: 0,
    deletions: 0,
    unchanged: 0,
  };

  // changes.forEach((change) => {
  //   if (change.added) {
  //     stats.additions += change.count ?? 0;
  //   } else if (change.removed) {
  //     stats.deletions += change.count ?? 0;
  //   } else {
  //     stats.unchanged += change.count ?? 0;
  //   }
  // });

  const changes: string[] = [];

  return { changes, stats };
} 