package com.adobexp.assetpicker.servlets;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletResponse;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.adobexp.assetpicker.dto.AssetDto;
import com.adobexp.assetpicker.dto.QuickViewFieldDto;
import com.adobexp.assetpicker.request.PickerRequestParams;
import com.adobexp.assetpicker.services.AssetMapper;
import com.adobexp.assetpicker.services.PickerSettings;
import com.adobexp.assetpicker.services.QuickViewMetadataService;
import com.adobexp.assetpicker.services.impl.QuickViewMetadataServiceImpl;

/**
 * Single asset detail: {@code /bin/asset-picker/asset.json?path=}
 *
 * <p>Feeds the quick view, which needs the full metadata for one asset rather than the trimmed
 * version carried in a listing. Extra metadata properties come from the Quick View CA-config
 * collection resolved against the asset (or its parent folder).
 */
@Component(service = Servlet.class, property = {
        "sling.servlet.paths=" + AbstractPickerServlet.API_ROOT + "/asset",
        "sling.servlet.methods=GET",
        "sling.servlet.extensions=json"
})
public class AssetServlet extends AbstractPickerServlet {

    private static final long serialVersionUID = 1L;

    @Reference
    private transient AssetMapper assetMapper;

    @Reference
    private transient PickerSettings settings;

    @Reference
    private transient QuickViewMetadataService quickViewMetadataService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        PickerRequestParams params = PickerRequestParams.from(request, settings);
        if (!params.isValid()) {
            writeForbiddenPath(response);
            return;
        }

        ResourceResolver resolver = request.getResourceResolver();
        Resource resource = resolver.getResource(params.getPath());
        List<String> extraProps = resolveExtraMetadataProperties(resource, resolver);
        AssetDto asset = assetMapper.toAsset(resource, request, extraProps);

        if (asset == null) {
            writeError(response, HttpServletResponse.SC_NOT_FOUND, "No such asset: " + params.getPath());
            return;
        }

        writeJson(response, asset);
    }

    private List<String> resolveExtraMetadataProperties(Resource assetResource, ResourceResolver resolver) {
        if (quickViewMetadataService == null || assetResource == null) {
            return Collections.emptyList();
        }
        Resource context = assetResource.getParent() != null ? assetResource.getParent() : assetResource;
        List<QuickViewFieldDto> fields = quickViewMetadataService.resolveFields(context, resolver);
        if (fields.isEmpty()) {
            Resource fallback = resolver.getResource("/content/asset-picker");
            if (fallback != null) {
                fields = quickViewMetadataService.resolveFields(fallback, resolver);
            }
        }
        if (fields.isEmpty()) {
            return Collections.emptyList();
        }
        return fields.stream()
                .map(QuickViewFieldDto::getId)
                .filter(id -> !QuickViewMetadataServiceImpl.isBuiltIn(id))
                .collect(Collectors.toList());
    }
}
