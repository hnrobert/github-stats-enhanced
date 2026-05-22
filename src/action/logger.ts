import * as os from "node:os";
import * as fs from "node:fs";

export function log(message: string): void {
  process.stdout.write(`${message}${os.EOL}`);
}

export function setFailed(message: string): void {
  process.exitCode = 1;
  process.stdout.write(
    `::error::${message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}${os.EOL}`
  );
}

export function appendSummary(markdown: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  fs.appendFileSync(summaryFile, markdown + os.EOL, "utf-8");
}
