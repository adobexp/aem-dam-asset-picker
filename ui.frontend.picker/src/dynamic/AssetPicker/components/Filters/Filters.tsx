// import { FC, MouseEvent, useMemo } from "react";

// import { useConfiguration } from "../../contexts/Configuration.context";
// import { useTranslation } from "../../contexts/I18n.context";
// import { Filter as FilterModel } from "../../models/filter";
// import { SearchParams, SearchScope } from "../../models/search";
// import { Stats } from "../../models/stats";
// import { Filter } from "../Filter";
// import { Search } from "../Search";
// import { Sort } from "../Sort";
// import { StatsPanel } from "../StatsPanel";

// import styles from "./Filters.module.scss";

// type FiltersProps = {
//   filters: FilterModel[];
//   toggleFilter: (id: string, collased: boolean) => void;
//   onReset: () => void;
//   onChange: (id: string, value: null | string | string[]) => void;
//   searchScope: SearchScope;
//   searchPhrase: string;
//   onSearch: (params: SearchParams) => void;
//   tempSearchScope: SearchScope;
//   tempSearchPhrase: string;
//   onTempSearch: (phrase: string) => void;
//   onTempSearchScope: (scope: SearchScope) => void;
//   setSearchStats: (searchStats: Stats | null) => void;
//   searchStats: Stats | null;
//   directoryStats: Stats | null;
//   showStats: boolean;
//   semanticSearchEnabled: boolean;
//   tempSemanticSearchEnabled: boolean;
//   onSemanticSearchToggle: (value: boolean) => void;
//   fuzzySearchEnabled: boolean;
//   tempFuzzySearchEnabled: boolean;
//   onFuzzySearchToggle: (value: boolean) => void;
// };

// /**
//  * Returns true when at least one filter has a non-empty value selected.
//  * Used to enable/disable the Clear and Apply buttons.
//  */
// const hasAnySelectedValue = (filters: FilterModel[]): boolean =>
//   filters.some((f) => {
//     const value = "value" in f ? f.value : null;
//     if (Array.isArray(value)) return value.length > 0;
//     return value !== null && value !== undefined && value !== "";
//   });

// export const Filters: FC<FiltersProps> = ({
//   filters,
//   toggleFilter,
//   searchPhrase,
//   tempSearchPhrase,
//   searchScope,
//   tempSearchScope,
//   onSearch,
//   onTempSearch,
//   onTempSearchScope,
//   onReset,
//   onChange,
//   searchStats,
//   setSearchStats,
//   directoryStats,
//   showStats,
//   semanticSearchEnabled,
//   tempSemanticSearchEnabled,
//   onSemanticSearchToggle,
//   fuzzySearchEnabled,
//   tempFuzzySearchEnabled,
//   onFuzzySearchToggle,
// }) => {
//   const { collections, showSearch } = useConfiguration();
//   const { __ } = useTranslation();

//   const hasSelection = useMemo(() => hasAnySelectedValue(filters), [filters]);

//   const activeStats: Stats | null = showStats ? searchStats : directoryStats;

//   const handleClear = (ev: MouseEvent<HTMLButtonElement>) => {
//     ev.preventDefault();
//     if (!hasSelection) return;
//     onReset();
//     setSearchStats(null);
//   };

//   // Filters currently apply on change (existing behavior preserved).
//   // Apply acts as an explicit confirmation; useful later if you switch to a
//   // pending/staged pattern. For now it dismisses the stats panel state cleanly.
//   const handleApply = (ev: MouseEvent<HTMLButtonElement>) => {
//     ev.preventDefault();
//     if (!hasSelection) return;
//     // Hook for future pending-state commit. Currently a no-op confirmation.
//   };

//   const handleChange = (id: string, value: null | string | string[]): void => {
//     onChange(id, value);
//   };

//   const isSearchVisible = !collections && showSearch;

//   return (
//     <div className={styles.wrapper}>
//       {/* Scrollable body */}
//       <div className={styles.body}>
//         {/* Mobile-only inline search (preserves existing behavior) */}
//         {/* {isSearchVisible && (
//           <div className={styles.search}>
//             <Search
//               phrase={searchPhrase}
//               scope={searchScope}
//               onSearch={onSearch}
//               tempSearchPhrase={tempSearchPhrase}
//               tempSearchScope={tempSearchScope}
//               onTempSearchScope={onTempSearchScope}
//               onTempSearch={onTempSearch}
//               setSearchStats={setSearchStats}
//               semanticSearchEnabled={semanticSearchEnabled}
//               tempSemanticSearchEnabled={tempSemanticSearchEnabled}
//               onSemanticSearchToggle={onSemanticSearchToggle}
//               fuzzySearchEnabled={fuzzySearchEnabled}
//               tempFuzzySearchEnabled={tempFuzzySearchEnabled}
//               onFuzzySearchToggle={onFuzzySearchToggle}
//             />
//           </div>
//         )} */}

//         {/* Sort (mobile-only — kept as-is) */}
//         {/* <div className={styles.sort}>
//           <Sort />
//         </div> */}

//         <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
//           <div className={styles.filters}>
//             {filters.map((filter) => (
//               <Filter
//                 filter={filter}
//                 key={filter.id}
//                 toggleFilter={toggleFilter}
//                 onChange={(value: null | string | string[]) => handleChange(filter.id, value)}
//               />
//             ))}
//           </div>
//         </form>

//         {/* {searchStats && showStats ? <StatsPanel stats={searchStats} /> : null}
//         {!showStats && directoryStats ? <StatsPanel stats={directoryStats} /> : null} */}
//       </div>

//       {/* Sticky footer with Clear / Apply */}
//       <div className={styles.footer}>
//         {activeStats ? (
//           <StatsPanel stats={activeStats} variant="compact" />
//         ) : (
//           <div className={styles.footerStatsSpacer} aria-hidden="true" />
//         )}

//         <button
//           type="button"
//           className={`${styles.footerButton} ${styles.footerButtonSecondary}`}
//           onClick={handleClear}
//           disabled={!hasSelection}
//           aria-disabled={!hasSelection}
//         >
//           {__("directoryExplorer.clear") || "Clear"}
//         </button>
//         <button
//           type="button"
//           className={`${styles.footerButton} ${styles.footerButtonPrimary}`}
//           onClick={handleApply}
//           disabled={!hasSelection}
//           aria-disabled={!hasSelection}
//         >
//           {__("directoryExplorer.apply") || "Apply"}
//         </button>
//       </div>
//     </div>
//   );
// };

import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useConfiguration } from "../../contexts/Configuration.context";
import { useTranslation } from "../../contexts/I18n.context";
import { Filter as FilterModel } from "../../models/filter";
import { SearchParams, SearchScope } from "../../models/search";
import { Stats } from "../../models/stats";
import { Filter } from "../Filter";
import { Search } from "../Search";
import { Sort } from "../Sort";
import { StatsPanel } from "../StatsPanel";

import styles from "./Filters.module.scss";

type FiltersProps = {
  filters: FilterModel[];
  toggleFilter: (id: string, collased: boolean) => void;
  onReset: () => void;
  onChange: (id: string, value: null | string | string[]) => void;
  onChangeBatch?: (changes: Array<{ id: string; value: null | string | string[] }>) => void;
  searchScope: SearchScope;
  searchPhrase: string;
  onSearch: (params: SearchParams) => void;
  tempSearchScope: SearchScope;
  tempSearchPhrase: string;
  onTempSearch: (phrase: string) => void;
  onTempSearchScope: (scope: SearchScope) => void;
  setSearchStats: (searchStats: Stats | null) => void;
  searchStats: Stats | null;
  directoryStats: Stats | null;
  showStats: boolean;
  semanticSearchEnabled: boolean;
  tempSemanticSearchEnabled: boolean;
  onSemanticSearchToggle: (value: boolean) => void;
  fuzzySearchEnabled: boolean;
  tempFuzzySearchEnabled: boolean;
  onFuzzySearchToggle: (value: boolean) => void;
};

type StagedValue = null | string | string[];
type StagedMap = Record<string, StagedValue>;

/** Snapshot the current committed values from the filter model. */
const snapshotCommitted = (filters: FilterModel[]): StagedMap => {
  const snap: StagedMap = {};
  filters.forEach((f) => {
    const v = ("value" in f ? f.value : null) as StagedValue;
    snap[f.id] = Array.isArray(v) ? [...v] : v;
  });
  return snap;
};

/** True if a value represents "no selection". */
const isEmptyValue = (v: StagedValue): boolean => {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

/** Deep-ish equality for filter values (string | string[] | null). */
const valuesEqual = (a: StagedValue, b: StagedValue): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((v, i) => v === bSorted[i]);
  }
  return false;
};

/** True if any value in a map is non-empty. */
const anyNonEmpty = (map: StagedMap): boolean => Object.values(map).some((v) => !isEmptyValue(v));

/** True if a filter type is array-based (multi-select / checkbox / multiselect). */
const isArrayTypeFilter = (f: FilterModel): boolean => {
  const type = (f as FilterModel & { type?: string }).type;
  return type === "checkbox" || type === "multiselect";
};

/** Generate an empty map matching each filter's natural empty value type. */
const buildEmptyMap = (filters: FilterModel[]): StagedMap => {
  const empty: StagedMap = {};
  filters.forEach((f) => {
    empty[f.id] = isArrayTypeFilter(f) ? [] : null;
  });
  return empty;
};

export const Filters: FC<FiltersProps> = ({
  filters,
  toggleFilter,
  searchPhrase,
  tempSearchPhrase,
  searchScope,
  tempSearchScope,
  onSearch,
  onTempSearch,
  onTempSearchScope,
  onReset,
  onChange,
  searchStats,
  setSearchStats,
  directoryStats,
  showStats,
  semanticSearchEnabled,
  tempSemanticSearchEnabled,
  onSemanticSearchToggle,
  fuzzySearchEnabled,
  tempFuzzySearchEnabled,
  onFuzzySearchToggle,
  onChangeBatch,
}) => {
  const { showSearch } = useConfiguration();
  const { __ } = useTranslation();

  /* ============================================================
     STAGED STATE — local-only until user clicks Apply
     ============================================================ */
  const [staged, setStaged] = useState<StagedMap>(() => snapshotCommitted(filters));

  /** Mirrors what's currently applied. Updated by:
       - parent filter prop changes when no pending edits exist
       - successful Apply (we mark committed immediately so Apply disables)
       - successful Clear (wiped to empty values) */
  const committedRef = useRef<StagedMap>(snapshotCommitted(filters));

  /** A force-bump counter to trigger re-renders after mutating committedRef
      (so derived flags like hasUnappliedChanges recompute). */
  const [bump, setBump] = useState(0);
  const forceRecompute = useCallback(() => setBump((n) => n + 1), []);

  // useEffect(() => {
  //   const fresh = snapshotCommitted(filters);

  //   const anyPending = filters.some((f) => {
  //     const stagedVal = staged[f.id] ?? null;
  //     const freshVal = fresh[f.id] ?? null;
  //     return !valuesEqual(stagedVal, freshVal);
  //   });

  //   committedRef.current = fresh;

  //   if (!anyPending) {
  //     setStaged(fresh);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filters]);

  useEffect(() => {
    const fresh = snapshotCommitted(filters);

    // Did the parent's committed values change since we last saw them?
    const committedChangedExternally = filters.some((f) => {
      const freshVal = fresh[f.id] ?? null;
      const lastKnownCommitted = (committedRef.current[f.id] ?? null) as StagedValue;
      return !valuesEqual(freshVal, lastKnownCommitted);
    });

    if (committedChangedExternally) {
      // External change (chip removal, URL nav, etc.) — fully re-seed
      committedRef.current = fresh;
      setStaged(fresh);
      forceRecompute();
    } else {
      // Just a re-render with same committed values — no-op
      committedRef.current = fresh;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const hasAnyStaged = useMemo(() => anyNonEmpty(staged), [staged]);

  const hasAnyCommitted = useMemo(
    () => anyNonEmpty(committedRef.current),
    // bump is included so this recomputes after committedRef mutates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bump],
  );

  /** Are there unapplied changes between staged and committed? */
  const hasUnappliedChanges = useMemo(() => {
    return filters.some((f) => {
      const stagedVal = staged[f.id] ?? null;
      const committedVal = (committedRef.current[f.id] ?? null) as StagedValue;
      return !valuesEqual(stagedVal, committedVal);
    });
    // bump triggers recompute after we mutate committedRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staged, filters, bump]);

  /* ============================================================
     Handlers
     ============================================================ */

  /** Stage a value locally — does NOT propagate to parent. */
  const handleStageChange = useCallback((id: string, value: StagedValue) => {
    setStaged((prev) => ({ ...prev, [id]: value }));
  }, []);

  /** Apply: commit every staged change in one batch. */
  const handleApply = useCallback(
    (ev: MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      if (!hasUnappliedChanges) return;

      // Collect changes
      const changes: Array<{ id: string; value: StagedValue }> = [];
      filters.forEach((f) => {
        const stagedVal = (staged[f.id] ?? null) as StagedValue;
        const committedVal = (committedRef.current[f.id] ?? null) as StagedValue;
        if (!valuesEqual(stagedVal, committedVal)) {
          changes.push({ id: f.id, value: stagedVal });
        }
      });

      // Use batch method if parent provided one (atomic URL update),
      // otherwise fall back to sequential calls (which now also work
      // because changeFilter uses functional setFilters internally).
      if (onChangeBatch) {
        onChangeBatch(changes);
      } else {
        changes.forEach(({ id, value }) => {
          onChange(id, value);
        });
      }

      // Mark these as committed immediately so Apply disables right away
      const newCommitted: StagedMap = { ...committedRef.current };
      changes.forEach(({ id, value }) => {
        newCommitted[id] = Array.isArray(value) ? [...value] : value;
      });
      committedRef.current = newCommitted;

      forceRecompute();
    },
    [filters, hasUnappliedChanges, onChange, onChangeBatch, staged, forceRecompute],
  );

  /** Clear: wipe staged + committed locally and reset URL if anything is applied. */
  const handleClear = useCallback(
    (ev: MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault();

      // Detect whether the parent had ANY filter applied BEFORE we wipe.
      const anyParentApplied = filters.some((f) => "value" in f && !isEmptyValue(f.value as StagedValue));

      // Build an empty map sized to each filter's natural type.
      const cleared = buildEmptyMap(filters);

      // Wipe staged + committed simultaneously so both Apply and Clear disable.
      setStaged(cleared);
      committedRef.current = { ...cleared };
      forceRecompute();

      // Reset URL only if something was applied — avoids unnecessary URL change.
      if (anyParentApplied) {
        onReset();
        setSearchStats(null);
      }
    },
    [filters, onReset, setSearchStats, forceRecompute],
  );

  const isSearchVisible = showSearch;
  const activeStats: Stats | null = showStats ? searchStats : directoryStats;

  // Clear should be enabled when there's anything to clear (staged or committed).
  const canClear = hasAnyStaged || hasAnyCommitted;

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className={styles.wrapper}>
      <div className={styles.body}>
        {isSearchVisible && (
          <div className={styles.search}>
            <Search
              phrase={searchPhrase}
              scope={searchScope}
              onSearch={onSearch}
              tempSearchPhrase={tempSearchPhrase}
              tempSearchScope={tempSearchScope}
              onTempSearchScope={onTempSearchScope}
              onTempSearch={onTempSearch}
              setSearchStats={setSearchStats}
              semanticSearchEnabled={semanticSearchEnabled}
              tempSemanticSearchEnabled={tempSemanticSearchEnabled}
              onSemanticSearchToggle={onSemanticSearchToggle}
              fuzzySearchEnabled={fuzzySearchEnabled}
              tempFuzzySearchEnabled={tempFuzzySearchEnabled}
              onFuzzySearchToggle={onFuzzySearchToggle}
            />
          </div>
        )}

        <div className={styles.sort}>
          <Sort />
        </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.filters}>
            {filters.map((filter) => {
              /* Pass staged value into each Filter via cloned model so the
                 child UI reflects unapplied selections. */
              const stagedVal = staged[filter.id] ?? null;
              const filterWithStaged = {
                ...filter,
                value: stagedVal,
              } as FilterModel;

              return (
                <Filter
                  filter={filterWithStaged}
                  key={filter.id}
                  toggleFilter={toggleFilter}
                  onChange={(value) => handleStageChange(filter.id, value)}
                />
              );
            })}
          </div>
        </form>
      </div>

      {/* Sticky footer: stats (left) + Clear / Apply (right) */}
      <div className={styles.footer}>
        {activeStats ? (
          <StatsPanel stats={activeStats} variant="compact" />
        ) : (
          <div className={styles.footerStatsSpacer} aria-hidden="true" />
        )}

        <div className={styles.footerActions}>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.footerButtonPrimary}`}
            onClick={handleApply}
            disabled={!hasUnappliedChanges}
            aria-disabled={!hasUnappliedChanges}
          >
            {__("directoryExplorer.apply") || "Apply"}
          </button>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.footerButtonSecondary}`}
            onClick={handleClear}
            disabled={!canClear}
            aria-disabled={!canClear}
          >
            {__("directoryExplorer.clear") || "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
};
