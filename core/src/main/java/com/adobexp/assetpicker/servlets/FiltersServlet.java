package com.adobexp.assetpicker.servlets;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import javax.servlet.Servlet;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.adobexp.assetpicker.dto.FilterDto;
import com.adobexp.assetpicker.request.PickerRequestParams;
import com.adobexp.assetpicker.services.MetadataFilterService;
import com.adobexp.assetpicker.services.PickerSettings;

/**
 * Sidebar filter definitions: {@code /bin/asset-picker/filters.json?path=}
 *
 * <p>Definitions come from the {@link com.adobexp.assetpicker.caconfig.AssetPickerMetadataFilterConfig}
 * Context-Aware Configuration collection, resolved against the browsed folder (so a brand folder tree
 * can override the instance defaults). The selector component also embeds the same list in
 * {@code data-config.filters}; the SPA prefers that and only calls this endpoint as a fallback.
 */
@Component(service = Servlet.class, property = {
        "sling.servlet.paths=" + AbstractPickerServlet.API_ROOT + "/filters",
        "sling.servlet.methods=GET",
        "sling.servlet.extensions=json"
})
public class FiltersServlet extends AbstractPickerServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient PickerSettings settings;

    @Reference
    private transient MetadataFilterService metadataFilterService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        PickerRequestParams params = PickerRequestParams.from(request, settings);
        if (!params.isValid()) {
            writeForbiddenPath(response);
            return;
        }

        ResourceResolver resolver = request.getResourceResolver();
        Resource context = resolver.getResource(params.getPath());
        List<FilterDto> filters = context != null
                ? metadataFilterService.resolveFilters(context, resolver)
                : Collections.emptyList();

        writeJson(response, filters);
    }
}
