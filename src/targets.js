import { watch } from "./watcher.js";

/**
 * Đăng ký các mục tiêu (người dùng hoặc nhóm) mà bot cần theo dõi.
 * Gọi hàm watch() cho từng mục tiêu cụ thể hoặc "*" để nghe tất cả.
 * 
 * @returns {void}
 */
export function registerTargets() {
    watch("Nhóm Đồ Án IT", {
        onMessage: (msg) => {
            const text = typeof msg.data.content === "string" ? msg.data.content : "(media/attachment)";
            console.log(`[MSG] ${msg.data.dName}: ${text}`);
        },
        onDelete: (undo) => {
            console.log(`[UNDO] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[REACT] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });

    // Thêm bao nhiêu tên tuỳ ý, mỗi tên 1 khối watch() riêng
    // watch("Nguyễn Văn A", { onMessage: (msg) => {...} });

    // Nghe TẤT CẢ thông báo/tin nhắn (mọi nhóm và người dùng)
    watch("*", {
        onMessage: (msg) => {
            const text = typeof msg.data.content === "string" ? msg.data.content : "(media/attachment)";
            console.log(`[TẤT CẢ MSG] ${msg.data.dName || msg.data.uidFrom}: ${text}`);
        },
        onDelete: (undo) => {
            console.log(`[TẤT CẢ UNDO] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[TẤT CẢ REACT] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });
}