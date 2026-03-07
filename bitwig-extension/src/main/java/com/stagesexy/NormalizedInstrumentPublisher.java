package com.stagesexy;

import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.function.Consumer;

public final class NormalizedInstrumentPublisher {
    public static final String FALLBACK_LAYER_KEY_STRATEGY =
        "Fallback layerKey uses selected-track:first-instrument:{layer index} because the verified public Bitwig observer path here does not expose a durable per-layer identifier.";

    private final Consumer<String> sink;
    private final Clock clock;
    private int nextSequence = 1;

    public NormalizedInstrumentPublisher(final Consumer<String> sink) {
        this(sink, Clock.systemUTC());
    }

    NormalizedInstrumentPublisher(final Consumer<String> sink, final Clock clock) {
        this.sink = Objects.requireNonNull(sink, "sink must not be null");
        this.clock = Objects.requireNonNull(clock, "clock must not be null");
    }

    public PublishedEvent publish(final SelectorObservation observation) {
        final NormalizedInstrumentEvent event = normalize(observation, clock.instant());
        final String payload = toJson(event);
        sink.accept(payload);
        return new PublishedEvent(event, payload);
    }

    NormalizedInstrumentEvent normalize(final SelectorObservation observation, final Instant occurredAt) {
        Objects.requireNonNull(observation, "observation must not be null");
        Objects.requireNonNull(occurredAt, "occurredAt must not be null");

        if (observation.signal() != ObservationSignal.LAYER_ACTIVATION) {
            throw new IllegalArgumentException(
                "signal must be LAYER_ACTIVATION. UI focus is not a truthful Instrument Selector source."
            );
        }

        if (observation.layerIndex() < 0) {
            throw new IllegalArgumentException("layerIndex must be >= 0");
        }

        final String selectorIdentity = requireText(observation.selectorIdentity(), "selectorIdentity");
        final String selectorName = requireText(observation.selectorName(), "selectorName");
        final String rawName = requireText(observation.rawName(), "rawName");
        final String stableLayerId = trimToNull(observation.stableLayerId());
        final String layerKey = stableLayerId != null
            ? stableLayerId
            : fallbackLayerKey(selectorIdentity, observation.layerIndex());

        final NormalizedInstrumentEvent event = new NormalizedInstrumentEvent(
            "bitwig",
            selectorName,
            layerKey,
            rawName,
            nextSequence++,
            occurredAt.toString()
        );

        return event;
    }

    static String fallbackLayerKey(final String selectorIdentity, final int layerIndex) {
        if (layerIndex < 0) {
            throw new IllegalArgumentException("layerIndex must be >= 0");
        }

        return requireText(selectorIdentity, "selectorIdentity") + ":" + layerIndex;
    }

    static String toJson(final NormalizedInstrumentEvent event) {
        return "{"
            + "\"source\":\"" + escapeJson(event.source()) + "\","
            + "\"selectorName\":\"" + escapeJson(event.selectorName()) + "\","
            + "\"layerKey\":\"" + escapeJson(event.layerKey()) + "\","
            + "\"rawName\":\"" + escapeJson(event.rawName()) + "\","
            + "\"sequence\":" + event.sequence() + ","
            + "\"occurredAt\":\"" + escapeJson(event.occurredAt()) + "\""
            + "}";
    }

    private static String requireText(final String value, final String fieldName) {
        final String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return trimmed;
    }

    private static String trimToNull(final String value) {
        if (value == null) {
            return null;
        }

        final String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String escapeJson(final String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"");
    }

    public enum ObservationSignal {
        LAYER_ACTIVATION,
        UI_FOCUS
    }

    public record SelectorObservation(
        String selectorIdentity,
        String selectorName,
        int layerIndex,
        String rawName,
        String stableLayerId,
        ObservationSignal signal
    ) {
    }

    public record NormalizedInstrumentEvent(
        String source,
        String selectorName,
        String layerKey,
        String rawName,
        int sequence,
        String occurredAt
    ) {
    }

    public record PublishedEvent(
        NormalizedInstrumentEvent event,
        String payload
    ) {
    }
}
