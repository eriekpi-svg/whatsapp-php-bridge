<?php
// ==============================================================================
// 1. PENGATURAN KONSTANTA
// ==============================================================================
// Harus sama dengan yang Anda set di Meta Console
define('VERIFY_TOKEN', 'MySecretCRMToken2025'); 
// Harus sama dengan yang Anda set di process_message.php
define('API_SECRET_KEY', 'Bintang_API_2025_KEY_RAHASIA'); 
// URL Endpoint Hostinger Anda
define('HOSTINGER_ENDPOINT', 'https://bintangcartravel.com/whatsapp_handler/process_message.php'); 

// Set zona waktu dan log file
date_default_timezone_set('Asia/Jakarta');
$log_file = 'heroku_log.txt'; // File log sementara di Heroku

// ==============================================================================
// 2. TAHAP VERIFIKASI (GET request dari Meta)
// ==============================================================================
if (isset($_GET['hub_mode']) && $_GET['hub_mode'] == 'subscribe') {
    $challenge = $_GET['hub_challenge'] ?? '';
    $verify_token = $_GET['hub_verify_token'] ?? '';

    if ($verify_token === VERIFY_TOKEN) {
        file_put_contents($log_file, date('Y-m-d H:i:s') . " - SUCCESS: Webhook Verified.\n", FILE_APPEND);
        // Wajib: Mengulang challenge
        echo $challenge;
        exit;
    } else {
        file_put_contents($log_file, date('Y-m-d H:i:s') . " - FAILURE: Token mismatch.\n", FILE_APPEND);
        http_response_code(403);
        die("Verification Token Mismatch.");
    }
}

// ==============================================================================
// 3. TAHAP PENERIMAAN PESAN & FORWARDING (POST request dari Meta)
// ==============================================================================

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = file_get_contents('php://input');
    
    // Data yang akan kita teruskan ke Hostinger
    $data_to_forward = [
        'secret' => API_SECRET_KEY, // Kunci rahasia kita
        'payload' => json_decode($input, true) // Payload mentah dari Meta
    ];
    
    // --- Lakukan POST ke Hostinger menggunakan cURL ---
    $ch = curl_init(HOSTINGER_ENDPOINT);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data_to_forward));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data_to_forward))
    ]);

    $result = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Log hasil forwarding ke file log Heroku
    file_put_contents($log_file, date('Y-m-d H:i:s') . " - POST Forwarded. Hostinger response code: " . $httpcode . " | Result: " . $result . "\n", FILE_APPEND);

    // Wajib: Merespons 200 OK ke Meta agar pesan tidak diulang
    http_response_code(200);
    die('Message forwarded and acknowledged.');
}

// Jika diakses sembarangan
http_response_code(400); 
?>