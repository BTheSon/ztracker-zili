// @ts-check
import fs from "fs";
import { QUEUE_PATH } from "../config.js";
import { requestWithRetry } from "./client.js";

/**
 * @typedef {Object} MessageBody
 * @property {string} msg_id - ID duy nhất của tin nhắn
 * @property {string} type
 * @property {string} text
 * @property {string|null} url
 * @property {string|null} title
 */

/**
 * @typedef {Object} QueueItem
 * @property {string} path - Endpoint API cần gọi lại
 * @property {MessageBody} body - Payload gốc bị gửi thất bại
 * @property {number} [queuedAt] - Timestamp (ms) lúc item được đưa vào queue
 * @property {number} [attempts] - Số lần đã thử gửi lại
 */

/**
 * Đọc toàn bộ queue từ file.
 * @returns {QueueItem[]}
 */
function readQueue() {
    if (!fs.existsSync(QUEUE_PATH)) return [];
    try {
        return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
    } catch (err) {
        console.error("[QUEUE] File queue bị lỗi định dạng, tạo mới:", err);
        return [];
    }
}

/**
 * Ghi đè queue ra file theo kiểu atomic (ghi file tmp rồi rename).
 * @param {QueueItem[]} queue
 */
function writeQueue(queue) {
    const tmpPath = QUEUE_PATH + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(queue, null, 2));
    fs.renameSync(tmpPath, QUEUE_PATH);
}

/**
 * Thêm 1 request thất bại vào queue để gửi lại sau.
 * @param {{ path: string, body: MessageBody }} item
 */
export function enqueueFailed(item) {
    const queue = readQueue();
    queue.push({ ...item, queuedAt: Date.now(), attempts: 0 });
    writeQueue(queue);
    console.error(`[QUEUE] Đã lưu order thất bại (msg_id: ${item.body?.msg_id})`);
}

/**
 * Duyệt toàn bộ queue và thử gửi lại từng item. Item nào vẫn fail
 * được giữ lại với số lần thử tăng lên cho lượt flush kế tiếp.
 * @returns {Promise<void>}
 */
export async function flushQueue() {
    const queue = readQueue();
    if (queue.length === 0) return;

    console.log(`[QUEUE] Đang thử gửi lại ${queue.length} order kẹt...`);
    /** @type {QueueItem[]} */
    const remaining = [];
    for (const item of queue) {
        try {
            await requestWithRetry(item.path, { method: "POST", body: JSON.stringify(item.body) }, 1);
            console.log(`[QUEUE] Gửi lại thành công: ${item.body?.msg_id}`);
        } catch {
            item.attempts = (item.attempts || 0) + 1;
            remaining.push(item);
        }
    }
    writeQueue(remaining);
}
