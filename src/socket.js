import { io } from "socket.io-client";
import { BASE_URL } from "./config.js";

export const socket = io(BASE_URL, {
    autoConnect: false,
    auth: {
        type: "zalo-worker"
    }
});

export const initSocket = () => {
    socket.connect();

    socket.on("connect", () => {
        console.log(`[SOCKET] Đã kết nối tới server với ID: ${socket.id}`);
    });

    socket.on("disconnect", () => {
        console.log("[SOCKET] Đã ngắt kết nối với server");
    });

    socket.on("connect_error", (err) => {
        console.error(`[SOCKET] Lỗi kết nối: ${err.message}`);
    });
};

/**
 * Gửi sự kiện về server
 * @param {string} eventName Tên sự kiện
 * @param {any} data Dữ liệu
 */
export const emitToServer = (eventName, data) => {
    if (socket.connected) {
        socket.emit(eventName, data);
    } else {
        console.warn(`[SOCKET] Không thể gửi ${eventName}, chưa kết nối.`);
    }
};
