package com.adobexp.assetpicker.servlets;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import javax.servlet.http.HttpServletResponse;

import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * Shared JSON plumbing for the picker endpoints.
 *
 * <p>All four are read-only GETs, which is what lets the SPA talk to them without a CSRF token
 * round-trip. Responses are marked no-store because the payload depends on the caller's DAM
 * permissions and must never be served from a shared cache.
 */
public abstract class AbstractPickerServlet extends SlingSafeMethodsServlet {

    /** Base path all picker endpoints hang off; kept in one place for the servlet annotations. */
    public static final String API_ROOT = "/bin/asset-picker";

    private static final long serialVersionUID = 1L;

    private static final Logger LOG = LoggerFactory.getLogger(AbstractPickerServlet.class);

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

    protected void writeJson(SlingHttpServletResponse response, Object payload) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(MAPPER.writeValueAsString(payload));
    }

    protected void writeError(SlingHttpServletResponse response, int status, String message) throws IOException {
        LOG.debug("Asset Picker API rejected a request: {}", message);
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(MAPPER.writeValueAsString(new ErrorDto(status, message)));
    }

    protected void writeForbiddenPath(SlingHttpServletResponse response) throws IOException {
        writeError(response, HttpServletResponse.SC_FORBIDDEN, "The requested path is outside the permitted DAM roots");
    }

    /** Error body shape, so a failing call is still parseable by the SPA's fetch helper. */
    public static final class ErrorDto {

        private final int status;
        private final String message;

        ErrorDto(int status, String message) {
            this.status = status;
            this.message = message;
        }

        public int getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }
    }
}
