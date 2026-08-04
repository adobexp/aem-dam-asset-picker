package com.adobexp.assetpicker.util;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;

/**
 * Reads metadata off a DAM resource the way the picker's URL parameters name it.
 *
 * <p>A property may arrive as a bare metadata name ({@code dc:title}) or as a full relative path
 * ({@code jcr:content/metadata/dc:title}); both resolve to the same value, so a host page can use
 * whichever reads better in its URLs.
 */
public final class DamProperties {

    private static final String METADATA_PATH = "jcr:content/metadata";

    private DamProperties() {
    }

    /** Every value of {@code property}, as text. Empty when the property is absent or blank. */
    public static List<String> read(Resource resource, String property) {
        if (resource == null || StringUtils.isEmpty(property)) {
            return Collections.emptyList();
        }

        String relativePath = property.contains("/") ? property : METADATA_PATH + "/" + property;
        String parentPath = StringUtils.substringBeforeLast(relativePath, "/");
        String name = StringUtils.substringAfterLast(relativePath, "/");

        Resource holder = StringUtils.isEmpty(parentPath) ? resource : resource.getChild(parentPath);
        if (holder == null) {
            return Collections.emptyList();
        }

        ValueMap values = holder.getValueMap();
        String[] multiple = values.get(name, String[].class);
        if (multiple != null) {
            return Arrays.stream(multiple)
                    .filter(StringUtils::isNotBlank)
                    .collect(Collectors.toList());
        }

        String single = values.get(name, String.class);
        return StringUtils.isBlank(single) ? Collections.emptyList() : Collections.singletonList(single);
    }

    /** True when the resource carries {@code property} with at least one of {@code candidates}. */
    public static boolean matchesAny(Resource resource, String property, List<String> candidates) {
        List<String> actual = read(resource, property);
        return actual.stream().anyMatch(value -> candidates.stream().anyMatch(value::equalsIgnoreCase));
    }
}
