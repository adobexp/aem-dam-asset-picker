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

CA configurations (Appearance, Metadata Filters, Quick View Metadata) are labelled with the **`Asset Picker : `** prefix and can be scoped per language or shared higher in the tree.

---

## Modules

| Module | Packaging | Contents |
| --- | --- | --- |
| `ui.frontend.picker` | `jar` | React SPA (esbuild + Express dev shell), packaged as AEM clientlibs |
| `core` | `jar` (OSGi bundle) | Sling servlets, DTOs, search service, Sling models, CA interfaces |
| `ui.apps` | `content-package` | `/apps/asset-picker` components, templates and clientlibs; embeds the core bundle |
| `ui.apps.structure` | `content-package` | Repository structure definition |
| `ui.config` | `content-package` | OSGi configuration |
| `ui.content` | `content-package` | `/content/asset-picker`, `/conf/asset-picker`, sample DAM content |
| `all` | `content-package` | Single deployable container package |

---

## Bespoke Sling APIs

All endpoints are read-only `GET` (no CSRF round-trip required).

| Endpoint | Purpose |
| --- | --- |
| `/bin/asset-picker/assets.json?path=` | Folder listing (child folders and assets) |
| `/bin/asset-picker/search.json?path=&q=&page=` | Paginated full-text and filter search |
| `/bin/asset-picker/filters.json?path=` | Filter definitions (from CA) and facet counts |
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
