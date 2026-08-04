package com.adobexp.assetpicker.services;

import java.util.List;

/** Instance-wide guard rails for the picker, configurable per environment through OSGi. */
public interface PickerSettings {

    /**
     * DAM paths the picker is permitted to read. A {@code root} on the picker URL is only
     * honoured when it sits inside one of these.
     */
    List<String> getAllowedRoots();

    /** Root used when the host page does not ask for one. */
    String getDefaultRoot();

    /** Page size applied when the request does not specify one. */
    int getDefaultPageSize();

    /** Hard ceiling on {@code pageSize}, so a crafted URL cannot ask for the whole DAM. */
    int getMaxPageSize();

    /** Whether {@code semantic=true} may prefix the full-text term with {@code ?{}?} for semantic search. */
    boolean isSemanticSearchEnabled();

    /**
     * Where to read the sidebar filter definitions when the browsed folder has no context-aware
     * configuration of its own.
     */
    String getFiltersConfigPath();

    /**
     * True when {@code path} is inside one of the allowed roots and therefore safe to query.
     */
    boolean isAllowed(String path);
}
