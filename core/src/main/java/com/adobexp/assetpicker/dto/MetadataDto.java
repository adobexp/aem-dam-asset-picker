package com.adobexp.assetpicker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** One label/value row shown on an asset card and in the quick view. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MetadataDto {

    private final String label;
    private final String value;
    /** Normalised metadata property (or built-in id) used to match Quick View CA config. */
    private final String key;

    public MetadataDto(String label, String value) {
        this(label, value, null);
    }

    public MetadataDto(String label, String value, String key) {
        this.label = label;
        this.value = value;
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public String getValue() {
        return value;
    }

    public String getKey() {
        return key;
    }
}
