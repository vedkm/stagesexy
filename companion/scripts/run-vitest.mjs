import { spawn } from "node:child_process";

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const vitest = spawn("npx", ["vitest", "run", ...forwardedArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

vitest.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
