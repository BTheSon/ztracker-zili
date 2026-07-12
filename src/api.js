// @ts-check
// const BASE_URL = "http://localhost:3000/api/"
const BASE_URL = "https://ztracker-back.onrender.com"



/**
 * 
 * @param {string} path 
 * @param {any} options 
 * @returns {Promise<Response>}
 */
async function api(path, options = {}) {
    const response = await fetch(new URL(path, BASE_URL), {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response;
}
/**
 * gửi file qr đăng nhập zalo
 * @param {string} fileBase64 
 */
export const send_qr_auth = async (fileBase64) => {
    try {
        const res = await api ("/worker/qr_code", {
            method: "POST",
            body: JSON.stringify({
                qrcode_base64: fileBase64
            })
        })

        return res.body
    } catch (err) {
        console.error('[API FETCH ERROR]', err);
    }

}

/**
 * @param {{type: string, text: string, url: string|null, title: string|null}} formatted
 * @param {string} msg_id
 * @returns {Promise<void>}
 */
export const send_msg = async (msg_id, formatted) => {
    try {
        const res = await api("/worker/messages",{
            method: "POST",
            body: JSON.stringify({
                msg_id: msg_id,
                ...formatted
            })
        })

        const json = await res.json();
        
        const gemini = json?.data?.geminiExtraction;
        console.log('[GEMINI EXTRACTION]', gemini);
    } catch (err) {
        console.error('[API FETCH ERROR]', err);
    }
}

/**
 * @param {string} msg_id
 * @returns {Promise<void>}
 */
export const delete_msg = async (msg_id) => {
    try {
        const res = await api("/worker/messsages/delete",{
            method: "POST",
            body: JSON.stringify({
                msg_id: msg_id,
            })
        })

        const json = await res.json();
        
        const rawtext = json?.msg;
        console.log('[GEMINI EXTRACTION]', rawtext);
    } catch (err) {
        console.error('[API FETCH ERROR]', err);
    }
}

/**
 * 
 * @param {string} msg_id 
 * @param {string} rIcon 
 */
export const reaction_msg = async(msg_id, rIcon) => {
    try {
        const res = await api("/worker/messages/reactions", {
            method: "POST",
            body: JSON.stringify({
                msg_id: msg_id,
                r_icon: rIcon
            })
        })
    }
    catch (err) {
        console.error("[API FETCH ERRR]: "+ err);
    }
}

export const ping = async() => {
    try {
        const res = await api("/api/ping", {method: "GET",})
        const pong = (await res.json()).message;

        console.log(pong);
    }
    catch (err) {
        console.error("Server is not ready." + err);
    }
}
