# AEM DAM Asset Picker

**Part of [AdobeXP](https://www.adobexp.com) open-source components.**  
Product details, related projects and documentation: [www.adobexp.com](https://www.adobexp.com)

A modern **React SPA Asset Picker for Adobe Experience Manager**, designed as a drop-in replacement for the OOTB AEM Asset Picker (`/aem/assetpicker.html`). It is backed by bespoke Sling APIs and keeps full compatibility with Adobe’s existing host integration contract.

A host page opens the picker in an **iframe**, **modal** or **popup**. Authors browse, search and filter DAM assets, then confirm a selection. The picker returns that selection to the opener using the **exact same `postMessage` payload as the OOTB Adobe Asset Picker**, so existing consumers can switch without changing their integration code.

---

## What this project offers

| Capability | Description |
| --- | --- |
| **Drop-in OOTB compatibility** | Same URL parameters and `postMessage` contract as `/aem/assetpicker.html` |
| **Browse & search** | Folder tree navigation plus full-text search against DAM |
| **Semantic & fuzzy search** | Optional query rewriting for meaning-based (`?{}?…`) and approximate (`…~`) Query Builder full-text |
| **Configurable metadata filters** | Sidebar filters authored via Context-Aware Configuration (labels, field types, lists, order) |
| **Quick View** | Asset detail overlay with CA-configurable metadata rows |
| **Light & dark themes** | Theme controlled by CA default and/or `?theme=light\|dark` on the selector URL |
| **Multi-tenant content tree** | `/content/asset-picker/<tenant>/<country>/<language>/…` with Sites templates for Tenant, Country, Language, Integration Page, Component and CA Config |
| **i18n-ready selector** | Language-specific selector / demo pages under each locale |
| **Authorable appearance** | Fonts, colours and panel styling via CA (Appearance config) |
| **Demo / integration host** | Built-in launch page to exercise iframe, modal and popup flows end to end |
| **Local frontend harness** | Run the SPA against mock fixtures or a local AEM author without a full package install |

Default sample content ships as the **Global** tenant:

- Demo host: `/content/asset-picker/global/us/en/picker.html`
- Asset Selector: `/content/asset-picker/global/us/en/selector.html`

---

## AdobeXP open source

This repository is part of the **AdobeXP** suite of open-source AEM components and accelerators.  
For overview, related components and project information, visit **[www.adobexp.com](https://www.adobexp.com)**.

---

## The integration contract

The picker posts a JSON string to `window.opener` (popup) or `parent` (iframe / modal):

```js
// selection confirmed
{
  "data": [
    {
      "path": "...",
      "url": "...",
      "type": "image/jpeg",
      "title": "...",
      "size": "1.3 MB",
      "img": "..."
    }
  ],
  "config": { "action": "done" }
}

// cancelled
{ "config": { "action": "close" } }
```

Consumers typically gate on message origin, for example `assetPickerURL.indexOf(event.origin) !== 0`, so the picker must be served from the same origin prefix as the configured picker URL.

### Replacing the OOTB picker

Point the host page’s picker URL at your selector page, for example:

`/content/asset-picker/global/us/en/selector.html`

Because the parameter set and the `postMessage` payload match the OOTB picker, **no consumer-side change is required**.

---

## Request parameters

The picker URL accepts the OOTB parameter set plus project extensions:

| Parameter | Values | Meaning |
| --- | --- | --- |
| `mode` | `single`, `multiple` | Selection mode (default `multiple`) |
| `root` | DAM path | Root folder the picker is restricted to |
| `mimetype` | Repeatable, e.g. `image/png` | Restrict to these MIME types |
| `assettype` | Comma-separated, e.g. `images,documents` | Restrict to asset type groups |
| `viewmode` | `browse`, `search` | Open in browse or search mode |
| `solution` | string | `dam:solutionContext` filter |
| `requiredproperty` | Repeatable | Assets must carry these metadata properties |
| `targetorigin` | Origin or `*` | `postMessage` target origin |
| `theme` | `light`, `dark` | Selector UI theme for this launch |
| `semantic` | `true` / `false` | Prefix full-text with `?{}?` for semantic search |
| `fuzzy` | `true` / `false` | Suffix full-text with `~` for fuzzy search |
| `filter.<prop>` | Any | Bespoke metadata filter, e.g. `filter.dc:format=image/jpeg` |

---

## Content & Sites templates

Content is organised as:

```text
/content/asset-picker/<tenant>/<country-iso>/<language>/
```

| Template | Typical page | Role |
| --- | --- | --- |
| **Asset Picker : Tenant** | `/content/asset-picker/global` | Tenant root (only creatable under `/content/asset-picker`) |
| **Asset Picker : Country** | `…/global/us` | Country / region container |
| **Asset Picker : Language** | `…/us/en` | Locale root |
| **Asset Picker : Integration Page** | `…/en/picker` | Demo / host launch page |
| **Asset Picker : Component** | `…/en/selector` | Asset Selector SPA page |
| **Asset Picker : CA Config** | Under tenant / country / language | Context-Aware Configuration editor |

CA configurations (Appearance, Metadata Filters, Quick View Metadata) are labelled with the **`Asset Picker : `** prefix and can be scoped per language or shared higher in the tree. The content root already points at the shared conf:

- `sling:configRef="/conf/asset-picker"`
- `cq:conf="/conf/asset-picker"`

on `/content/asset-picker`. Without that reference the selector page cannot resolve CA collections, and the **Filter** tab stays empty.

---

## Required configuration

Two layers must be in place for the picker to work end to end:

| Layer | Where | What it controls |
| --- | --- | --- |
| **OSGi** (`ui.config`) | `/system/console/configMgr` and `/apps/asset-picker/osgiconfig/config` | DAM allowlist, paging, semantic search, `adobexp` namespace |
| **Context-Aware (CA)** (`ui.content` + Sites) | `/conf/asset-picker/sling:configs` | Filter tab fields, Quick View rows, fonts / theme / colours |

The **Filter** tab on the selector (for example `/content/asset-picker/global/us/fr/selector.html?wcmmode=disabled#/content/dam`) is **not** authored on the component dialog. It is rendered only from the **Asset Picker : Metadata Filter** CA collection. If that collection is missing, disabled, or its option lists cannot be resolved, the sidebar body under **Filter** is blank (Apply / Clear stay disabled).

---

## OSGi configuration

Shipped in `ui.config` under `/apps/asset-picker/osgiconfig/config`. After deploy, review or override them in the OSGi Web Console: `/system/console/configMgr`.

### AEM DAM Asset Picker - Settings

PID: `com.adobexp.assetpicker.services.impl.PickerSettingsImpl`  
File: `com.adobexp.assetpicker.services.impl.PickerSettingsImpl.cfg.json`

Instance-wide guard rails for the `/bin/asset-picker/*` APIs. A `root` on the picker URL is honoured only when it sits inside an allowed root.

| Property | Default | Purpose |
| --- | --- | --- |
| `allowedRoots` | `/content/dam` | DAM paths the picker may read. Paths outside this list (and anything outside `/content/dam`) return `403`. |
| `defaultRoot` | `/content/dam` | Root used when the host page / selector does not pass one. |
| `defaultPageSize` | `100` | Search page size when the request does not specify one. |
| `maxPageSize` | `500` | Hard ceiling so a crafted URL cannot ask for the whole DAM. |
| `semanticSearchEnabled` | `true` | Allows `semantic=true` to prefix full-text with `?{}?`. Also gates the selector’s Semantic Search toggle. |
| `filtersConfigPath` | `/conf/asset-picker/settings/asset-picker/filters` | Reserved fallback JCR path when a browsed DAM folder has no CA context. The selector **Filter** tab itself is driven by the Metadata Filter CA collection below, not by this path. |

Typical local values:

```json
{
  "allowedRoots": ["/content/dam"],
  "defaultRoot": "/content/dam",
  "defaultPageSize": 100,
  "maxPageSize": 500,
  "semanticSearchEnabled": true,
  "filtersConfigPath": "/conf/asset-picker/settings/asset-picker/filters"
}
```

If `allowedRoots` is too narrow, folder listing and search fail even when CA filters are correct. If it is too wide, the picker can still never leave `/content/dam`.

### Repository initializer (namespace)

PID: `org.apache.sling.jcr.repoinit.RepositoryInitializer~asset-picker`  
File: `org.apache.sling.jcr.repoinit.RepositoryInitializer~asset-picker.cfg.json`

Registers the `adobexp` JCR namespace:

```text
register namespace (adobexp) http://www.adobexp.com/jcr/adobexp/1.0
```

Required for the sample metadata properties used by the shipped filters and Quick View rows (`adobexp:year`, `adobexp:status`, `adobexp:asset-type`). Without it, those properties cannot be stored or queried reliably.

---

## Context-Aware configuration

Three Sling CA configurations live under `/conf/asset-picker/sling:configs`. They are resolved from the selector component (and, as a fallback, from the browsed DAM folder via `/bin/asset-picker/filters.json?path=`).

| CA name (Sites / editor) | Java type | Cardinality | Drives |
| --- | --- | --- | --- |
| **Asset Picker : Metadata Filter** | `com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig` | Collection (one item per field) | **Filter** tab on the selector |
| **Asset Picker : Quick View Metadata** | `com.adobexp.assetpicker.caconfig.AssetPickerQuickViewMetadataConfig` | Collection (one item per row) | Quick View overlay rows |
| **Asset Picker : Appearance** | `com.adobexp.assetpicker.caconfig.AssetPickerAppearanceConfig` | Singleton | Default theme, fonts, panel and button colours |

Sample content ships defaults at:

```text
/conf/asset-picker/sling:configs/com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig/
/conf/asset-picker/sling:configs/com.adobexp.assetpicker.caconfig.AssetPickerQuickViewMetadataConfig/
/conf/asset-picker/sling:configs/com.adobexp.assetpicker.caconfig.AssetPickerAppearanceConfig
```

Locale- or tenant-specific overrides: create a page with the **Asset Picker : CA Config** template under the tenant, country or language page (for example under `/content/asset-picker/global/us/fr`). That template opens the WCM.io CA Config editor (`wcm-io/caconfig/editor/components/page/editor`). You can also edit the nodes directly in CRXDE / Configuration Browser.

Collection items inherit down the tree when `sling:configCollectionInherit` is `true` (the sample collections set this).

### Asset Picker : Metadata Filter (required for the Filter tab)

Author **one collection item per sidebar field**. The selector Sling model embeds the resolved list in `data-config.filters`. The SPA uses that list and does not call `filters.json` when it is non-empty.

| Property | Required | Meaning |
| --- | --- | --- |
| `label` | Yes | Section title in the Filter panel, e.g. `Year` |
| `propertyPath` | Yes | Metadata path, e.g. `./jcr:content/metadata/adobexp:year`. A leading `./` is stripped before Query Builder use. |
| `fieldType` | No | `text`, `dropdown`, `checkbox` (default), `radio`, `daterange` |
| `valuesListPath` | For list types | ACS Commons Generic List page that supplies options, e.g. `/etc/acs-commons/lists/adobexp/metadata/year` |
| `values` | Alternative | Inline options when no Generic List is set. Each entry is `value` or `value=Label` |
| `tagsRoot` | Alternative | `cq:tags` root whose child tags become options (used when the two sources above are blank) |
| `multiSelectAllowed` | No | For `checkbox` / `dropdown`. Default `true`. `dropdown` + `false` becomes a single-select. |
| `expanded` | No | Open this section when the panel first loads |
| `searchable` | No | Search box above checkbox options. Default `true` |
| `placeholder` | No | Placeholder for `text` |
| `dependsOn` | No | Parent filter `propertyPath` for cascading options |
| `orderIndex` | No | Sort order (lower first). Default `0` |
| `enabled` | No | `false` hides the filter without deleting the item. Default `true` |

**Option resolution order:** Generic List → inline `values` → tags.  
`text` and `daterange` do not need options. For `checkbox`, `dropdown` and `radio`, **if no options resolve the filter is skipped** and will not appear in the Filter tab.

Shipped sample items (Global tenant):

| Item | Label | Property | List |
| --- | --- | --- | --- |
| `year` | Year | `./jcr:content/metadata/adobexp:year` | `/etc/acs-commons/lists/adobexp/metadata/year` |
| `asset-type` | Asset Type | `./jcr:content/metadata/adobexp:asset-type` | `/etc/acs-commons/lists/adobexp/metadata/asset-type` |
| `status` | Status | `./jcr:content/metadata/adobexp:status` | `/etc/acs-commons/lists/adobexp/metadata/status` |

Those Generic Lists are packaged with `ui.content` at `/etc/acs-commons/lists/adobexp/metadata`. They must exist in the repository (and be readable by the request user). If the CA items are present but the lists are missing, the Filter tab stays empty.

You can avoid ACS Commons lists by setting **Inline Values** instead, for example:

```text
2024=2024
2025=2025
2026=2026
```

### Asset Picker : Quick View Metadata

Author **one collection item per row** in the Quick View dialog.

| Property | Meaning |
| --- | --- |
| `label` | Row label, e.g. `Size` or `Year` |
| `propertyPath` | Built-in field (`size`, `mime`, `type`, `resolution`, `dpi`, `dimensions`, `name`) or a metadata property such as `adobexp:year` / `./jcr:content/metadata/dc:title` |
| `orderIndex` | Sort order (lower first) |
| `enabled` | `false` hides the row without deleting it |

Sample rows: Size, Type, Resolution, Year, Asset Type, Status.

### Asset Picker : Appearance

Optional look-and-feel. Blank values fall through to `theme-light.scss` / `theme-dark.scss`.

| Property | Meaning |
| --- | --- |
| `fontFamily`, `fontStylesheetUrl`, `fontWeight`, `fontSize` | Typography (stylesheet URL is emitted as `@import`) |
| `defaultTheme` | `light` or `dark` (overridden by `?theme=` on the selector URL) |
| `light*` / `dark*` | Text, sidebar, toolbar, title bar, content and button colours per theme |

### How the Filter tab is populated

1. The selector Sling model (`asset-picker/components/selector`) adapts the page resource to Sling CA Config and asks `MetadataFilterService` for the collection.
2. Enabled items with a `propertyPath` are mapped to SPA filter DTOs; list-type items without options are dropped.
3. The list is serialised into the component’s `data-config.filters`.
4. The React Filter panel renders that array. If it is empty, the SPA may call `/bin/asset-picker/filters.json?path=<current DAM folder>` as a fallback — that only helps when the DAM folder (or an ancestor) also has a `sling:configRef` that resolves the same collection.

Checklist when the Filter tab is blank:

1. `/content/asset-picker` (or the locale page) has `sling:configRef="/conf/asset-picker"`.
2. At least one **Asset Picker : Metadata Filter** item exists, is `enabled`, and has `label` + `propertyPath`.
3. For `checkbox` / `dropdown` / `radio`, options resolve (Generic List path exists, or inline `values`, or `tagsRoot`).
4. `ui.config` is installed so `PickerSettings` allowlist includes the DAM root you are browsing.
5. Reload the selector with `?wcmmode=disabled` after changing CA nodes (the Sling model reads them on each page request).

---

## Modules

| Module | Packaging | Contents |
| --- | --- | --- |
| `ui.frontend.picker` | `jar` | React SPA (esbuild + Express dev shell), packaged as AEM clientlibs |
| `core` | `jar` (OSGi bundle) | Sling servlets, DTOs, search service, Sling models, CA interfaces |
| `ui.apps` | `content-package` | `/apps/asset-picker` components, templates and clientlibs; embeds the core bundle |
| `ui.apps.structure` | `content-package` | Repository structure definition |
| `ui.config` | `content-package` | OSGi configuration (`PickerSettings`, `adobexp` repoinit namespace) |
| `ui.content` | `content-package` | `/content/asset-picker`, `/conf/asset-picker` CA samples, ACS Generic Lists, sample DAM content |
| `all` | `content-package` | Single deployable container package |

---

## Bespoke Sling APIs

All endpoints are read-only `GET` (no CSRF round-trip required).

| Endpoint | Purpose |
| --- | --- |
| `/bin/asset-picker/assets.json?path=` | Folder listing (child folders and assets) |
| `/bin/asset-picker/search.json?path=&q=&page=` | Paginated full-text and filter search |
| `/bin/asset-picker/filters.json?path=` | Filter definitions from the Metadata Filter CA collection (fallback when `data-config.filters` is empty) |
| `/bin/asset-picker/asset.json?path=` | Single asset detail (Quick View) |

---

## Frontend development

Run the SPA against static JSON fixtures (no AEM required):

```bash
cd ui.frontend.picker
npm install
npm run start:mock
```

Then open:

- `http://localhost:4000/host/test.html` — demo host (iframe / modal / popup launch + callback)
- `http://localhost:4000/selector.html` — picker alone

Against a local AEM author on `localhost:4502`:

```bash
npm run start:local
```

---

## Building and deploying

Build everything and install the single package on local author:

```bash
mvn clean install -PautoInstallSinglePackage
```

Install on publish:

```bash
mvn clean install -PautoInstallSinglePackagePublish
```

Bundle only (fast Java iteration):

```bash
mvn clean install -PautoInstallBundle -pl core
```

After deploy:

| Page | Path |
| --- | --- |
| Demo / integration host | `/content/asset-picker/global/us/en/picker.html` |
| Asset Selector | `/content/asset-picker/global/us/en/selector.html` |

Add `?wcmmode=disabled` on author when you want the published-style experience without the editor chrome.

---

## License

See [LICENSE](LICENSE) in this repository.

For AdobeXP component details and related open-source projects, visit [www.adobexp.com](https://www.adobexp.com).
