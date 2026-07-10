import { Zalo } from "zca-js";
import fs from "fs";

const CREDENTIALS_PATH = "./credentials.json";
const QR_CODE_GEN_PATH = "/storage/emulated/0/Download/qr.png";

/**
 * @typedef {import("zca-js").API} API
 */

/**
 * Khởi tạo đối tượng Zalo và đăng nhập để lấy API instance.
 * Nếu đã có file credentials (lưu cookie), sẽ đăng nhập bằng cookie.
 * Nếu cookie hết hạn hoặc chưa có file, sẽ yêu cầu quét mã QR để đăng nhập mới.
 * 
 * @returns {Promise<API>} Đối tượng API từ zca-js, dùng để thực hiện các thao tác Zalo.
 * @throws {Error} Ném lỗi nếu quét mã QR thất bại hoặc hệ thống không thể khởi tạo Zalo.
 */
export async function getApi() {
    const zalo = new Zalo({ selfListen: false, checkUpdate: true, logging: true });

    if (fs.existsSync(CREDENTIALS_PATH)) {
        console.log("Đã có session, đăng nhập lại bằng cookie...");
        const { cookie, imei, userAgent } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
        try {
            return await zalo.login({ cookie, imei, userAgent });
        } catch (err) {
            console.log("Session hết hạn, cần quét QR lại:", err.message);
            fs.unlinkSync(CREDENTIALS_PATH);
        }
    }

    console.log("Chưa có session, quét QR để đăng nhập...");
    const api = await zalo.loginQR({ qrPath:  QR_CODE_GEN_PATH});

    const ctx = api.getContext();
    fs.writeFileSync(
        CREDENTIALS_PATH,
        JSON.stringify({ cookie: ctx.cookie.toJSON(), imei: ctx.imei, userAgent: ctx.userAgent }, null, 2),
    );
    console.log("Đã lưu session vào", CREDENTIALS_PATH);

    return api;
}