package com.adobexp.assetpicker.services.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.caconfig.ConfigurationBuilder;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobexp.assetpicker.caconfig.AssetPickerQuickViewMetadataConfig;
import com.adobexp.assetpicker.dto.QuickViewFieldDto;
import com.adobexp.assetpicker.services.QuickViewMetadataService;

/**
 * Turns the Quick View Metadata CA-config collection into {@link QuickViewFieldDto}s.
 */
@Component(service = QuickViewMetadataService.class)
public class QuickViewMetadataServiceImpl implements QuickViewMetadataService {

    private static final Logger LOG = LoggerFactory.getLogger(QuickViewMetadataServiceImpl.class);

    private static final String METADATA_PREFIX = "jcr:content/metadata/";

    /** Built-in asset payload fields the SPA resolves without a JCR metadata lookup. */
    public static final Set<String> BUILT_IN_FIELDS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "size", "filesize", "mime", "type", "resolution", "dpi", "dimensions", "dimension", "name")));

    @Override
    public List<QuickViewFieldDto> resolveFields(Resource contextResource, ResourceResolver resolver) {
        if (contextResource == null) {
            return Collections.emptyList();
        }

        Collection<AssetPickerQuickViewMetadataConfig> configs = resolveCollection(contextResource);
        if (configs == null || configs.isEmpty()) {
            return Collections.emptyList();
        }

        List<AssetPickerQuickViewMetadataConfig> ordered = configs.stream()
                .sorted(Comparator.comparingInt(AssetPickerQuickViewMetadataConfig::orderIndex))
                .collect(Collectors.toList());

        List<QuickViewFieldDto> fields = new ArrayList<>();
        for (AssetPickerQuickViewMetadataConfig config : ordered) {
            QuickViewFieldDto field = toField(config);
            if (field != null) {
                fields.add(field);
            }
        }
        return fields;
    }

    private static Collection<AssetPickerQuickViewMetadataConfig> resolveCollection(Resource contextResource) {
        try {
            ConfigurationBuilder builder = contextResource.adaptTo(ConfigurationBuilder.class);
            if (builder == null) {
                return null;
            }
            return builder.asCollection(AssetPickerQuickViewMetadataConfig.class);
        } catch (RuntimeException error) {
            LOG.warn("Could not resolve AssetPickerQuickViewMetadataConfig at {}", contextResource.getPath(), error);
            return null;
        }
    }

    private static QuickViewFieldDto toField(AssetPickerQuickViewMetadataConfig config) {
        if (config == null || !config.enabled()) {
            return null;
        }

        String id = normalisePropertyPath(config.propertyPath());
        if (StringUtils.isBlank(id)) {
            return null;
        }

        String label = StringUtils.defaultIfBlank(config.label(), id);
        return new QuickViewFieldDto(id, label);
    }

    /**
     * Strips {@code ./} and {@code jcr:content/metadata/} so authors can paste either a short
     * property name or a full metadata path. Built-in ids are lower-cased.
     */
    public static String normalisePropertyPath(String propertyPath) {
        if (StringUtils.isBlank(propertyPath)) {
            return "";
        }
        String path = propertyPath.trim();
        if (path.startsWith("./")) {
            path = path.substring(2);
        }
        if (path.regionMatches(true, 0, METADATA_PREFIX, 0, METADATA_PREFIX.length())) {
            path = path.substring(METADATA_PREFIX.length());
        }
        String lower = path.toLowerCase(Locale.ROOT);
        if (BUILT_IN_FIELDS.contains(lower)) {
            return lower;
        }
        return path;
    }

    public static boolean isBuiltIn(String id) {
        return id != null && BUILT_IN_FIELDS.contains(id.toLowerCase(Locale.ROOT));
    }
}
