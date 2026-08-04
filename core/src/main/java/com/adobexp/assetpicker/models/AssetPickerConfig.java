package com.adobexp.assetpicker.models;

/**
 * Backs the selector component: everything the SPA needs before its first API call.
 */
public interface AssetPickerConfig {

    /** The {@code data-config} payload, serialised. Never {@code null}. */
    String getConfig();

    /**
     * Flat key→string dictionary for the current page language, serialised as JSON.
     * Never {@code null}; returns {@code "{}"} when no messages can be resolved.
     */
    String getTranslations();

    /**
     * CSS custom-property overrides derived from the Appearance CA config.
     * Empty string when nothing is authored.
     */
    String getStyleOverrides();
}
