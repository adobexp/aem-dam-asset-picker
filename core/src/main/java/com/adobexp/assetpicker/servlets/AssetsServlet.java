package com.adobexp.assetpicker.servlets;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.adobexp.assetpicker.dto.AssetDto;
import com.adobexp.assetpicker.dto.DirectoryDto;
import com.adobexp.assetpicker.dto.ItemDto;
import com.adobexp.assetpicker.dto.ListingDto;
import com.adobexp.assetpicker.dto.ThumbnailDto;
import com.adobexp.assetpicker.request.PickerRequestParams;
import com.adobexp.assetpicker.services.AssetMapper;
import com.adobexp.assetpicker.services.PickerSettings;
import com.adobexp.assetpicker.util.DamProperties;

/**
 * Folder listing: {@code /bin/asset-picker/assets.json?path=&sort=&sortOrder=&mimetype=&filter.*=}
 *
 * <p>Browsing reads the folder's children directly rather than going through the query index, so a
 * freshly uploaded asset shows up immediately and the response reflects exactly what the caller is
 * allowed to see.
 */
@Component(service = Servlet.class, property = {
        "sling.servlet.paths=" + AbstractPickerServlet.API_ROOT + "/assets",
        "sling.servlet.methods=GET",
        "sling.servlet.extensions=json"
})
public class AssetsServlet extends AbstractPickerServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient AssetMapper assetMapper;

    @Reference
    private transient PickerSettings settings;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        long started = System.currentTimeMillis();
        PickerRequestParams params = PickerRequestParams.from(request, settings);

        if (!params.isValid()) {
            writeForbiddenPath(response);
            return;
        }

        Resource folder = request.getResourceResolver().getResource(params.getPath());
        if (folder == null) {
            writeError(response, HttpServletResponse.SC_NOT_FOUND, "No such folder: " + params.getPath());
            return;
        }

        List<Entry> folders = new ArrayList<>();
        List<Entry> assets = new ArrayList<>();

        for (Resource child : folder.getChildren()) {
            DirectoryDto directory = assetMapper.toDirectory(child);
            if (directory != null) {
                if (params.isIncludeFolders()) {
                    folders.add(new Entry(child, directory));
                }
                continue;
            }

            if (!params.isIncludeAssets()) {
                continue;
            }

            AssetDto asset = assetMapper.toAsset(child, request);
            if (asset != null && matches(child, asset, params)) {
                assets.add(new Entry(child, asset));
            }
        }

        sort(folders, params);
        sort(assets, params);

        ListingDto listing = listingFor(folder);
        // Folders first: both the tree and the grid render this order as given.
        folders.forEach(entry -> listing.add(entry.item));
        assets.forEach(entry -> listing.add(entry.item));

        listing.setTotal(listing.getItems().size());
        listing.setDisplayed(listing.getItems().size());
        listing.setTime(System.currentTimeMillis() - started);

        writeJson(response, listing);
    }

    private ListingDto listingFor(Resource folder) {
        DirectoryDto self = assetMapper.toDirectory(folder);
        if (self == null) {
            return new ListingDto(folder.getPath(), folder.getName(), true, new ThumbnailDto(folder.getPath()));
        }
        return new ListingDto(self.getPath(), self.getName(), self.getIsLeaf(), self.getThumbnail());
    }

    /**
     * Mime type and metadata restrictions from the picker URL are applied here rather than in a
     * query, because browsing never runs one.
     */
    private static boolean matches(Resource resource, AssetDto asset, PickerRequestParams params) {
        List<String> mimeTypes = params.getMimeTypes();
        if (!mimeTypes.isEmpty() && !mimeTypes.contains(asset.getMime())) {
            return false;
        }

        for (Map.Entry<String, List<String>> filter : params.getMetadataFilters().entrySet()) {
            if (!DamProperties.matchesAny(resource, filter.getKey(), filter.getValue())) {
                return false;
            }
        }

        for (String required : params.getRequiredProperties()) {
            if (DamProperties.read(resource, required).isEmpty()) {
                return false;
            }
        }

        return true;
    }

    private static void sort(List<Entry> entries, PickerRequestParams params) {
        String sortProperty = params.getSortProperty();
        Comparator<Entry> comparator = Comparator.comparing(entry -> sortKey(entry, sortProperty));
        entries.sort(params.isSortDescending() ? comparator.reversed() : comparator);
    }

    /** Falls back to the display name whenever the requested sort property is absent. */
    private static String sortKey(Entry entry, String sortProperty) {
        if (StringUtils.isNotEmpty(sortProperty)) {
            List<String> values = DamProperties.read(entry.resource, sortProperty);
            if (!values.isEmpty()) {
                return StringUtils.lowerCase(values.get(0));
            }
        }
        return StringUtils.lowerCase(StringUtils.defaultString(entry.item.getName()));
    }

    /** Pairs a mapped item with its resource so sorting and filtering can read raw properties. */
    private static final class Entry {

        private final Resource resource;
        private final ItemDto item;

        Entry(Resource resource, ItemDto item) {
            this.resource = resource;
            this.item = item;
        }
    }
}
