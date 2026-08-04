package com.adobexp.assetpicker.caconfig;

import org.apache.sling.caconfig.annotation.Configuration;
import org.apache.sling.caconfig.annotation.Property;

/**
 * One Quick View metadata row for the Asset Picker.
 *
 * <p>Author one collection item per field. Built-in identifiers ({@code size}, {@code mime},
 * {@code type}, {@code resolution}, {@code dpi}, {@code dimensions}, {@code name}) map to values
 * already on the asset payload; any other path is read from {@code jcr:content/metadata}.
 */
@Configuration(
        collection = true,
        label = "Asset Picker : Quick View Metadata",
        description = "Controls which metadata rows appear in the Quick View dialog, and in what order.")
public @interface AssetPickerQuickViewMetadataConfig {

    @Property(label = "Label",
            description = "Row label shown in the Quick View table, e.g. Size or Brand")
    String label();

    @Property(label = "Property / Field",
            description = "Built-in field (size, mime, type, resolution, dpi, dimensions, name) "
                    + "or a metadata property such as dam:status, adobexp:year, "
                    + "./jcr:content/metadata/dc:title. A leading ./ and jcr:content/metadata/ "
                    + "prefix are stripped before lookup.")
    String propertyPath();

    @Property(label = "Order Index",
            description = "Sort order among Quick View rows (lower first). Defaults to 0.")
    int orderIndex() default 0;

    @Property(label = "Enabled",
            description = "When false the row is skipped without deleting the config item.")
    boolean enabled() default true;
}
