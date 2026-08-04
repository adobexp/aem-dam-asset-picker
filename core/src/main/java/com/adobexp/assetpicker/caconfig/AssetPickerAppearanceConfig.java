package com.adobexp.assetpicker.caconfig;

import org.apache.sling.caconfig.annotation.Configuration;
import org.apache.sling.caconfig.annotation.Property;

/**
 * Look-and-feel overrides for the Asset Picker selector SPA.
 *
 * <p>All properties are optional; blank values fall through to the tokens shipped in
 * {@code theme-light.scss} / {@code theme-dark.scss}.
 */
@Configuration(
        label = "Asset Picker : Appearance",
        description = "Fonts, default theme, panel backgrounds, text and button colours for the Asset Picker")
public @interface AssetPickerAppearanceConfig {

    @Property(label = "Font family", description = "CSS font-family stack, e.g. \"Inter\", sans-serif")
    String fontFamily() default "";

    @Property(label = "Font stylesheet URL",
            description = "Optional stylesheet URL that loads the custom font (e.g. a Google Fonts CSS URL)")
    String fontStylesheetUrl() default "";

    @Property(label = "Font weight", description = "Default font weight, e.g. 400")
    String fontWeight() default "";

    @Property(label = "Font size", description = "Default font size, e.g. 14px")
    String fontSize() default "";

    @Property(label = "Default theme", description = "light or dark")
    String defaultTheme() default "light";

    /* ===== Light theme ===== */

    @Property(label = "Light: text colour")
    String lightTextColor() default "";

    @Property(label = "Light: sidebar background")
    String lightSidebarBackground() default "";

    @Property(label = "Light: toolbar background")
    String lightToolbarBackground() default "";

    @Property(label = "Light: title bar background")
    String lightTitleBarBackground() default "";

    @Property(label = "Light: content background")
    String lightContentBackground() default "";

    @Property(label = "Light: button background (default)")
    String lightButtonBackground() default "";

    @Property(label = "Light: button colour (default)")
    String lightButtonColor() default "";

    @Property(label = "Light: button background (hover)")
    String lightButtonBackgroundHover() default "";

    @Property(label = "Light: button colour (hover)")
    String lightButtonColorHover() default "";

    @Property(label = "Light: button background (active)")
    String lightButtonBackgroundActive() default "";

    @Property(label = "Light: button colour (active)")
    String lightButtonColorActive() default "";

    @Property(label = "Light: button background (selected)")
    String lightButtonBackgroundSelected() default "";

    @Property(label = "Light: button colour (selected)")
    String lightButtonColorSelected() default "";

    /* ===== Dark theme ===== */

    @Property(label = "Dark: text colour")
    String darkTextColor() default "";

    @Property(label = "Dark: sidebar background")
    String darkSidebarBackground() default "";

    @Property(label = "Dark: toolbar background")
    String darkToolbarBackground() default "";

    @Property(label = "Dark: title bar background")
    String darkTitleBarBackground() default "";

    @Property(label = "Dark: content background")
    String darkContentBackground() default "";

    @Property(label = "Dark: button background (default)")
    String darkButtonBackground() default "";

    @Property(label = "Dark: button colour (default)")
    String darkButtonColor() default "";

    @Property(label = "Dark: button background (hover)")
    String darkButtonBackgroundHover() default "";

    @Property(label = "Dark: button colour (hover)")
    String darkButtonColorHover() default "";

    @Property(label = "Dark: button background (active)")
    String darkButtonBackgroundActive() default "";

    @Property(label = "Dark: button colour (active)")
    String darkButtonColorActive() default "";

    @Property(label = "Dark: button background (selected)")
    String darkButtonBackgroundSelected() default "";

    @Property(label = "Dark: button colour (selected)")
    String darkButtonColorSelected() default "";
}
