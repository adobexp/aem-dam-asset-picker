package com.adobexp.assetpicker.dto;

public class ResolutionDto {

    private final long width;
    private final long height;
    private final long dpi;
    private final String dimensions;

    public ResolutionDto(long width, long height, long dpi) {
        this.width = width;
        this.height = height;
        this.dpi = dpi;
        this.dimensions = width > 0 && height > 0 ? width + " x " + height : "";
    }

    public long getWidth() {
        return width;
    }

    public long getHeight() {
        return height;
    }

    public long getDpi() {
        return dpi;
    }

    public String getDimensions() {
        return dimensions;
    }
}
