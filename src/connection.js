export function keepAlive(api) {
    api.listener.on("closed", () => {
        console.warn("Mất kết nối, bắt đầu thử kết nối lại...");
        reconnect(api);
    });
}

async function reconnect(api) {
    while (true) {
        const ok = await tryConnect(api);
        if (ok) {
            console.log("Đã kết nối lại thành công");
            return;
        }
        console.warn("Kết nối lại thất bại, thử lại sau 5s...");
        await new Promise((r) => setTimeout(r, 5000));
    }
}

function tryConnect(api) {
    return new Promise((resolve) => {
        const onConnected = () => { cleanup(); resolve(true); };
        const onClosed = () => { cleanup(); resolve(false); };
        const cleanup = () => {
            api.listener.off("connected", onConnected);
            api.listener.off("closed", onClosed);
        };

        api.listener.once("connected", onConnected);
        api.listener.once("closed", onClosed);

        try {
            api.listener.start({ retryOnClose: true });
        } catch {
            cleanup();
            resolve(false);
        }
    });
}