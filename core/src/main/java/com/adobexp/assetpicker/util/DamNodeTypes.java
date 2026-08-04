package com.adobexp.assetpicker.util;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.apache.sling.api.resource.Resource;

/**
 * The node types a DAM tree is built from.
 *
 * <p>Folders come in three flavours depending on how they were created: the touch UI makes
 * {@code sling:OrderedFolder}, older tooling and package installs make {@code sling:Folder}, and a
 * plain JCR import makes {@code nt:folder}. All three must browse identically.
 */
public final class DamNodeTypes {

    public static final String ASSET = "dam:Asset";

    public static final String ORDERED_FOLDER = "sling:OrderedFolder";

    public static final String FOLDER = "sling:Folder";

    public static final String NT_FOLDER = "nt:folder";

    public static final List<String> FOLDERS =
            Collections.unmodifiableList(Arrays.asList(ORDERED_FOLDER, FOLDER, NT_FOLDER));

    private DamNodeTypes() {
    }

    public static boolean isFolder(Resource resource) {
        return resource != null && FOLDERS.stream().anyMatch(resource::isResourceType);
    }
}
