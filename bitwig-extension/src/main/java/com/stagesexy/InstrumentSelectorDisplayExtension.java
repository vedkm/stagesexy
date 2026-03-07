package com.stagesexy;

import com.bitwig.extension.api.PlatformType;
import com.bitwig.extension.controller.AutoDetectionMidiPortNamesList;
import com.bitwig.extension.controller.ControllerExtension;
import com.bitwig.extension.controller.ControllerExtensionDefinition;
import com.bitwig.extension.controller.api.ControllerHost;
import com.bitwig.extension.controller.api.CursorDeviceFollowMode;
import com.bitwig.extension.controller.api.CursorTrack;
import com.bitwig.extension.controller.api.DeviceLayer;
import com.bitwig.extension.controller.api.DeviceLayerBank;
import com.bitwig.extension.controller.api.PinnableCursorDevice;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class InstrumentSelectorDisplayExtension extends ControllerExtensionDefinition {
    private static final UUID ID = UUID.fromString("3ac472d7-1137-4fd6-b759-e884fac43822");

    @Override
    public String getName() {
        return "Instrument Selector Display";
    }

    @Override
    public String getAuthor() {
        return "Stage Sexy";
    }

    @Override
    public String getVersion() {
        return "0.1.0";
    }

    @Override
    public UUID getId() {
        return ID;
    }

    @Override
    public String getHardwareVendor() {
        return "Stage Sexy";
    }

    @Override
    public String getHardwareModel() {
        return "Instrument Selector Display";
    }

    @Override
    public int getRequiredAPIVersion() {
        return 22;
    }

    @Override
    public int getNumMidiInPorts() {
        return 0;
    }

    @Override
    public int getNumMidiOutPorts() {
        return 0;
    }

    @Override
    public void listAutoDetectionMidiPortNames(
        final AutoDetectionMidiPortNamesList list,
        final PlatformType platformType
    ) {
        // No MIDI ports required. This extension only observes Bitwig state.
    }

    @Override
    public ControllerExtension createInstance(final ControllerHost host) {
        return new ExtensionInstance(this, host);
    }

    private static final class ExtensionInstance extends ControllerExtension {
        private static final int OBSERVED_LAYER_COUNT = 16;
        private static final String FALLBACK_SELECTOR_IDENTITY = "selected-track:first-instrument";

        private final List<ObservedLayer> observedLayers = new ArrayList<>();
        private CursorTrack cursorTrack;
        private PinnableCursorDevice selectorDevice;
        private NormalizedInstrumentPublisher publisher;

        private ExtensionInstance(
            final InstrumentSelectorDisplayExtension definition,
            final ControllerHost host
        ) {
            super(definition, host);
        }

        @Override
        public void init() {
            final ControllerHost host = getHost();

            publisher = new NormalizedInstrumentPublisher(host::println);
            cursorTrack = host.createCursorTrack(
                "stage-selector-track",
                "Stage Selector Track",
                0,
                0,
                true
            );
            selectorDevice = cursorTrack.createCursorDevice(
                "stage-selector-device",
                "Stage Selector Device",
                0,
                CursorDeviceFollowMode.FIRST_INSTRUMENT
            );

            selectorDevice.name().markInterested();
            selectorDevice.exists().markInterested();
            selectorDevice.hasLayers().markInterested();

            registerLayerObservers(selectorDevice.createLayerBank(OBSERVED_LAYER_COUNT));

            host.println("Stage Sexy Instrument Selector Display initialized.");
        }

        private void registerLayerObservers(final DeviceLayerBank layerBank) {
            observedLayers.clear();

            for (int index = 0; index < layerBank.getSizeOfBank(); index++) {
                final DeviceLayer layer = layerBank.getItemAt(index);
                final ObservedLayer observedLayer = new ObservedLayer(index, layer);
                observedLayers.add(observedLayer);
            }
        }

        private void handleObservedLayerChange() {
            if (!selectorDevice.exists().get()) {
                return;
            }

            if (!selectorDevice.hasLayers().get()) {
                throw new IllegalStateException(
                    "Observed device does not expose layers. This extension only supports Bitwig Instrument Selector state."
                );
            }

            final List<ObservedLayer> activeLayers = observedLayers.stream()
                .filter(ObservedLayer::exists)
                .filter(ObservedLayer::activated)
                .toList();

            if (activeLayers.size() > 1) {
                throw new IllegalStateException(
                    "Observed multiple active layers. Active Instrument Selector truth must map to exactly one playable layer."
                );
            }

            if (activeLayers.isEmpty()) {
                return;
            }

            final ObservedLayer activeLayer = activeLayers.get(0);
            publisher.publish(
                new NormalizedInstrumentPublisher.SelectorObservation(
                    FALLBACK_SELECTOR_IDENTITY,
                    requireName(selectorDevice.name().get(), "selectorName"),
                    activeLayer.index(),
                    requireName(activeLayer.name(), "rawName"),
                    null,
                    NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
                )
            );
        }

        @Override
        public void exit() {
        }

        @Override
        public void flush() {
        }

        private String requireName(final String value, final String fieldName) {
            return Optional.ofNullable(value)
                .map(String::trim)
                .filter(text -> !text.isEmpty())
                .orElseThrow(() -> new IllegalStateException(fieldName + " must not be blank"));
        }

        private final class ObservedLayer {
            private final int index;
            private String name = "";
            private boolean exists;
            private boolean activated;

            private ObservedLayer(final int index, final DeviceLayer layer) {
                this.index = index;

                layer.name().markInterested();
                layer.exists().markInterested();
                layer.isActivated().markInterested();

                layer.exists().addValueObserver(value -> {
                    exists = value;
                    handleObservedLayerChange();
                });
                layer.name().addValueObserver(value -> {
                    name = value;
                    if (activated) {
                        handleObservedLayerChange();
                    }
                });
                layer.isActivated().addValueObserver(value -> {
                    activated = value;
                    handleObservedLayerChange();
                });
            }

            private boolean exists() {
                return exists;
            }

            private boolean activated() {
                return activated;
            }

            private int index() {
                return index;
            }

            private String name() {
                return name;
            }
        }
    }
}
