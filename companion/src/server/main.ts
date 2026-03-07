import { startCompanionServer, type CompanionListenOptions } from "./app";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3197;

export function resolveCompanionRuntimeOptions(
  env: NodeJS.ProcessEnv = process.env,
): CompanionListenOptions {
  const host = env.COMPANION_HOST?.trim() || DEFAULT_HOST;
  const port = parseOptionalPositiveInteger(env.COMPANION_PORT, "COMPANION_PORT");
  const aliasFilePath = env.COMPANION_ALIAS_FILE_PATH?.trim() || undefined;
  const statusCheckMs = parseOptionalPositiveInteger(
    env.COMPANION_STATUS_CHECK_MS,
    "COMPANION_STATUS_CHECK_MS",
  );
  const staleAfterMs = parseOptionalPositiveInteger(
    env.COMPANION_STALE_AFTER_MS,
    "COMPANION_STALE_AFTER_MS",
  );
  const disconnectedAfterMs = parseOptionalPositiveInteger(
    env.COMPANION_DISCONNECTED_AFTER_MS,
    "COMPANION_DISCONNECTED_AFTER_MS",
  );

  return {
    aliasFilePath,
    host,
    port: port ?? DEFAULT_PORT,
    statusCheckMs,
    thresholds:
      staleAfterMs === undefined && disconnectedAfterMs === undefined
        ? undefined
        : {
            staleAfterMs: staleAfterMs ?? 3_000,
            disconnectedAfterMs: disconnectedAfterMs ?? 10_000,
          },
  };
}

export async function runCompanionServer(): Promise<void> {
  const options = resolveCompanionRuntimeOptions();
  await startCompanionServer(options);

  process.stdout.write(
    `Companion truth service listening on http://${options.host}:${options.port}\n`,
  );
}

function parseOptionalPositiveInteger(
  value: string | undefined,
  envName: string,
): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${envName} must be a positive integer when provided.`);
  }

  return parsed;
}

if (import.meta.main) {
  await runCompanionServer();
}
