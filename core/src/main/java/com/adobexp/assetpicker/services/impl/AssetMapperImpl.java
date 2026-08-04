package com.adobexp.assetpicker.services.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.adobexp.assetpicker.dto.AssetDto;
import com.adobexp.assetpicker.dto.DirectoryDto;
import com.adobexp.assetpicker.dto.MetadataDto;
import com.adobexp.assetpicker.dto.ResolutionDto;
import com.adobexp.assetpicker.dto.ThumbnailDto;
import com.adobexp.assetpicker.services.AssetMapper;
import com.adobexp.assetpicker.util.DamNodeTypes;
import com.day.cq.commons.Externalizer;
import com.day.cq.commons.jcr.JcrConstants;
import com.day.cq.dam.api.Asset;

@Component(service = AssetMapper.class)
public class AssetMapperImpl implements AssetMapper {

    /** DAM servlet that renders a square thumbnail for any asset, generating it on demand. */
    private static final String THUMBNAIL_SELECTOR = ".thumb.319.319.png";

    private static final String FOLDER_THUMBNAIL_SELECTOR = ".folderthumbnail.jpg";

    private static final String METADATA_PATH = "jcr:content/metadata";

    /**
     * Metadata surfaced on the cards, in display order. Anything outside this list stays out of
     * the listing payload unless {@link #toAsset(Resource, SlingHttpServletRequest, Collection)}
     * asks for extra Quick View properties.
     */
    private static final Map<String, String> CARD_METADATA = new LinkedHashMap<>();

    static {
        CARD_METADATA.put("dam:assetType", "Asset type");
        CARD_METADATA.put("dc:publisher", "Brand");
        CARD_METADATA.put("dam:status", "Status");
        CARD_METADATA.put("dc:description", "Description");
    }

    @Reference
    private Externalizer externalizer;

    @Override
    public AssetDto toAsset(Resource resource, SlingHttpServletRequest request) {
        return toAsset(resource, request, Collections.emptyList());
    }

    @Override
    public AssetDto toAsset(Resource resource, SlingHttpServletRequest request,
                            Collection<String> extraMetadataProperties) {
        Asset asset = resource == null ? null : resource.adaptTo(Asset.class);
        if (asset == null) {
            return null;
        }

        ValueMap metadata = metadata(resource);
        String mime = StringUtils.defaultString(asset.getMimeType());
        String path = asset.getPath();

        return AssetDto.builder()
                .path(path)
                .name(asset.getName())
                .mime(mime)
                .title(title(metadata, asset.getName()))
                .size(humanReadableSize(metadata.get("dam:size", 0L)))
                .url(externalUrl(path, request))
                .thumbnail(new ThumbnailDto(thumbnailUrl(path, mime)))
                .resolution(resolution(metadata))
                .originalDownloadUrl(path)
                .renditionDownloadUrl(path)
                .metadata(cardMetadata(metadata, extraMetadataProperties))
                .build();
    }

    @Override
    public DirectoryDto toDirectory(Resource resource) {
        if (resource == null || !isFolder(resource)) {
            return null;
        }

        long childFolders = countChildFolders(resource);
        return new DirectoryDto(
                resource.getPath(),
                folderTitle(resource),
                childFolders == 0,
                childFolders,
                new ThumbnailDto(resource.getPath() + FOLDER_THUMBNAIL_SELECTOR));
    }

    private static boolean isFolder(Resource resource) {
        return DamNodeTypes.isFolder(resource);
    }

    /**
     * SVG and WebP thumbnails are frequently missing on instances where the rendition workflow has
     * not run, and browsers render both formats directly, so those point at the original.
     */
    private static String thumbnailUrl(String path, String mime) {
        if ("image/svg+xml".equalsIgnoreCase(mime) || "image/webp".equalsIgnoreCase(mime)) {
            return path;
        }
        return path + THUMBNAIL_SELECTOR;
    }

    private String externalUrl(String path, SlingHttpServletRequest request) {
        if (externalizer == null || request == null) {
            return path;
        }
        try {
            return externalizer.externalLink(request.getResourceResolver(), Externalizer.PUBLISH, path);
        } catch (IllegalArgumentException error) {
            // No externalizer mapping in this environment; a repository path still resolves
            // relative to the host that served the picker.
            return path;
        }
    }

    private static ValueMap metadata(Resource resource) {
        Resource metadata = resource.getChild(METADATA_PATH);
        return metadata == null ? ValueMap.EMPTY : metadata.getValueMap();
    }

    private static String title(ValueMap metadata, String fallback) {
        String title = metadata.get("dc:title", String.class);
        return StringUtils.isNotBlank(title) ? title : fallback;
    }

    private static String folderTitle(Resource resource) {
        Resource content = resource.getChild(JcrConstants.JCR_CONTENT);
        String title = content == null ? null : content.getValueMap().get("jcr:title", String.class);
        return StringUtils.isNotBlank(title) ? title : resource.getName();
    }

    private static ResolutionDto resolution(ValueMap metadata) {
        long width = metadata.get("tiff:ImageWidth", metadata.get("exif:PixelXDimension", 0L));
        long height = metadata.get("tiff:ImageLength", metadata.get("exif:PixelYDimension", 0L));
        long dpi = metadata.get("dam:Physicalwidthindpi", 0L);
        return new ResolutionDto(width, height, dpi);
    }

    private static List<MetadataDto> cardMetadata(ValueMap metadata, Collection<String> extraProperties) {
        Map<String, String> properties = new LinkedHashMap<>(CARD_METADATA);
        if (extraProperties != null) {
            for (String property : extraProperties) {
                if (StringUtils.isBlank(property) || QuickViewMetadataServiceImpl.isBuiltIn(property)) {
                    continue;
                }
                properties.putIfAbsent(property, property);
            }
        }

        List<MetadataDto> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        properties.forEach((property, label) -> {
            if (!seen.add(property)) {
                return;
            }
            String value = readAsText(metadata, property);
            if (StringUtils.isNotBlank(value)) {
                rows.add(new MetadataDto(label, value, property));
            }
        });
        return rows;
    }

    /** Multi-value metadata (keywords, statuses) is joined rather than dropped. */
    private static String readAsText(ValueMap metadata, String property) {
        String[] values = metadata.get(property, String[].class);
        if (values != null) {
            return String.join(", ", values);
        }
        return metadata.get(property, String.class);
    }

    private static long countChildFolders(Resource resource) {
        long count = 0;
        for (Resource child : resource.getChildren()) {
            if (isFolder(child)) {
                count++;
            }
        }
        return count;
    }

    static String humanReadableSize(long bytes) {
        if (bytes <= 0) {
            return "0 B";
        }
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unit = Math.min((int) (Math.log10(bytes) / 3), units.length - 1);
        if (unit == 0) {
            return bytes + " B";
        }
        return String.format("%.1f %s", bytes / Math.pow(1000, unit), units[unit]);
    }
}
