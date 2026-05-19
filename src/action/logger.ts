import * as os from "node:os";

export function log(message: string): void {
  process.stdout.write(`${message}${os.EOL}`);
}

export function setFailed(message: string): void {
  process.exitCode = 1;
  process.stdout.write(
    `::error::${message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}${os.EOL}`
  );
}
