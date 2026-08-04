package com.adobexp.assetpicker.util;

import org.apache.commons.lang3.StringUtils;

/** Brings the paths that arrive from configuration and from the SPA into one comparable form. */
public final class PickerPaths {

    private PickerPaths() {
    }

    /**
     * Trims whitespace and any trailing slash, and unwraps the {@code <parent>|<realPath>} key the
     * SPA uses to cache folders, so that a value from either source can be compared with a root.
     */
    public static String normalise(String path) {
        String trimmed = StringUtils.trimToEmpty(path);
        if (trimmed.contains("|")) {
            trimmed = StringUtils.substringAfterLast(trimmed, "|");
        }
        if (trimmed.length() > 1 && trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    /** Prefix match on whole segments, so {@code /content/dam/brands} never matches {@code brand}. */
    public static boolean isWithin(String path, String root) {
        if (StringUtils.isEmpty(path) || StringUtils.isEmpty(root)) {
            return false;
        }
        return path.equals(root) || path.startsWith(root.endsWith("/") ? root : root + "/");
    }
}
