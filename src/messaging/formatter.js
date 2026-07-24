/**
 * Lớp cơ sở (Base Class) cho tất cả các chiến lược xử lý tin nhắn.
 * Mọi Strategy cụ thể đều kế thừa từ lớp này để đảm bảo tính đồng nhất.
 */
class BaseMessageStrategy {
    /**
     * @param {Object|string} content - Nội dung của tin nhắn.
     * @returns {{type: string, text: string, url: string|null, title: string|null}}
     */
    format(content) {
        return { type: "unknown", text: "[Không xác định]", url: null, title: null };
    }
}

class TextMessageStrategy extends BaseMessageStrategy {
    format(content) {
        return {
            type: "text",
            text: typeof content === "string" ? content : "(Văn bản không hợp lệ)",
            url: null,
            title: null
        };
    }
}

class PhotoMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const url = (typeof content === "object" && content !== null)
            ? (content.href || content.thumb || null)
            : null;
        return { type: "photo", text: "[Hình ảnh]", url, title: null };
    }
}

class FileMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const title = (typeof content === "object" && content !== null)
            ? (content.title || "Tài liệu không tên")
            : null;
        const url = (typeof content === "object" && content !== null)
            ? (content.href || null)
            : null;
        return { type: "file", text: "[File]", url, title };
    }
}

class VideoMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const url = (typeof content === "object" && content !== null)
            ? (content.href || content.thumb || null)
            : null;
        return { type: "video", text: "[Video]", url, title: null };
    }
}

class StickerMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const url = (typeof content === "object" && content !== null)
            ? (content.href || null)
            : null;
        return { type: "sticker_or_gif", text: "[Nhãn dán/GIF]", url, title: null };
    }
}

class VoiceMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const url = (typeof content === "object" && content !== null)
            ? (content.href || null)
            : null;
        return { type: "voice", text: "[Tin nhắn thoại]", url, title: null };
    }
}

class LinkMessageStrategy extends BaseMessageStrategy {
    format(content) {
        const title = (typeof content === "object" && content !== null)
            ? (content.title || "Liên kết")
            : null;
        const url = (typeof content === "object" && content !== null)
            ? (content.href || null)
            : null;
        return { type: "link", text: "[Liên kết]", url, title };
    }
}

/**
 * Lớp Context quản lý các chiến lược định dạng tin nhắn. (Design Pattern: Strategy)
 */
class MessageFormatterContext {
    constructor() {
        this.strategies = new Map();
        this.defaultStrategy = new BaseMessageStrategy();
    }

    /**
     * Đăng ký một chiến lược mới cho loại tin nhắn cụ thể.
     * @param {string} msgType - Loại tin nhắn (VD: "chat.photo")
     * @param {BaseMessageStrategy} strategy
     */
    registerStrategy(msgType, strategy) {
        this.strategies.set(msgType, strategy);
    }

    /**
     * Phân tích và định dạng tin nhắn dựa vào msgType.
     * @param {object} msgData - Đối tượng data của tin nhắn
     * @returns {{ type: string, text: string, url: string|null, title: string|null }}
     */
    format(msgData) {
        const strategy = this.strategies.get(msgData.msgType) || this.defaultStrategy;
        return strategy.format(msgData.content);
    }
}

// Khởi tạo và thiết lập các chiến lược
const messageFormatter = new MessageFormatterContext();

messageFormatter.registerStrategy("webchat",          new TextMessageStrategy());
messageFormatter.registerStrategy("chat.photo",       new PhotoMessageStrategy());
messageFormatter.registerStrategy("share.file",       new FileMessageStrategy());
messageFormatter.registerStrategy("chat.video.msg",   new VideoMessageStrategy());
messageFormatter.registerStrategy("chat.sticker",     new StickerMessageStrategy());
messageFormatter.registerStrategy("chat.gif",         new StickerMessageStrategy());
messageFormatter.registerStrategy("chat.voice",       new VoiceMessageStrategy());
messageFormatter.registerStrategy("chat.link",        new LinkMessageStrategy());
messageFormatter.registerStrategy("chat.recommended", new LinkMessageStrategy());

export default messageFormatter;
