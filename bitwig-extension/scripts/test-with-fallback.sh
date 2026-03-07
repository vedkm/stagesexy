#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_IMAGE="stagesexy-bitwig-extension-test"

has_java_21() {
  local java_cmd=""

  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    java_cmd="${JAVA_HOME}/bin/java"
  elif command -v java >/dev/null 2>&1; then
    java_cmd="$(command -v java)"
  else
    return 1
  fi

  local version_major
  version_major="$("${java_cmd}" -version 2>&1 | awk -F[\".] '/version/ {print $2; exit}')"

  [[ -n "${version_major}" ]] && (( version_major >= 21 ))
}

run_local_tests() {
  cd "${PROJECT_DIR}"
  ./gradlew test
}

run_docker_tests() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Java 21 is unavailable locally and Docker is not installed. Install Java 21 or Docker to run bitwig-extension tests." >&2
    return 1
  fi

  docker build -f "${PROJECT_DIR}/Dockerfile.test" -t "${DOCKER_IMAGE}" "${PROJECT_DIR}"
  docker run --rm -v "${PROJECT_DIR}:/workspace" -w /workspace "${DOCKER_IMAGE}" ./gradlew test
}

if has_java_21; then
  run_local_tests
else
  echo "Java 21 not detected locally. Falling back to the repository-owned Docker test image." >&2
  run_docker_tests
fi
