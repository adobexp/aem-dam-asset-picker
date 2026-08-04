package com.adobexp.assetpicker.services.impl;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

import com.adobexp.assetpicker.services.PickerSettings;
import com.adobexp.assetpicker.util.PickerPaths;

@Component(service = PickerSettings.class)
@Designate(ocd = PickerSettingsImpl.Config.class)
public class PickerSettingsImpl implements PickerSettings {

    private static final String DAM_ROOT = "/content/dam";

    private static final String DEFAULT_FILTERS_CONFIG_PATH = "/conf/asset-picker/settings/asset-picker/filters";

    private List<String> allowedRoots;
    private String defaultRoot;
    private int defaultPageSize;
    private int maxPageSize;
    private boolean semanticSearchEnabled;
    private String filtersConfigPath;

    @Activate
    protected void activate(Config config) {
        this.allowedRoots = normaliseRoots(config.allowedRoots());
        this.defaultRoot = PickerPaths.normalise(config.defaultRoot());
        this.defaultPageSize = Math.max(1, config.defaultPageSize());
        this.maxPageSize = Math.max(this.defaultPageSize, config.maxPageSize());
        this.semanticSearchEnabled = config.semanticSearchEnabled();
        this.filtersConfigPath = PickerPaths.normalise(config.filtersConfigPath());
    }

    @Override
    public List<String> getAllowedRoots() {
        return allowedRoots;
    }

    @Override
    public String getDefaultRoot() {
        return defaultRoot;
    }

    @Override
    public int getDefaultPageSize() {
        return defaultPageSize;
    }

    @Override
    public int getMaxPageSize() {
        return maxPageSize;
    }

    @Override
    public boolean isSemanticSearchEnabled() {
        return semanticSearchEnabled;
    }

    @Override
    public String getFiltersConfigPath() {
        return filtersConfigPath;
    }

    @Override
    public boolean isAllowed(String path) {
        String candidate = PickerPaths.normalise(path);
        if (StringUtils.isEmpty(candidate) || candidate.contains("..")) {
            return false;
        }
        // Everything the picker can reach must live under /content/dam, whatever the allowlist says.
        if (!PickerPaths.isWithin(candidate, DAM_ROOT)) {
            return false;
        }
        return allowedRoots.stream().anyMatch(root -> PickerPaths.isWithin(candidate, root));
    }

    private static List<String> normaliseRoots(String[] roots) {
        if (roots == null || roots.length == 0) {
            return Collections.singletonList(DAM_ROOT);
        }
        List<String> normalised = Arrays.stream(roots)
                .map(PickerPaths::normalise)
                .filter(StringUtils::isNotEmpty)
                .collect(Collectors.toList());
        return normalised.isEmpty() ? Collections.singletonList(DAM_ROOT) : Collections.unmodifiableList(normalised);
    }

    @ObjectClassDefinition(name = "AEM DAM Asset Picker - Settings",
            description = "Guard rails and defaults for the bespoke Asset Picker APIs")
    public @interface Config {

        @AttributeDefinition(name = "Allowed roots",
                description = "DAM paths the picker may read. A root requested on the picker URL must sit inside one of these.")
        String[] allowedRoots() default {DAM_ROOT};

        @AttributeDefinition(name = "Default root",
                description = "Root used when the host page does not pass one")
        String defaultRoot() default DAM_ROOT;

        @AttributeDefinition(name = "Default page size",
                description = "Search page size applied when the request does not specify one")
        int defaultPageSize() default 100;

        @AttributeDefinition(name = "Maximum page size",
                description = "Hard ceiling on the page size a request may ask for")
        int maxPageSize() default 500;

        @AttributeDefinition(name = "Enable broad search",
                description = "Allow requests to broaden a search from an all-words to an any-word match")
        boolean semanticSearchEnabled() default true;

        @AttributeDefinition(name = "Filter definitions path",
                description = "Fallback location of the sidebar filter definitions, used when the browsed "
                        + "folder has no context-aware configuration of its own")
        String filtersConfigPath() default DEFAULT_FILTERS_CONFIG_PATH;
    }
}
