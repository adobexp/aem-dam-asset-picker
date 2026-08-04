package com.adobexp.assetpicker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Common shape of everything the picker lists. The {@code type} discriminator is what the
 * SPA switches on to decide between a folder tile and an asset card.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class ItemDto {

    private final String type;
    private final String path;
    private final String name;

    protected ItemDto(String type, String path, String name) {
        this.type = type;
        this.path = path;
        this.name = name;
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
}
