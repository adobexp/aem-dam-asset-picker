/*
 * Asset Picker demo host page.
 *
 * Doubles as a conformance test for the OOTB AEM Asset Picker contract: the launch hook
 * (`.import_assets_activator` carrying `data-assetpickerurl`), the origin gate
 * (`assetPickerURL.indexOf(event.origin) !== 0`) and the `{ data, config: { action } }`
 * message shape are all identical to Adobe's demo page, so anything that works here
 * works against a consumer written for the OOTB picker.
 *
 * Shared verbatim by the local mock harness and the AEM demo component clientlib.
 */
(function () {
  "use strict";

  var STYLE_IFRAME = "iframe";
  var STYLE_POPUP = "popup";
  var STYLE_MODAL = "modal";

  /** Absolute picker URL, so the origin gate can compare against `event.origin`. */
  var assetPickerURL = "";
  var popup = null;
  var elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    elements = {
      form: byId("ap-options"),
      launch: document.querySelector(".import_assets_activator"),
      reset: byId("ap-reset"),
      urlPreview: byId("ap-url"),
      copyUrl: byId("ap-copy-url"),
      filters: byId("ap-filters"),
      addFilter: byId("ap-add-filter"),
      stage: byId("ap-stage"),
      stageEmpty: byId("ap-stage-empty"),
      frame: byId("ap-frame"),
      modal: byId("ap-modal"),
      modalFrame: byId("ap-modal-frame"),
      modalClose: byId("ap-modal-close"),
      results: byId("ap-results"),
      resultsEmpty: byId("ap-results-empty"),
      resultsCount: byId("ap-results-count"),
      json: byId("ap-json"),
      copyJson: byId("ap-copy-json"),
      log: byId("ap-log"),
    };
  }

  function selectedStyle() {
    var checked = elements.form.querySelector("input[name='style']:checked");
    return checked ? checked.value : STYLE_IFRAME;
  }

  function fieldValue(name) {
    var field = elements.form.elements[name];
    if (!field) {
      return "";
    }
    if (field.length !== undefined && field.tagName === undefined) {
      var checked = elements.form.querySelector("input[name='" + name + "']:checked");
      return checked ? checked.value : "";
    }
    return (field.value || "").trim();
  }

  function checkedValues(name) {
    var inputs = elements.form.querySelectorAll("input[name='" + name + "']:checked");
    return Array.prototype.map.call(inputs, function (input) {
      return input.value;
    });
  }

  function metadataFilters() {
    var rows = elements.filters.querySelectorAll(".ap-filters__row");
    return Array.prototype.reduce.call(
      rows,
      function (pairs, row) {
        var property = row.querySelector("[data-filter-property]").value.trim();
        var value = row.querySelector("[data-filter-value]").value.trim();
        if (property && value) {
          pairs.push([property, value]);
        }
        return pairs;
      },
      [],
    );
  }

  /** Builds the picker URL exactly as a real consumer would. */
  function buildPickerUrl() {
    var params = new URLSearchParams();

    params.set("theme", fieldValue("theme") || "light");
    params.set("mode", fieldValue("mode") || "multiple");
    params.set("viewmode", fieldValue("viewmode") || "browse");

    var root = fieldValue("root");
    if (root) {
      params.set("root", root);
    }

    checkedValues("mimetype").forEach(function (mimetype) {
      params.append("mimetype", mimetype);
    });

    ["assettype", "solution", "requiredproperty", "targetorigin"].forEach(function (name) {
      var value = fieldValue(name);
      if (value) {
        params.set(name, value);
      }
    });

    metadataFilters().forEach(function (pair) {
      params.append("filter." + pair[0], pair[1]);
    });

    return assetPickerURL + (assetPickerURL.indexOf("?") === -1 ? "?" : "&") + params.toString();
  }

  function refreshUrlPreview() {
    elements.urlPreview.textContent = buildPickerUrl();
  }

  function log(message, level) {
    var item = document.createElement("li");
    var time = document.createElement("span");
    time.className = "ap-log__time";
    time.textContent = new Date().toLocaleTimeString();

    var body = document.createElement("span");
    body.className = "ap-log__level--" + (level || "info");
    body.textContent = message;

    item.appendChild(time);
    item.appendChild(body);
    elements.log.insertBefore(item, elements.log.firstChild);
  }

  function addFilterRow(property, value) {
    var row = document.createElement("div");
    row.className = "ap-filters__row";
    row.innerHTML =
      '<input class="ap-input" data-filter-property placeholder="jcr:content/metadata/dam:assetType" />' +
      '<input class="ap-input" data-filter-value placeholder="Logo" />' +
      '<button type="button" class="ap-iconbutton" data-remove-filter aria-label="Remove filter">&times;</button>';

    if (property) {
      row.querySelector("[data-filter-property]").value = property;
    }
    if (value) {
      row.querySelector("[data-filter-value]").value = value;
    }

    elements.filters.appendChild(row);
    refreshUrlPreview();
  }

  function hideStage() {
    elements.frame.hidden = true;
    elements.frame.removeAttribute("src");
    elements.modal.hidden = true;
    elements.modalFrame.removeAttribute("src");
    if (popup && !popup.closed) {
      popup.close();
    }
    popup = null;
    syncStageForStyle();
  }

  /**
   * Reflect the chosen integration style in the stage before / after a launch:
   * - iframe: show the stage card with the empty placeholder (until launch fills the frame)
   * - modal / popup: hide the whole stage — nothing renders inline in those modes
   */
  function syncStageForStyle() {
    if (!elements.stage) {
      return;
    }
    var style = selectedStyle();
    var iframeMode = style === STYLE_IFRAME;
    elements.stage.hidden = !iframeMode;
    if (iframeMode) {
      var frameActive = elements.frame && !elements.frame.hidden && elements.frame.getAttribute("src");
      elements.stageEmpty.hidden = !!frameActive;
    } else {
      elements.stageEmpty.hidden = true;
    }
  }

  function launch() {
    var url = buildPickerUrl();
    var style = selectedStyle();

    hideStage();
    log("Launching picker (" + style + "): " + url);

    if (style === STYLE_POPUP) {
      popup = window.open(url, "dam", "left=25%,top=25%,height=800,width=1000,status=yes,toolbar=no,menubar=no");
      if (!popup) {
        log("Popup blocked by the browser — falling back to the inline frame.", "warn");
        elements.stage.hidden = false;
        elements.stageEmpty.hidden = true;
        elements.frame.hidden = false;
        elements.frame.src = url;
      }
      return;
    }

    if (style === STYLE_MODAL) {
      elements.modal.hidden = false;
      elements.modalFrame.src = url;
      return;
    }

    elements.stage.hidden = false;
    elements.stageEmpty.hidden = true;
    elements.frame.hidden = false;
    elements.frame.src = url;
  }

  function renderResults(assets) {
    elements.results.innerHTML = "";

    assets.forEach(function (asset) {
      var card = document.createElement("article");
      card.className = "ap-result";

      var thumb = document.createElement("div");
      thumb.className = "ap-result__thumb";
      if (asset.img) {
        var image = document.createElement("img");
        image.src = asset.img;
        image.alt = asset.title || asset.path;
        thumb.appendChild(image);
      } else {
        thumb.textContent = "No preview";
      }

      var meta = document.createElement("div");
      meta.className = "ap-result__meta";

      var title = document.createElement("div");
      title.className = "ap-result__title";
      title.textContent = asset.title || asset.path;
      title.title = asset.title || asset.path;

      var sub = document.createElement("div");
      sub.className = "ap-result__sub";
      sub.textContent = [asset.type, asset.size].filter(Boolean).join(" · ");
      sub.title = asset.path;

      meta.appendChild(title);
      meta.appendChild(sub);
      card.appendChild(thumb);
      card.appendChild(meta);
      elements.results.appendChild(card);
    });

    elements.resultsEmpty.hidden = assets.length > 0;
    elements.resultsCount.textContent = assets.length + (assets.length === 1 ? " asset" : " assets");
  }

  function receiveMessage(event) {
    // Same gate as the OOTB consumer: only trust the origin the picker is served from.
    if (assetPickerURL.indexOf(event.origin) !== 0) {
      return;
    }

    var payload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      log("Ignored a non-JSON message from " + event.origin, "warn");
      return;
    }

    if (payload.data) {
      elements.json.textContent = JSON.stringify(payload, null, 2);
      renderResults(payload.data);
      log("Received " + payload.data.length + " asset(s) from the picker.");
    }

    if (payload.config) {
      var action = payload.config.action;
      if (action === "done" || action === "close") {
        hideStage();
        log('Picker closed with action "' + action + '".');
      }
      if (action === "close" && !payload.data) {
        elements.json.textContent = JSON.stringify(payload, null, 2);
      }
    }
  }

  function copyToClipboard(text, label) {
    if (!navigator.clipboard) {
      log("Clipboard access is unavailable in this browser.", "warn");
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () {
        log(label + " copied to the clipboard.");
      },
      function () {
        log("Could not copy " + label + " to the clipboard.", "warn");
      },
    );
  }

  function bindEvents() {
    elements.form.addEventListener("input", refreshUrlPreview);
    elements.form.addEventListener("change", function (event) {
      refreshUrlPreview();
      if (event.target && event.target.name === "style") {
        hideStage();
      }
    });

    elements.launch.addEventListener("click", launch);
    elements.reset.addEventListener("click", function () {
      elements.form.reset();
      elements.filters.innerHTML = "";
      addFilterRow();
      hideStage();
      refreshUrlPreview();
    });

    elements.addFilter.addEventListener("click", function () {
      addFilterRow();
    });

    elements.filters.addEventListener("click", function (event) {
      if (!event.target.matches("[data-remove-filter]")) {
        return;
      }
      var row = event.target.closest(".ap-filters__row");
      if (row) {
        row.remove();
      }
      if (!elements.filters.querySelector(".ap-filters__row")) {
        addFilterRow();
      }
      refreshUrlPreview();
    });

    elements.copyUrl.addEventListener("click", function () {
      copyToClipboard(elements.urlPreview.textContent, "Picker URL");
    });

    elements.copyJson.addEventListener("click", function () {
      copyToClipboard(elements.json.textContent, "Payload JSON");
    });

    elements.modalClose.addEventListener("click", hideStage);

    window.addEventListener("message", receiveMessage, false);
  }

  function init() {
    cacheElements();
    if (!elements.form || !elements.launch) {
      return;
    }

    // The AEM component externalises this to an absolute URL; the static harness uses a
    // relative one, so normalise before the origin comparison.
    assetPickerURL = new URL(elements.launch.dataset.assetpickerurl || "/selector.html", window.location.href).href;

    bindEvents();
    addFilterRow();
    refreshUrlPreview();
    syncStageForStyle();
    log("Ready. Picker URL base: " + assetPickerURL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
