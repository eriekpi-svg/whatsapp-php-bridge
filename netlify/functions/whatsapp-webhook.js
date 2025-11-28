// Minimal Serverless Function for Netlify (JavaScript)

// --- KONSTANTA ---
const HOSTINGER_ENDPOINT = 'https://bintangcartravel.com/media/wa_receiver.php';'; 
const API_SECRET_KEY = 'Bintang_API_2025_KEY_RAHASIA'; // HARUS SAMA dengan di Hostinger!
const VERIFY_TOKEN = 'MySecretCRMToken2025'; // HARUS SAMA dengan di Meta!

// Fungsi utama yang dipanggil Netlify
exports.handler = async (event, context) => {
    
    // --- TAHAP VERIFIKASI (GET request) ---
    if (event.httpMethod === 'GET') {
        const params = event.queryStringParameters;
        const mode = params['hub.mode'];
        const token = params['hub.verify_token'];
        const challenge = params['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook Verified by Netlify!');
            return { statusCode: 200, body: challenge }; // Sukses verifikasi
        } else {
            return { statusCode: 403, body: 'Verification Token Mismatch.' };
        }
    }

    // --- TAHAP PESAN MASUK (POST request) ---
    if (event.httpMethod === 'POST') {
        try {
            const metaPayload = JSON.parse(event.body);
        
            // Data yang akan diteruskan ke Hostinger
            const dataToForward = {
                secret: API_SECRET_KEY, 
                payload: metaPayload     
            };

            // Lakukan POST ke Hostinger (menggunakan built-in fetch)
            const response = await fetch(HOSTINGER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToForward),
            });
            
            // Wajib merespon 200 OK ke Meta (melalui Netlify)
            return { statusCode: 200, body: 'Message forwarded successfully.' };
            
        } catch (error) {
            console.error('Error processing or forwarding:', error.message);
            // Tetap kirim 200 OK ke Meta, meskipun Hostinger gagal merespons
            return { statusCode: 200, body: 'Internal processing failed, but Meta acknowledged.' };
        }
    }
    
    return { statusCode: 400, body: 'Bad Request' };
};
