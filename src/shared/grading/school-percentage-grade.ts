/**
 * Letter grades from percentage using ordered min-inclusive thresholds (highest first).
 * Matches legacy behaviour: A ≥80, B ≥70, … F for the rest.
 */

export type GradeThreshold = {
  label: string;
  minInclusive: number;
};

export const DEFAULT_GRADE_THRESHOLDS: GradeThreshold[] = [
  { label: 'A', minInclusive: 80 },
  { label: 'B', minInclusive: 70 },
  { label: 'C', minInclusive: 60 },
  { label: 'D', minInclusive: 50 },
  { label: 'E', minInclusive: 40 },
  { label: 'F', minInclusive: 0 },
];

export function gradeFromMinThresholds(
  percentage: number,
  bands: GradeThreshold[],
): string {
  if (!bands.length) {
    return gradeFromMinThresholds(percentage, DEFAULT_GRADE_THRESHOLDS);
  }
  const sorted = [...bands].sort(
    (a, b) => b.minInclusive - a.minInclusive,
  );
  for (const row of sorted) {
    if (percentage >= row.minInclusive) {
      return row.label;
    }
  }
  return sorted[sorted.length - 1]!.label;
}

/** Display max % for each band (top band ends at 100). */
export function attachDisplayMax(
  bands: GradeThreshold[],
): Array<GradeThreshold & { maxInclusive: number }> {
  const sortedDesc = [...bands].sort(
    (a, b) => b.minInclusive - a.minInclusive,
  );
  return sortedDesc.map((b, i) => ({
    ...b,
    maxInclusive:
      i === 0 ? 100 : sortedDesc[i - 1]!.minInclusive - Number.EPSILON,
  }));
}
