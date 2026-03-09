package com.stagesexy;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
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
        final List<SelectorLayer> layers = normalizeLayers(
            selectorIdentity,
            layerKey,
            rawName,
            observation.layers()
        );

        final NormalizedInstrumentEvent event = new NormalizedInstrumentEvent(
            "bitwig",
            selectorName,
            layerKey,
            rawName,
            layers,
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
            + "\"layers\":" + layersToJson(event.layers()) + ","
            + "\"sequence\":" + event.sequence() + ","
            + "\"occurredAt\":\"" + escapeJson(event.occurredAt()) + "\""
            + "}";
    }

    private static List<SelectorLayer> normalizeLayers(
        final String selectorIdentity,
        final String activeLayerKey,
        final String activeRawName,
        final List<ObservedLayer> observedLayers
    ) {
        final List<ObservedLayer> layers = observedLayers == null ? List.of() : observedLayers;
        final List<SelectorLayer> normalizedLayers = new java.util.ArrayList<>();

        for (final ObservedLayer layer : layers) {
            if (layer == null) {
                continue;
            }

            final String rawName = trimToNull(layer.rawName());
            if (rawName == null) {
                continue;
            }

            final String stableLayerId = trimToNull(layer.stableLayerId());
            final String layerKey = stableLayerId != null
                ? stableLayerId
                : fallbackLayerKey(selectorIdentity, layer.layerIndex());

            normalizedLayers.add(new SelectorLayer(layerKey, rawName));
        }

        final boolean hasActiveLayer = normalizedLayers.stream()
            .anyMatch(layer -> layer.layerKey().equals(activeLayerKey));

        if (!hasActiveLayer) {
            normalizedLayers.add(new SelectorLayer(activeLayerKey, activeRawName));
        }

        return List.copyOf(normalizedLayers);
    }

    private static String layersToJson(final List<SelectorLayer> layers) {
        final StringBuilder json = new StringBuilder("[");

        for (int index = 0; index < layers.size(); index++) {
            final SelectorLayer layer = layers.get(index);

            if (index > 0) {
                json.append(",");
            }

            json.append("{")
                .append("\"layerKey\":\"").append(escapeJson(layer.layerKey())).append("\",")
                .append("\"rawName\":\"").append(escapeJson(layer.rawName())).append("\"")
                .append("}");
        }

        json.append("]");
        return json.toString();
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
        List<ObservedLayer> layers,
        ObservationSignal signal
    ) {
    }

    public record NormalizedInstrumentEvent(
        String source,
        String selectorName,
        String layerKey,
        String rawName,
        List<SelectorLayer> layers,
        int sequence,
        String occurredAt
    ) {
    }

    public record ObservedLayer(
        int layerIndex,
        String rawName,
        String stableLayerId
    ) {
    }

    public record SelectorLayer(
        String layerKey,
        String rawName
    ) {
    }

    public record PublishedEvent(
        NormalizedInstrumentEvent event,
        String payload
    ) {
    }
}
