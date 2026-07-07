# Kế hoạch: Zalo Bot theo dõi đoạn chat theo tên (zca-js + JavaScript)

> Ngôn ngữ: **JavaScript (Node.js, ESM)** — ưu tiên tốc độ ra MVP, không dùng TypeScript ở giai đoạn này.
> Thư viện: [`zca-js`](https://github.com/RFS-ADRENO/zca-js) — Unofficial Zalo API.

---

## 1. Mục tiêu chức năng

- [x] Đăng nhập Zalo: QR lần đầu, các lần sau dùng cookie đã lưu (đã hoàn thành).
- [ ] Đăng ký danh sách **tên đoạn chat** cần lắng nghe, kèm callback riêng cho từng tên (Observer pattern).
- [ ] Khi khởi động (init): load toàn bộ danh sách nhóm/bạn bè, đối chiếu với danh sách tên đã đăng ký, build bảng ánh xạ `tên -> danh sách uid`.
- [ ] Bắt sự kiện tin nhắn mới trong các đoạn chat đã đăng ký.
- [ ] Bắt sự kiện tin nhắn bị thu hồi/xóa (`undo`), đối chiếu nội dung gốc đã lưu trước đó.
- [ ] Bắt trạng thái tin nhắn: đã gửi tới / đã xem (`delivered_messages`, `seen_messages`).
- [ ] Bắt sự kiện reaction (thả cảm xúc), decode loại icon sang tên dễ đọc.

---

## 2. Cấu trúc dự án (JS thuần, MVP)

```
zalo-bot/
├── src/
│   ├── auth/
│   │   └── session.js          # login QR lần đầu / cookie các lần sau
│   ├── core/
│   │   ├── chatDirectory.js     # load danh bạ, build map tên -> uid
│   │   ├── observerRegistry.js  # đăng ký callback theo tên (Observer/Subject)
│   │   └── eventRouter.js       # gắn vào api.listener, dispatch tới observer
│   ├── store/
│   │   └── messageHistory.js    # lưu tạm msgId -> content (phục vụ tra cứu khi undo)
│   ├── features/
│   │   ├── onMessage.js         # xử lý nghiệp vụ khi có tin nhắn mới
│   │   ├── onUndo.js            # xử lý khi tin nhắn bị thu hồi
│   │   ├── onReaction.js        # xử lý khi có reaction, decode icon
│   │   └── onStatus.js          # xử lý delivered/seen
│   ├── config/
│   │   └── targets.js           # danh sách tên đoạn chat cần theo dõi + callback
│   └── index.js                  # entry point, ghép mọi thứ, start listener
├── credentials.json               # session đã lưu (gitignore)
├── package.json
└── .gitignore
```

---

## 3. Kiến trúc Observer Pattern cho việc theo dõi theo tên

### 3.1. `ChatDirectory` (core/chatDirectory.js)

Nhiệm vụ: chạy **một lần lúc init**.

1. Gọi `api.getAllGroups()` → lấy danh sách `groupId`.
2. Gọi `api.getGroupInfo(groupIds)` → lấy `{groupId, name}` cho từng nhóm.
3. Gọi `api.getAllFriends()` → lấy `{userId, displayName}` cho từng bạn.
4. Chuẩn hoá tên (`trim().toLowerCase()`), so khớp với danh sách tên đã đăng ký trong `ObserverRegistry`.
5. Build 2 bảng:
   - `nameToUids: Map<string, string[]>` — 1 tên có thể ứng với nhiều uid (trùng tên).
   - `uidToName: Map<string, string>` — bảng ngược, tra nhanh khi có event thô (event chỉ có `threadId`).
6. Tên nào đăng ký mà không tìm thấy trong danh bạ → log cảnh báo, không throw lỗi (để không chặn các tên khác vẫn hoạt động).

### 3.2. `ObserverRegistry` (core/observerRegistry.js)

Cấu trúc dữ liệu thuần, không phụ thuộc `zca-js` → dễ test độc lập.

```
Map<tên, Map<loại_event, Set<callback>>>
```

API công khai:
- `on(name, eventType, callback)` — đăng ký quan tâm.
- `off(name, eventType, callback)` — huỷ đăng ký.
- `getCallbacks(name, eventType)` — nội bộ, `EventRouter` dùng để lấy callback cần gọi.

`eventType` gồm: `"message"`, `"undo"`, `"reaction"`, `"delivered"`, `"seen"`.

### 3.3. `EventRouter` (core/eventRouter.js)

Gắn **đúng 1 lần** vào 5 event gốc của `api.listener`:
`message`, `undo`, `reaction`, `delivered_messages`, `seen_messages`.

Mỗi handler gốc chỉ làm 1 việc: lấy `threadId` từ payload, gọi `dispatch(eventType, threadId, payload)`.

`dispatch()` — phần logic khó diễn giải bằng lời, demo nhỏ:

```js
function dispatch(eventType, threadId, payload) {
    const name = uidToName.get(threadId);
    if (!name) return; // không phải đoạn chat đang theo dõi

    const callbacks = registry.getCallbacks(name, eventType);
    for (const cb of callbacks) cb(payload, threadId, name);
}
```

---

## 4. Luồng hoạt động (init → runtime)

**Init:**
1. `config/targets.js` gọi `registry.on(tên, eventType, callback)` cho từng tên quan tâm — đăng ký **trước** khi build danh bạ.
2. `chatDirectory.build(api, registry)` chạy, tạo `nameToUids` / `uidToName`.
3. `eventRouter.attach(api, registry, uidToName)` — gắn 5 listener gốc.
4. `api.listener.start()`.

**Runtime:**
1. `zca-js` bắn event thô (có `threadId`).
2. `EventRouter` tra `uidToName` → ra tên.
3. Không khớp → bỏ qua. Khớp → tra `registry.getCallbacks(tên, eventType)` → gọi từng callback.
4. Nếu 2 đoạn chat trùng tên → cả 2 cùng kích hoạt callback; callback nhận thêm `threadId` để tự phân biệt nếu cần.

---

## 5. Tính năng bổ trợ: lưu lịch sử tin nhắn (phục vụ `undo`)

Zalo **không gửi lại nội dung gốc** trong event `undo`, chỉ có `msgId`. Vì vậy:

- `store/messageHistory.js`: Map trong bộ nhớ (MVP) `msgId -> {content, threadId, dName, ts}`, giới hạn dung lượng (VD: giữ tối đa 5000 tin gần nhất, hoặc TTL vài giờ) để tránh phình RAM.
- `features/onMessage.js`: mỗi khi có tin nhắn mới → lưu vào `messageHistory` trước, rồi mới gọi callback nghiệp vụ.
- `features/onUndo.js`: khi có `undo` → tra `messageHistory.get(msgId)` để lấy lại nội dung gốc, log/thông báo "tin nhắn X đã bị thu hồi, nội dung: ...".

> Giai đoạn sau (không phải MVP): thay Map bộ nhớ bằng SQLite/lowdb để không mất dữ liệu khi restart.

---

## 6. Ghi chú / rủi ro cần theo dõi

| Vấn đề | Ảnh hưởng | Hướng xử lý (giai đoạn sau) |
|---|---|---|
| Nhóm đổi tên sau khi init | Không ảnh hưởng dispatch (dựa vào `uid`), chỉ tên hiển thị cũ trong log | Thêm `chatDirectory.rebuild()` chạy định kỳ hoặc theo `group_event` |
| Đoạn chat mới tạo sau init | Không tự phát hiện, không có trong `uidToName` | Poll định kỳ `getAllGroups()`, hoặc lắng nghe `group_event` để trigger rebuild một phần |
| Trùng tên đoạn chat | 1 tên có thể trỏ nhiều `uid` | `nameToUids` là list; khuyến nghị cấu hình theo `threadId` trực tiếp nếu phát hiện trùng |
| Reaction icon dạng mã ký tự lạ (VD `/-heart`, `:>`) | Khó đọc log | Bảng dịch `Reactions` enum -> tên tiếng Việt trong `features/onReaction.js` |
| `delivered_messages`/`seen_messages` chỉ áp dụng cho tin **tự gửi** | Không dùng để tra trạng thái tin nhắn bất kỳ | Ghi rõ giới hạn này trong tài liệu nội bộ, tránh kỳ vọng sai |

---

## 7. Thứ tự triển khai MVP

1. `observerRegistry.js` — thuần cấu trúc dữ liệu, viết + test độc lập trước tiên.
2. `chatDirectory.js` — load danh bạ, build map, log các tên không khớp.
3. `eventRouter.js` — gắn 5 listener gốc, forward vào `dispatch()`.
4. `config/targets.js` — đăng ký thử 1 tên thật + callback `console.log` để verify toàn chuỗi chạy đúng.
5. `store/messageHistory.js` + `features/onMessage.js`, `features/onUndo.js` — tính năng thu hồi tin nhắn.
6. `features/onReaction.js` — decode `Reactions` enum.
7. `features/onStatus.js` — delivered/seen (thấp ưu tiên nhất, giá trị thấp nhất cho MVP).

---

## 8. Danh sách package cần cài

```bash
npm install zca-js
```

Không cần TypeScript, `ts-node`, hay build step — chạy thẳng bằng Node.js (`"type": "module"` trong `package.json` để dùng `import`/`export`).