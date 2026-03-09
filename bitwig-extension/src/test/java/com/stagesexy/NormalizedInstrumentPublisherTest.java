package com.stagesexy;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NormalizedInstrumentPublisherTest {
    @Test
    void publishesFallbackLayerKeyFromSelectorIdentityAndLayerIndex() {
        final List<String> payloads = new ArrayList<>();
        final NormalizedInstrumentPublisher publisher = new NormalizedInstrumentPublisher(
            payloads::add,
            Clock.fixed(Instant.parse("2026-03-07T16:00:00Z"), ZoneOffset.UTC)
        );

        final NormalizedInstrumentPublisher.PublishedEvent published = publisher.publish(
            new NormalizedInstrumentPublisher.SelectorObservation(
                "selected-track:first-instrument",
                "Main Selector",
                2,
                "Lead Piano",
                null,
                List.of(
                    new NormalizedInstrumentPublisher.ObservedLayer(0, "Piano Intro", null),
                    new NormalizedInstrumentPublisher.ObservedLayer(1, "Warm Pad", null),
                    new NormalizedInstrumentPublisher.ObservedLayer(2, "Lead Piano", null)
                ),
                NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
            )
        );

        assertEquals("bitwig", published.event().source());
        assertEquals("selected-track:first-instrument:2", published.event().layerKey());
        assertEquals(3, published.event().layers().size());
        assertEquals("selected-track:first-instrument:0", published.event().layers().get(0).layerKey());
        assertEquals(1, published.event().sequence());
        assertEquals("2026-03-07T16:00:00Z", published.event().occurredAt());
        assertEquals(1, payloads.size());
        assertTrue(payloads.get(0).contains("\"layerKey\":\"selected-track:first-instrument:2\""));
        assertTrue(payloads.get(0).contains("\"layers\":["));
    }

    @Test
    void prefersStableLayerIdWhenBitwigProvidesOne() {
        final NormalizedInstrumentPublisher publisher = new NormalizedInstrumentPublisher(
            payload -> {
            },
            Clock.fixed(Instant.parse("2026-03-07T16:00:00Z"), ZoneOffset.UTC)
        );

        final NormalizedInstrumentPublisher.PublishedEvent published = publisher.publish(
            new NormalizedInstrumentPublisher.SelectorObservation(
                "selected-track:first-instrument",
                "Main Selector",
                1,
                "Pad",
                "bitwig-layer-42",
                List.of(
                    new NormalizedInstrumentPublisher.ObservedLayer(1, "Pad", "bitwig-layer-42")
                ),
                NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
            )
        );

        assertEquals("bitwig-layer-42", published.event().layerKey());
    }

    @Test
    void rejectsUiFocusSignals() {
        final NormalizedInstrumentPublisher publisher = new NormalizedInstrumentPublisher(
            payload -> {
            },
            Clock.fixed(Instant.parse("2026-03-07T16:00:00Z"), ZoneOffset.UTC)
        );

        final IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> publisher.publish(
                new NormalizedInstrumentPublisher.SelectorObservation(
                    "selected-track:first-instrument",
                    "Main Selector",
                    1,
                    "Pad",
                    null,
                    List.of(),
                    NormalizedInstrumentPublisher.ObservationSignal.UI_FOCUS
                )
            )
        );

        assertEquals(
            "signal must be LAYER_ACTIVATION. UI focus is not a truthful Instrument Selector source.",
            error.getMessage()
        );
    }

    @Test
    void incrementsSequenceForEachPublishedEvent() {
        final NormalizedInstrumentPublisher publisher = new NormalizedInstrumentPublisher(
            payload -> {
            },
            Clock.fixed(Instant.parse("2026-03-07T16:00:00Z"), ZoneOffset.UTC)
        );

        final int firstSequence = publisher.publish(
            new NormalizedInstrumentPublisher.SelectorObservation(
                "selected-track:first-instrument",
                "Main Selector",
                0,
                "Keys",
                null,
                List.of(
                    new NormalizedInstrumentPublisher.ObservedLayer(0, "Keys", null)
                ),
                NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
            )
        ).event().sequence();

        final int secondSequence = publisher.publish(
            new NormalizedInstrumentPublisher.SelectorObservation(
                "selected-track:first-instrument",
                "Main Selector",
                1,
                "Bass",
                null,
                List.of(
                    new NormalizedInstrumentPublisher.ObservedLayer(0, "Keys", null),
                    new NormalizedInstrumentPublisher.ObservedLayer(1, "Bass", null)
                ),
                NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
            )
        ).event().sequence();

        assertEquals(1, firstSequence);
        assertEquals(2, secondSequence);
    }
}
