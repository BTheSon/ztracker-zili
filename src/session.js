import { LoginQRCallbackEventType, Zalo } from "zca-js";
import fs from "fs";
import path from "path";
import { send_qr_auth } from "./api/index.js";
import { CREDENTIALS_PATH, QR_CODE_PATH } from "./config.js";

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
    const zalo = new Zalo({ selfListen: true, checkUpdate: true, logging: true });

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
    const api = await zalo.loginQR({ qrPath: QR_CODE_PATH }, async (event) => {
        switch (event.type) {
            case LoginQRCallbackEventType.QRCodeGenerated: {
                const result = await send_qr_auth(event.data.image);
                console.log("[AUTH LOG]: " + result);
                break;
            }

            case LoginQRCallbackEventType.QRCodeExpired: {
                console.log("Mã QR đã hết hạn, tự động tạo lại...");
                event.actions.retry();
                break;
            }

            case LoginQRCallbackEventType.QRCodeScanned: {
                console.log(`Đã quét bởi: ${event.data.display_name}`);
                console.log(`Avatar: ${event.data.avatar}`);
                console.log("Đang chờ xác nhận đăng nhập trên điện thoại...");
                break;
            }

            case LoginQRCallbackEventType.QRCodeDeclined: {
                console.log("Người dùng đã từ chối đăng nhập trên điện thoại. Mã:", event.data.code);
                break;
            }

            case LoginQRCallbackEventType.GotLoginInfo: {
                console.log("Đã lấy được thông tin đăng nhập (imei/userAgent/cookie)");
                break;
            }
        }
    });

    const ctx = api.getContext();
    const dir = path.dirname(CREDENTIALS_PATH);
    fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(
        CREDENTIALS_PATH,
        JSON.stringify({ cookie: ctx.cookie.toJSON(), imei: ctx.imei, userAgent: ctx.userAgent }, null, 2),
    );
    console.log("Đã lưu session vào", CREDENTIALS_PATH);

    return api;
}