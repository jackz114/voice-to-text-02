// 使用方法 node log-server.js

const { spawn } = require("child_process");
const fs = require("fs");
const readline = require("readline");

const LOG_FILE = "server-errors.log";
const MAX_SIZE_BYTES = 50000; // 约 50KB

// 启动时清空文件
fs.writeFileSync(LOG_FILE, "");

const child = spawn("npm", ["run", "dev"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

// 内存缓冲区 - 始终保持最新的 MAX_SIZE_BYTES 内容
let ringBuffer = [];
let currentSize = 0;

function addToBuffer(text) {
  ringBuffer.push(text);
  currentSize += Buffer.byteLength(text, "utf-8");

  // 超出限制时从头部删除旧内容
  while (currentSize > MAX_SIZE_BYTES && ringBuffer.length > 0) {
    const removed = ringBuffer.shift();
    currentSize -= Buffer.byteLength(removed, "utf-8");
  }
}

function flushToDisk() {
  if (ringBuffer.length === 0) return;
  const content = ringBuffer.join("");
  fs.writeFileSync(LOG_FILE, content);
}

// 定时刷盘（每秒一次）
const flushInterval = setInterval(flushToDisk, 1000);

// 进程退出前刷盘
function cleanup() {
  clearInterval(flushInterval);
  flushToDisk();
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  child.kill("SIGINT");
});
process.on("SIGTERM", () => {
  cleanup();
  child.kill("SIGTERM");
});

// 使用 readline 处理行缓冲
const stdoutRl = readline.createInterface({ input: child.stdout });
const stderrRl = readline.createInterface({ input: child.stderr });

stdoutRl.on("line", (line) => {
  const text = line + "\n";
  process.stdout.write(text);
  addToBuffer(text);
});

stderrRl.on("line", (line) => {
  const text = line + "\n";
  process.stderr.write(text);
  addToBuffer(text);
});

child.on("exit", (code) => {
  cleanup();
  process.exit(code);
});

console.log(`[log-server] 日志写入 ${LOG_FILE}，内存缓冲 ${MAX_SIZE_BYTES} 字节，1秒刷盘`);
