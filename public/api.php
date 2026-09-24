<?php
/**
 * Youmi production API - PHP/MySQL, InfinityFree compatible.
 * Includes:
 * - Authentication
 * - Admin authentication
 * - Merchant authentication
 * - Stores / Products / Orders / Coupons / Subscriptions
 * - Tenant databases
 * - Platform settings
 * - Password recovery by email verification code
 */

/*
|--------------------------------------------------------------------------
| Error Protection
|--------------------------------------------------------------------------
*/

error_reporting(E_ALL);

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');

/*
|--------------------------------------------------------------------------
| Prevent accidental output from breaking JSON
|--------------------------------------------------------------------------
*/

ob_start();

/*
|--------------------------------------------------------------------------
| JSON Header
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigin = $origin ?: (
    (($_SERVER['HTTPS'] ?? '') !== 'off')
        ? ('https://' . ($_SERVER['HTTP_HOST'] ?? ''))
        : ('http://' . ($_SERVER['HTTP_HOST'] ?? ''))
);

header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

/*
|--------------------------------------------------------------------------
| OPTIONS / CORS preflight
|--------------------------------------------------------------------------
*/

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {

    http_response_code(204);

    if (ob_get_length()) {
        ob_end_clean();
    }

    exit;
}

/*
|--------------------------------------------------------------------------
| Global PHP Exception Protection
|--------------------------------------------------------------------------
*/

set_exception_handler(function (Throwable $e) {

    if (ob_get_length()) {
        ob_clean();
    }

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }

    http_response_code(500);

    echo json_encode([
        'status' => 'error',
        'message' => 'خطأ PHP في الخادم.',
        'debug' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

    exit;
});

/*
|--------------------------------------------------------------------------
| Fatal / Parse Error Protection
|--------------------------------------------------------------------------
*/

register_shutdown_function(function () {

    $e = error_get_last();

    if (
        $e &&
        in_array(
            $e['type'],
            [
                E_ERROR,
                E_CORE_ERROR,
                E_COMPILE_ERROR,
                E_PARSE
            ],
            true
        )
    ) {

        if (ob_get_length()) {
            ob_clean();
        }

        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }

        http_response_code(500);

        echo json_encode([
            'status' => 'error',
            'message' => 'حدث خطأ داخلي في الخادم.',
            'debug' => $e['message'],
            'file' => basename($e['file']),
            'line' => $e['line']
        ], JSON_UNESCAPED_UNICODE);
    }
});
|--------------------------------------------------------------------------
| PHP session
|--------------------------------------------------------------------------
*/

session_name('YOUMI_SESSION');

session_set_cookie_params([
    'httponly' => true,
    'secure' => (($_SERVER['HTTPS'] ?? '') !== 'off'),
    'samesite' => 'Lax',
    'path' => '/'
]);

session_start();

/*
|--------------------------------------------------------------------------
| Runtime error protection
|--------------------------------------------------------------------------
*/

register_shutdown_function(function () {

    $e = error_get_last();

    if (
        $e &&
        in_array(
            $e['type'],
            [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR],
            true
        )
    ) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }

        http_response_code(500);

        echo json_encode([
            'status' => 'error',
            'message' => 'حدث خطأ داخلي في الخادم.'
        ], JSON_UNESCAPED_UNICODE);
    }
});

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function out($data, $code = 200)
{
    http_response_code($code);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

function body()
{
    $d = json_decode(
        file_get_contents('php://input'),
        true
    );

    return is_array($d) ? $d : [];
}

function cfg()
{
    $p = __DIR__ . '/config.php';

    if (!file_exists($p)) {
        out([
            'status' => 'error',
            'message' => 'أنشئ public/config.php من config.example.php أولاً.'
        ], 500);
    }

    $c = require $p;

    foreach (['host', 'dbname', 'user', 'pass'] as $k) {
        if (!array_key_exists($k, $c)) {
            out([
                'status' => 'error',
                'message' => 'إعداد قاعدة البيانات ناقص.'
            ], 500);
        }
    }

    return $c;
}

function db()
{
    static $pdo = null;

    if ($pdo) {
        return $pdo;
    }

    $c = cfg();

    try {

        $pdo = new PDO(
            "mysql:host={$c['host']};dbname={$c['dbname']};charset=utf8mb4",
            $c['user'],
            $c['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );

    } catch (Throwable $e) {

        out([
            'status' => 'error',
            'message' => 'تعذر الاتصال بقاعدة البيانات.'
        ], 500);
    }

    return $pdo;
}

function user()
{
    return $_SESSION['user'] ?? null;
}

function requireUser($roles = [])
{
    $u = user();

    if (!$u) {
        out([
            'status' => 'error',
            'message' => 'يجب تسجيل الدخول أولاً.'
        ], 401);
    }

    if (
        $roles &&
        !in_array($u['role'], $roles, true)
    ) {
        out([
            'status' => 'error',
            'message' => 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
        ], 403);
    }

    if (
        $u['role'] === 'merchant' &&
        ($u['status'] ?? 'active') === 'suspended'
    ) {
        out([
            'status' => 'error',
            'message' => 'حساب البائع موقوف.'
        ], 403);
    }

    return $u;
}

function publicUser($u)
{
    return [
        'id' => $u['id'],
        'name' => $u['name'],
        'phone' => $u['phone'] ?? null,
        'companyName' => $u['company_name'] ?? null,
        'role' => $u['role'],
        'status' => $u['status'] ?? 'active',
        'isLoggedIn' => true
    ];
}

/*
|--------------------------------------------------------------------------
| Password recovery helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize Algerian phone number.
 *
 * Examples:
 * 0669964145
 * 669964145
 * +213669964145
 * 00213669964145
 *
 * Result:
 * 0669964145
 */
function normalizePhone($phone)
{
    $phone = trim((string)$phone);

    $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

    if (strpos($phone, '+213') === 0) {
        $phone = '0' . substr($phone, 4);
    } elseif (strpos($phone, '00213') === 0) {
        $phone = '0' . substr($phone, 5);
    } elseif (strpos($phone, '213') === 0 && strlen($phone) >= 11) {
        $phone = '0' . substr($phone, 3);
    } elseif (strlen($phone) === 9 && $phone[0] !== '0') {
        $phone = '0' . $phone;
    }

    return $phone;
}

/**
 * Generate a 6 digit verification code.
 */
function generateResetCode()
{
    return str_pad(
        (string)random_int(0, 999999),
        6,
        '0',
        STR_PAD_LEFT
    );
}

/**
 * Send password reset code by email.
 *
 * InfinityFree hosting may restrict PHP mail().
 * The function still attempts to send the email normally.
 */
function sendResetCodeByEmail($email, $code, $name = '')
{
    $email = trim((string)$email);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $subject = 'Youmi - رمز استعادة كلمة المرور';

    $safeName = htmlspecialchars(
        $name ?: 'عضو Youmi',
        ENT_QUOTES,
        'UTF-8'
    );

    $message = "
<html>
<head>
<meta charset=\"UTF-8\">
</head>
<body dir=\"rtl\" style=\"font-family:Arial,sans-serif;\">
    <h2>استعادة كلمة المرور - Youmi</h2>

    <p>مرحباً {$safeName}،</p>

    <p>
        لقد طلبت استعادة كلمة المرور لحسابك في منصة
        <strong>Youmi</strong>.
    </p>

    <p>
        رمز التحقق الخاص بك هو:
    </p>

    <div style=\"
        font-size:32px;
        font-weight:bold;
        letter-spacing:8px;
        padding:15px;
        background:#f5f5f5;
        text-align:center;
        border-radius:10px;
        margin:20px 0;
    \">
        {$code}
    </div>

    <p>
        هذا الرمز صالح لمدة <strong>10 دقائق</strong>.
    </p>

    <p>
        إذا لم تطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة.
    </p>

    <hr>

    <p>
        Youmi - سوق تجارة الجملة والربط المباشر بالجزائر
    </p>
</body>
</html>
";

    $headers = [];

    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: Youmi <noreply@youmi.wuaze.com>';
    $headers[] = 'Reply-To: noreply@youmi.wuaze.com';
    $headers[] = 'X-Mailer: PHP/' . phpversion();

    $headersString = implode("\r\n", $headers);

    return @mail(
        $email,
        '=?UTF-8?B?' . base64_encode($subject) . '?=',
        $message,
        $headersString
    );
}

/*
|--------------------------------------------------------------------------
| Database installation
|--------------------------------------------------------------------------
*/

function install()
{
    $p = db();

    $sql = [

        "CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(40),
            email VARCHAR(190),
            company_name VARCHAR(190),
            role ENUM('buyer','merchant','admin') NOT NULL DEFAULT 'buyer',
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            password_hash VARCHAR(255),
            created_at DATETIME NOT NULL,
            UNIQUE KEY uq_email(email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS stores (
            id VARCHAR(64) PRIMARY KEY,
            slug VARCHAR(150) NOT NULL UNIQUE,
            name VARCHAR(190) NOT NULL,
            merchant_user_id VARCHAR(64),
            data LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(merchant_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(64) PRIMARY KEY,
            store_id VARCHAR(64) NOT NULL,
            sku VARCHAR(120),
            title VARCHAR(255) NOT NULL,
            price DECIMAL(14,2) NOT NULL DEFAULT 0,
            stock INT NOT NULL DEFAULT 0,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(store_id),
            INDEX(sku)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            store_id VARCHAR(64) NOT NULL,
            customer_user_id VARCHAR(64),
            status VARCHAR(60) NOT NULL,
            total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
            data LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(store_id),
            INDEX(status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS coupons (
            id VARCHAR(64) PRIMARY KEY,
            store_id VARCHAR(64) NOT NULL,
            code VARCHAR(80) NOT NULL,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            UNIQUE KEY uq_store_code(store_id,code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS subscriptions (
            id VARCHAR(64) PRIMARY KEY,
            store_id VARCHAR(64) NOT NULL,
            status VARCHAR(60) NOT NULL,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            UNIQUE KEY uq_sub_store(store_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS settings (
            k VARCHAR(100) PRIMARY KEY,
            v LONGTEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS tenant_databases (
            store_id VARCHAR(64) PRIMARY KEY,
            db_host VARCHAR(255) NOT NULL,
            db_name VARCHAR(190) NOT NULL,
            db_user VARCHAR(190) NOT NULL,
            db_pass TEXT NOT NULL,
            enabled TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($sql as $q) {
        $p->exec($q);
    }

    try {
        $p->exec(
            "ALTER TABLE users
             ADD COLUMN status VARCHAR(30)
             NOT NULL DEFAULT 'active'"
        );
    } catch (Throwable $e) {
        // Column already exists.
    }

    /*
    |--------------------------------------------------------------------------
    | Bootstrap admin
    |--------------------------------------------------------------------------
    */

    $adminUsername = 'aymen';
    $adminPhone = '0669964145';

    $adminPasswordHash =
        '$2y$12$z7SqtIX3s696apMyWckg/ei0HuRrcBU0W/KFUoKgd9oaFBk1/JSgS';

    $q = $p->prepare(
        "SELECT id
         FROM users
         WHERE role='admin'
         AND name=?
         LIMIT 1"
    );

    $q->execute([$adminUsername]);

    $admin = $q->fetch();

    if (!$admin) {

        $q = $p->query(
            "SELECT id
             FROM users
             WHERE role='admin'
             ORDER BY created_at ASC
             LIMIT 1"
        );

        $admin = $q->fetch();
    }

    if (!$admin) {

        $p->prepare(
            "INSERT INTO users
            (
                id,
                name,
                phone,
                email,
                role,
                status,
                password_hash,
                created_at
            )
            VALUES (?,?,?,?,?,?,?,?)"
        )->execute([
            'admin-' . bin2hex(random_bytes(5)),
            $adminUsername,
            $adminPhone,
            $adminUsername,
            'admin',
            'active',
            $adminPasswordHash,
            date('Y-m-d H:i:s')
        ]);

    } else {

        $p->prepare(
            "UPDATE users
             SET name=?,
                 phone=?,
                 email=?,
                 status='active',
                 password_hash=?
             WHERE id=?
             AND role='admin'"
        )->execute([
            $adminUsername,
            $adminPhone,
            $adminUsername,
            $adminPasswordHash,
            $admin['id']
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Demo buyer
    |--------------------------------------------------------------------------
    */

    $q = $p->prepare(
        "SELECT id
         FROM users
         WHERE phone=?
         LIMIT 1"
    );

    $q->execute(['0550123456']);

    if (!$q->fetch()) {

        $p->prepare(
            "INSERT INTO users
            (
                id,
                name,
                phone,
                company_name,
                role,
                status,
                password_hash,
                created_at
            )
            VALUES (?,?,?,?,?,?,?,?)"
        )->execute([
            'demo-buyer',
            'حساب تجريبي مشتري',
            '0550123456',
            'مؤسسة الأمل لتجارة التجزئة',
            'buyer',
            'active',
            password_hash('demo1234', PASSWORD_DEFAULT),
            date('Y-m-d H:i:s')
        ]);
    }
}

/*
|--------------------------------------------------------------------------
| Store helpers
|--------------------------------------------------------------------------
*/

function decodeStore($row)
{
    $s = json_decode(
        $row['data'] ?? '{}',
        true
    );

    return is_array($s) ? $s : [];
}

function getStoreRow($id)
{
    $q = db()->prepare(
        'SELECT * FROM stores WHERE id=? LIMIT 1'
    );

    $q->execute([$id]);

    return $q->fetch();
}

function owned($id, $uid)
{
    $q = db()->prepare(
        'SELECT id
         FROM stores
         WHERE id=?
         AND merchant_user_id=?
         LIMIT 1'
    );

    $q->execute([
        $id,
        $uid
    ]);

    return (bool)$q->fetch();
}

/*
|--------------------------------------------------------------------------
| Tenant database
|--------------------------------------------------------------------------
*/

function tenantDb($storeId)
{
    static $cache = [];

    if (!$storeId) {
        return db();
    }

    if (isset($cache[$storeId])) {
        return $cache[$storeId];
    }

    $c = cfg();

    if (empty($c['tenant_databases_enabled'])) {
        return db();
    }

    $q = db()->prepare(
        'SELECT *
         FROM tenant_databases
         WHERE store_id=?
         AND enabled=1
         LIMIT 1'
    );

    $q->execute([$storeId]);

    $t = $q->fetch();

    if (!$t) {
        return db();
    }

    try {

        $pdo = new PDO(
            "mysql:host={$t['db_host']};dbname={$t['db_name']};charset=utf8mb4",
            $t['db_user'],
            $t['db_pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );

        $cache[$storeId] = $pdo;

        return $pdo;

    } catch (Throwable $e) {

        out([
            'status' => 'error',
            'message' => 'تعذر الاتصال بقاعدة بيانات المتجر.'
        ], 500);
    }
}

function ensureTenantSchema($p)
{
    $sql = [

        "CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(64) PRIMARY KEY,
            sku VARCHAR(120),
            title VARCHAR(255) NOT NULL,
            price DECIMAL(14,2) NOT NULL DEFAULT 0,
            stock INT NOT NULL DEFAULT 0,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(sku),
            INDEX(updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            customer_user_id VARCHAR(64),
            status VARCHAR(60) NOT NULL,
            total_amount DECIMAL(14,2) NOT NULL,
            data LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX(status),
            INDEX(created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS coupons (
            id VARCHAR(64) PRIMARY KEY,
            code VARCHAR(80) NOT NULL,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            UNIQUE KEY uq_code(code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS subscriptions (
            id VARCHAR(64) PRIMARY KEY,
            status VARCHAR(60) NOT NULL,
            data LONGTEXT NOT NULL,
            updated_at DATETIME NOT NULL,
            UNIQUE KEY uq_subscription_store(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($sql as $q) {
        $p->exec($q);
    }
}

function hydrateStore($s)
{
    if (
        !is_array($s) ||
        empty($s['id'])
    ) {
        return $s;
    }

    $p = tenantDb($s['id']);

    if ($p === db()) {
        return $s;
    }

    ensureTenantSchema($p);

    $r = $p->query(
        'SELECT *
         FROM products
         ORDER BY updated_at DESC'
    )->fetchAll();

    $s['products'] = array_map(
        fn($x) => json_decode($x['data'], true) ?: [],
        $r
    );

    $r = $p->query(
        'SELECT data
         FROM orders
         ORDER BY created_at DESC'
    )->fetchAll();

    $s['orders'] = array_map(
        fn($x) => json_decode($x['data'], true) ?: [],
        $r
    );

    $r = $p->query(
        'SELECT data
         FROM coupons
         ORDER BY updated_at DESC'
    )->fetchAll();

    $s['coupons'] = array_map(
        fn($x) => json_decode($x['data'], true) ?: [],
        $r
    );

    $r = $p->query(
        'SELECT data
         FROM subscriptions
         LIMIT 1'
    )->fetch();

    if ($r) {
        $s['subscription'] =
            json_decode($r['data'], true) ?: [];
    }

    return $s;
}

function syncStore($s, $merchantId = null)
{
    if (
        empty($s['id']) ||
        empty($s['slug']) ||
        empty($s['name'])
    ) {
        out([
            'status' => 'error',
            'message' => 'بيانات المتجر غير مكتملة.'
        ]);
    }

    $central = db();

    $now = date('Y-m-d H:i:s');

    $row = getStoreRow($s['id']);

    $owner =
        $merchantId ??
        ($row['merchant_user_id'] ??
        ($s['merchantUserId'] ?? null));

    $s['merchantUserId'] = $owner;

    $old = $row
        ? decodeStore($row)
        : [];

    $centralStore = $s;

    $p = tenantDb($s['id']);

    if ($p !== $central) {

        $centralStore['products'] = [];
        $centralStore['orders'] = [];
        $centralStore['coupons'] = [];
    }

    $q = $central->prepare(
        "INSERT INTO stores
        (
            id,
            slug,
            name,
            merchant_user_id,
            data,
            created_at,
            updated_at
        )
        VALUES (?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
            slug=VALUES(slug),
            name=VALUES(name),
            merchant_user_id=VALUES(merchant_user_id),
            data=VALUES(data),
            updated_at=VALUES(updated_at)"
    );

    $created =
        $row['created_at'] ??
        $now;

    $q->execute([
        $s['id'],
        $s['slug'],
        $s['name'],
        $owner,
        json_encode(
            $centralStore,
            JSON_UNESCAPED_UNICODE
        ),
        $created,
        $now
    ]);

    if ($p !== $central) {

        ensureTenantSchema($p);

        foreach (($s['products'] ?? []) as $x) {

            $p->prepare(
                "INSERT INTO products
                (
                    id,
                    sku,
                    title,
                    price,
                    stock,
                    data,
                    updated_at
                )
                VALUES (?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    sku=VALUES(sku),
                    title=VALUES(title),
                    price=VALUES(price),
                    stock=VALUES(stock),
                    data=VALUES(data),
                    updated_at=VALUES(updated_at)"
            )->execute([
                $x['id'],
                $x['sku'] ?? null,
                $x['title'] ?? '',
                (float)($x['price'] ?? 0),
                (int)($x['stock'] ?? 0),
                json_encode(
                    $x,
                    JSON_UNESCAPED_UNICODE
                ),
                $now
            ]);
        }

        foreach (($s['coupons'] ?? []) as $x) {

            $p->prepare(
                "INSERT INTO coupons
                (
                    id,
                    code,
                    data,
                    updated_at
                )
                VALUES (?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    code=VALUES(code),
                    data=VALUES(data),
                    updated_at=VALUES(updated_at)"
            )->execute([
                $x['id'],
                $x['code'] ?? '',
                json_encode(
                    $x,
                    JSON_UNESCAPED_UNICODE
                ),
                $now
            ]);
        }

        foreach (($s['orders'] ?? []) as $x) {

            $p->prepare(
                "INSERT INTO orders
                (
                    id,
                    customer_user_id,
                    status,
                    total_amount,
                    data,
                    created_at,
                    updated_at
                )
                VALUES (?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    customer_user_id=VALUES(customer_user_id),
                    status=VALUES(status),
                    total_amount=VALUES(total_amount),
                    data=VALUES(data),
                    updated_at=VALUES(updated_at)"
            )->execute([
                $x['id'],
                $x['customerUserId'] ?? null,
                $x['status'] ?? 'جديد',
                (float)($x['totalAmount'] ?? 0),
                json_encode(
                    $x,
                    JSON_UNESCAPED_UNICODE
                ),
                date('Y-m-d H:i:s'),
                $now
            ]);
        }

        if (isset($s['subscription'])) {

            $p->prepare(
                "INSERT INTO subscriptions
                (
                    id,
                    status,
                    data,
                    updated_at
                )
                VALUES (?,?,?,?)
                ON DUPLICATE KEY UPDATE
                    status=VALUES(status),
                    data=VALUES(data),
                    updated_at=VALUES(updated_at)"
            )->execute([
                'sub-' . $s['id'],
                $s['subscription']['status'] ??
                    'active_trial',
                json_encode(
                    $s['subscription'],
                    JSON_UNESCAPED_UNICODE
                ),
                $now
            ]);
        }
    }

    return hydrateStore($s);
}

function publicStore($s)
{
    if (!is_array($s)) {
        return $s;
    }

    $s['orders'] = [];

    if (isset($s['stats'])) {
        $s['stats']['totalSales'] = 0;
    }

    $s['email'] = '';
    $s['phone'] = '';

    if (
        isset(
            $s['settings']
            ['shippingApiSettings']
            ['apiKey']
        )
    ) {
        $s['settings']
        ['shippingApiSettings']
        ['apiKey'] = '';
    }

    return $s;
}

function allStores($public = true)
{
    $r = db()->query(
        'SELECT data
         FROM stores
         ORDER BY created_at DESC'
    )->fetchAll();

    return array_map(
        function ($x) use ($public) {

            $s = hydrateStore(
                decodeStore($x)
            );

            return $public
                ? publicStore($s)
                : $s;
        },
        $r
    );
}

function admin()
{
    return requireUser(['admin']);
}

function merchantStore($id)
{
    $u = requireUser(['merchant']);

    if (!owned($id, $u['id'])) {

        out([
            'status' => 'error',
            'message' => 'لا تملك هذا المتجر.'
        ], 403);
    }

    $r = getStoreRow($id);

    if (!$r) {

        out([
            'status' => 'error',
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    return hydrateStore(
        decodeStore($r)
    );
}

/*
|--------------------------------------------------------------------------
| Install database
|--------------------------------------------------------------------------
*/

install();

/*
|--------------------------------------------------------------------------
| Action
|--------------------------------------------------------------------------
*/

$action = $_GET['action'] ?? 'status';

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

if ($action === 'status') {

    out([
        'status' => 'success',
        'server' => 'InfinityFree PHP/MySQL',
        'database' => 'connected',
        'mysql_version' =>
            db()->query(
                'SELECT VERSION() v'
            )->fetch()['v'],
        'timestamp' => date('c')
    ]);
}

/*
|--------------------------------------------------------------------------
| Current session
|--------------------------------------------------------------------------
*/

if ($action === 'me') {

    out([
        'status' => 'success',
        'user' => user()
            ? publicUser(user())
            : null
    ]);
}

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

if ($action === 'logout') {

    $_SESSION = [];

    session_destroy();

    out([
        'status' => 'success'
    ]);
}

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

if ($action === 'register') {

    $d = body();

    $role = in_array(
        ($d['role'] ?? 'buyer'),
        ['buyer', 'merchant'],
        true
    )
        ? $d['role']
        : 'buyer';

    if (
        empty($d['phone']) ||
        empty($d['name']) ||
        empty($d['password'])
    ) {

        out([
            'status' => 'error',
            'message' =>
                'الاسم والهاتف وكلمة المرور مطلوبة.'
        ], 422);
    }

    $p = db();

    $phone = normalizePhone($d['phone']);

    $email = trim(
        (string)($d['email'] ?? '')
    );

    $q = $p->prepare(
        'SELECT id
         FROM users
         WHERE phone=?
         OR (
            email IS NOT NULL
            AND email=?
         )
         LIMIT 1'
    );

    $q->execute([
        $phone,
        $email
    ]);

    if ($q->fetch()) {

        out([
            'status' => 'error',
            'message' =>
                'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل.'
        ], 409);
    }

    $id =
        'usr-' .
        bin2hex(random_bytes(8));

    $p->prepare(
        "INSERT INTO users
        (
            id,
            name,
            phone,
            email,
            company_name,
            role,
            status,
            password_hash,
            created_at
        )
        VALUES (?,?,?,?,?,?,?,?,?)"
    )->execute([
        $id,
        $d['name'],
        $phone,
        $email ?: null,
        $d['companyName'] ?? null,
        $role,
        'active',
        password_hash(
            $d['password'],
            PASSWORD_DEFAULT
        ),
        date('Y-m-d H:i:s')
    ]);

    $_SESSION['user'] = [
        'id' => $id,
        'name' => $d['name'],
        'phone' => $phone,
        'company_name' =>
            $d['companyName'] ?? null,
        'role' => $role,
        'status' => 'active'
    ];

    out([
        'status' => 'success',
        'user' =>
            publicUser($_SESSION['user'])
    ]);
}

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

if ($action === 'login') {

    $d = body();

    $p = db();

    $login = trim(
        (string)($d['login'] ?? '')
    );

    $q = $p->prepare(
        'SELECT *
         FROM users
         WHERE phone=?
         OR email=?
         LIMIT 1'
    );

    $q->execute([
        $login,
        $login
    ]);

    $u = $q->fetch();

    if (
        !$u ||
        empty($u['password_hash']) ||
        !password_verify(
            $d['password'] ?? '',
            $u['password_hash']
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'بيانات الدخول غير صحيحة.'
        ], 401);
    }

    if (
        ($u['status'] ?? 'active') ===
        'suspended'
    ) {

        out([
            'status' => 'error',
            'message' =>
                'حساب البائع موقوف من الإدارة.'
        ], 403);
    }

    $_SESSION['user'] = [
        'id' => $u['id'],
        'name' => $u['name'],
        'phone' => $u['phone'],
        'company_name' =>
            $u['company_name'],
        'role' => $u['role'],
        'status' =>
            $u['status'] ?? 'active'
    ];

    out([
        'status' => 'success',
        'user' =>
            publicUser($_SESSION['user'])
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

if ($action === 'admin_login') {

    $d = body();

    $p = db();

    $login = trim(
        (string)($d['username'] ?? '')
    );

    $q = $p->prepare(
        "SELECT *
         FROM users
         WHERE role='admin'
         AND (
            email=?
            OR name=?
            OR phone=?
         )
         LIMIT 1"
    );

    $q->execute([
        $login,
        $login,
        $login
    ]);

    $u = $q->fetch();

    if (
        !$u ||
        ($u['status'] ?? 'active') !== 'active' ||
        empty($u['password_hash']) ||
        !password_verify(
            (string)($d['password'] ?? ''),
            $u['password_hash']
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'بيانات المدير غير صحيحة.'
        ], 401);
    }

    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => $u['id'],
        'name' => $u['name'],
        'phone' => $u['phone'],
        'company_name' =>
            $u['company_name'],
        'role' => 'admin',
        'status' => 'active'
    ];

    out([
        'status' => 'success',
        'user' =>
            publicUser($_SESSION['user'])
    ]);
}

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/

if ($action === 'forgot_password') {

    $d = body();

    $phone = normalizePhone(
        $d['phone'] ?? ''
    );

    if (!$phone) {

        out([
            'status' => 'error',
            'message' =>
                'رقم الهاتف مطلوب.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Algerian phone
    |--------------------------------------------------------------------------
    */

    if (
        !preg_match(
            '/^0[5-7][0-9]{8}$/',
            $phone
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'رقم الهاتف الجزائري غير صالح.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        "SELECT id,name,phone,email,status
         FROM users
         WHERE phone=?
         LIMIT 1"
    );

    $q->execute([$phone]);

    $u = $q->fetch();

    if (!$u) {

        out([
            'status' => 'error',
            'message' =>
                'لا يوجد حساب مرتبط برقم الهاتف هذا.'
        ], 404);
    }

    if (
        ($u['status'] ?? 'active') ===
        'suspended'
    ) {

        out([
            'status' => 'error',
            'message' =>
                'هذا الحساب موقوف ولا يمكن استعادة كلمة المرور حالياً.'
        ], 403);
    }

    $email = trim(
        (string)($u['email'] ?? '')
    );

    if (
        !$email ||
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'لا يوجد بريد إلكتروني صالح مرتبط بهذا الحساب. يرجى التواصل مع الإدارة.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Generate code
    |--------------------------------------------------------------------------
    */

    $code = generateResetCode();

    /*
    |--------------------------------------------------------------------------
    | Save hashed code in session
    |--------------------------------------------------------------------------
    */

    $_SESSION['password_reset'] = [
        'user_id' => $u['id'],
        'phone' => $phone,
        'code_hash' =>
            password_hash(
                $code,
                PASSWORD_DEFAULT
            ),
        'expires_at' =>
            time() + (10 * 60),
        'attempts' => 0
    ];

    /*
    |--------------------------------------------------------------------------
    | Send email
    |--------------------------------------------------------------------------
    */

    $sent = sendResetCodeByEmail(
        $email,
        $code,
        $u['name'] ?? ''
    );

    if (!$sent) {

        /*
        |--------------------------------------------------------------------------
        | Remove reset session if sending failed.
        |--------------------------------------------------------------------------
        */

        unset(
            $_SESSION['password_reset']
        );

        out([
            'status' => 'error',
            'message' =>
                'تعذر إرسال رمز التحقق إلى البريد الإلكتروني. قد تكون خدمة البريد في الاستضافة غير مفعلة.'
        ], 500);
    }

    /*
    |--------------------------------------------------------------------------
    | Mask email
    |--------------------------------------------------------------------------
    */

    $emailParts =
        explode('@', $email, 2);

    $local =
        $emailParts[0] ?? '';

    $domain =
        $emailParts[1] ?? '';

    if (strlen($local) > 2) {

        $maskedEmail =
            substr($local, 0, 2) .
            str_repeat(
                '*',
                max(2, strlen($local) - 2)
            ) .
            '@' .
            $domain;

    } else {

        $maskedEmail =
            substr($local, 0, 1) .
            '**@' .
            $domain;
    }

    out([
        'status' => 'success',
        'message' =>
            'تم إرسال رمز التحقق إلى بريدك الإلكتروني.',
        'email' => $maskedEmail,
        'expiresIn' => 600
    ]);
}

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/

if ($action === 'reset_password') {

    $d = body();

    $phone = normalizePhone(
        $d['phone'] ?? ''
    );

    $code = trim(
        (string)($d['code'] ?? '')
    );

    $password =
        (string)($d['password'] ?? '');

    if (!$phone) {

        out([
            'status' => 'error',
            'message' =>
                'رقم الهاتف مطلوب.'
        ], 422);
    }

    if (
        !preg_match(
            '/^[0-9]{6}$/',
            $code
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'رمز التحقق يجب أن يتكون من 6 أرقام.'
        ], 422);
    }

    if (strlen($password) < 6) {

        out([
            'status' => 'error',
            'message' =>
                'كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.'
        ], 422);
    }

    $reset =
        $_SESSION['password_reset'] ?? null;

    if (!$reset) {

        out([
            'status' => 'error',
            'message' =>
                'انتهت جلسة استعادة كلمة المرور. اطلب رمزاً جديداً.'
        ], 400);
    }

    if (
        ($reset['phone'] ?? '') !==
        $phone
    ) {

        out([
            'status' => 'error',
            'message' =>
                'رقم الهاتف لا يطابق طلب الاستعادة.'
        ], 400);
    }

    if (
        time() >
        (int)($reset['expires_at'] ?? 0)
    ) {

        unset(
            $_SESSION['password_reset']
        );

        out([
            'status' => 'error',
            'message' =>
                'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.'
        ], 400);
    }

    $attempts =
        (int)($reset['attempts'] ?? 0);

    if ($attempts >= 5) {

        unset(
            $_SESSION['password_reset']
        );

        out([
            'status' => 'error',
            'message' =>
                'تم تجاوز عدد المحاولات المسموح بها. اطلب رمزاً جديداً.'
        ], 429);
    }

    /*
    |--------------------------------------------------------------------------
    | Increase attempts before verification
    |--------------------------------------------------------------------------
    */

    $_SESSION['password_reset']['attempts'] =
        $attempts + 1;

    if (
        empty($reset['code_hash']) ||
        !password_verify(
            $code,
            $reset['code_hash']
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'رمز التحقق غير صحيح.'
        ], 400);
    }

    /*
    |--------------------------------------------------------------------------
    | Find user
    |--------------------------------------------------------------------------
    */

    $p = db();

    $q = $p->prepare(
        "SELECT *
         FROM users
         WHERE id=?
         AND phone=?
         LIMIT 1"
    );

    $q->execute([
        $reset['user_id'],
        $phone
    ]);

    $u = $q->fetch();

    if (!$u) {

        unset(
            $_SESSION['password_reset']
        );

        out([
            'status' => 'error',
            'message' =>
                'لم يتم العثور على الحساب.'
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Update password
    |--------------------------------------------------------------------------
    */

    $newHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    $p->prepare(
        "UPDATE users
         SET password_hash=?
         WHERE id=?"
    )->execute([
        $newHash,
        $u['id']
    ]);

    /*
    |--------------------------------------------------------------------------
    | Clear reset session
    |--------------------------------------------------------------------------
    */

    unset(
        $_SESSION['password_reset']
    );

    out([
        'status' => 'success',
        'message' =>
            'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
    ]);
}

/*
|--------------------------------------------------------------------------
| Stores
|--------------------------------------------------------------------------
*/

if ($action === 'stores') {

    out([
        'status' => 'success',
        'stores' => allStores(true)
    ]);
}

/*
|--------------------------------------------------------------------------
| My Stores
|--------------------------------------------------------------------------
*/

if ($action === 'my_stores') {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    if ($u['role'] === 'admin') {

        out([
            'status' => 'success',
            'stores' => allStores(false)
        ]);
    }

    $q = db()->prepare(
        'SELECT data
         FROM stores
         WHERE merchant_user_id=?
         ORDER BY created_at DESC'
    );

    $q->execute([
        $u['id']
    ]);

    out([
        'status' => 'success',
        'stores' =>
            array_map(
                fn($x) => decodeStore($x),
                $q->fetchAll()
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Create Store
|--------------------------------------------------------------------------
*/

if ($action === 'create_store') {

    $u = requireUser(['merchant']);

    $s = body();

    if (
        empty($s['id']) ||
        empty($s['slug']) ||
        empty($s['name'])
    ) {

        out([
            'status' => 'error',
            'message' =>
                'بيانات المتجر ناقصة.'
        ], 422);
    }

    $q = db()->prepare(
        'SELECT id
         FROM stores
         WHERE slug=?
         LIMIT 1'
    );

    $q->execute([
        $s['slug']
    ]);

    if ($q->fetch()) {

        out([
            'status' => 'error',
            'message' =>
                'رابط المتجر مستخدم بالفعل.'
        ], 409);
    }

    $qOwner = db()->prepare(
        'SELECT id
         FROM stores
         WHERE merchant_user_id=?
         LIMIT 1'
    );

    $qOwner->execute([
        $u['id']
    ]);

    if ($qOwner->fetch()) {

        out([
            'status' => 'error',
            'message' =>
                'لديك متجر بالفعل. يُسمح بمتجر واحد فقط لكل بائع.'
        ], 400);
    }

    $s['merchantUserId'] =
        $u['id'];

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $u['id']
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Save Store
|--------------------------------------------------------------------------
*/

if (
    $action === 'save_store' ||
    $action === 'merchant_save_store'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $s = body();

    $r = getStoreRow(
        $s['id'] ?? ''
    );

    if (
        $u['role'] === 'merchant' &&
        (
            !$r ||
            $r['merchant_user_id'] !==
            $u['id']
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'لا تملك هذا المتجر.'
        ], 403);
    }

    if (
        !$r &&
        $u['role'] !== 'admin'
    ) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    $old =
        $r
            ? decodeStore($r)
            : [];

    $s['orders'] =
        $old['orders'] ?? [];

    $s['stats'] =
        $old['stats'] ??
        [
            'totalSales' => 0,
            'visitorsCount' => 0
        ];

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $r['merchant_user_id'] ?? null
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Save Product
|--------------------------------------------------------------------------
*/

if (
    $action === 'save_product' ||
    $action === 'merchant_save_product'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s =
        merchantStore(
            $d['storeId']
        );

    $p =
        $d['product'] ??
        $d;

    if ($u['role'] === 'admin') {

        $r =
            getStoreRow(
                $d['storeId']
            );

        $s =
            decodeStore($r);
    }

    if (empty($p['id'])) {

        out([
            'status' => 'error',
            'message' =>
                'المنتج غير صالح.'
        ], 422);
    }

    $i = -1;

    foreach (
        $s['products'] ?? []
        as $k => $x
    ) {

        if (
            $x['id'] ===
            $p['id']
        ) {
            $i = $k;
        }
    }

    if ($i >= 0) {
        $s['products'][$i] = $p;
    } else {
        array_unshift(
            $s['products'],
            $p
        );
    }

    out([
        'status' => 'success',
        'store' =>
            syncStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Delete Product
|--------------------------------------------------------------------------
*/

if (
    $action === 'delete_product' ||
    $action === 'merchant_delete_product'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s =
        $u['role'] === 'admin'
            ? decodeStore(
                getStoreRow(
                    $d['storeId']
                )
            )
            : merchantStore(
                $d['storeId']
            );

    $s['products'] =
        array_values(
            array_filter(
                $s['products'] ?? [],
                fn($x) =>
                    $x['id'] !==
                    ($d['productId'] ?? '')
            )
        );

    out([
        'status' => 'success',
        'store' =>
            syncStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Save Coupon
|--------------------------------------------------------------------------
*/

if (
    $action === 'save_coupon' ||
    $action === 'merchant_save_coupon'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s =
        $u['role'] === 'admin'
            ? decodeStore(
                getStoreRow(
                    $d['storeId']
                )
            )
            : merchantStore(
                $d['storeId']
            );

    $c =
        $d['coupon'] ??
        $d;

    $i = -1;

    foreach (
        $s['coupons'] ?? []
        as $k => $x
    ) {

        if (
            $x['id'] ===
            $c['id']
        ) {
            $i = $k;
        }
    }

    if ($i >= 0) {
        $s['coupons'][$i] = $c;
    } else {
        array_unshift(
            $s['coupons'],
            $c
        );
    }

    out([
        'status' => 'success',
        'store' =>
            syncStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Delete Coupon
|--------------------------------------------------------------------------
*/

if (
    $action === 'delete_coupon' ||
    $action === 'merchant_delete_coupon'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s =
        $u['role'] === 'admin'
            ? decodeStore(
                getStoreRow(
                    $d['storeId']
                )
            )
            : merchantStore(
                $d['storeId']
            );

    $s['coupons'] =
        array_values(
            array_filter(
                $s['coupons'] ?? [],
                fn($x) =>
                    $x['id'] !==
                    ($d['couponId'] ?? '')
            )
        );

    out([
        'status' => 'success',
        'store' =>
            syncStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Subscription
|--------------------------------------------------------------------------
*/

if (
    $action === 'merchant_update_subscription' ||
    $action === 'admin_update_subscription'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $r = getStoreRow(
        $d['storeId'] ?? ''
    );

    if (!$r) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    if (
        $u['role'] === 'merchant' &&
        $r['merchant_user_id'] !==
        $u['id']
    ) {

        out([
            'status' => 'error',
            'message' =>
                'لا تملك هذا المتجر.'
        ], 403);
    }

    $s =
        decodeStore($r);

    $incoming =
        $d['subscription'] ?? [];

    $s['subscription'] =
        array_merge(
            $s['subscription'] ?? [],
            $incoming
        );

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $r['merchant_user_id'] ?? null
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Merchant Store
|--------------------------------------------------------------------------
*/

if ($action === 'merchant_store') {

    requireUser(['merchant']);

    $d = body();

    $s =
        merchantStore(
            $d['storeId'] ?? ''
        );

    out([
        'status' => 'success',
        'store' => $s
    ]);
}

/*
|--------------------------------------------------------------------------
| Merchant Orders
|--------------------------------------------------------------------------
*/

if ($action === 'merchant_orders') {

    requireUser(['merchant']);

    $d = body();

    $s =
        merchantStore(
            $d['storeId'] ?? ''
        );

    out([
        'status' => 'success',
        'orders' =>
            $s['orders'] ?? []
    ]);
}

/*
|--------------------------------------------------------------------------
| Update Order
|--------------------------------------------------------------------------
*/

if (
    $action === 'update_order' ||
    $action === 'merchant_update_order'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $storeId =
        $d['storeId'] ?? '';

    $s =
        $u['role'] === 'admin'
            ? hydrateStore(
                decodeStore(
                    getStoreRow(
                        $storeId
                    )
                )
            )
            : merchantStore(
                $storeId
            );

    $orderId =
        $d['orderId'] ?? '';

    $idx = -1;

    foreach (
        $s['orders'] ?? []
        as $i => $x
    ) {

        if (
            ($x['id'] ?? '') ===
            $orderId
        ) {
            $idx = $i;
        }
    }

    if ($idx < 0) {

        out([
            'status' => 'error',
            'message' =>
                'الطلب غير موجود.'
        ], 404);
    }

    $o =
        $s['orders'][$idx];

    $o['status'] =
        $d['status'] ??
        $o['status'];

    if (
        isset($d['trackingNumber'])
    ) {
        $o['trackingNumber'] =
            $d['trackingNumber'];
    }

    if (
        isset($d['shippingProvider'])
    ) {
        $o['shippingProvider'] =
            $d['shippingProvider'];
    }

    $s['orders'][$idx] = $o;

    out([
        'status' => 'success',
        'store' =>
            syncStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Create Order
|--------------------------------------------------------------------------
*/

if (
    $action === 'create_order' ||
    $action === 'save_order'
) {

    requireUser([
        'buyer',
        'merchant',
        'admin'
    ]);

    $d = body();

    $order =
        $d['order'] ??
        $d;

    $slug =
        $d['storeSlug'] ?? '';

    if (
        !$slug ||
        empty($order['id'])
    ) {

        out([
            'status' => 'error',
            'message' =>
                'بيانات الطلب ناقصة.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        'SELECT *
         FROM stores
         WHERE slug=?
         LIMIT 1'
    );

    $q->execute([
        $slug
    ]);

    $sr = $q->fetch();

    if (!$sr) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    $s =
        hydrateStore(
            decodeStore($sr)
        );

    $products =
        $s['products'] ?? [];

    foreach (
        $order['items'] ?? []
        as $it
    ) {

        $found = false;

        foreach (
            $products
            as &$prod
        ) {

            if (
                $prod['id'] ===
                $it['productId']
            ) {

                $found = true;

                if (
                    (int)$prod['stock'] <
                    (int)$it['quantity']
                ) {

                    out([
                        'status' => 'error',
                        'message' =>
                            'المخزون غير كافٍ للمنتج: ' .
                            ($prod['title'] ?? '')
                    ], 409);
                }

                $prod['stock'] =
                    (int)$prod['stock'] -
                    (int)$it['quantity'];

                if (
                    $prod['stock'] <= 0
                ) {
                    $prod['isAvailable'] =
                        false;
                }
            }
        }

        unset($prod);

        if (!$found) {

            out([
                'status' => 'error',
                'message' =>
                    'أحد المنتجات لم يعد متاحاً.'
            ], 409);
        }
    }

    $order['createdAt'] =
        $order['createdAt'] ??
        date('c');

    $order['status'] =
        $order['status'] ??
        'جديد';

    $s['products'] =
        $products;

    array_unshift(
        $s['orders'],
        $order
    );

    $s['stats']['totalSales'] =
        ($s['stats']['totalSales'] ?? 0) +
        (float)(
            $order['totalAmount'] ?? 0
        );

    $tp =
        tenantDb(
            $sr['id']
        );

    ensureTenantSchema($tp);

    $tp->beginTransaction();

    try {

        $tp->prepare(
            "INSERT INTO orders
            (
                id,
                customer_user_id,
                status,
                total_amount,
                data,
                created_at,
                updated_at
            )
            VALUES (?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                data=VALUES(data),
                status=VALUES(status),
                total_amount=VALUES(total_amount),
                updated_at=VALUES(updated_at)"
        )->execute([
            $order['id'],
            user()['id'] ?? null,
            $order['status'],
            (float)(
                $order['totalAmount'] ?? 0
            ),
            json_encode(
                $order,
                JSON_UNESCAPED_UNICODE
            ),
            date('Y-m-d H:i:s'),
            date('Y-m-d H:i:s')
        ]);

        $tp->commit();

    } catch (Throwable $e) {

        $tp->rollBack();

        out([
            'status' => 'error',
            'message' =>
                'تعذر حفظ الطلب.'
        ], 500);
    }

    syncStore(
        $s,
        $sr['merchant_user_id'] ?? null
    );

    out([
        'status' => 'success',
        'order' => $order,
        'store' =>
            publicStore($s)
    ]);
}

/*
|--------------------------------------------------------------------------
| Track Order
|--------------------------------------------------------------------------
*/

if ($action === 'track_order') {

    $d = body();

    $term =
        trim(
            $d['query'] ?? ''
        );

    if (!$term) {

        out([
            'status' => 'error',
            'message' =>
                'أدخل رقم الطلب أو رقم الهاتف أو رقم التتبع.'
        ], 422);
    }

    $stores =
        db()->query(
            'SELECT id
             FROM stores
             ORDER BY created_at DESC'
        )->fetchAll();

    foreach (
        $stores as $st
    ) {

        $tp =
            tenantDb(
                $st['id']
            );

        ensureTenantSchema($tp);

        $q = $tp->prepare(
            "SELECT data
             FROM orders
             WHERE id=?
             OR JSON_UNQUOTE(
                 JSON_EXTRACT(
                     data,
                     '$.customerPhone'
                 )
             )=?
             OR JSON_UNQUOTE(
                 JSON_EXTRACT(
                     data,
                     '$.trackingNumber'
                 )
             )=?
             ORDER BY created_at DESC
             LIMIT 1"
        );

        $q->execute([
            $term,
            $term,
            $term
        ]);

        $r = $q->fetch();

        if ($r) {

            out([
                'status' => 'success',
                'order' =>
                    json_decode(
                        $r['data'],
                        true
                    )
            ]);
        }
    }

    out([
        'status' => 'error',
        'message' =>
            'لم يتم العثور على الطلب.'
    ], 404);
}

/*
|--------------------------------------------------------------------------
| Configure Tenant
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_configure_tenant'
) {

    admin();

    $d = body();

    foreach (
        [
            'storeId',
            'dbHost',
            'dbName',
            'dbUser',
            'dbPass'
        ] as $k
    ) {

        if (
            !isset($d[$k]) ||
            $d[$k] === ''
        ) {

            out([
                'status' => 'error',
                'message' =>
                    'بيانات قاعدة البائع ناقصة.'
            ], 422);
        }
    }

    $sr =
        getStoreRow(
            $d['storeId']
        );

    if (!$sr) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    $now =
        date('Y-m-d H:i:s');

    db()->prepare(
        "INSERT INTO tenant_databases
        (
            store_id,
            db_host,
            db_name,
            db_user,
            db_pass,
            enabled,
            created_at,
            updated_at
        )
        VALUES (?,?,?,?,?,1,?,?)
        ON DUPLICATE KEY UPDATE
            db_host=VALUES(db_host),
            db_name=VALUES(db_name),
            db_user=VALUES(db_user),
            db_pass=VALUES(db_pass),
            enabled=1,
            updated_at=VALUES(updated_at)"
    )->execute([
        $d['storeId'],
        $d['dbHost'],
        $d['dbName'],
        $d['dbUser'],
        $d['dbPass'],
        $now,
        $now
    ]);

    $tp =
        tenantDb(
            $d['storeId']
        );

    ensureTenantSchema($tp);

    $s =
        decodeStore($sr);

    syncStore(
        $s,
        $sr['merchant_user_id'] ?? null
    );

    out([
        'status' => 'success',
        'message' =>
            'تم ربط قاعدة بيانات البائع بنجاح.'
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

if ($action === 'admin_dashboard') {

    admin();

    $p = db();

    $stats = [

        'merchants' =>
            (int)$p->query(
                "SELECT COUNT(*)
                 FROM users
                 WHERE role='merchant'"
            )->fetchColumn(),

        'stores' =>
            (int)$p->query(
                'SELECT COUNT(*)
                 FROM stores'
            )->fetchColumn(),

        'products' =>
            (int)$p->query(
                'SELECT COUNT(*)
                 FROM products'
            )->fetchColumn(),

        'orders' =>
            (int)$p->query(
                'SELECT COUNT(*)
                 FROM orders'
            )->fetchColumn(),

        'sales' =>
            (float)$p->query(
                "SELECT COALESCE(
                    SUM(total_amount),
                    0
                 )
                 FROM orders
                 WHERE status <> 'ملغي'"
            )->fetchColumn()
    ];

    out([
        'status' => 'success',
        'stats' => $stats
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Merchants
|--------------------------------------------------------------------------
*/

if (
    $action === 'admin_merchants' ||
    $action === 'merchants'
) {

    admin();

    $r =
        db()->query(
            "SELECT
                id,
                name,
                phone,
                email,
                company_name,
                role,
                status,
                created_at
             FROM users
             WHERE role='merchant'
             ORDER BY created_at DESC"
        )->fetchAll();

    out([
        'status' => 'success',
        'merchants' => $r
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Stores
|--------------------------------------------------------------------------
*/

if (
    $action === 'admin_stores' ||
    $action === 'stores_admin'
) {

    admin();

    out([
        'status' => 'success',
        'stores' =>
            allStores(false)
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Orders
|--------------------------------------------------------------------------
*/

if (
    $action === 'admin_orders' ||
    $action === 'orders'
) {

    admin();

    $r =
        db()->query(
            "SELECT
                o.id,
                o.store_id,
                o.status,
                o.total_amount,
                o.created_at,
                o.data,
                s.name store_name,
                u.name merchant_name
             FROM orders o
             LEFT JOIN stores s
                ON s.id=o.store_id
             LEFT JOIN users u
                ON u.id=s.merchant_user_id
             ORDER BY o.created_at DESC"
        )->fetchAll();

    foreach (
        $r as &$x
    ) {

        $x['order'] =
            json_decode(
                $x['data'],
                true
            );

        unset($x['data']);
    }

    unset($x);

    out([
        'status' => 'success',
        'orders' => $r
    ]);
}

/*
|--------------------------------------------------------------------------
| Set Merchant Status
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_set_merchant_status' ||
    $action ===
    'set_merchant_status'
) {

    admin();

    $d = body();

    if (
        !in_array(
            $d['status'] ?? '',
            [
                'active',
                'suspended'
            ],
            true
        )
    ) {

        out([
            'status' => 'error',
            'message' =>
                'حالة غير صالحة.'
        ], 422);
    }

    db()->prepare(
        "UPDATE users
         SET status=?
         WHERE id=?
         AND role='merchant'"
    )->execute([
        $d['status'],
        $d['id'] ?? ''
    ]);

    out([
        'status' => 'success'
    ]);
}

/*
|--------------------------------------------------------------------------
| Delete Merchant
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_delete_merchant' ||
    $action ===
    'delete_merchant'
) {

    admin();

    $d = body();

    $id =
        $d['id'] ?? '';

    if (!$id) {

        out([
            'status' => 'error',
            'message' =>
                'معرف البائع مطلوب.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        "SELECT id
         FROM stores
         WHERE merchant_user_id=?"
    );

    $q->execute([$id]);

    $stores =
        $q->fetchAll();

    foreach (
        $stores as $st
    ) {

        $sid =
            $st['id'];

        $p->prepare(
            "DELETE FROM products
             WHERE store_id=?"
        )->execute([$sid]);

        $p->prepare(
            "DELETE FROM orders
             WHERE store_id=?"
        )->execute([$sid]);

        $p->prepare(
            "DELETE FROM coupons
             WHERE store_id=?"
        )->execute([$sid]);

        $p->prepare(
            "DELETE FROM subscriptions
             WHERE store_id=?"
        )->execute([$sid]);

        $p->prepare(
            "DELETE FROM stores
             WHERE id=?"
        )->execute([$sid]);
    }

    $p->prepare(
        "DELETE FROM users
         WHERE id=?
         AND role='merchant'"
    )->execute([$id]);

    out([
        'status' => 'success'
    ]);
}

/*
|--------------------------------------------------------------------------
| Delete Store
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_delete_store' ||
    $action ===
    'delete_store'
) {

    admin();

    $d = body();

    $id =
        $d['id'] ?? '';

    if (!$id) {

        out([
            'status' => 'error',
            'message' =>
                'معرف المتجر مطلوب.'
        ], 422);
    }

    $p = db();

    $p->prepare(
        "DELETE FROM products
         WHERE store_id=?"
    )->execute([$id]);

    $p->prepare(
        "DELETE FROM orders
         WHERE store_id=?"
    )->execute([$id]);

    $p->prepare(
        "DELETE FROM coupons
         WHERE store_id=?"
    )->execute([$id]);

    $p->prepare(
        "DELETE FROM subscriptions
         WHERE store_id=?"
    )->execute([$id]);

    $p->prepare(
        "DELETE FROM stores
         WHERE id=?"
    )->execute([$id]);

    out([
        'status' => 'success'
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Save Product
|--------------------------------------------------------------------------
*/

if ($action === 'admin_save_product') {

    admin();

    $d = body();

    $r =
        getStoreRow(
            $d['storeId'] ?? ''
        );

    if (!$r) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    $s =
        decodeStore($r);

    $p =
        $d['product'] ?? [];

    if (empty($p['id'])) {

        out([
            'status' => 'error',
            'message' =>
                'المنتج غير صالح.'
        ], 422);
    }

    $found = false;

    foreach (
        $s['products'] ?? []
        as $i => $x
    ) {

        if (
            $x['id'] ===
            $p['id']
        ) {

            $s['products'][$i] =
                $p;

            $found = true;

            break;
        }
    }

    if (!$found) {

        array_unshift(
            $s['products'],
            $p
        );
    }

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $r['merchant_user_id'] ?? null
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Delete Product
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_delete_product'
) {

    admin();

    $d = body();

    $r =
        getStoreRow(
            $d['storeId'] ?? ''
        );

    if (!$r) {

        out([
            'status' => 'error',
            'message' =>
                'المتجر غير موجود.'
        ], 404);
    }

    $s =
        decodeStore($r);

    $s['products'] =
        array_values(
            array_filter(
                $s['products'] ?? [],
                fn($x) =>
                    $x['id'] !==
                    ($d['productId'] ?? '')
            )
        );

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $r['merchant_user_id'] ?? null
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Set Order Status
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_set_order_status' ||
    $action ===
    'set_order_status'
) {

    admin();

    $d = body();

    $q = db()->prepare(
        'SELECT
            store_id,
            data
         FROM orders
         WHERE id=?'
    );

    $q->execute([
        $d['id'] ?? ''
    ]);

    $rr =
        $q->fetch();

    if (!$rr) {

        out([
            'status' => 'error',
            'message' =>
                'الطلب غير موجود.'
        ], 404);
    }

    $p = db();

    $now =
        date('Y-m-d H:i:s');

    $o =
        json_decode(
            $rr['data'],
            true
        ) ?: [];

    $o['status'] =
        $d['status'] ??
        $o['status'] ??
        'جديد';

    $p->prepare(
        "UPDATE orders
         SET status=?,
             data=?,
             updated_at=?
         WHERE id=?"
    )->execute([
        $o['status'],
        json_encode(
            $o,
            JSON_UNESCAPED_UNICODE
        ),
        $now,
        $d['id']
    ]);

    $sr =
        getStoreRow(
            $rr['store_id']
        );

    if ($sr) {

        $store =
            decodeStore($sr);

        foreach (
            $store['orders'] ?? []
            as &$so
        ) {

            if (
                ($so['id'] ?? '') ===
                ($o['id'] ?? '')
            ) {

                $so = $o;

                break;
            }
        }

        unset($so);

        syncStore(
            $store,
            $sr['merchant_user_id'] ?? null
        );
    }

    out([
        'status' => 'success',
        'order' => $o
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Save Store
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_save_store'
) {

    admin();

    $s = body();

    $r =
        getStoreRow(
            $s['id'] ?? ''
        );

    $old =
        $r
            ? decodeStore($r)
            : [];

    $s['orders'] =
        $old['orders'] ?? [];

    $s['stats'] =
        $old['stats'] ??
        [
            'totalSales' => 0,
            'visitorsCount' => 0
        ];

    out([
        'status' => 'success',
        'store' =>
            syncStore(
                $s,
                $r['merchant_user_id'] ??
                ($s['merchantUserId'] ?? null)
            )
    ]);
}

/*
|--------------------------------------------------------------------------
| Seed
|--------------------------------------------------------------------------
*/

if ($action === 'seed') {

    admin();

    $d = body();

    $count = 0;

    foreach (
        ($d['stores'] ?? [])
        as $s
    ) {

        syncStore(
            $s,
            $s['merchantUserId'] ?? null
        );

        $count++;
    }

    out([
        'status' => 'success',
        'count' => $count
    ]);
}

/*
|--------------------------------------------------------------------------
| Platform Settings
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'get_platform_settings'
) {

    $p = db();

    $b =
        json_decode(
            $p->query(
                "SELECT v
                 FROM settings
                 WHERE k='admin_baridimob'"
            )->fetchColumn()
            ?: 'null',
            true
        );

    $a =
        json_decode(
            $p->query(
                "SELECT v
                 FROM settings
                 WHERE k='platform_announcements'"
            )->fetchColumn()
            ?: '[]',
            true
        );

    $n =
        json_decode(
            $p->query(
                "SELECT v
                 FROM settings
                 WHERE k='merchant_notifications'"
            )->fetchColumn()
            ?: '[]',
            true
        );

    out([
        'status' => 'success',
        'baridimob' => $b,
        'announcements' => $a,
        'notifications' => $n
    ]);
}

/*
|--------------------------------------------------------------------------
| Admin Save Platform Settings
|--------------------------------------------------------------------------
*/

if (
    $action ===
    'admin_save_platform_settings'
) {

    admin();

    $d = body();

    $p = db();

    if (isset($d['baridimob'])) {

        $p->prepare(
            "INSERT INTO settings
            (k,v)
            VALUES
            ('admin_baridimob',?)
            ON DUPLICATE KEY UPDATE
                v=VALUES(v)"
        )->execute([
            json_encode(
                $d['baridimob'],
                JSON_UNESCAPED_UNICODE
            )
        ]);
    }

    if (isset($d['announcements'])) {

        $p->prepare(
            "INSERT INTO settings
            (k,v)
            VALUES
            ('platform_announcements',?)
            ON DUPLICATE KEY UPDATE
                v=VALUES(v)"
        )->execute([
            json_encode(
                $d['announcements'],
                JSON_UNESCAPED_UNICODE
            )
        ]);
    }

    if (isset($d['notifications'])) {

        $p->prepare(
            "INSERT INTO settings
            (k,v)
            VALUES
            ('merchant_notifications',?)
            ON DUPLICATE KEY UPDATE
                v=VALUES(v)"
        )->execute([
            json_encode(
                $d['notifications'],
                JSON_UNESCAPED_UNICODE
            )
        ]);
    }

    out([
        'status' => 'success'
    ]);
}

/*
|--------------------------------------------------------------------------
| Gemini endpoint disabled
|--------------------------------------------------------------------------
*/

if ($action === 'gemini_generate') {

    requireUser([
        'merchant',
        'admin'
    ]);

    out([
        'status' => 'error',
        'message' =>
            'Gemini endpoint is disabled in this PHP-only production build.'
    ], 501);
}

/*
|--------------------------------------------------------------------------
| Unknown action
|--------------------------------------------------------------------------
*/

out([
    'status' => 'error',
    'message' =>
        'Action غير معروفة.'
], 404);
