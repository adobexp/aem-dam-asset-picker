package com.adobexp.assetpicker.services.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.apache.sling.caconfig.ConfigurationBuilder;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig;
import com.adobexp.assetpicker.dto.FilterDto;
import com.adobexp.assetpicker.services.MetadataFilterService;
import com.day.cq.tagging.Tag;

/**
 * Turns the Metadata Filter CA-config collection into {@link FilterDto}s the SPA understands.
 *
 * <p>ACS Commons Generic Lists are read directly from the JCR ({@code listPath/jcr:content/list/*})
 * so this bundle stays free of an ACS Commons compile dependency.
 *
 * <p>Cascading options are authored on the same CA item ({@code dependsOn} + {@code cascadeValues})
 * and do not read DAM metadata schemas.
 */
@Component(service = MetadataFilterService.class)
public class MetadataFilterServiceImpl implements MetadataFilterService {

    private static final Logger LOG = LoggerFactory.getLogger(MetadataFilterServiceImpl.class);

    private static final String GENERIC_LIST_ITEMS = "jcr:content/list";

    private static final List<String> MULTI_VALUE_TYPES = Collections.unmodifiableList(
            Arrays.asList("checkbox", "multiselect"));

    @Override
    public List<FilterDto> resolveFilters(Resource contextResource, ResourceResolver resolver) {
        if (contextResource == null || resolver == null) {
            return Collections.emptyList();
        }

        Collection<AssetPickerMetadataFilterConfig> configs = resolveCollection(contextResource);
        if (configs == null || configs.isEmpty()) {
            return Collections.emptyList();
        }

        List<AssetPickerMetadataFilterConfig> ordered = configs.stream()
                .sorted(Comparator.comparingInt(AssetPickerMetadataFilterConfig::orderIndex))
                .collect(Collectors.toList());

        List<FilterDto> filters = new ArrayList<>();
        for (AssetPickerMetadataFilterConfig config : ordered) {
            FilterDto filter = toFilter(config, resolver);
            if (filter != null) {
                filters.add(filter);
            }
        }
        return filters;
    }

    private static Collection<AssetPickerMetadataFilterConfig> resolveCollection(Resource contextResource) {
        try {
            ConfigurationBuilder builder = contextResource.adaptTo(ConfigurationBuilder.class);
            if (builder == null) {
                return null;
            }
            return builder.asCollection(AssetPickerMetadataFilterConfig.class);
        } catch (RuntimeException error) {
            LOG.warn("Could not resolve AssetPickerMetadataFilterConfig at {}", contextResource.getPath(), error);
            return null;
        }
    }

    private static FilterDto toFilter(AssetPickerMetadataFilterConfig config, ResourceResolver resolver) {
        if (config == null || !config.enabled()) {
            return null;
        }

        String property = normalisePropertyPath(config.propertyPath());
        if (StringUtils.isBlank(property)) {
            return null;
        }

        String authoredType = StringUtils.defaultIfBlank(config.fieldType(), "checkbox")
                .trim()
                .toLowerCase(Locale.ROOT);
        String spaType = mapFieldType(authoredType, config.multiSelectAllowed());
        String name = StringUtils.defaultIfBlank(config.label(), property);
        boolean expanded = config.expanded();

        List<FilterDto.ValueDto> values = resolveValues(config, resolver);
        Map<String, List<FilterDto.ValueDto>> categoryValues = resolveCategoryValues(config, resolver);
        if (values.isEmpty() && !categoryValues.isEmpty()) {
            values = flattenCategoryValues(categoryValues);
        }

        if (values.isEmpty() && categoryValues.isEmpty()
                && !"text".equals(spaType) && !"daterange".equals(spaType)) {
            LOG.debug("Skipping metadata filter {}: no options resolved", property);
            return null;
        }

        Object preselected = MULTI_VALUE_TYPES.contains(spaType) ? new String[0] : null;
        Boolean multiSelect = "checkbox".equals(spaType) ? Boolean.valueOf(config.multiSelectAllowed()) : null;
        Boolean searchable = "checkbox".equals(spaType) ? Boolean.valueOf(config.searchable()) : null;
        String placeholder = StringUtils.trimToNull(config.placeholder());
        String dependsOn = StringUtils.trimToNull(normalisePropertyPath(config.dependsOn()));

        return new FilterDto(
                property,
                name,
                spaType,
                expanded,
                preselected,
                values.isEmpty() ? null : values,
                multiSelect,
                searchable,
                placeholder,
                dependsOn,
                categoryValues.isEmpty() ? null : categoryValues);
    }

    /**
     * Strips a leading {@code ./} so author-friendly paths like
     * {@code ./jcr:content/metadata/adobexp:year} become QueryBuilder-safe relative paths.
     */
    static String normalisePropertyPath(String propertyPath) {
        if (StringUtils.isBlank(propertyPath)) {
            return null;
        }
        String trimmed = propertyPath.trim();
        if (trimmed.startsWith("./")) {
            trimmed = trimmed.substring(2);
        }
        return StringUtils.trimToNull(trimmed);
    }

    /**
     * Maps CA-config field types onto the SPA vocabulary.
     * {@code dropdown} becomes {@code select} or {@code multiselect} based on multiSelectAllowed.
     */
    static String mapFieldType(String authoredType, boolean multiSelectAllowed) {
        switch (authoredType) {
            case "dropdown":
                return multiSelectAllowed ? "multiselect" : "select";
            case "select":
                return "select";
            case "multiselect":
                return "multiselect";
            case "radio":
                return "radio";
            case "text":
                return "text";
            case "daterange":
            case "date-range":
            case "date":
                return "daterange";
            case "checkbox":
            default:
                return "checkbox";
        }
    }

    private static List<FilterDto.ValueDto> resolveValues(AssetPickerMetadataFilterConfig config,
                                                          ResourceResolver resolver) {
        List<FilterDto.ValueDto> fromList = genericListValues(config.valuesListPath(), resolver);
        if (!fromList.isEmpty()) {
            return fromList;
        }

        List<FilterDto.ValueDto> fromInline = inlineValues(config.values());
        if (!fromInline.isEmpty()) {
            return fromInline;
        }

        return tagValues(config.tagsRoot(), resolver);
    }

    /**
     * Resolves parent-keyed child options. Order: authored {@code cascadeValues}, then a folder of
     * Generic Lists named by parent value, then a single Generic List whose items have
     * {@code category} or {@code parent}.
     */
    static Map<String, List<FilterDto.ValueDto>> resolveCategoryValues(AssetPickerMetadataFilterConfig config,
                                                                      ResourceResolver resolver) {
        if (config == null) {
            return Collections.emptyMap();
        }

        Map<String, List<FilterDto.ValueDto>> fromCascade = parseCascadeValues(config.cascadeValues());
        if (!fromCascade.isEmpty()) {
            return fromCascade;
        }

        if (resolver == null || StringUtils.isBlank(config.valuesListPath())) {
            return Collections.emptyMap();
        }

        Map<String, List<FilterDto.ValueDto>> fromFolder = folderOfLists(config.valuesListPath(), resolver);
        if (!fromFolder.isEmpty()) {
            return fromFolder;
        }

        return categorizedListItems(config.valuesListPath(), resolver);
    }

    /**
     * Parses {@code parentValue=childValue} or {@code parentValue=childValue=Child Label}.
     */
    static Map<String, List<FilterDto.ValueDto>> parseCascadeValues(String[] authored) {
        if (authored == null || authored.length == 0) {
            return Collections.emptyMap();
        }

        Map<String, List<FilterDto.ValueDto>> result = new LinkedHashMap<>();
        Set<String> seenKeys = new HashSet<>();
        for (String entry : authored) {
            if (StringUtils.isBlank(entry)) {
                continue;
            }
            String trimmed = entry.trim();
            int firstEq = trimmed.indexOf('=');
            if (firstEq <= 0 || firstEq == trimmed.length() - 1) {
                continue;
            }
            String parent = trimmed.substring(0, firstEq).trim();
            String rest = trimmed.substring(firstEq + 1).trim();
            if (StringUtils.isBlank(parent) || StringUtils.isBlank(rest)) {
                continue;
            }

            int secondEq = rest.indexOf('=');
            String childId;
            String childLabel;
            if (secondEq > 0) {
                childId = rest.substring(0, secondEq).trim();
                childLabel = rest.substring(secondEq + 1).trim();
            } else {
                childId = rest;
                childLabel = rest;
            }
            if (StringUtils.isBlank(childId)) {
                continue;
            }
            if (StringUtils.isBlank(childLabel)) {
                childLabel = childId;
            }

            String dedupeKey = parent + "\u0000" + childId;
            if (!seenKeys.add(dedupeKey)) {
                continue;
            }
            result.computeIfAbsent(parent, key -> new ArrayList<>())
                    .add(new FilterDto.ValueDto(childId, childLabel));
        }
        return result.isEmpty() ? Collections.emptyMap() : result;
    }

    static List<FilterDto.ValueDto> flattenCategoryValues(Map<String, List<FilterDto.ValueDto>> categoryValues) {
        if (categoryValues == null || categoryValues.isEmpty()) {
            return Collections.emptyList();
        }
        List<FilterDto.ValueDto> flattened = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (List<FilterDto.ValueDto> group : categoryValues.values()) {
            if (group == null) {
                continue;
            }
            for (FilterDto.ValueDto value : group) {
                if (value == null || StringUtils.isBlank(value.getId()) || !seen.add(value.getId())) {
                    continue;
                }
                flattened.add(value);
            }
        }
        return flattened;
    }

    /**
     * When {@code valuesListPath} is a folder (not a Generic List page), each child is read as
     * its own Generic List. The same options are registered under the child node name and the
     * list page title / {@code value}, so a slug folder name can still match a differently
     * capitalised parent selection.
     */
    static Map<String, List<FilterDto.ValueDto>> folderOfLists(String listPath, ResourceResolver resolver) {
        Resource folder = resolveResource(listPath, resolver);
        if (folder == null || isGenericList(folder)) {
            return Collections.emptyMap();
        }

        Map<String, List<FilterDto.ValueDto>> result = new LinkedHashMap<>();
        for (Resource child : folder.getChildren()) {
            List<FilterDto.ValueDto> items = genericListValues(child.getPath(), resolver);
            if (items.isEmpty()) {
                continue;
            }
            for (String key : parentKeysForListPage(child)) {
                result.put(key, items);
            }
        }
        return result;
    }

    /**
     * Keys used to look up a nested Generic List from a parent filter value.
     */
    static List<String> parentKeysForListPage(String nodeName, String pageTitle, String pageValue,
                                              String contentTitle, String contentValue) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addKey(keys, nodeName);
        addKey(keys, pageValue);
        addKey(keys, pageTitle);
        addKey(keys, contentValue);
        addKey(keys, contentTitle);
        return new ArrayList<>(keys);
    }

    private static List<String> parentKeysForListPage(Resource child) {
        if (child == null) {
            return Collections.emptyList();
        }
        ValueMap page = child.getValueMap();
        String pageTitle = page.get("jcr:title", String.class);
        String pageValue = page.get("value", String.class);
        String contentTitle = null;
        String contentValue = null;
        Resource content = child.getChild("jcr:content");
        if (content != null) {
            ValueMap properties = content.getValueMap();
            contentTitle = properties.get("jcr:title", String.class);
            contentValue = properties.get("value", String.class);
        }
        return parentKeysForListPage(child.getName(), pageTitle, pageValue, contentTitle, contentValue);
    }

    private static void addKey(Set<String> keys, String candidate) {
        String trimmed = StringUtils.trimToNull(candidate);
        if (trimmed != null) {
            keys.add(trimmed);
        }
    }

    /**
     * Groups items of a single Generic List by {@code category} or {@code parent}.
     */
    static Map<String, List<FilterDto.ValueDto>> categorizedListItems(String listPath, ResourceResolver resolver) {
        Resource listRoot = resolveListRoot(listPath, resolver);
        if (listRoot == null) {
            return Collections.emptyMap();
        }

        Map<String, List<FilterDto.ValueDto>> result = new LinkedHashMap<>();
        for (Resource item : listRoot.getChildren()) {
            ValueMap properties = item.getValueMap();
            String value = StringUtils.trimToNull(properties.get("value", String.class));
            if (value == null) {
                continue;
            }
            String category = StringUtils.trimToNull(properties.get("category", String.class));
            if (category == null) {
                category = StringUtils.trimToNull(properties.get("parent", String.class));
            }
            if (category == null) {
                continue;
            }
            String title = StringUtils.defaultIfBlank(properties.get("jcr:title", String.class), value);
            result.computeIfAbsent(category, key -> new ArrayList<>())
                    .add(new FilterDto.ValueDto(value, title));
        }
        return result;
    }

    /**
     * Reads an ACS Commons Generic List page without depending on the ACS Commons API:
     * {@code <listPath>/jcr:content/list/item*} with {@code value} and {@code jcr:title}.
     */
    private static List<FilterDto.ValueDto> genericListValues(String listPath, ResourceResolver resolver) {
        Resource listRoot = resolveListRoot(listPath, resolver);
        if (listRoot == null) {
            return Collections.emptyList();
        }

        List<FilterDto.ValueDto> values = new ArrayList<>();
        for (Resource item : listRoot.getChildren()) {
            ValueMap properties = item.getValueMap();
            String value = StringUtils.trimToNull(properties.get("value", String.class));
            if (value == null) {
                continue;
            }
            String title = StringUtils.defaultIfBlank(properties.get("jcr:title", String.class), value);
            values.add(new FilterDto.ValueDto(value, title));
        }
        return values;
    }

    private static Resource resolveListRoot(String listPath, ResourceResolver resolver) {
        Resource page = resolveResource(listPath, resolver);
        if (page == null) {
            return null;
        }
        Resource listRoot = page.getChild(GENERIC_LIST_ITEMS);
        if (listRoot != null) {
            return listRoot;
        }
        if (GENERIC_LIST_ITEMS.equals(page.getName()) || "list".equals(page.getName())) {
            return page;
        }
        LOG.debug("ACS Generic List not found at {}", listPath);
        return null;
    }

    private static Resource resolveResource(String path, ResourceResolver resolver) {
        if (resolver == null || StringUtils.isBlank(path)) {
            return null;
        }
        return resolver.getResource(StringUtils.stripEnd(path.trim(), "/"));
    }

    private static boolean isGenericList(Resource resource) {
        return resource != null && resource.getChild(GENERIC_LIST_ITEMS) != null;
    }

    private static List<FilterDto.ValueDto> inlineValues(String[] authored) {
        if (authored == null || authored.length == 0) {
            return Collections.emptyList();
        }
        List<FilterDto.ValueDto> values = new ArrayList<>();
        for (String entry : authored) {
            if (StringUtils.isBlank(entry)) {
                continue;
            }
            String id = StringUtils.trim(StringUtils.substringBefore(entry, "="));
            String label = StringUtils.trimToEmpty(StringUtils.substringAfter(entry, "="));
            if (StringUtils.isBlank(id)) {
                continue;
            }
            values.add(new FilterDto.ValueDto(id, StringUtils.defaultIfEmpty(label, id)));
        }
        return values;
    }

    private static List<FilterDto.ValueDto> tagValues(String tagsRoot, ResourceResolver resolver) {
        if (StringUtils.isBlank(tagsRoot)) {
            return Collections.emptyList();
        }

        Resource root = resolver.getResource(tagsRoot);
        if (root == null) {
            return Collections.emptyList();
        }

        List<FilterDto.ValueDto> values = new ArrayList<>();
        for (Resource child : root.getChildren()) {
            Tag tag = child.adaptTo(Tag.class);
            if (tag != null) {
                values.add(new FilterDto.ValueDto(tag.getTagID(), tag.getTitle()));
            }
        }
        return values;
    }
}
