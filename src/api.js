// @ts-check

/**
 * @param {{type: string, text: string, url: string|null, title: string|null}} formatted
 * @returns {Promise<void>}
 */
export const send_msg = async (formatted) => {
    try {
        const res = await fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formatted),
        });

        if (!res.ok) {
            console.error('[API ERROR] status', res.status);
            return;
        }

        const json = await res.json();
        // mong đợi:
        // { success: true, data: { type, text, url, title, geminiExtraction: extractedInfo } }
        const gemini = json?.data?.geminiExtraction;
        console.log('[GEMINI EXTRACTION]', gemini);
    } catch (err) {
        console.error('[API FETCH ERROR]', err);
    }
}