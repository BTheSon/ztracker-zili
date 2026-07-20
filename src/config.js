// @ts-check
import { fileURLToPath } from "url";

/** URL gốc của backend server */
export const BASE_URL = "https://ztracker-back.onrender.com";

/** Đường dẫn tuyệt đối đến file lưu session đăng nhập */
export const CREDENTIALS_PATH = fileURLToPath(new URL("../credentials.json", import.meta.url));

/** Đường dẫn tuyệt đối đến file ảnh QR đăng nhập */
export const QR_CODE_PATH = fileURLToPath(new URL("../qr.png", import.meta.url));

/** Đường dẫn tuyệt đối đến file hàng đợi gửi lại */
export const QUEUE_PATH = fileURLToPath(new URL("../failed_queue.json", import.meta.url));

/** Số lần retry tối đa khi gọi API thất bại */
export const MAX_RETRIES = 4;

/** Timeout mỗi request (ms) — Render cold start có thể tới 30-50s */
export const TIMEOUT_MS = 45_000;
