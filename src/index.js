import { getApi } from "./zalo/session.js";
import { initDirectory, attach } from "./zalo/watcher.js";
import { registerTargets } from "./zalo/targets.js";
import { keepAlive } from "./zalo/connection.js";

process.on("uncaughtException", (err) => {
    console.error("Lỗi không bắt được:", err);
    process.exit(1); // để run.sh (tầng 2) khởi động lại tiến trình mới
});

(async () => {
    registerTargets();

    const api = await getApi();
    await initDirectory(api);
    attach(api);

    keepAlive(api);                            // tầng 1: tự reconnect khi socket đóng
    api.listener.start({ retryOnClose: true }); // kết nối lần đầu

    console.log("Đang lắng nghe...");
})();