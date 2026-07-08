// @ts-check

import { watch } from "./watcher.js";
import messageFormatter from "./messageFormatter.js";
import { send_msg } from "./api.js";

/**
 * Đăng ký các mục tiêu (người dùng hoặc nhóm) mà bot cần theo dõi.
 * Gọi hàm watch() cho từng mục tiêu cụ thể hoặc "*" để nghe tất cả.
 * 
 * @returns {void}
 */
export function registerTargets() {

    watch("[BoBo] SHIP BOBO", {
        onMessage: (msg) => {
            const data = messageFormatter.format(msg.data);
            
            console.log(`[MSG] ${msg.data.dName}: ${data}`);
        },
        onDelete: (undo) => {
            console.log(`[UNDO] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[REACT] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });

    watch("*", {
        onMessage: async (msg) => {
            const formatted = messageFormatter.format(msg.data);
            
            let display = formatted.text;
            if (formatted.title) display += ` - ${formatted.title}`;
            if (formatted.url) display += ` (URL: ${formatted.url})`;

            console.log(`[TẤT CẢ MSG] ${msg.data.dName || msg.data.uidFrom}: ${display}`);
            
            if (formatted.type == "photo" || formatted.type == "text")  {
                // gửi về server
                await send_msg(formatted);
            }
        },
        onDelete: (undo) => {
            console.log(`[TẤT CẢ UNDO] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[TẤT CẢ REACT] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });
}