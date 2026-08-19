---
name: aem-dam-asset-picker
description: >-
  Guides changes to the AdobeXP AEM DAM Asset Picker (React SPA + Sling APIs +
  CA/OSGi config). Use when editing aem-dam-asset-picker, ui.frontend.picker,
  selector.html, /bin/asset-picker APIs, Metadata Filter / Quick View / Appearance
  CA configs, PickerSettings OSGi, postMessage host contract, or the Filter tab.
---

# AEM DAM Asset Picker

Drop-in replacement for OOTB `/aem/assetpicker.html`. A host opens the **selector** page in an iframe, modal, or popup. Authors browse/search/filter DAM assets. Confirm/cancel returns the **same stringified `postMessage` payload** as Adobe’s picker.

Repo: `aem-dam-asset-picker` (Anamnesis graph tag: `aem-dam-asset-picker`).

Before structural edits, query that graph, then read [architecture.md](architecture.md) for file maps and change recipes. Product/config details: [README.md](../../../README.md).

## Invariants — do not break

1. **Host contract.** `postMessage` must be a **JSON string** (not an object). Shape:
   - done: `{ "data": [{ path, url, type, title, size, img }], "config": { "action": "done" } }`
   - close: `{ "config": { "action": "close" } }`
   - Target: `window.opener` or `parent`. Field names on each asset are frozen (`toPickerAsset` / `postMessageBridge`).
2. **OOTB URL params** stay compatible: `mode`, `root`, `mimetype`, `assettype`, `viewmode`, `solution`, `requiredproperty`, `targetorigin`. Extensions: `theme`, `semantic`, `fuzzy`, `filter.<prop>`, `range.<prop>`.
3. **APIs are GET-only** under `/bin/asset-picker` (no CSRF). Every path is allowlisted via `PickerSettings` and must stay under `/content/dam`.
4. **Filter tab is CA-driven**, not a component dialog. List-type filters with neither flat options nor `categoryValues` are **dropped**. Cascade is CA-only (`dependsOn` + `cascadeValues`); do not read metadata schemas.
5. **URL `root` / `theme` / `mode` win** over authored `data-config`, but `root` must sit inside configured roots.

## Architecture in one pass

```text
Host page  →  selector.html (HTL + data-config + data-translations)
                 ↓ hydrates  .__react-cmp[data-react-component=AssetPicker]
              React SPA (ui.frontend.picker)
                 ↓ GET /bin/asset-picker/{assets,search,filters,asset}.json
              core servlets → Query Builder / DAM
                 ↑ CA: Metadata Filter, Quick View, Appearance
                 ↑ OSGi: PickerSettings + adobexp repoinit
```

- HTL: `ui.apps/.../components/selector/selector.html` uses `AssetPickerConfig`.
- Bootstrap: `ui.frontend.picker/src/index.tsx` mounts every `.__react-cmp`.
- Registration: `registerDynamicComp.tsx` maps `AssetPicker` → `App`.
- Config merge: `App.buildConfiguration` = Sling JSON + `parsePickerParams()`.
- Filters: authored `data-config.filters` wins; else `useFilterDefinitions` → `filters.json`.

## Modules

| Module | Role |
| --- | --- |
| `ui.frontend.picker` | React SPA (esbuild). Clientlib `asset-picker.spa` embedded by `asset-picker.selector`. |
| `core` | Servlets, DTOs, search, CA interfaces, Sling model. |
| `ui.apps` | Components, templates, i18n JSON, clientlibs. |
| `ui.config` | OSGi: `PickerSettingsImpl`, repoinit `adobexp` namespace. |
| `ui.content` | `/content/asset-picker`, `/conf/asset-picker` CA samples, ACS Generic Lists. |

Content tree: `/content/asset-picker/<tenant>/<country>/<lang>/{picker,selector}`.  
Root has `sling:configRef` + `cq:conf` = `/conf/asset-picker`.

## Frontend conventions

- Source: `ui.frontend.picker/src/dynamic/AssetPicker/` (`components/`, `contexts/`, `hooks/`, `models/`, `utils/`).
- CSS modules + SCSS themes (`theme-light.scss` / `theme-dark.scss`). Appearance CA emits CSS variables onto `[data-asset-browser-theme]`.
- i18n: `useTranslation()` / `__("key")`. Dictionaries at `ui.apps/.../i18n/{en,fr,de,es,pl,ro}.json`. Add keys to **en.json first**, then locales.
- Hash router: `#/content/dam/...` is the browsed path.
- Sidebar Filter UI: `Filters.tsx` **stages** values until Apply. Search sends `filter.<id>` / `range.<id>=from..to`.
- SPA filter `id` **is** the JCR property path (after stripping `./`). Do not invent a second mapping table.
- Local harness: `npm run start:mock` (fixtures) or `start:local` (proxy `:4502`) from `ui.frontend.picker`.
- After SPA changes: `npm run build` (Maven `ui.apps` also rebuilds the clientlib).

## AEM conventions

- Package: `com.adobexp.assetpicker.*` (`caconfig`, `models`, `servlets`, `services`, `dto`, `request`).
- New servlet: extend `AbstractPickerServlet`, path `/bin/asset-picker/<name>`, GET + `json`, validate with `PickerRequestParams.from(request, settings)`.
- CA types are `@Configuration` interfaces in `core/.../caconfig/`. Changing properties requires a new collection item in `/conf/asset-picker/sling:configs/<fqcn>/` **and** matching Java + DTO + SPA model.
- Sample filters use `adobexp:*` metadata. Repoinit must register that namespace.
- List-type filter options: Generic List (`valuesListPath`) → inline `values` → `tagsRoot`. Missing lists = silent skip unless `cascadeValues` (or a folder / categorized list) supplies `categoryValues`.
- Cascading children: `dependsOn` = parent `propertyPath`; options from `cascadeValues` (`parentValue=childValue[=Label]`), a folder of Generic Lists named by parent value, or list items with `category` / `parent`. Changing a parent clears descendants. Search still uses `filter.<id>=value`.

## Configuration (must be present)

**OSGi** (`/apps/asset-picker/osgiconfig/config`, ConfigMgr):

- `com.adobexp.assetpicker.services.impl.PickerSettingsImpl` — `allowedRoots`, `defaultRoot`, page sizes, `semanticSearchEnabled`. `filtersConfigPath` is reserved; the Filter tab uses CA, not that path.
- Repoinit `RepositoryInitializer~asset-picker` — `adobexp` namespace.

**CA** (`/conf/asset-picker/sling:configs`):

| Label | Type | Drives |
| --- | --- | --- |
| Asset Picker : Metadata Filter | collection | Filter tab |
| Asset Picker : Quick View Metadata | collection | Quick View rows |
| Asset Picker : Appearance | singleton | theme / fonts / colours |

Author overrides with template **Asset Picker : CA Config** (WCM.io editor) under tenant/country/language.

Blank Filter tab checklist: `sling:configRef` on `/content/asset-picker` → enabled CA items with `propertyPath` → options resolve → `ui.config` allowlist includes the DAM root → reload `?wcmmode=disabled`.

## Change recipes (pick one)

**Add a sidebar filter** → CA collection item + option source. No React change if `fieldType` is already supported (`text`, `dropdown`/`select`/`multiselect`, `checkbox`, `radio`, `daterange`). New widget → `models/filter.ts` + `Filter.tsx` + `MetadataFilterServiceImpl.mapFieldType` + search predicates.

**Add a cascading filter chain** → parent CA item with options; each child with `dependsOn` + `cascadeValues` (preferred) or a folder / categorized Generic List. Keep `id` === property path. Do not encode cascade in a metadata schema. Tenant-specific property names stay in that tenant's `/conf/...` CA, not in this repo.

**Add a Quick View row** → CA collection item only (`propertyPath` built-in or metadata).

**Change host payload** → almost never. If you must, update `PickerAsset`, `toPickerAsset`, and document the break. Prefer adding unused optional fields over renaming.

**New picker URL param** → `parsePickerParams.ts` + `PickerParams` + `PickerRequestParams` + `apiClient.pickerParamsToQuery` + README table.

**New i18n string** → `en.json` + other locale files + `__("key")`.

**New API field on assets** → Java DTO/`AssetMapper` + `models/api.ts` + the component that reads it.

## Do not

- Change `postMessage` from string to object, or rename `data` / `config.action`.
- Add POST/CSRF to picker APIs without updating `apiClient.fetchJson`.
- Author Filter fields on the selector component dialog — they will not render.
- Assume `filters.json?path=/content/dam` returns CA filters (DAM usually has no `sling:configRef`).
- Deploy via a fat `all` package on local AEM unless the user asks (prefer `ui.config` → `ui.apps` → `ui.content`).
- Point `valuesListPath` at a missing Generic List and expect the filter to show.
- Encode cascade in a DAM metadata schema, or put customer / tenant / company names in variables, node names, comments, or markdown in this repo.

## Verify

- Frontend: `cd ui.frontend.picker && npm run typecheck`
- Java: `mvn -pl core test` (or `-DskipTests` only if the user asked)
- Local selector: `/content/asset-picker/global/us/<lang>/selector.html?wcmmode=disabled#/content/dam`
- Demo host: `.../picker.html?wcmmode=disabled`
- Confirm Filter tab after CA/list changes; confirm host callback after selection changes.
