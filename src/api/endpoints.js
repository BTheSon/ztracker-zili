// @ts-check
import { request, requestWithRetry } from "./client.js";
import { enqueueFailed } from "./queue.js";

/**
 * @typedef {Object} FormattedMessage
 * @property {string} type - Loại tin nhắn, vd "text" | "photo" | "unknown"
 * @property {string} text - Nội dung văn bản
 * @property {string|null} url - URL ảnh/tài liệu nếu có
 * @property {string|null} title - Tiêu đề đi kèm nếu có
 */

/**
 * @typedef {Object} MessageBody
 * @property {string} msg_id
 * @property {string} type
 * @property {string} text
 * @property {string|null} url
 * @property {string|null} title
 */

/**
 * @typedef {Object} SendResult
 * @property {boolean} success
 * @property {string} [error]
 */

/**
 * Gửi file QR đăng nhập Zalo lên server.
 * @param {string} fileBase64
 */
export const send_qr_auth = async (fileBase64) => {
    try {
        const res = await request("/api/qr_code", {
            method: "POST",
            body: JSON.stringify({ qrcode_base64: fileBase64 }),
        });
        return res.body;
    } catch (err) {
        console.error("[API FETCH ERROR]", err);
    }
};

/**
 * Gửi 1 đơn hàng lên server. Tự động retry khi thất bại; nếu vẫn thất bại
 * sau khi retry hết, lưu vào queue cục bộ — KHÔNG bao giờ âm thầm làm mất đơn.
 * @param {string} msg_id - ID duy nhất của tin nhắn (dùng để server dedupe)
 * @param {FormattedMessage} formatted
 * @returns {Promise<SendResult>}
 */
export const send_msg = async (msg_id, formatted) => {
    /** @type {MessageBody} */
    const body = { msg_id, ...formatted };
    try {
        const res = await requestWithRetry("/worker/messages", {
            method: "POST",
            body: JSON.stringify(body),
        });
        const json = await res.json();
        console.log("[GEMINI EXTRACTION]", json?.data?.geminiExtraction);
        return { success: true };
    } catch (err) {
        console.error("[SEND_MSG FAILED - đã retry hết]", msg_id, err);
        enqueueFailed({ path: "/worker/messages", body });
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
};

/**
 * @param {string} msg_id
 * @returns {Promise<void>}
 */
export const delete_msg = async (msg_id) => {
    try {
        const res = await request("/worker/messages/delete", {
            method: "POST",
            body: JSON.stringify({ msg_id }),
        });
        const json = await res.json();
        console.log("[GEMINI EXTRACTION]", json?.msg);
    } catch (err) {
        console.error("[API FETCH ERROR]", err);
    }
};

/**
 * @param {string} msg_id
 * @param {string} rIcon
 */
export const reaction_msg = async (msg_id, rIcon) => {
    try {
        await request("/worker/messages/reactions", {
            method: "POST",
            body: JSON.stringify({ msg_id, r_icon: rIcon }),
        });
    } catch (err) {
        console.error("[API FETCH ERROR]:", err);
    }
};

export const ping = async () => {
    try {
        const res = await request("/api/ping", { method: "GET" });
        const pong = (await res.json()).message;
        console.log(pong);
    } catch (err) {
        console.error("Server is not ready.", err);
    }
};
