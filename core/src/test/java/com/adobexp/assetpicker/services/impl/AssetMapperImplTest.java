package com.adobexp.assetpicker.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.resource.ResourceResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AssetMapperImplTest {

    private static final String PATH = "/content/dam/sample/folder/image.jpg";

    private SlingHttpServletRequest request;
    private ResourceResolver resolver;

    @BeforeEach
    void setUp() {
        request = mock(SlingHttpServletRequest.class);
        resolver = mock(ResourceResolver.class);
        when(request.getResourceResolver()).thenReturn(resolver);
        // Identity mapping, as on a publish tier without /etc/map entries for /content/dam.
        when(resolver.map(eq(request), anyString())).thenAnswer(invocation -> invocation.getArgument(1));
    }

    @Test
    void usesForwardedProtoAndHostWhenPresent() {
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");
        when(request.getHeader("X-Forwarded-Host")).thenReturn("tenant-ap-dev.example.test");
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("localhost");
        when(request.getServerPort()).thenReturn(4503);

        assertEquals("https://tenant-ap-dev.example.test" + PATH, AssetMapperImpl.externalUrl(PATH, request));
    }

    @Test
    void takesFirstHopFromCommaSeparatedForwardedHeaders() {
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("https, http");
        when(request.getHeader("X-Forwarded-Host")).thenReturn("public.example.test, dispatcher.internal");

        assertEquals("https://public.example.test" + PATH, AssetMapperImpl.externalUrl(PATH, request));
    }

    @Test
    void fallsBackToRequestSchemeAndServerNameOmittingDefaultPort() {
        when(request.getScheme()).thenReturn("https");
        when(request.getServerName()).thenReturn("tenant.example.test");
        when(request.getServerPort()).thenReturn(443);

        assertEquals("https://tenant.example.test" + PATH, AssetMapperImpl.externalUrl(PATH, request));
    }

    @Test
    void keepsNonDefaultPortWhenNoForwardedHost() {
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("localhost");
        when(request.getServerPort()).thenReturn(4503);

        assertEquals("http://localhost:4503" + PATH, AssetMapperImpl.externalUrl(PATH, request));
    }

    @Test
    void honoursAbsoluteUrlProducedByResourceMapping() {
        when(resolver.map(eq(request), anyString())).thenReturn("https://cdn.example.test" + PATH);
        when(request.getScheme()).thenReturn("https");
        when(request.getServerName()).thenReturn("tenant.example.test");
        when(request.getServerPort()).thenReturn(443);

        assertEquals("https://cdn.example.test" + PATH, AssetMapperImpl.externalUrl(PATH, request));
    }

    @Test
    void returnsPathUnchangedWithoutRequest() {
        assertEquals(PATH, AssetMapperImpl.externalUrl(PATH, null));
    }
}
