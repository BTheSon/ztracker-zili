// @ts-check

import { watch } from "./watcher.js";
import messageFormatter from "./messageFormatter.js";
import { send_msg } from "./api/index.js";
import { buildDisplayText } from "./utils/display.js";

/**
 * Đăng ký các mục tiêu (người dùng hoặc nhóm) mà bot cần theo dõi.
 * Gọi hàm watch() cho từng mục tiêu cụ thể hoặc "*" để nghe tất cả.
 */
export function registerTargets() {

    watch("*", {
        onMessage: (msg) => {
            const formatted = messageFormatter.format(msg.data);
            console.log(`[MSG_ALL] ${msg.data.dName}: ${buildDisplayText(formatted)}`);
        },
        onDelete: (undo) => {
            console.log(`[UNDO_ALL] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[REACT_ALL] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });

    watch("[BoBo] SHIP BOBO", {
        onMessage: async (msg) => {
            const formatted = messageFormatter.format(msg.data);
            const display = buildDisplayText(formatted);
            console.log(`[BOBO] ${msg.data.dName || msg.data.uidFrom}: ${display}`);

            if (formatted.type === "photo" || formatted.type === "text") {
                await send_msg(msg.data.msgId, formatted);
            }
        },
        onDelete: (undo) => {
            console.log(`[BOBO] Tin nhắn ${undo.data.msgId} vừa bị thu hồi`);
        },
        onReaction: (r) => {
            console.log(`[BOBO] ${r.data.dName ?? r.data.uidFrom}: ${r.data.content.rIcon}`);
        },
    });
}