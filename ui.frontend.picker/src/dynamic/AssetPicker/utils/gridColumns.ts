/** Cards may stretch or shrink by this fraction of their nominal width. */
const MAX_FLEX_PERCENT = 0.12;

const MAX_COLUMNS = 12;

export type GridLayout = {
  columnCount: number;
  columnWidth: number;
};

/**
 * Chooses the column count whose stretched card width sits closest to `cardWidth`,
 * preferring counts that keep it within the flex range.
 *
 * At widths where no count fits that range — routine in the narrow iframes and popups the
 * picker is embedded in — it falls back to the closest fit instead of collapsing to a
 * single full-width column.
 */
export const computeGridLayout = (availableWidth: number, cardWidth: number, gap: number): GridLayout => {
  const minCardWidth = cardWidth * (1 - MAX_FLEX_PERCENT);
  const maxCardWidth = cardWidth * (1 + MAX_FLEX_PERCENT);

  let bestColumnCount = 1;
  let bestDistance = Infinity;
  let bestInRange = false;

  for (let columns = 1; columns <= MAX_COLUMNS; columns++) {
    const candidateWidth = (availableWidth - (columns - 1) * gap) / columns;
    if (candidateWidth <= 0) {
      continue;
    }

    const inRange = candidateWidth >= minCardWidth && candidateWidth <= maxCardWidth;
    if (bestInRange && !inRange) {
      continue;
    }

    const distance = Math.abs(candidateWidth - cardWidth);
    if ((inRange && !bestInRange) || distance < bestDistance) {
      bestDistance = distance;
      bestColumnCount = columns;
      bestInRange = inRange;
    }
  }

  return {
    columnCount: bestColumnCount,
    columnWidth: (availableWidth - (bestColumnCount - 1) * gap) / bestColumnCount,
  };
};
