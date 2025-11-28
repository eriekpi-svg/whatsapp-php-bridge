// Minimal Serverless Function for Netlify (JavaScript)
const fetch = require('node-fetch');

// --- KONSTANTA UTAMA ---
// Token untuk Verifikasi di Meta Console
const VERIFY_TOKEN = 'MySecretCRMToken2025'; 
// API Secret Key untuk otorisasi POST ke Hostinger (HARUS SAMA dengan di wa_receiver.php)
const API_SECRET_KEY = 'Bintang_API_2025_KEY_RAHASIA';
// Hostinger Endpoint (Sudah di-update untuk Firewall Bypass)
const HOSTINGER_ENDPOINT = 'https://bintangcartravel.com/media/wa_receiver.php'; 


exports.handler = async (event, context) => {
    // 1. PENANGANAN VERIFIKASI DARI META (GET Request)
    if (event.httpMethod === 'GET') {
        const query = event.queryStringParameters;
        const mode = query['hub.mode'];
        const token = query['hub.verify_token'];
        const challenge = query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('Webhook Verified by Netlify!');
                // Mengirim kembali challenge yang diminta Meta
                return {
                    statusCode: 200,
                    body: challenge,
                };
            } else {
                return {
                    statusCode: 403, // Forbidden
                    body: 'Verification token mismatch.',
                };
            }
        }
    }

    // 2. PENANGANAN PESAN MASUK DARI META (POST Request)
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);

            // Menambahkan Secret Key ke payload sebelum diteruskan ke Hostinger
            const payload = {
                secret: API_SECRET_KEY,
                payload: body
            };

            const hostingerResponse = await fetch(HOSTINGER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Baca respons dari Hostinger
            const hostingerResponseText = await hostingerResponse.text();

            console.log(`POST Forwarded. Hostinger response code: ${hostingerResponse.status} | Result: ${hostingerResponseText}`);

            // Mengirim respons 200 ke Meta, memberi tahu bahwa pesan telah diterima
            return {
                statusCode: 200,
                body: 'EVENT_RECEIVED'
            };

        } catch (error) {
            console.error('Error processing POST request:', error);
            // Mengirim respons 500 ke Meta jika ada error di fungsi Netlify
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to process request in Netlify' })
            };
        }
    }

    // Jika method lain
    return {
        statusCode: 405, // Method Not Allowed
        body: 'Method Not Allowed'
    };
};
