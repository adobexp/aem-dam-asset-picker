# Architecture reference

Read this after [SKILL.md](SKILL.md) when a change crosses SPA ↔ Sling ↔ CA.

## Request path

1. Host opens `/content/asset-picker/<tenant>/<cc>/<lang>/selector.html` (plus OOTB query params).
2. `selector.html` adapts `AssetPickerConfig` → `data-config`, `data-translations`, optional inline `<style>`.
3. `src/index.tsx` hydrates `.asset-picker-selector.__react-cmp` as `AssetPicker` (`App`).
4. `App` merges URL params over `data-config`. `useFilterDefinitions` fetches `filters.json` only if `filters` is empty.
5. Browse: `GET /bin/asset-picker/assets.json?path=`. Search: `GET /bin/asset-picker/search.json?path=&q=&filter.*=&range.*=`.
6. Select → `postSelection` / Cancel → `postCancel` (`postMessageBridge.ts`).

## Frontend map (`ui.frontend.picker/src`)

| Path | Responsibility |
| --- | --- |
| `index.tsx` | Hydrate `.__react-cmp` via `data-react-component` |
| `dynamic/registerDynamicComp.tsx` | Register `AssetPicker` |
| `dynamic/AssetPicker/components/App/App.tsx` | Config merge, providers, HashRouter |
| `components/AssetPickerView/` | Shell: sidebar (Filter / Tree), gallery, toolbar |
| `components/Filters/Filters.tsx` | Staged filter panel (Apply / Clear) |
| `components/Filter/Filter.tsx` | One filter widget by `type` |
| `components/DirectoryTree/` | DAM folder tree |
| `components/QuickViewModal/` | Asset detail; rows from `quickViewMetadata` |
| `contexts/Configuration.context.tsx` | Authored + URL config |
| `contexts/Selection.context.tsx` | Selection + `targetOrigin` |
| `hooks/useFilters/` | Filter state ↔ hash/search params |
| `hooks/useFilterDefinitions/` | CA-embedded vs `filters.json` fallback |
| `hooks/useDirectories/`, `useSearch/` | Folder listing / search |
| `utils/apiClient.ts` | URL builders + GET `fetchJson` |
| `utils/parsePickerParams.ts` | OOTB + `filter.*` query parsing |
| `utils/postMessageBridge.ts` | Host contract |
| `utils/toPickerAsset.ts` | SPA asset → host payload |
| `models/filter.ts` | SPA filter types (`id` = property path) |
| `models/picker.ts` | `PickerAsset`, `PickerParams` |
| `public/selector.html`, `public/host/` | Local harness (mock/local) |

Clientlib: build writes `asset-picker.spa`; `clientlib-selector` (`categories=asset-picker.selector`) embeds it. Selector page `clientlibs=[asset-picker.selector]`.

## AEM map (`core` / `ui.apps` / `ui.config` / `ui.content`)

| Path | Responsibility |
| --- | --- |
| `caconfig/AssetPickerMetadataFilterConfig.java` | Filter CA collection |
| `caconfig/AssetPickerQuickViewMetadataConfig.java` | Quick View CA collection |
| `caconfig/AssetPickerAppearanceConfig.java` | Appearance singleton |
| `models/impl/AssetPickerConfigImpl.java` | Builds `data-config` / i18n / CSS overrides |
| `services/impl/MetadataFilterServiceImpl.java` | CA → `FilterDto`; option resolution |
| `services/impl/QuickViewMetadataServiceImpl.java` | CA → Quick View rows |
| `services/impl/PickerSettingsImpl.java` | OSGi allowlist / paging / semantic |
| `services/impl/PickerSearchServiceImpl.java` | Query Builder + `filter.` / `range.` |
| `services/impl/AssetMapperImpl.java` | DAM asset → API DTO |
| `request/PickerRequestParams.java` | Shared query parsing + allowlist |
| `servlets/*Servlet.java` | `assets`, `search`, `filters`, `asset` |
| `ui.apps/.../components/selector/` | HTL bootstrap |
| `ui.apps/.../templates/` | Tenant, Country, Language, Integration, Component, CA Config |
| `ui.apps/.../i18n/*.json` | Locale dictionaries (en is canonical) |
| `ui.config/.../PickerSettingsImpl.cfg.json` | Default OSGi |
| `ui.config/.../RepositoryInitializer~asset-picker.cfg.json` | `adobexp` namespace |
| `ui.content/.../conf/asset-picker/_sling_configs/` | Sample CA |
| `ui.content/.../etc/acs-commons/lists/adobexp/metadata/` | Sample Generic Lists |

## CA → SPA field mapping

`MetadataFilterServiceImpl.mapFieldType`:

| CA `fieldType` | SPA `type` |
| --- | --- |
| `checkbox` (default) | `checkbox` |
| `dropdown` + multi | `multiselect` |
| `dropdown` + !multi | `select` |
| `radio` | `radio` |
| `text` | `text` |
| `daterange` / `date` | `daterange` |

`propertyPath` `./jcr:content/metadata/adobexp:year` → filter `id` `jcr:content/metadata/adobexp:year` → search `filter.jcr:content/metadata/adobexp:year=2025`.

Daterange value encoding: `from..to` (either side optional) on `range.<property>`.

List-type items with zero resolved options are omitted. Resolution: Generic List (`<path>/jcr:content/list/*` with `value` + `jcr:title`) → inline `value` or `value=Label` → child tags of `tagsRoot`.

## Adding a Metadata Filter (no new widget)

1. Ensure `/content/asset-picker` has `sling:configRef=/conf/asset-picker`.
2. Add a child under  
   `/conf/asset-picker/sling:configs/com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig/<id>`  
   with `label`, `propertyPath`, `fieldType`, `orderIndex`, `enabled`.
3. Provide options: existing Generic List, new list under `/etc/acs-commons/lists/...`, inline `values`, or `tagsRoot`.
4. Reload selector `?wcmmode=disabled`. Confirm `data-config` JSON includes `filters`.

Do **not** add dialog fields on `asset-picker/components/selector` for this.

## Adding a new filter widget

1. Extend `models/filter.ts` union.
2. Render it in `components/Filter/Filter.tsx` (and input component if needed).
3. Map CA type in `MetadataFilterServiceImpl.mapFieldType`.
4. If not equality: teach `apiClient` (`filter.` vs `range.`) and `PickerSearchServiceImpl`.
5. Keep `id` === Query Builder property path.

## Adding a picker URL / API parameter

Touch all four: `parsePickerParams.ts`, `PickerParams`, `PickerRequestParams`, `apiClient.pickerParamsToQuery` (and the servlet/search predicate if it affects results). Update the README parameter table.

## i18n

`AssetPickerConfigImpl` loads key set from `/apps/asset-picker/i18n/en.json`, then `ResourceBundle` for the page language. New UI copy: add the key to **every** `ui.apps/.../i18n/*.json`, use `__("the.key")`.

## Local pages

| Page | Path |
| --- | --- |
| Demo host | `/content/asset-picker/global/us/<lang>/picker.html` |
| Selector | `/content/asset-picker/global/us/<lang>/selector.html` |

Use `?wcmmode=disabled` on author. Hash `#/content/dam/...` is the current folder.

## Deploy

Install `ui.config` → `ui.apps` → `ui.content` unless the user explicitly wants the `all` package. SPA-only iteration: `ui.frontend.picker` `npm run build` then reinstall `ui.apps`. Java-only: `mvn clean install -PautoInstallBundle -pl core`.
