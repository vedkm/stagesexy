package com.stagesexy;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

public final class CompanionIngestClient {
    private static final int CONNECT_TIMEOUT_MS = 2_000;
    private static final int REQUEST_TIMEOUT_MS = 2_000;
    private static final int SUCCESS_STATUS_MIN = 200;
    private static final int SUCCESS_STATUS_MAX = 299;
    static final URI DEFAULT_INGEST_URI = URI.create("http://127.0.0.1:3197/ingest");

    private final URI ingestUri;

    public CompanionIngestClient() {
        this(DEFAULT_INGEST_URI);
    }

    public CompanionIngestClient(final URI ingestUri) {
        this.ingestUri = Objects.requireNonNull(ingestUri, "ingestUri must not be null");
    }

    public void publish(final String payload) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("payload must not be blank");
        }

        final byte[] requestBody = payload.getBytes(StandardCharsets.UTF_8);

        try {
            final HttpURLConnection connection = (HttpURLConnection) ingestUri.toURL().openConnection();
            connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
            connection.setReadTimeout(REQUEST_TIMEOUT_MS);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            try (OutputStream requestStream = connection.getOutputStream()) {
                requestStream.write(requestBody);
            }

            final int statusCode = connection.getResponseCode();
            closeResponseBody(connection, statusCode);
            if (!isSuccessStatus(statusCode)) {
                throw new IllegalStateException(
                    "Failed to POST normalized instrument event to companion /ingest at "
                        + ingestUri
                        + ". Received HTTP "
                        + statusCode
                        + "."
                );
            }
        } catch (final IOException exception) {
            throw new IllegalStateException(
                "Failed to POST normalized instrument event to companion /ingest at "
                    + ingestUri
                    + ". Ensure the companion truth service is running and reachable.",
                exception
            );
        }
    }

    URI ingestUri() {
        return ingestUri;
    }

    private static boolean isSuccessStatus(final int statusCode) {
        return statusCode >= SUCCESS_STATUS_MIN && statusCode <= SUCCESS_STATUS_MAX;
    }

    private static void closeResponseBody(
        final HttpURLConnection connection,
        final int statusCode
    ) throws IOException {
        final InputStream responseStream = isSuccessStatus(statusCode)
            ? connection.getInputStream()
            : connection.getErrorStream();

        if (responseStream == null) {
            return;
        }

        try (InputStream stream = responseStream) {
            while (stream.read() != -1) {
                // Drain the response so the connection can close cleanly.
            }
        }
    }
}
