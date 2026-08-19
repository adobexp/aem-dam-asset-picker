package com.adobexp.assetpicker.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * One sidebar filter, shaped exactly like the SPA's {@code Filter} type.
 *
 * <p>{@code id} is the JCR property the filter narrows on, which is also what the SPA sends back as
 * {@code filter.<id>=<value>} (or {@code range.<id>} for date ranges), so no translation table is
 * needed on either side.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FilterDto {

    private final String id;
    private final String name;
    private final String type;
    private final boolean expanded;
    private final Object value;
    private final List<ValueDto> values;
    private final Boolean multiSelect;
    private final Boolean searchable;
    private final String placeholder;
    private final String dependsOn;
    private final Map<String, List<ValueDto>> categoryValues;

    public FilterDto(String id, String name, String type, boolean expanded, Object value, List<ValueDto> values) {
        this(id, name, type, expanded, value, values, null, null, null, null, null);
    }

    public FilterDto(String id, String name, String type, boolean expanded, Object value, List<ValueDto> values,
                     Boolean multiSelect, Boolean searchable, String placeholder, String dependsOn) {
        this(id, name, type, expanded, value, values, multiSelect, searchable, placeholder, dependsOn, null);
    }

    public FilterDto(String id, String name, String type, boolean expanded, Object value, List<ValueDto> values,
                     Boolean multiSelect, Boolean searchable, String placeholder, String dependsOn,
                     Map<String, List<ValueDto>> categoryValues) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.expanded = expanded;
        this.value = value;
        this.values = values;
        this.multiSelect = multiSelect;
        this.searchable = searchable;
        this.placeholder = placeholder;
        this.dependsOn = dependsOn;
        this.categoryValues = (categoryValues == null || categoryValues.isEmpty()) ? null : categoryValues;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public boolean getExpanded() {
        return expanded;
    }

    /** Pre-selected value: an array for multi-value filters, {@code null} otherwise. */
    public Object getValue() {
        return value;
    }

    public List<ValueDto> getValues() {
        return values;
    }

    public Boolean getMultiSelect() {
        return multiSelect;
    }

    public Boolean getSearchable() {
        return searchable;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public String getDependsOn() {
        return dependsOn;
    }

    /**
     * Child options keyed by the parent filter's stored value. Present when this filter
     * {@link #getDependsOn() depends on} another filter.
     */
    public Map<String, List<ValueDto>> getCategoryValues() {
        return categoryValues;
    }

    /** A selectable option. {@code id} is the stored value, {@code name} the label. */
    public static final class ValueDto {

        private final String id;
        private final String name;

        public ValueDto(String id, String name) {
            this.id = id;
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }
    }
}
