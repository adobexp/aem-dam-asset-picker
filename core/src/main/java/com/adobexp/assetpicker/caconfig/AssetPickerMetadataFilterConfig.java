package com.adobexp.assetpicker.caconfig;

import org.apache.sling.caconfig.annotation.Configuration;
import org.apache.sling.caconfig.annotation.Property;

/**
 * One sidebar metadata filter for the Asset Picker.
 *
 * <p>Author one collection item per field. The selector SPA picks the collection up from the page's
 * Context-Aware Configuration and renders the Filter panel automatically — no component dialog
 * authoring is required.
 */
@Configuration(
        collection = true,
        label = "Asset Picker : Metadata Filter",
        description = "One sidebar filter for the Asset Picker. Add one item per metadata field.")
public @interface AssetPickerMetadataFilterConfig {

    @Property(label = "Metadata Label", description = "Section title shown in the Filter panel, e.g. Brand")
    String label();

    @Property(label = "Metadata Key",
            description = "Metadata property path, e.g. ./jcr:content/metadata/dc:title "
                    + "or jcr:content/metadata/adobexp:year. A leading ./ is stripped before use.")
    String propertyPath();

    @Property(label = "Metadata Field Type",
            description = "One of: text (free text), dropdown (single-select list; set Multi Select "
                    + "Allowed for a multi-select list), checkbox (tick list), radio (radio options), "
                    + "daterange (from/to date pickers). Defaults to checkbox.")
    String fieldType() default "checkbox";

    @Property(label = "Metadata Field Values Location",
            description = "ACS Commons Generic List page that supplies the selectable options, "
                    + "e.g. /etc/acs-commons/lists/adobexp/metadata/year. For a cascading filter, "
                    + "this may instead be a folder of Generic Lists named by parent value, or a "
                    + "single list whose items carry a category (or parent) property. "
                    + "Ignored for text and daterange.")
    String valuesListPath() default "";

    @Property(label = "Inline Values",
            description = "Optional inline options when no Generic List is set. Each entry is "
                    + "value or value=Label, e.g. Logo or Logo=Logo artwork.")
    String[] values() default {};

    @Property(label = "Tags Root",
            description = "Optional cq:tags root whose child tags become options "
                    + "(used when Values Location and Inline Values are blank).")
    String tagsRoot() default "";

    @Property(label = "Multi Select Allowed",
            description = "For checkbox and dropdown: when false, only one option may be selected. "
                    + "Defaults to true.")
    boolean multiSelectAllowed() default true;

    @Property(label = "Expanded by Default",
            description = "Open this filter section when the panel first loads.")
    boolean expanded() default false;

    @Property(label = "Searchable Options",
            description = "Show a search box above the option list (checkbox type).")
    boolean searchable() default true;

    @Property(label = "Placeholder",
            description = "Placeholder text for the text field type.")
    String placeholder() default "";

    @Property(label = "Depends On",
            description = "Property path of the parent filter (same form as that item's Metadata Key). "
                    + "When set, this filter's options come from Cascade Values (or a folder of lists) "
                    + "keyed by the parent selection. Independent of DAM metadata schemas.")
    String dependsOn() default "";

    @Property(label = "Cascade Values",
            description = "Parent-to-child options for a cascading filter. Each entry is "
                    + "parentValue=childValue or parentValue=childValue=Child Label. "
                    + "Used when Depends On is set. Preferred over metadata-schema cascade.")
    String[] cascadeValues() default {};

    @Property(label = "Order Index",
            description = "Sort order among filter items (lower first). Defaults to 0.")
    int orderIndex() default 0;

    @Property(label = "Enabled",
            description = "When false the filter is skipped without deleting the config item.")
    boolean enabled() default true;
}
