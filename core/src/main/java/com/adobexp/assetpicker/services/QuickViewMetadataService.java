package com.adobexp.assetpicker.services;

import java.util.List;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;

import com.adobexp.assetpicker.dto.QuickViewFieldDto;

/**
 * Builds the Quick View metadata field list the Asset Picker SPA consumes.
 *
 * <p>Definitions come from the
 * {@link com.adobexp.assetpicker.caconfig.AssetPickerQuickViewMetadataConfig} Context-Aware
 * Configuration collection.
 */
public interface QuickViewMetadataService {

    /**
     * Resolves the Quick View field collection for {@code contextResource} (typically the selector
     * component or a DAM folder). Never {@code null}; empty when nothing is authored.
     */
    List<QuickViewFieldDto> resolveFields(Resource contextResource, ResourceResolver resolver);
}
