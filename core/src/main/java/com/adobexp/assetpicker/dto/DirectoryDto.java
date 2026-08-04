package com.adobexp.assetpicker.dto;

/**
 * A folder as it appears inside another folder's listing. Deliberately carries identity and
 * counts only: the SPA fetches a folder's own children when the user navigates into it.
 */
public class DirectoryDto extends ItemDto {

    public static final String TYPE = "directory";

    private final boolean isLeaf;
    private final long childrenCount;
    private final ThumbnailDto thumbnail;

    public DirectoryDto(String path, String name, boolean isLeaf, long childrenCount, ThumbnailDto thumbnail) {
        super(TYPE, path, name);
        this.isLeaf = isLeaf;
        this.childrenCount = childrenCount;
        this.thumbnail = thumbnail;
    }

    public boolean getIsLeaf() {
        return isLeaf;
    }

    public long getChildrenCount() {
        return childrenCount;
    }

    public ThumbnailDto getThumbnail() {
        return thumbnail;
    }
}
