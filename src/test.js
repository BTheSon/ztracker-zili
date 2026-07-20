//@ts-check
import { send_msg } from "./api/index.js";
import messageFormatter from "./messageFormatter.js";
import { genRandomPicUrl } from "./randomPic.js";
import { buildDisplayText } from "./utils/display.js";

// Hàm sinh cấu trúc dữ liệu mô phỏng kết quả sau khi format
function generateMockFormattedData() {
    const isPhoto = true;

    // Lấy text được sinh ngẫu nhiên từ bộ generator
    // (Bóc tách chuỗi URL để lấy phần text gốc)
    const rawUrl = genRandomPicUrl();
    const cleanText = decodeURIComponent(rawUrl.split('?text=')[1] || "Tin nhắn trống");

    return {
        msgId: `msg_${Date.now()}`,
        sender: Math.random() > 0.3 ? "Khách hàng Quy Nhơn" : "User ẩn danh",
        formatted: {
            type: isPhoto ? "photo" : "text",
            text: cleanText,
            url: isPhoto ? rawUrl : null,
            title: isPhoto ? "Đơn hàng bằng ảnh" : null
        }
    };
}

async function SendOrderTest() {
    const { msgId, sender, formatted } = generateMockFormattedData();
    const display = buildDisplayText(formatted);
    console.log(`[TẤT CẢ MSG] ${sender}: ${display}`);

    if (formatted.type === "photo" || formatted.type === "text") {
        const result = await send_msg(msgId, formatted);
        if (result.success) {
            console.log(`✔️ Đã gửi thành công: ${msgId}`);
        } else {
            console.error(`❌ Gửi thất bại (đã vào queue): ${msgId} — ${result.error}`);
        }
    }
}

// Chạy vòng lặp test mỗi 30 giây
setInterval(SendOrderTest, 30000);
SendOrderTest();
console.log("🚀 Test script đã chạy. Dữ liệu ngẫu nhiên sẽ được gửi mỗi 30 giây...");