package com.adobexp.assetpicker.servlets;

import java.io.IOException;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.adobexp.assetpicker.dto.AssetDto;
import com.adobexp.assetpicker.dto.DirectoryDto;
import com.adobexp.assetpicker.dto.ListingDto;
import com.adobexp.assetpicker.dto.ThumbnailDto;
import com.adobexp.assetpicker.request.PickerRequestParams;
import com.adobexp.assetpicker.services.AssetMapper;
import com.adobexp.assetpicker.services.PickerSearchService;
import com.adobexp.assetpicker.services.PickerSettings;

/**
 * Search: {@code /bin/asset-picker/search.json?path=&q=&page=&pageSize=&fuzzy=&semantic=&sort=&mimetype=&filter.*=}
 *
 * <p>Returns the same envelope as the folder listing so the grid can render either without knowing
 * where the items came from, plus {@code hasNextPage} to drive infinite scroll.
 */
@Component(service = Servlet.class, property = {
        "sling.servlet.paths=" + AbstractPickerServlet.API_ROOT + "/search",
        "sling.servlet.methods=GET",
        "sling.servlet.extensions=json"
})
public class SearchServlet extends AbstractPickerServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient PickerSearchService searchService;

    @Reference
    private transient AssetMapper assetMapper;

    @Reference
    private transient PickerSettings settings;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        PickerRequestParams params = PickerRequestParams.from(request, settings);
        if (!params.isValid()) {
            writeForbiddenPath(response);
            return;
        }

        PickerSearchService.Results results = searchService.search(params, request.getResourceResolver());

        ListingDto listing = new ListingDto(
                params.getPath(),
                params.hasSearchTerm() ? params.getSearchTerm() : params.getPath(),
                true,
                new ThumbnailDto(params.getPath()));

        for (Resource hit : results.getResources()) {
            DirectoryDto directory = assetMapper.toDirectory(hit);
            if (directory != null) {
                listing.add(directory);
                continue;
            }

            AssetDto asset = assetMapper.toAsset(hit, request);
            if (asset != null) {
                listing.add(asset);
            }
        }

        listing.setTotal(results.getTotal());
        listing.setDisplayed(listing.getItems().size());
        listing.setTime(results.getExecutionTimeMillis());
        listing.setHasNextPage(results.hasNextPage());

        writeJson(response, listing);
    }
}
