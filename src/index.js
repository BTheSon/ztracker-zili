import { getApi } from "./session.js";
import { initDirectory, attach } from "./watcher.js";
import { registerTargets } from "./targets.js";
import { ping } from "./api.js";
import { initSocket } from "./socket.js";

(async () => {
    initSocket();               // khởi tạo socket connection

    registerTargets();          // đăng ký tên cần nghe + callback

    const api = await getApi(); // login (QR lần đầu / cookie các lần sau)

    await initDirectory(api);   // load danh bạ, khớp tên -> uid
    attach(api);                // gắn listener gốc

    api.listener.start();
    await ping();               // đánh thức server

    console.log("Đang lắng nghe...");
})();