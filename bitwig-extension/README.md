# Bitwig Extension Build And Install

This project builds a Bitwig controller extension named `StageSexyInstrumentSelector.bwextension`.

In plain terms, the extension watches the active `Instrument Selector` chain inside Bitwig and sends the current layer to the local companion service.

## Build

### Option A: Build locally with Java 21

From the repo root:

```sh
cd bitwig-extension
./gradlew jar
```

### Option B: Build with Docker

On this machine, the reliable build path is Docker because local Java is `17`, not `21`.

From the repo root:

```sh
cd bitwig-extension
docker run --rm \
  -e GRADLE_USER_HOME=/work/.gradle-docker \
  -v "$PWD":/work \
  -w /work \
  eclipse-temurin:21-jdk \
  ./gradlew jar
```

Both approaches produce:

```sh
bitwig-extension/build/libs/StageSexyInstrumentSelector.bwextension
```

## Optional Verification

Before installing, you can run:

```sh
cd bitwig-extension
./scripts/test-with-fallback.sh
```

This uses local Java 21 if available and falls back to Docker otherwise.

## Install To Bitwig On macOS

Bitwig loads Java controller extensions from:

```sh
$HOME/Documents/Bitwig Studio/Extensions
```

From the repo root, the explicit install command is:

```sh
mkdir -p "$HOME/Documents/Bitwig Studio/Extensions" && \
cp "bitwig-extension/build/libs/StageSexyInstrumentSelector.bwextension" \
   "$HOME/Documents/Bitwig Studio/Extensions/StageSexyInstrumentSelector.bwextension"
```

On newer Bitwig versions, dragging the `.bwextension` file onto the Bitwig window may also work, but the copy command above is the most repeatable path.

## Reload After Rebuild

If Bitwig is already open:

1. Replace the file in `~/Documents/Bitwig Studio/Extensions`.
2. In Bitwig, open `Settings` -> `Controllers`.
3. Remove the existing `Instrument Selector Display` controller entry if it is already loaded.
4. Add it again and choose `Stage Sexy` -> `Instrument Selector Display`.

If Bitwig still appears to use the old version, quit and reopen Bitwig after copying the file, then add the controller again.

## Quick End-To-End Check

1. Start the companion server:

```sh
npm --prefix companion run start:server
```

2. Start the browser UI:

```sh
npm --prefix companion run dev
```

3. Switch `Instrument Selector` layers in Bitwig and confirm the stage display follows the change.

## Agent Handoff

Known-good recovery target:

```sh
521992e fix(01-07): trust live chain selection and close Phase 1
```

Last successful operator recovery performed from the CLI:

1. Reset the repo to commit `521992e`.
2. Reinstall `companion` dependencies with `npm install` in `companion/`.
3. Rebuild the extension with the Docker `gradlew jar` command above.
4. Copy the resulting file to:

```sh
$HOME/Documents/Bitwig Studio/Extensions/StageSexyInstrumentSelector.bwextension
```

CLI actions complete at that point. The remaining reload step must be done inside Bitwig:

1. Open `Settings` -> `Controllers`.
2. Remove the existing `Instrument Selector Display` entry if needed.
3. Add `Stage Sexy` -> `Instrument Selector Display` again.

## Notes

- The Gradle toolchain targets `Java 21` for builds.
- The extension is built against Bitwig controller API `19` for compatibility with the verified Bitwig version.
- The runtime companion ingest target is `http://127.0.0.1:3197/ingest`.
