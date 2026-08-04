package com.adobexp.assetpicker.services;

import java.util.List;

import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;

import com.adobexp.assetpicker.request.PickerRequestParams;

/** Runs the picker's DAM queries and reports what the stats bar and pagination need. */
public interface PickerSearchService {

    /** One page of hits plus the totals needed to decide whether to keep scrolling. */
    final class Results {

        private final List<Resource> resources;
        private final long total;
        private final boolean hasNextPage;
        private final long executionTimeMillis;

        public Results(List<Resource> resources, long total, boolean hasNextPage, long executionTimeMillis) {
            this.resources = resources;
            this.total = total;
            this.hasNextPage = hasNextPage;
            this.executionTimeMillis = executionTimeMillis;
        }

        public List<Resource> getResources() {
            return resources;
        }

        public long getTotal() {
            return total;
        }

        public boolean hasNextPage() {
            return hasNextPage;
        }

        public long getExecutionTimeMillis() {
            return executionTimeMillis;
        }
    }

    Results search(PickerRequestParams params, ResourceResolver resolver);
}
