import { spawn } from "node:child_process";
import { loadDotEnv } from "../server/env.js";

loadDotEnv();

const configuredVitePort = process.env.LOOPOS_VITE_PORT || "5173";
const vitePort = /^\d+$/.test(configuredVitePort) ? configuredVitePort : "5173";
const children = [];

function start(label, command, args) {
  const child = spawn(command, args, {
    env: process.env,
    shell: false,
    stdio: "inherit"
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (signal) {
      return;
    }

    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}.`);
      stopAll(code);
    }
  });

  return child;
}

function startNpm(label, args) {
  if (process.platform === "win32") {
    start(label, process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", ["npm", ...args].join(" ")]);
    return;
  }

  start(label, "npm", args);
}

function stopAll(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exitCode = code;
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

start("LoopOS API bridge", process.execPath, ["server/index.js"]);
startNpm("Vite dev server", ["run", "dev", "--", "--port", vitePort]);

console.log(`LoopOS full dev stack starting. App: http://127.0.0.1:${vitePort}`);
