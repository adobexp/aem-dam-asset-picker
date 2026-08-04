package com.adobexp.assetpicker.services;

import java.util.List;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;

import com.adobexp.assetpicker.dto.FilterDto;

/**
 * Builds the sidebar filter definitions the Asset Picker SPA consumes.
 *
 * <p>Definitions come from the {@link com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig}
 * Context-Aware Configuration collection, with option values resolved from ACS Commons Generic
 * Lists, inline strings, or a cq:tags root.
 */
public interface MetadataFilterService {

    /**
     * Resolves the filter collection for {@code contextResource} (typically the selector component
     * or a DAM folder) and returns SPA-shaped {@link FilterDto}s. Never {@code null}.
     */
    List<FilterDto> resolveFilters(Resource contextResource, ResourceResolver resolver);
}
