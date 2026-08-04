package com.adobexp.assetpicker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One Quick View metadata row definition, shaped for the SPA's {@code quickViewMetadata} config.
 *
 * <p>{@code id} is the normalised property / built-in field key the SPA matches against asset
 * payload values and {@link MetadataDto#getKey()}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuickViewFieldDto {

    private final String id;
    private final String label;

    public QuickViewFieldDto(String id, String label) {
        this.id = id;
        this.label = label;
    }

    public String getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }
}
