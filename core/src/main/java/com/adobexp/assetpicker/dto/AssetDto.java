package com.adobexp.assetpicker.dto;

import java.util.List;

/**
 * An asset card. {@code url}, {@code title}, {@code size} and {@code type} (the mime type) are
 * the fields the picker hands back to the host page, so they are always populated.
 */
public class AssetDto extends ItemDto {

    public static final String TYPE = "asset";

    private final String mime;
    private final String title;
    private final String size;
    private final String url;
    private final ThumbnailDto thumbnail;
    private final ResolutionDto resolution;
    private final String originalDownloadUrl;
    private final String renditionDownloadUrl;
    private final List<MetadataDto> metadata;

    // The picker has no cart, share or download affordances; the flags stay in the payload so a
    // consumer written against the design-system browser keeps working.
    private final boolean downloadEnabled = false;
    private final boolean shareEnabled = false;
    private final boolean cartEnabled = false;

    private AssetDto(Builder builder) {
        super(TYPE, builder.path, builder.name);
        this.mime = builder.mime;
        this.title = builder.title;
        this.size = builder.size;
        this.url = builder.url;
        this.thumbnail = builder.thumbnail;
        this.resolution = builder.resolution;
        this.originalDownloadUrl = builder.originalDownloadUrl;
        this.renditionDownloadUrl = builder.renditionDownloadUrl;
        this.metadata = builder.metadata;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getMime() {
        return mime;
    }

    public String getTitle() {
        return title;
    }

    public String getSize() {
        return size;
    }

    public String getUrl() {
        return url;
    }

    public ThumbnailDto getThumbnail() {
        return thumbnail;
    }

    public ResolutionDto getResolution() {
        return resolution;
    }

    public String getOriginalDownloadUrl() {
        return originalDownloadUrl;
    }

    public String getRenditionDownloadUrl() {
        return renditionDownloadUrl;
    }

    public List<MetadataDto> getMetadata() {
        return metadata;
    }

    public boolean isDownloadEnabled() {
        return downloadEnabled;
    }

    public boolean isShareEnabled() {
        return shareEnabled;
    }

    public boolean isCartEnabled() {
        return cartEnabled;
    }

    public static final class Builder {

        private String path;
        private String name;
        private String mime;
        private String title;
        private String size;
        private String url;
        private ThumbnailDto thumbnail;
        private ResolutionDto resolution;
        private String originalDownloadUrl;
        private String renditionDownloadUrl;
        private List<MetadataDto> metadata;

        public Builder path(String value) {
            this.path = value;
            return this;
        }

        public Builder name(String value) {
            this.name = value;
            return this;
        }

        public Builder mime(String value) {
            this.mime = value;
            return this;
        }

        public Builder title(String value) {
            this.title = value;
            return this;
        }

        public Builder size(String value) {
            this.size = value;
            return this;
        }

        public Builder url(String value) {
            this.url = value;
            return this;
        }

        public Builder thumbnail(ThumbnailDto value) {
            this.thumbnail = value;
            return this;
        }

        public Builder resolution(ResolutionDto value) {
            this.resolution = value;
            return this;
        }

        public Builder originalDownloadUrl(String value) {
            this.originalDownloadUrl = value;
            return this;
        }

        public Builder renditionDownloadUrl(String value) {
            this.renditionDownloadUrl = value;
            return this;
        }

        public Builder metadata(List<MetadataDto> value) {
            this.metadata = value;
            return this;
        }

        public AssetDto build() {
            return new AssetDto(this);
        }
    }
}
