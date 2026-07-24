// @ts-check
import { BASE_URL, TIMEOUT_MS, MAX_RETRIES } from "../config/index.js";

/** @param {number} ms @returns {Promise<void>} */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Gọi 1 request HTTP với timeout chủ động (tránh treo vô thời hạn khi Render cold-start).
 * @param {string} reqPath - Đường dẫn tương đối, vd "/worker/messages"
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 * @throws {Error} Nếu HTTP status không ok hoặc request bị abort do timeout
 */
export async function request(reqPath, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(new URL(reqPath, BASE_URL), {
            headers: { "Content-Type": "application/json", ...options.headers },
            signal: controller.signal,
            ...options,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Gọi request() kèm retry theo exponential backoff (1s, 2s, 4s, 8s...).
 * @param {string} reqPath
 * @param {RequestInit} [options]
 * @param {number} [retries] - Số lần thử lại tối đa (không tính lần đầu)
 * @returns {Promise<Response>}
 * @throws {Error} Nếu tất cả các lần thử đều thất bại
 */
export async function requestWithRetry(reqPath, options, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await request(reqPath, options);
        } catch (err) {
            if (err instanceof Error) {
                const isLast = attempt === retries;
                console.warn(`[API RETRY] ${reqPath} lần ${attempt + 1}/${retries + 1} thất bại: ${err.message}`);
                if (isLast) throw err;
                await sleep(1000 * 2 ** attempt);
            }
        }
    }
    throw new Error("Unreachable");
}
