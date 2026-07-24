/**
 * @typedef {import("zca-js").API} API
 * @typedef {import("zca-js").Message} Message
 * @typedef {import("zca-js").Undo} Undo
 * @typedef {import("zca-js").Reaction} Reaction
 */

/**
 * Các callback xử lý sự kiện liên quan đến tin nhắn.
 * @typedef {Object} WatchCallbacks
 * @property {(msg: Message) => void} [onMessage] - Callback được gọi khi có tin nhắn mới.
 * @property {(undoMsg: Undo) => void} [onDelete] - Callback được gọi khi có tin nhắn bị thu hồi.
 * @property {(reactionMsg: Reaction) => void} [onReaction] - Callback được gọi khi có thả cảm xúc.
 */

const targetsToWatch = [];
const nameToIdMap = new Map();

/**
 * Đăng ký một mục tiêu (người dùng hoặc nhóm) để theo dõi các sự kiện tin nhắn.
 *
 * @param {string} name - Tên người dùng hoặc tên nhóm Zalo (sử dụng "*" để theo dõi tất cả).
 * @param {WatchCallbacks} callbacks - Các hàm callback xử lý sự kiện.
 * @returns {void}
 */
export function watch(name, callbacks) {
    targetsToWatch.push({ name, callbacks });
}

/**
 * Tải danh bạ bạn bè và danh sách nhóm từ Zalo, sau đó ánh xạ Tên -> ID.
 * Hàm này cần được gọi một lần khi khởi động để hệ thống nhận diện đúng mục tiêu theo tên.
 *
 * @param {API} api - Đối tượng API Zalo được trả về từ thư viện zca-js sau khi login.
 * @returns {Promise<void>} Hoàn thành khi tải xong danh bạ và nhóm.
 * @throws {Error} Ném lỗi nếu có vấn đề kết nối hoặc gọi API.
 */
export async function initDirectory(api) {
    try {
        console.log("Đang tải danh bạ và nhóm...");

        // Tải danh sách bạn bè
        const friends = await api.getAllFriends();
        if (Array.isArray(friends)) {
            for (const friend of friends) {
                if (friend.displayName && friend.userId) {
                    nameToIdMap.set(friend.displayName, String(friend.userId));
                }
                if (friend.zaloName && friend.userId) {
                    nameToIdMap.set(friend.zaloName, String(friend.userId));
                }
            }
        }

        // Tải danh sách nhóm (trả về gridVerMap chứa mapping groupId -> version)
        const groupsResponse = await api.getAllGroups();
        if (groupsResponse && groupsResponse.gridVerMap) {
            const groupIds = Object.keys(groupsResponse.gridVerMap);
            if (groupIds.length > 0) {
                const groupInfos = await api.getGroupInfo(groupIds);
                if (groupInfos && groupInfos.gridInfoMap) {
                    for (const [, group] of Object.entries(groupInfos.gridInfoMap)) {
                        if (group.name && group.groupId) {
                            nameToIdMap.set(group.name, String(group.groupId));
                        }
                    }
                }
            }
        }
        console.log(`Đã nạp xong danh bạ.`);
    } catch (error) {
        console.error("Lỗi khi tải danh bạ:", error);
    }
}

/**
 * Gắn các bộ lắng nghe sự kiện (listeners) vào đối tượng Zalo API.
 *
 * @param {API} api - Đối tượng API Zalo từ zca-js.
 * @returns {void}
 */
export function attach(api) {
    api.listener.on("message", (msg) => {
        triggerCallback("onMessage", msg);
    });

    api.listener.on("undo", (undoMsg) => {
        triggerCallback("onDelete", undoMsg);
    });

    api.listener.on("reaction", (reactionMsg) => {
        triggerCallback("onReaction", reactionMsg);
    });
}

/**
 * Kích hoạt callback tương ứng nếu sự kiện thuộc về mục tiêu đang theo dõi.
 *
 * @param {"onMessage" | "onDelete" | "onReaction"} callbackName
 * @param {any} event
 * @returns {void}
 */
function triggerCallback(callbackName, event) {
    const data = event.data || {};
    const threadId = String(event.threadId || data.groupId || data.uidFrom || data.threadId);

    for (const target of targetsToWatch) {
        const expectedId = nameToIdMap.get(target.name);

        // Nếu mục tiêu là "*" (nghe tất cả) hoặc tìm thấy ID khớp, tên khớp
        if (target.name === "*" || expectedId === threadId || data.dName === target.name || data.groupName === target.name) {
            if (target.callbacks && typeof target.callbacks[callbackName] === "function") {
                target.callbacks[callbackName](event);
            }
        }
    }
}
