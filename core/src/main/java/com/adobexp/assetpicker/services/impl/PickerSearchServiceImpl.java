package com.adobexp.assetpicker.services.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import javax.jcr.Session;

import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobexp.assetpicker.request.PickerRequestParams;
import com.adobexp.assetpicker.services.PickerSearchService;
import com.adobexp.assetpicker.util.DamNodeTypes;
import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;

@Component(service = PickerSearchService.class)
public class PickerSearchServiceImpl implements PickerSearchService {

    private static final Logger LOG = LoggerFactory.getLogger(PickerSearchServiceImpl.class);

    private static final String METADATA_RELATIVE_PATH = "jcr:content/metadata";

    @Reference
    private QueryBuilder queryBuilder;

    @Override
    public Results search(PickerRequestParams params, ResourceResolver resolver) {
        Session session = resolver.adaptTo(Session.class);
        if (session == null) {
            LOG.warn("Cannot search the DAM: the resolver did not adapt to a JCR session");
            return new Results(new ArrayList<>(), 0, false, 0);
        }

        long started = System.currentTimeMillis();
        Query query = queryBuilder.createQuery(PredicateGroup.create(buildPredicates(params)), session);

        // One extra hit tells us whether another page exists without a second count query.
        query.setStart(params.getOffset());
        query.setHitsPerPage((long) params.getPageSize() + 1);

        SearchResult result = query.getResult();
        List<Hit> hits = result.getHits();

        List<Resource> resources = new ArrayList<>();
        int limit = Math.min(hits.size(), params.getPageSize());
        for (int index = 0; index < limit; index++) {
            Resource resource = toResource(hits.get(index), resolver);
            if (resource != null) {
                resources.add(resource);
            }
        }

        boolean hasNextPage = hits.size() > params.getPageSize();
        long total = result.getTotalMatches();
        long elapsed = System.currentTimeMillis() - started;

        return new Results(resources, total, hasNextPage, elapsed);
    }

    private static Resource toResource(Hit hit, ResourceResolver resolver) {
        try {
            return resolver.getResource(hit.getPath());
        } catch (Exception error) {
            LOG.debug("Skipping a hit that could not be resolved", error);
            return null;
        }
    }

    private static Map<String, String> buildPredicates(PickerRequestParams params) {
        Map<String, String> predicates = new HashMap<>();
        predicates.put("path", params.getPath());
        predicates.put("p.guessTotal", "true");

        // QueryBuilder identifies repeated predicates of the same kind by a numeric prefix, so the
        // mime, asset type, required and metadata restrictions all draw from one counter.
        AtomicInteger predicateIndex = new AtomicInteger(1);

        applyTypes(predicates, params);
        applyFullText(predicates, params);
        applyValues(predicates, predicateIndex, METADATA_RELATIVE_PATH + "/dc:format", params.getMimeTypes());
        applyValues(predicates, predicateIndex, METADATA_RELATIVE_PATH + "/dam:assetType", params.getAssetTypes());
        applyRequiredProperties(predicates, predicateIndex, params);
        applyMetadataFilters(predicates, predicateIndex, params);
        applyMetadataRanges(predicates, predicateIndex, params);
        applySort(predicates, params);

        return predicates;
    }

    /**
     * Folders and assets are different node types, so a mixed listing needs a type group rather
     * than a single {@code type} predicate.
     */
    private static void applyTypes(Map<String, String> predicates, PickerRequestParams params) {
        if (params.isIncludeAssets() && !params.isIncludeFolders()) {
            predicates.put("type", DamNodeTypes.ASSET);
            return;
        }

        List<String> types = new ArrayList<>();
        if (params.isIncludeAssets()) {
            types.add(DamNodeTypes.ASSET);
        }
        types.addAll(DamNodeTypes.FOLDERS);

        predicates.put("group.p.or", "true");
        for (int index = 0; index < types.size(); index++) {
            predicates.put("group." + (index + 1) + "_type", types.get(index));
        }
    }

    private static void applyFullText(Map<String, String> predicates, PickerRequestParams params) {
        if (!params.hasSearchTerm()) {
            return;
        }

        String term = escapeFullText(params.getSearchTerm());
        if (StringUtils.isEmpty(term)) {
            return;
        }

        predicates.put("fulltext", expandTerm(term, params.isFuzzy(), params.isSemantic()));
    }

    /**
     * Rewrites the search term for the two recall toggles the picker exposes.
     *
     * <p>Semantic prefixes the term with {@code ?{}?} so Oak/Query Builder runs a semantic
     * (vector) full-text query. Fuzzy appends Lucene's {@code ~} to the whole phrase for
     * approximate matching. Both may apply at once: {@code ?{}?Boy playing football~}.
     *
     * <p>Operator characters are added after {@link #escapeFullText(String)} so user input cannot
     * inject them, while the intentional semantic/fuzzy markers still reach the index.
     */
    private static String expandTerm(String term, boolean fuzzy, boolean semantic) {
        if (StringUtils.isEmpty(term)) {
            return term;
        }

        String expanded = term;
        if (semantic) {
            expanded = "?{}?" + expanded;
        }
        if (fuzzy) {
            expanded = expanded + "~";
        }
        return expanded;
    }

    /**
     * Strips the characters Oak's full-text parser treats as operators. The term reaches the index
     * as literal words, so a stray quote or bracket cannot change the query's meaning.
     */
    private static String escapeFullText(String term) {
        return term.replaceAll("[\\\\/\\[\\]{}()!*?:^\"~+&|-]", " ").replaceAll("\\s+", " ").trim();
    }

    /**
     * One property predicate restricting {@code property} to any of {@code values}. Values inside a
     * single predicate are an OR; separate predicates AND together, which is what the picker's
     * "narrow by mime type and by brand" semantics call for.
     */
    private static void applyValues(Map<String, String> predicates, AtomicInteger predicateIndex,
                                    String property, List<String> values) {
        if (values.isEmpty()) {
            return;
        }

        String prefix = predicateIndex.getAndIncrement() + "_property";
        predicates.put(prefix, property);

        AtomicInteger valueIndex = new AtomicInteger(1);
        values.forEach(value -> predicates.put(prefix + "." + valueIndex.getAndIncrement() + "_value", value));
    }

    /** {@code requiredproperty} narrows results to assets that actually carry the property. */
    private static void applyRequiredProperties(Map<String, String> predicates, AtomicInteger predicateIndex,
                                                PickerRequestParams params) {
        params.getRequiredProperties().forEach(property -> {
            String prefix = predicateIndex.getAndIncrement() + "_property";
            predicates.put(prefix, relativeProperty(property));
            predicates.put(prefix + ".operation", "exists");
        });
    }

    private static void applyMetadataFilters(Map<String, String> predicates, AtomicInteger predicateIndex,
                                             PickerRequestParams params) {
        params.getMetadataFilters()
                .forEach((property, values) -> applyValues(predicates, predicateIndex, relativeProperty(property), values));
    }

    /**
     * Date-range filters arrive as {@code range.<property>=from..to}. Either bound may be blank.
     * QueryBuilder's {@code daterange} predicate accepts ISO dates on {@code lowerBound}/{@code upperBound}.
     */
    private static void applyMetadataRanges(Map<String, String> predicates, AtomicInteger predicateIndex,
                                            PickerRequestParams params) {
        params.getMetadataRanges().forEach((property, encoded) -> {
            if (StringUtils.isBlank(encoded)) {
                return;
            }
            int separator = encoded.indexOf("..");
            String from = separator >= 0 ? encoded.substring(0, separator).trim() : encoded.trim();
            String to = separator >= 0 ? encoded.substring(separator + 2).trim() : "";
            if (StringUtils.isBlank(from) && StringUtils.isBlank(to)) {
                return;
            }

            String prefix = predicateIndex.getAndIncrement() + "_daterange";
            predicates.put(prefix + ".property", relativeProperty(property));
            if (StringUtils.isNotBlank(from)) {
                predicates.put(prefix + ".lowerBound", from);
            }
            if (StringUtils.isNotBlank(to)) {
                predicates.put(prefix + ".upperBound", to);
            }
        });
    }

    /**
     * Accepts both a bare metadata property (`dc:title`) and a full relative path
     * (`jcr:content/metadata/dc:title`), since the host page URL may carry either.
     */
    private static String relativeProperty(String property) {
        return property.contains("/") ? property : METADATA_RELATIVE_PATH + "/" + property;
    }

    private static void applySort(Map<String, String> predicates, PickerRequestParams params) {
        String sortProperty = params.getSortProperty();
        if (StringUtils.isEmpty(sortProperty)) {
            return;
        }

        predicates.put("orderby", "@" + relativeProperty(sortProperty));
        predicates.put("orderby.sort", params.isSortDescending() ? "desc" : "asc");
    }
}
