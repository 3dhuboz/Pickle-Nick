<?php
/**
 * Pickle Nick - Server-Side Email Handler
 * Deploy this file to your SiteGround GoGeek hosting at /api/send-email.php
 * 
 * SMTP credentials can be configured two ways:
 * 1. From the Admin Settings panel (sent in request body as "smtp" object)
 * 2. As fallback defaults hardcoded below (edit these on the server)
 */

// ─── CORS Headers (allow your frontend domain) ───
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Replace * with your domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ─── Fallback SMTP defaults (used only if admin hasn't configured SMTP in Settings) ───
$DEFAULT_SMTP_HOST   = 'mail.picklenick.com';
$DEFAULT_SMTP_PORT   = 465;
$DEFAULT_SMTP_USER   = 'noreply@picklenick.com';
$DEFAULT_SMTP_PASS   = '';  // Set on server if not using admin config
$DEFAULT_SMTP_SECURE = 'ssl';

// ─── Parse Request ───
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['to']) || !isset($input['subject']) || !isset($input['html'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: to, subject, html']);
    exit;
}

$to       = filter_var($input['to'], FILTER_VALIDATE_EMAIL);
$subject  = strip_tags($input['subject']);
$html     = $input['html'];
$fromName = isset($input['fromName']) ? strip_tags($input['fromName']) : 'Pickle Nick';
$bcc      = isset($input['bcc']) ? filter_var($input['bcc'], FILTER_VALIDATE_EMAIL) : null;

// ─── Resolve SMTP config: request body > server defaults ───
$smtp = isset($input['smtp']) && is_array($input['smtp']) ? $input['smtp'] : [];
$smtpHost   = !empty($smtp['host'])   ? $smtp['host']            : $DEFAULT_SMTP_HOST;
$smtpPort   = !empty($smtp['port'])   ? intval($smtp['port'])    : $DEFAULT_SMTP_PORT;
$smtpUser   = !empty($smtp['user'])   ? $smtp['user']            : $DEFAULT_SMTP_USER;
$smtpPass   = !empty($smtp['pass'])   ? $smtp['pass']            : $DEFAULT_SMTP_PASS;
$smtpSecure = !empty($smtp['secure']) ? $smtp['secure']          : $DEFAULT_SMTP_SECURE;
$fromEmail  = isset($input['fromEmail']) ? filter_var($input['fromEmail'], FILTER_VALIDATE_EMAIL) : $smtpUser;

if (!$to) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid recipient email']);
    exit;
}

// ─── Build email message ───
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: {$fromName} <{$fromEmail}>\r\n";
$headers .= "Reply-To: {$fromEmail}\r\n";
if ($bcc) {
    $headers .= "Bcc: {$bcc}\r\n";
}
$headers .= "X-Mailer: PickleNick/1.0\r\n";

// ─── Send: try SMTP auth if credentials provided, else fall back to mail() ───
$success = false;
$errorMsg = '';

if (!empty($smtpPass)) {
    // Authenticated SMTP via fsockopen
    $prefix = ($smtpSecure === 'ssl') ? 'ssl://' : '';
    $conn = @fsockopen($prefix . $smtpHost, $smtpPort, $errno, $errstr, 15);
    
    if (!$conn) {
        $errorMsg = "SMTP connection failed: {$errstr} ({$errno})";
    } else {
        $resp = '';
        $smtpOk = true;
        
        $readResp = function() use ($conn) {
            $r = '';
            while ($line = fgets($conn, 512)) {
                $r .= $line;
                if (substr($line, 3, 1) === ' ') break;
            }
            return $r;
        };
        
        $sendCmd = function($cmd, $expectCode) use ($conn, $readResp, &$errorMsg, &$smtpOk) {
            if (!$smtpOk) return false;
            fwrite($conn, $cmd . "\r\n");
            $resp = $readResp();
            if (intval(substr($resp, 0, 3)) !== $expectCode) {
                $errorMsg = "SMTP error on '{$cmd}': {$resp}";
                $smtpOk = false;
                return false;
            }
            return true;
        };
        
        // Read greeting
        $readResp();
        
        // EHLO
        $sendCmd("EHLO " . gethostname(), 250);
        
        // STARTTLS for port 587
        if ($smtpOk && $smtpSecure === 'tls') {
            $sendCmd("STARTTLS", 220);
            if ($smtpOk) {
                stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $sendCmd("EHLO " . gethostname(), 250);
            }
        }
        
        // AUTH LOGIN
        if ($smtpOk) {
            $sendCmd("AUTH LOGIN", 334);
            $sendCmd(base64_encode($smtpUser), 334);
            $sendCmd(base64_encode($smtpPass), 235);
        }
        
        // MAIL FROM / RCPT TO / DATA
        if ($smtpOk) {
            $sendCmd("MAIL FROM:<{$fromEmail}>", 250);
            $sendCmd("RCPT TO:<{$to}>", 250);
            if ($bcc) $sendCmd("RCPT TO:<{$bcc}>", 250);
            $sendCmd("DATA", 354);
            
            // Build raw message
            $msg  = "To: {$to}\r\n";
            $msg .= "Subject: {$subject}\r\n";
            $msg .= $headers;
            $msg .= "\r\n{$html}\r\n.\r\n";
            
            fwrite($conn, $msg);
            $dataResp = $readResp();
            if (intval(substr($dataResp, 0, 3)) !== 250) {
                $errorMsg = "SMTP DATA error: {$dataResp}";
                $smtpOk = false;
            }
        }
        
        fwrite($conn, "QUIT\r\n");
        fclose($conn);
        $success = $smtpOk;
    }
} else {
    // No SMTP password — use PHP mail() (SiteGround handles routing natively)
    $success = mail($to, $subject, $html, $headers);
    if (!$success) {
        $lastError = error_get_last();
        $errorMsg = $lastError ? $lastError['message'] : 'mail() returned false';
    }
}

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Mail delivery failed. Check SMTP configuration in admin Settings.',
        'debug' => $errorMsg
    ]);
}
?>
