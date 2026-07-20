// @ts-check

/**
 * @typedef {Object} FormattedMessage
 * @property {string} type - Loại tin nhắn (text, photo, ...)
 * @property {string} text - Nội dung văn bản
 * @property {string|null} url - URL ảnh/tài liệu nếu có
 * @property {string|null} title - Tiêu đề đi kèm nếu có
 */

/**
 * Tạo chuỗi hiển thị từ FormattedMessage (dùng cho log).
 * @param {FormattedMessage} formatted
 * @returns {string}
 */
export function buildDisplayText(formatted) {
    let display = formatted.text;
    if (formatted.title) display += ` - ${formatted.title}`;
    if (formatted.url)   display += ` (URL: ${formatted.url})`;
    return display;
}
