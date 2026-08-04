package com.adobexp.assetpicker.services.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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
        if (values.isEmpty() && !"text".equals(spaType) && !"daterange".equals(spaType)) {
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
                dependsOn);
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
     * Reads an ACS Commons Generic List page without depending on the ACS Commons API:
     * {@code <listPath>/jcr:content/list/item*} with {@code value} and {@code jcr:title}.
     */
    private static List<FilterDto.ValueDto> genericListValues(String listPath, ResourceResolver resolver) {
        if (StringUtils.isBlank(listPath)) {
            return Collections.emptyList();
        }

        String path = StringUtils.stripEnd(listPath.trim(), "/");
        Resource listRoot = resolver.getResource(path + "/" + GENERIC_LIST_ITEMS);
        if (listRoot == null) {
            // Also accept the list path pointing directly at the list node.
            Resource page = resolver.getResource(path);
            if (page != null) {
                listRoot = page.getChild(GENERIC_LIST_ITEMS);
            }
        }
        if (listRoot == null) {
            LOG.debug("ACS Generic List not found at {}", listPath);
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
