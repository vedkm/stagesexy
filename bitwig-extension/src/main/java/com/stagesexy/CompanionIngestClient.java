package com.stagesexy;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Objects;

public final class CompanionIngestClient {
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(2);
    private static final int SUCCESS_STATUS_MIN = 200;
    private static final int SUCCESS_STATUS_MAX = 299;

    static final URI DEFAULT_INGEST_URI = URI.create("http://127.0.0.1:3197/ingest");

    private final HttpClient httpClient;
    private final URI ingestUri;

    public CompanionIngestClient() {
        this(DEFAULT_INGEST_URI);
    }

    public CompanionIngestClient(final URI ingestUri) {
        this(
            HttpClient.newBuilder()
                .connectTimeout(CONNECT_TIMEOUT)
                .build(),
            ingestUri
        );
    }

    CompanionIngestClient(final HttpClient httpClient, final URI ingestUri) {
        this.httpClient = Objects.requireNonNull(httpClient, "httpClient must not be null");
        this.ingestUri = Objects.requireNonNull(ingestUri, "ingestUri must not be null");
    }

    public void publish(final String payload) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("payload must not be blank");
        }

        final HttpRequest request = HttpRequest.newBuilder(ingestUri)
            .timeout(REQUEST_TIMEOUT)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        try {
            final HttpResponse<Void> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.discarding()
            );

            if (!isSuccessStatus(response.statusCode())) {
                throw new IllegalStateException(
                    "Failed to POST normalized instrument event to companion /ingest at "
                        + ingestUri
                        + ". Received HTTP "
                        + response.statusCode()
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
        } catch (final InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                "Interrupted while posting normalized instrument event to companion /ingest at "
                    + ingestUri
                    + ".",
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
}
