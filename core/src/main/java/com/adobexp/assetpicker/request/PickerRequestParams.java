package com.adobexp.assetpicker.request;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.request.RequestParameter;

import com.adobexp.assetpicker.services.PickerSettings;
import com.adobexp.assetpicker.util.PickerPaths;

/**
 * The query string every picker endpoint understands, parsed and validated once.
 *
 * <p>The parameter names are the OOTB AEM Asset Picker ones ({@code root}, {@code mimetype},
 * {@code assettype}, {@code solution}, {@code requiredproperty}) plus the bespoke
 * {@code filter.<property>} extension, so the same URL a host page builds for the picker can be
 * replayed against the API.
 *
 * <p>{@link #getPath()} is always inside the allowlist: a request for anything else is reported
 * through {@link #isValid()} rather than silently widened.
 */
public final class PickerRequestParams {

    public static final String PARAM_PATH = "path";
    public static final String PARAM_ROOT = "root";
    public static final String PARAM_QUERY = "q";
    public static final String PARAM_PAGE = "page";
    public static final String PARAM_PAGE_SIZE = "pageSize";
    public static final String PARAM_FILES = "files";
    public static final String PARAM_FOLDERS = "folders";
    public static final String PARAM_SORT = "sort";
    public static final String PARAM_SORT_ORDER = "sortOrder";
    public static final String PARAM_FUZZY = "fuzzy";
    public static final String PARAM_SEMANTIC = "semantic";
    public static final String PARAM_MIME_TYPE = "mimetype";
    public static final String PARAM_ASSET_TYPE = "assettype";
    public static final String PARAM_REQUIRED_PROPERTY = "requiredproperty";
    public static final String PARAM_SOLUTION = "solution";
    public static final String FILTER_PREFIX = "filter.";
    public static final String RANGE_PREFIX = "range.";

    private static final String SORT_ORDER_DESC = "desc";

    private final String path;
    private final String searchTerm;
    private final int page;
    private final int pageSize;
    private final boolean includeAssets;
    private final boolean includeFolders;
    private final String sortProperty;
    private final String sortOrder;
    private final boolean fuzzy;
    private final boolean semantic;
    private final List<String> mimeTypes;
    private final List<String> assetTypes;
    private final List<String> requiredProperties;
    private final String solution;
    private final Map<String, List<String>> metadataFilters;
    private final Map<String, String> metadataRanges;
    private final boolean valid;

    private PickerRequestParams(SlingHttpServletRequest request, PickerSettings settings) {
        // `path` is what the SPA navigates to; `root` is the boundary the host page asked for.
        // Either may be absent, in which case the configured default applies.
        String requested = firstNonEmpty(value(request, PARAM_PATH), value(request, PARAM_ROOT), settings.getDefaultRoot());
        String candidate = PickerPaths.normalise(requested);

        this.valid = settings.isAllowed(candidate);
        this.path = this.valid ? candidate : settings.getDefaultRoot();

        this.searchTerm = StringUtils.trimToEmpty(value(request, PARAM_QUERY));
        this.page = Math.max(0, intValue(request, PARAM_PAGE, 0));
        this.pageSize = Math.min(settings.getMaxPageSize(),
                Math.max(1, intValue(request, PARAM_PAGE_SIZE, settings.getDefaultPageSize())));

        // Neither flag set means "everything", which is what folder browsing wants.
        boolean assetsRequested = booleanValue(request, PARAM_FILES, false);
        boolean foldersRequested = booleanValue(request, PARAM_FOLDERS, false);
        this.includeAssets = assetsRequested || !foldersRequested;
        this.includeFolders = foldersRequested || !assetsRequested;

        this.sortProperty = StringUtils.trimToNull(value(request, PARAM_SORT));
        this.sortOrder = SORT_ORDER_DESC.equalsIgnoreCase(value(request, PARAM_SORT_ORDER)) ? SORT_ORDER_DESC : "asc";

        this.fuzzy = booleanValue(request, PARAM_FUZZY, false);
        this.semantic = settings.isSemanticSearchEnabled() && booleanValue(request, PARAM_SEMANTIC, false);

        this.mimeTypes = list(request, PARAM_MIME_TYPE);
        this.assetTypes = list(request, PARAM_ASSET_TYPE);
        this.requiredProperties = list(request, PARAM_REQUIRED_PROPERTY);
        this.solution = StringUtils.trimToNull(value(request, PARAM_SOLUTION));
        this.metadataFilters = metadataFilters(request);
        this.metadataRanges = metadataRanges(request);
    }

    public static PickerRequestParams from(SlingHttpServletRequest request, PickerSettings settings) {
        return new PickerRequestParams(request, settings);
    }

    public boolean isValid() {
        return valid;
    }

    public String getPath() {
        return path;
    }

    public String getSearchTerm() {
        return searchTerm;
    }

    public boolean hasSearchTerm() {
        return StringUtils.isNotEmpty(searchTerm);
    }

    public int getPage() {
        return page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public int getOffset() {
        return page * pageSize;
    }

    public boolean isIncludeAssets() {
        return includeAssets;
    }

    public boolean isIncludeFolders() {
        return includeFolders;
    }

    public String getSortProperty() {
        return sortProperty;
    }

    public String getSortOrder() {
        return sortOrder;
    }

    public boolean isSortDescending() {
        return SORT_ORDER_DESC.equals(sortOrder);
    }

    public boolean isFuzzy() {
        return fuzzy;
    }

    public boolean isSemantic() {
        return semantic;
    }

    public List<String> getMimeTypes() {
        return mimeTypes;
    }

    public List<String> getAssetTypes() {
        return assetTypes;
    }

    public List<String> getRequiredProperties() {
        return requiredProperties;
    }

    public String getSolution() {
        return solution;
    }

    public Map<String, List<String>> getMetadataFilters() {
        return metadataFilters;
    }

    /**
     * Date-range filters keyed by property path. Values are encoded {@code from..to} with either
     * bound optional.
     */
    public Map<String, String> getMetadataRanges() {
        return metadataRanges;
    }

    private static Map<String, List<String>> metadataFilters(SlingHttpServletRequest request) {
        Map<String, List<String>> filters = new LinkedHashMap<>();
        RequestParameter[] parameters = request.getRequestParameterList().toArray(new RequestParameter[0]);

        for (RequestParameter parameter : parameters) {
            String name = parameter.getName();
            if (name == null || !name.startsWith(FILTER_PREFIX)) {
                continue;
            }

            String property = name.substring(FILTER_PREFIX.length());
            List<String> values = split(parameter.getString());
            if (StringUtils.isEmpty(property) || values.isEmpty()) {
                continue;
            }

            filters.computeIfAbsent(property, key -> new ArrayList<>()).addAll(values);
        }

        return Collections.unmodifiableMap(filters);
    }

    private static Map<String, String> metadataRanges(SlingHttpServletRequest request) {
        Map<String, String> ranges = new LinkedHashMap<>();
        RequestParameter[] parameters = request.getRequestParameterList().toArray(new RequestParameter[0]);

        for (RequestParameter parameter : parameters) {
            String name = parameter.getName();
            if (name == null || !name.startsWith(RANGE_PREFIX)) {
                continue;
            }

            String property = name.substring(RANGE_PREFIX.length());
            String encoded = StringUtils.trimToNull(parameter.getString());
            if (StringUtils.isEmpty(property) || encoded == null) {
                continue;
            }
            ranges.put(property, encoded);
        }

        return Collections.unmodifiableMap(ranges);
    }

    private static List<String> list(SlingHttpServletRequest request, String name) {
        String[] values = request.getParameterValues(name);
        if (values == null) {
            return Collections.emptyList();
        }
        return Collections.unmodifiableList(Arrays.stream(values)
                .flatMap(value -> split(value).stream())
                .distinct()
                .collect(Collectors.toList()));
    }

    /** Accepts both the repeated (`?mimetype=a&mimetype=b`) and comma separated forms. */
    private static List<String> split(String value) {
        if (StringUtils.isEmpty(value)) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
                .map(StringUtils::trimToEmpty)
                .filter(StringUtils::isNotEmpty)
                .collect(Collectors.toList());
    }

    private static String value(SlingHttpServletRequest request, String name) {
        return request.getParameter(name);
    }

    private static int intValue(SlingHttpServletRequest request, String name, int fallback) {
        try {
            return Integer.parseInt(StringUtils.trimToEmpty(value(request, name)));
        } catch (NumberFormatException error) {
            return fallback;
        }
    }

    private static boolean booleanValue(SlingHttpServletRequest request, String name, boolean fallback) {
        String value = value(request, name);
        return StringUtils.isEmpty(value) ? fallback : Boolean.parseBoolean(value);
    }

    private static String firstNonEmpty(String... values) {
        for (String value : values) {
            if (StringUtils.isNotEmpty(StringUtils.trimToEmpty(value))) {
                return value;
            }
        }
        return StringUtils.EMPTY;
    }
}
