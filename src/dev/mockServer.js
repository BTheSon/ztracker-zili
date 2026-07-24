// src/dev/mockServer.js — chạy: node src/dev/mockServer.js
import http from "http";

let requestCount = 0;
const PORT = 4000;

http.createServer((req, res) => {
    requestCount++;
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
        console.log(`[MOCK] Request #${requestCount}: ${req.method} ${req.url}`);

        // Kịch bản: cứ mỗi 2 request thì giả lập "cold start" — treo lâu rồi mới trả 502
        if (requestCount % 2 === 0) {
            console.log("[MOCK] Giả lập cold-start: treo 60s rồi trả 502...");
            setTimeout(() => {
                res.writeHead(502);
                res.end("Bad Gateway (simulated)");
            }, 60000); // dài hơn TIMEOUT_MS (45s) để trigger AbortController
            return;
        }

        // Kịch bản: request ngẫu nhiên trả 500
        if (Math.random() < 0.3) {
            res.writeHead(500);
            res.end("Internal Error (simulated)");
            return;
        }

        // Bình thường
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: { geminiExtraction: "ok (mock)" } }));
    });
}).listen(PORT, () => console.log(`[MOCK] Server giả chạy tại http://localhost:${PORT}`));
