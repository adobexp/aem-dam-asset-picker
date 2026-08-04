package com.adobexp.assetpicker.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The envelope every listing endpoint returns: the folder that was queried, its items and the
 * query statistics the stats bar renders.
 *
 * <p>{@code hasNextPage} is only meaningful for search, where results are paginated; folder
 * browsing returns a folder's children in one response and omits it.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ListingDto {

    private final String type = DirectoryDto.TYPE;
    private final String path;
    private final String name;
    private final boolean isLeaf;
    private final ThumbnailDto thumbnail;
    private final List<ItemDto> items = new ArrayList<>();

    private long total;
    private long displayed;
    private long time;
    private Boolean hasNextPage;

    public ListingDto(String path, String name, boolean isLeaf, ThumbnailDto thumbnail) {
        this.path = path;
        this.name = name;
        this.isLeaf = isLeaf;
        this.thumbnail = thumbnail;
    }

    public void add(ItemDto item) {
        items.add(item);
    }

    public String getType() {
        return type;
    }

    public String getPath() {
        return path;
    }

    public String getName() {
        return name;
    }

    public boolean getIsLeaf() {
        return isLeaf;
    }

    public ThumbnailDto getThumbnail() {
        return thumbnail;
    }

    public List<ItemDto> getItems() {
        return items;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getDisplayed() {
        return displayed;
    }

    public void setDisplayed(long displayed) {
        this.displayed = displayed;
    }

    public long getTime() {
        return time;
    }

    public void setTime(long time) {
        this.time = time;
    }

    public Boolean getHasNextPage() {
        return hasNextPage;
    }

    public void setHasNextPage(Boolean hasNextPage) {
        this.hasNextPage = hasNextPage;
    }
}
