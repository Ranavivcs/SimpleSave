/**
 * Dev-server launcher. Antivirus TLS interception (AVG/Avast) re-signs HTTPS
 * with a root cert Node doesn't trust, so every Supabase call from the server
 * fails with `fetch failed: UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Node only reads
 * NODE_EXTRA_CA_CERTS at process startup, so it can't be fixed from .env.local —
 * we set it here and re-spawn `next dev`. No-op on machines without the cert.
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const env = { ...process.env };
if (!env.NODE_EXTRA_CA_CERTS) {
  const candidates = [
    "C:/ProgramData/AVG/Antivirus/wscert.pem",
    "C:/ProgramData/Avast Software/Avast/wscert.pem",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (found) {
    env.NODE_EXTRA_CA_CERTS = found;
    console.log(`[dev] trusting antivirus TLS cert: ${found}`);
  }
}

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", "3001"], {
  stdio: "inherit",
  env,
});
child.on("exit", (code) => process.exit(code ?? 0));
