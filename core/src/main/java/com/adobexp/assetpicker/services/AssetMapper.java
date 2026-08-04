package com.adobexp.assetpicker.services;

import java.util.Collection;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.Resource;

import com.adobexp.assetpicker.dto.AssetDto;
import com.adobexp.assetpicker.dto.DirectoryDto;

/** Turns DAM resources into the payloads the picker SPA and its host pages consume. */
public interface AssetMapper {

    /** Maps a {@code dam:Asset} resource, or returns {@code null} when it is not an asset. */
    AssetDto toAsset(Resource resource, SlingHttpServletRequest request);

    /**
     * Maps a {@code dam:Asset} and merges additional metadata properties (e.g. Quick View CA
     * fields) into the payload alongside the default card metadata.
     */
    AssetDto toAsset(Resource resource, SlingHttpServletRequest request, Collection<String> extraMetadataProperties);

    /** Maps a DAM folder resource, or returns {@code null} when it is not a folder. */
    DirectoryDto toDirectory(Resource resource);
}
