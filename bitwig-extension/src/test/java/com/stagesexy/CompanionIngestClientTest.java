package com.stagesexy;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CompanionIngestClientTest {
    @Test
    void usesDeterministicLocalIngestUrlByDefault() {
        final CompanionIngestClient client = new CompanionIngestClient();

        assertEquals("http://127.0.0.1:3197/ingest", client.ingestUri().toString());
    }

    @Test
    void postsNormalizedInstrumentPayloadToCompanionIngestRoute() throws Exception {
        final AtomicReference<String> requestMethod = new AtomicReference<>();
        final AtomicReference<String> contentType = new AtomicReference<>();
        final AtomicReference<String> requestBody = new AtomicReference<>();
        final HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/ingest", exchange -> {
            captureRequest(exchange, requestMethod, contentType, requestBody);
            respond(exchange, 204);
        });
        server.start();

        try {
            final NormalizedInstrumentPublisher publisher = new NormalizedInstrumentPublisher(
                payload -> {
                },
                Clock.fixed(Instant.parse("2026-03-07T16:00:00Z"), ZoneOffset.UTC)
            );
            final String payload = publisher.publish(
                new NormalizedInstrumentPublisher.SelectorObservation(
                    "selected-track:first-instrument",
                    "Main Selector",
                    3,
                    "Lead Piano",
                    null,
                    java.util.List.of(
                        new NormalizedInstrumentPublisher.ObservedLayer(2, "Warm Pad", null),
                        new NormalizedInstrumentPublisher.ObservedLayer(3, "Lead Piano", null)
                    ),
                    NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
                )
            ).payload();

            final CompanionIngestClient client = new CompanionIngestClient(
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/ingest")
            );

            client.publish(payload);

            assertEquals("POST", requestMethod.get());
            assertEquals("application/json", contentType.get());
            assertEquals(payload, requestBody.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void surfacesTransportFailuresWithActionableContext() throws Exception {
        final HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/ingest", exchange -> respond(exchange, 503));
        server.start();

        try {
            final CompanionIngestClient client = new CompanionIngestClient(
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/ingest")
            );

            final IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> client.publish("{\"source\":\"bitwig\"}")
            );

            assertTrue(error.getMessage().contains("/ingest"));
            assertTrue(error.getMessage().contains("503"));
        } finally {
            server.stop(0);
        }
    }

    private static void captureRequest(
        final HttpExchange exchange,
        final AtomicReference<String> requestMethod,
        final AtomicReference<String> contentType,
        final AtomicReference<String> requestBody
    ) throws IOException {
        requestMethod.set(exchange.getRequestMethod());
        contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
        requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
    }

    private static void respond(final HttpExchange exchange, final int statusCode) throws IOException {
        exchange.sendResponseHeaders(statusCode, -1);
        try (OutputStream responseBody = exchange.getResponseBody()) {
            responseBody.flush();
        }
    }
}
