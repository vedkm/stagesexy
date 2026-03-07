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
import com.bitwig.extension.controller.api.ChainSelector;

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
        return 19;
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
        private ChainSelector chainSelector;
        private NormalizedInstrumentPublisher publisher;
        private int lastPublishedChainIndex = Integer.MIN_VALUE;
        private String lastPublishedChainName = "";

        private ExtensionInstance(
            final InstrumentSelectorDisplayExtension definition,
            final ControllerHost host
        ) {
            super(definition, host);
        }

        @Override
        public void init() {
            final ControllerHost host = getHost();
            final CompanionIngestClient ingestClient = new CompanionIngestClient();

            publisher = new NormalizedInstrumentPublisher(ingestClient::publish);
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
            chainSelector = selectorDevice.createChainSelector();

            selectorDevice.name().markInterested();
            selectorDevice.exists().markInterested();
            selectorDevice.hasLayers().markInterested();
            chainSelector.activeChainIndex().markInterested();
            chainSelector.activeChain().name().markInterested();
            chainSelector.activeChain().exists().markInterested();

            selectorDevice.name().addValueObserver(value -> publishSelectedChainIfReady());
            chainSelector.activeChainIndex().addValueObserver(value -> publishSelectedChainIfReady(), 128);
            chainSelector.activeChain().exists().addValueObserver(value -> publishSelectedChainIfReady());

            registerLayerObservers(selectorDevice.createLayerBank(OBSERVED_LAYER_COUNT));

            host.println(
                "Stage Sexy Instrument Selector Display initialized. Publishing normalized events to "
                    + CompanionIngestClient.DEFAULT_INGEST_URI
            );
        }

        private void registerLayerObservers(final DeviceLayerBank layerBank) {
            observedLayers.clear();

            for (int index = 0; index < layerBank.getSizeOfBank(); index++) {
                final DeviceLayer layer = layerBank.getItemAt(index);
                final ObservedLayer observedLayer = new ObservedLayer(index, layer);
                observedLayers.add(observedLayer);
            }
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

            private ObservedLayer(final int index, final DeviceLayer layer) {
                this.index = index;

                layer.name().markInterested();
                layer.exists().markInterested();

                layer.exists().addValueObserver(value -> {
                    exists = value;
                    publishSelectedChainIfReady();
                });
                layer.name().addValueObserver(value -> {
                    name = value;
                    publishSelectedChainIfReady();
                });
            }

            private boolean exists() {
                return exists;
            }

            private int index() {
                return index;
            }

            private String name() {
                return name;
            }
        }

        private void publishSelectedChainIfReady() {
            final boolean activeChainExists = chainSelector.activeChain().exists().get();
            final int activeChainIndex = chainSelector.activeChainIndex().get();
            final String selectorName = selectorDevice.name().get();
            final String observedLayerName = activeChainIndex >= 0 && activeChainIndex < observedLayers.size()
                ? observedLayers.get(activeChainIndex).name()
                : "";

            if (!activeChainExists || activeChainIndex < 0 || activeChainIndex >= OBSERVED_LAYER_COUNT) {
                return;
            }

            final String trimmedSelectorName = selectorName == null ? "" : selectorName.trim();
            final String trimmedChainName = observedLayerName == null ? "" : observedLayerName.trim();

            if (trimmedSelectorName.isEmpty() || trimmedChainName.isEmpty()) {
                return;
            }

            if (activeChainIndex == lastPublishedChainIndex && trimmedChainName.equals(lastPublishedChainName)) {
                return;
            }

            publisher.publish(
                new NormalizedInstrumentPublisher.SelectorObservation(
                    FALLBACK_SELECTOR_IDENTITY,
                    trimmedSelectorName,
                    activeChainIndex,
                    trimmedChainName,
                    null,
                    NormalizedInstrumentPublisher.ObservationSignal.LAYER_ACTIVATION
                )
            );

            lastPublishedChainIndex = activeChainIndex;
            lastPublishedChainName = trimmedChainName;
        }
    }
}
