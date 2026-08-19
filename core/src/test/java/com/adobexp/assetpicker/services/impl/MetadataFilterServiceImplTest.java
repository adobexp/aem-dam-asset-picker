package com.adobexp.assetpicker.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.adobexp.assetpicker.dto.FilterDto;

class MetadataFilterServiceImplTest {

    @Test
    void parseCascadeValues_readsParentChildAndOptionalLabel() {
        Map<String, List<FilterDto.ValueDto>> result = MetadataFilterServiceImpl.parseCascadeValues(new String[] {
                "agency-a=client-x=Client X",
                "agency-a=client-y",
                "agency-b=client-z=Client Z",
                "",
                "broken",
                "=missing-parent=Nope"
        });

        assertEquals(2, result.size());
        assertEquals(2, result.get("agency-a").size());
        assertEquals("client-x", result.get("agency-a").get(0).getId());
        assertEquals("Client X", result.get("agency-a").get(0).getName());
        assertEquals("client-y", result.get("agency-a").get(1).getId());
        assertEquals("client-y", result.get("agency-a").get(1).getName());
        assertEquals("client-z", result.get("agency-b").get(0).getId());
        assertEquals("Client Z", result.get("agency-b").get(0).getName());
    }

    @Test
    void parseCascadeValues_deduplicatesTheSameParentChildPair() {
        Map<String, List<FilterDto.ValueDto>> result = MetadataFilterServiceImpl.parseCascadeValues(new String[] {
                "agency-a=client-x=First",
                "agency-a=client-x=Second"
        });

        assertEquals(1, result.get("agency-a").size());
        assertEquals("First", result.get("agency-a").get(0).getName());
    }

    @Test
    void flattenCategoryValues_keepsFirstOccurrenceOfEachChild() {
        Map<String, List<FilterDto.ValueDto>> categoryValues = MetadataFilterServiceImpl.parseCascadeValues(
                new String[] {
                        "agency-a=shared=Shared A",
                        "agency-b=shared=Shared B",
                        "agency-b=unique=Unique"
                });

        List<FilterDto.ValueDto> flattened = MetadataFilterServiceImpl.flattenCategoryValues(categoryValues);
        assertEquals(2, flattened.size());
        assertEquals("shared", flattened.get(0).getId());
        assertEquals("Shared A", flattened.get(0).getName());
        assertEquals("unique", flattened.get(1).getId());
    }

    @Test
    void parseCascadeValues_emptyInputIsEmptyMap() {
        assertTrue(MetadataFilterServiceImpl.parseCascadeValues(null).isEmpty());
        assertTrue(MetadataFilterServiceImpl.parseCascadeValues(new String[0]).isEmpty());
    }

    @Test
    void parentKeysForListPage_includesSlugAndTitle() {
        List<String> keys = MetadataFilterServiceImpl.parentKeysForListPage(
                "agency-a", null, null, "Agency A", null);
        assertEquals(2, keys.size());
        assertEquals("agency-a", keys.get(0));
        assertEquals("Agency A", keys.get(1));
    }

    @Test
    void normalisePropertyPath_stripsLeadingDotSlash() {
        assertEquals(
                "jcr:content/metadata/adobexp:studio-agency",
                MetadataFilterServiceImpl.normalisePropertyPath("./jcr:content/metadata/adobexp:studio-agency"));
        assertEquals(
                "jcr:content/metadata/adobexp:studio-agency",
                MetadataFilterServiceImpl.normalisePropertyPath("jcr:content/metadata/adobexp:studio-agency"));
    }
}
