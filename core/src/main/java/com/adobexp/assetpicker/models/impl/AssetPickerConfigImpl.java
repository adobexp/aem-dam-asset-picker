package com.adobexp.assetpicker.models.impl;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.caconfig.ConfigurationBuilder;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.ScriptVariable;
import org.apache.sling.models.annotations.injectorspecific.SlingObject;
import org.apache.sling.models.annotations.injectorspecific.ValueMapValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobexp.assetpicker.caconfig.AssetPickerAppearanceConfig;
import com.adobexp.assetpicker.dto.FilterDto;
import com.adobexp.assetpicker.dto.QuickViewFieldDto;
import com.adobexp.assetpicker.models.AssetPickerConfig;
import com.adobexp.assetpicker.services.MetadataFilterService;
import com.adobexp.assetpicker.services.PickerSettings;
import com.adobexp.assetpicker.services.QuickViewMetadataService;
import com.adobexp.assetpicker.servlets.AbstractPickerServlet;
import com.day.cq.wcm.api.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Turns the authored selector properties into the SPA's {@code data-config},
 * {@code data-translations} and inline style overrides.
 *
 * <p>These are defaults only. The host page narrows them per launch through the picker URL
 * ({@code root}, {@code mode}, {@code mimetype}, {@code filter.*}), which the SPA merges on top,
 * and the API re-validates the resulting path against the allowlist regardless.
 */
@Model(adaptables = SlingHttpServletRequest.class,
        adapters = AssetPickerConfig.class,
        resourceType = AssetPickerConfigImpl.RESOURCE_TYPE)
public class AssetPickerConfigImpl implements AssetPickerConfig {

    protected static final String RESOURCE_TYPE = "asset-picker/components/selector";

    private static final Logger LOG = LoggerFactory.getLogger(AssetPickerConfigImpl.class);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Matches the OOTB picker, whose hosts pass no origin and accept any. */
    private static final String DEFAULT_TARGET_ORIGIN = "*";

    private static final String I18N_EN_PATH = "/apps/asset-picker/i18n/en.json";

    @SlingObject
    private SlingHttpServletRequest request;

    @SlingObject
    private Resource resource;

    @ScriptVariable(name = "currentPage")
    private Page currentPage;

    @OSGiService
    private PickerSettings settings;

    @OSGiService
    private MetadataFilterService metadataFilterService;

    @OSGiService
    private QuickViewMetadataService quickViewMetadataService;

    /** DAM folders the picker may browse. Defaults to the instance-wide configured root. */
    @ValueMapValue
    private String[] rootPath;

    @ValueMapValue
    private String rootLabel;

    /** {@code single} or {@code multiple}. */
    @ValueMapValue
    private String selectionMode;

    /** {@code browse} opens the folder tree, {@code search} opens the filters panel. */
    @ValueMapValue
    private String viewMode;

    @ValueMapValue
    private String theme;

    @ValueMapValue
    private String targetOrigin;

    @ValueMapValue
    private Integer searchPageSize;

    @ValueMapValue
    private Boolean showSearch;

    @ValueMapValue
    private Boolean showFuzzySearch;

    @ValueMapValue
    private Boolean showSemanticSearch;

    @ValueMapValue
    private Boolean collapsibleFilters;

    @ValueMapValue
    private Boolean displayDirectoryNames;

    private String config;
    private String translations = "{}";
    private String styleOverrides = "";

    @PostConstruct
    protected void init() {
        AssetPickerAppearanceConfig appearance = resolveAppearance();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("apiBase", AbstractPickerServlet.API_ROOT);
        payload.put("rootDirectories", roots());
        payload.put("selectionMode", "single".equals(selectionMode) ? "single" : "multiple");
        payload.put("pickerViewMode", "search".equals(viewMode) ? "search" : "browse");
        payload.put("targetOrigin", StringUtils.defaultIfBlank(targetOrigin, DEFAULT_TARGET_ORIGIN));
        payload.put("searchPageSize", searchPageSize == null ? settings.getDefaultPageSize() : searchPageSize);
        payload.put("showSearch", showSearch == null || showSearch);
        payload.put("showFuzzySearch", showFuzzySearch == null || showFuzzySearch);
        payload.put("showSemanticSearch",
                settings.isSemanticSearchEnabled() && (showSemanticSearch == null || showSemanticSearch));
        payload.put("collapsibleFilters", collapsibleFilters != null && collapsibleFilters);
        payload.put("displayDirectoryNames", displayDirectoryNames != null && displayDirectoryNames);
        payload.put("enableDirectorySidebarCollapse", true);

        if (StringUtils.isNotBlank(rootLabel)) {
            payload.put("rootLabel", rootLabel);
        }

        String resolvedTheme = resolveTheme(appearance);
        if (StringUtils.isNotBlank(resolvedTheme)) {
            payload.put("theme", resolvedTheme);
        }

        List<FilterDto> filters = resolveFilters();
        if (!filters.isEmpty()) {
            payload.put("filters", filters);
        }

        List<QuickViewFieldDto> quickViewMetadata = resolveQuickViewMetadata();
        if (!quickViewMetadata.isEmpty()) {
            payload.put("quickViewMetadata", quickViewMetadata);
        }

        this.config = serialise(payload);
        this.translations = buildTranslations();
        this.styleOverrides = buildStyleOverrides(appearance);
    }

    @Override
    public String getConfig() {
        return config;
    }

    @Override
    public String getTranslations() {
        return translations;
    }

    @Override
    public String getStyleOverrides() {
        return styleOverrides;
    }

    private AssetPickerAppearanceConfig resolveAppearance() {
        try {
            ConfigurationBuilder builder = resource.adaptTo(ConfigurationBuilder.class);
            if (builder != null) {
                return builder.as(AssetPickerAppearanceConfig.class);
            }
        } catch (RuntimeException error) {
            LOG.warn("Could not resolve AssetPickerAppearanceConfig at {}", resource.getPath(), error);
        }
        return null;
    }

    private List<FilterDto> resolveFilters() {
        if (metadataFilterService == null) {
            return Collections.emptyList();
        }
        try {
            return metadataFilterService.resolveFilters(resource, request.getResourceResolver());
        } catch (RuntimeException error) {
            LOG.warn("Could not resolve metadata filters at {}", resource.getPath(), error);
            return Collections.emptyList();
        }
    }

    private List<QuickViewFieldDto> resolveQuickViewMetadata() {
        if (quickViewMetadataService == null) {
            return Collections.emptyList();
        }
        try {
            return quickViewMetadataService.resolveFields(resource, request.getResourceResolver());
        } catch (RuntimeException error) {
            LOG.warn("Could not resolve Quick View metadata at {}", resource.getPath(), error);
            return Collections.emptyList();
        }
    }

    private String resolveTheme(AssetPickerAppearanceConfig appearance) {
        if (StringUtils.isNotBlank(theme)) {
            return theme;
        }
        if (appearance != null && StringUtils.isNotBlank(appearance.defaultTheme())) {
            String authored = appearance.defaultTheme().trim().toLowerCase(Locale.ROOT);
            if ("dark".equals(authored) || "light".equals(authored)) {
                return authored;
            }
        }
        return "light";
    }

    /**
     * Reads the canonical key set from {@code /apps/asset-picker/i18n/en.json}, then looks each
     * key up in the request's ResourceBundle for the page language, falling back to English.
     */
    private String buildTranslations() {
        Map<String, String> english = loadEnglishDictionary();
        if (english.isEmpty()) {
            return "{}";
        }

        Locale locale = resolveLocale();
        ResourceBundle bundle = request.getResourceBundle(locale);
        ResourceBundle englishBundle = Locale.ENGLISH.equals(locale)
                ? bundle
                : request.getResourceBundle(Locale.ENGLISH);

        Map<String, String> resolved = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : english.entrySet()) {
            String key = entry.getKey();
            String value = lookup(bundle, key);
            if (value == null || value.equals(key)) {
                value = lookup(englishBundle, key);
            }
            if (value == null || value.equals(key)) {
                value = entry.getValue();
            }
            resolved.put(key, value);
        }
        return serialise(resolved);
    }

    private static String lookup(ResourceBundle bundle, String key) {
        if (bundle == null || key == null) {
            return null;
        }
        try {
            if (bundle.containsKey(key)) {
                return bundle.getString(key);
            }
        } catch (RuntimeException ignored) {
            // MissingResourceException and friends — treat as absent.
        }
        return null;
    }

    private Locale resolveLocale() {
        if (currentPage != null) {
            Locale pageLocale = currentPage.getLanguage(false);
            if (pageLocale != null && StringUtils.isNotBlank(pageLocale.getLanguage())) {
                return pageLocale;
            }
        }
        return Locale.ENGLISH;
    }

    private Map<String, String> loadEnglishDictionary() {
        Resource dict = request.getResourceResolver().getResource(I18N_EN_PATH);
        if (dict == null) {
            LOG.warn("English i18n dictionary missing at {}", I18N_EN_PATH);
            return Collections.emptyMap();
        }
        try (InputStream stream = dict.adaptTo(InputStream.class)) {
            if (stream == null) {
                LOG.warn("Could not open InputStream for {}", I18N_EN_PATH);
                return Collections.emptyMap();
            }
            return MAPPER.readValue(stream, new TypeReference<LinkedHashMap<String, String>>() { });
        } catch (Exception error) {
            LOG.error("Failed to parse English i18n dictionary at {}", I18N_EN_PATH, error);
            return Collections.emptyMap();
        }
    }

    private String buildStyleOverrides(AssetPickerAppearanceConfig appearance) {
        if (appearance == null) {
            return "";
        }

        StringBuilder css = new StringBuilder();

        if (StringUtils.isNotBlank(appearance.fontStylesheetUrl())) {
            css.append("@import url('")
                    .append(escapeCss(appearance.fontStylesheetUrl().trim()))
                    .append("');\n");
        }

        Map<String, String> shared = new LinkedHashMap<>();
        putIfPresent(shared, "--font-family", appearance.fontFamily());
        putIfPresent(shared, "--font-weight", appearance.fontWeight());
        putIfPresent(shared, "--font-size", appearance.fontSize());

        Map<String, String> light = new LinkedHashMap<>(shared);
        putIfPresent(light, "--text-color", appearance.lightTextColor());
        putIfPresent(light, "--directory-tree-background", appearance.lightSidebarBackground());
        putIfPresent(light, "--filters-background", appearance.lightSidebarBackground());
        putIfPresent(light, "--settings-panel-background", appearance.lightToolbarBackground());
        putIfPresent(light, "--breadcrumbs-background", appearance.lightTitleBarBackground());
        putIfPresent(light, "--content-background", appearance.lightContentBackground());
        putIfPresent(light, "--background", appearance.lightContentBackground());
        putIfPresent(light, "--button-background", appearance.lightButtonBackground());
        putIfPresent(light, "--button-color", appearance.lightButtonColor());
        putIfPresent(light, "--button-background-hover", appearance.lightButtonBackgroundHover());
        putIfPresent(light, "--button-color-hover", appearance.lightButtonColorHover());
        putIfPresent(light, "--button-background-active", appearance.lightButtonBackgroundActive());
        putIfPresent(light, "--button-color-active", appearance.lightButtonColorActive());
        putIfPresent(light, "--button-background-selected", appearance.lightButtonBackgroundSelected());
        putIfPresent(light, "--button-color-selected", appearance.lightButtonColorSelected());
        // Keep primary/search aliases in sync with the default button colour.
        putIfPresent(light, "--button-primary-bg", appearance.lightButtonBackground());
        putIfPresent(light, "--button-primary-color", appearance.lightButtonColor());
        putIfPresent(light, "--button-primary-hover-bg", appearance.lightButtonBackgroundHover());
        putIfPresent(light, "--search-submit-background", appearance.lightButtonBackground());
        putIfPresent(light, "--search-submit-color", appearance.lightButtonColor());
        putIfPresent(light, "--settings-panel-button", appearance.lightButtonBackground());
        putIfPresent(light, "--settings-panel-button-color", appearance.lightButtonColor());

        Map<String, String> dark = new LinkedHashMap<>(shared);
        putIfPresent(dark, "--text-color", appearance.darkTextColor());
        putIfPresent(dark, "--directory-tree-background", appearance.darkSidebarBackground());
        putIfPresent(dark, "--filters-background", appearance.darkSidebarBackground());
        putIfPresent(dark, "--settings-panel-background", appearance.darkToolbarBackground());
        putIfPresent(dark, "--breadcrumbs-background", appearance.darkTitleBarBackground());
        putIfPresent(dark, "--content-background", appearance.darkContentBackground());
        putIfPresent(dark, "--background", appearance.darkContentBackground());
        putIfPresent(dark, "--button-background", appearance.darkButtonBackground());
        putIfPresent(dark, "--button-color", appearance.darkButtonColor());
        putIfPresent(dark, "--button-background-hover", appearance.darkButtonBackgroundHover());
        putIfPresent(dark, "--button-color-hover", appearance.darkButtonColorHover());
        putIfPresent(dark, "--button-background-active", appearance.darkButtonBackgroundActive());
        putIfPresent(dark, "--button-color-active", appearance.darkButtonColorActive());
        putIfPresent(dark, "--button-background-selected", appearance.darkButtonBackgroundSelected());
        putIfPresent(dark, "--button-color-selected", appearance.darkButtonColorSelected());
        putIfPresent(dark, "--button-primary-bg", appearance.darkButtonBackground());
        putIfPresent(dark, "--button-primary-color", appearance.darkButtonColor());
        putIfPresent(dark, "--button-primary-hover-bg", appearance.darkButtonBackgroundHover());
        putIfPresent(dark, "--search-submit-background", appearance.darkButtonBackground());
        putIfPresent(dark, "--search-submit-color", appearance.darkButtonColor());
        putIfPresent(dark, "--settings-panel-button", appearance.darkButtonBackground());
        putIfPresent(dark, "--settings-panel-button-color", appearance.darkButtonColor());

        appendThemeBlock(css, "light", light);
        appendThemeBlock(css, "dark", dark);
        return css.toString();
    }

    private static void putIfPresent(Map<String, String> target, String property, String value) {
        if (StringUtils.isNotBlank(value)) {
            target.put(property, value.trim());
        }
    }

    private static void appendThemeBlock(StringBuilder css, String themeName, Map<String, String> tokens) {
        if (tokens.isEmpty()) {
            return;
        }
        css.append("[data-asset-browser-theme=\"").append(themeName).append("\"]{");
        for (Map.Entry<String, String> entry : tokens.entrySet()) {
            css.append(entry.getKey()).append(':').append(escapeCss(entry.getValue())).append(';');
        }
        css.append("}\n");
    }

    /** Strip characters that could break out of a CSS declaration or @import URL. */
    private static String escapeCss(String value) {
        return value.replace("\\", "").replace("\"", "").replace("'", "").replace("<", "").replace(">", "");
    }

    /**
     * Authored roots are filtered through the allowlist here as well as in the API, so a
     * misconfigured component surfaces an empty tree rather than the whole DAM.
     */
    private List<String> roots() {
        List<String> allowed = new ArrayList<>();
        if (rootPath != null) {
            Arrays.stream(rootPath)
                    .filter(StringUtils::isNotBlank)
                    .map(StringUtils::trim)
                    .filter(path -> {
                        if (settings.isAllowed(path)) {
                            return true;
                        }
                        LOG.warn("Selector at {} lists root {}, which is outside the permitted DAM roots",
                                resource.getPath(), path);
                        return false;
                    })
                    .forEach(allowed::add);
        }
        return allowed.isEmpty() ? Collections.singletonList(settings.getDefaultRoot()) : allowed;
    }

    private static String serialise(Object payload) {
        try {
            return MAPPER.writeValueAsString(payload);
        } catch (JsonProcessingException error) {
            LOG.error("Could not serialise Asset Picker payload", error);
            return "{}";
        }
    }
}
