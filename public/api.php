<?php
/** Youmi production API - PHP/MySQL, InfinityFree compatible. */
header('Content-Type: application/json; charset=utf-8');

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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_name('YOUMI_SESSION');

session_set_cookie_params([
    'httponly' => true,
    'secure' => (($_SERVER['HTTPS'] ?? '') !== 'off'),
    'samesite' => 'Lax',
    'path' => '/'
]);

session_start();

function out($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function body()
{
    $d = json_decode(file_get_contents('php://input'), true);
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

    if ($roles && !in_array($u['role'], $roles, true)) {
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

/**
 * Normalize Algerian phone number.
 * Keeps compatibility with the phone numbers already stored.
 */
function normalizePhone($phone)
{
    $phone = trim((string)$phone);

    $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

    if (strpos($phone, '+213') === 0) {
        $phone = '0' . substr($phone, 4);
    } elseif (strpos($phone, '213') === 0 && strlen($phone) >= 11) {
        $phone = '0' . substr($phone, 3);
    }

    return $phone;
}

/**
 * Create all required platform tables.
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        /**
         * Password reset tokens.
         */
        "CREATE TABLE IF NOT EXISTS password_resets (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id VARCHAR(64) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            attempts INT NOT NULL DEFAULT 0,
            used TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            PRIMARY KEY(id),
            INDEX idx_phone(phone),
            INDEX idx_user(user_id),
            INDEX idx_expires(expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];

    foreach ($sql as $q) {
        $p->exec($q);
    }

    try {
        $p->exec(
            "ALTER TABLE users
             ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'active'"
        );
    } catch (Throwable $e) {
    }

    $adminUsername = 'aymen';
    $adminPhone = '0669964145';

    $adminPasswordHash =
        '$2y$12$z7SqtIX3s696apMyWckg/ei0HuRrcBU0W/KFUoKgd9oaFBk1/JSgS';

    $q = $p->prepare(
        "SELECT id
         FROM users
         WHERE role='admin' AND name=?
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
            (id,name,phone,email,role,status,password_hash,created_at)
            VALUES(?,?,?,?,?,?,?,?)"
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
             WHERE id=? AND role='admin'"
        )->execute([
            $adminUsername,
            $adminPhone,
            $adminUsername,
            $adminPasswordHash,
            $admin['id']
        ]);
    }

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
            (id,name,phone,company_name,role,status,password_hash,created_at)
            VALUES(?,?,?,?,?,?,?,?)"
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

/**
 * Remove old/expired reset codes.
 */
function cleanupPasswordResets()
{
    try {
        db()->exec(
            "DELETE FROM password_resets
             WHERE used=1
                OR expires_at < NOW()"
        );
    } catch (Throwable $e) {
    }
}

/**
 * Create password reset OTP.
 *
 * IMPORTANT:
 * There is currently no SMS provider in this project.
 * Therefore debug_code is returned temporarily so the frontend
 * can be tested. It should be removed after connecting an SMS provider.
 */
function createPasswordReset($phone)
{
    cleanupPasswordResets();

    $phone = normalizePhone($phone);

    if ($phone === '') {
        out([
            'status' => 'error',
            'message' => 'أدخل رقم الهاتف.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        "SELECT id,name,phone,status
         FROM users
         WHERE phone=?
         LIMIT 1"
    );

    $q->execute([$phone]);
    $u = $q->fetch();

    if (!$u) {
        out([
            'status' => 'error',
            'message' => 'لا يوجد حساب مرتبط بهذا الرقم.'
        ], 404);
    }

    if (($u['status'] ?? 'active') !== 'active') {
        out([
            'status' => 'error',
            'message' => 'هذا الحساب غير نشط حالياً.'
        ], 403);
    }

    /**
     * Invalidate previous codes.
     */
    $p->prepare(
        "UPDATE password_resets
         SET used=1
         WHERE user_id=? AND used=0"
    )->execute([$u['id']]);

    $code = (string)random_int(100000, 999999);

    $codeHash = password_hash($code, PASSWORD_DEFAULT);

    $expiresAt = date(
        'Y-m-d H:i:s',
        time() + (10 * 60)
    );

    $p->prepare(
        "INSERT INTO password_resets
        (user_id,phone,code_hash,expires_at,attempts,used,created_at)
        VALUES(?,?,?,?,0,0,?)"
    )->execute([
        $u['id'],
        $phone,
        $codeHash,
        $expiresAt,
        date('Y-m-d H:i:s')
    ]);

    /**
     * Temporary testing response.
     *
     * Once SMS is connected, remove debug_code from this response.
     */
    out([
        'status' => 'success',
        'message' => 'تم إنشاء رمز التحقق. الرمز صالح لمدة 10 دقائق.',
        'expiresIn' => 600,
        'debug_code' => $code
    ]);
}

/**
 * Reset password using OTP.
 */
function resetPassword()
{
    cleanupPasswordResets();

    $d = body();

    $phone = normalizePhone($d['phone'] ?? '');
    $code = trim((string)($d['code'] ?? ''));
    $password = (string)($d['password'] ?? '');

    if ($phone === '' || $code === '' || $password === '') {
        out([
            'status' => 'error',
            'message' => 'رقم الهاتف ورمز التحقق وكلمة المرور مطلوبة.'
        ], 422);
    }

    if (!preg_match('/^\d{6}$/', $code)) {
        out([
            'status' => 'error',
            'message' => 'رمز التحقق يجب أن يتكون من 6 أرقام.'
        ], 422);
    }

    if (strlen($password) < 6) {
        out([
            'status' => 'error',
            'message' => 'كلمة المرور يجب أن تحتوي على 6 أحرف أو أرقام على الأقل.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        "SELECT pr.*,u.id user_id,u.status user_status
         FROM password_resets pr
         INNER JOIN users u ON u.id=pr.user_id
         WHERE pr.phone=?
           AND pr.used=0
           AND pr.expires_at > NOW()
         ORDER BY pr.id DESC
         LIMIT 1"
    );

    $q->execute([$phone]);
    $reset = $q->fetch();

    if (!$reset) {
        out([
            'status' => 'error',
            'message' => 'رمز التحقق غير موجود أو انتهت صلاحيته. اطلب رمزاً جديداً.'
        ], 400);
    }

    if (($reset['user_status'] ?? 'active') !== 'active') {
        out([
            'status' => 'error',
            'message' => 'الحساب غير نشط حالياً.'
        ], 403);
    }

    $attempts = (int)($reset['attempts'] ?? 0);

    if ($attempts >= 5) {

        $p->prepare(
            "UPDATE password_resets
             SET used=1
             WHERE id=?"
        )->execute([$reset['id']]);

        out([
            'status' => 'error',
            'message' => 'تم تجاوز عدد المحاولات المسموح بها. اطلب رمزاً جديداً.'
        ], 429);
    }

    if (!password_verify($code, $reset['code_hash'])) {

        $p->prepare(
            "UPDATE password_resets
             SET attempts=attempts+1
             WHERE id=?"
        )->execute([$reset['id']]);

        out([
            'status' => 'error',
            'message' => 'رمز التحقق غير صحيح.'
        ], 400);
    }

    $newPasswordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    $p->beginTransaction();

    try {

        $p->prepare(
            "UPDATE users
             SET password_hash=?
             WHERE id=?"
        )->execute([
            $newPasswordHash,
            $reset['user_id']
        ]);

        $p->prepare(
            "UPDATE password_resets
             SET used=1
             WHERE id=?"
        )->execute([
            $reset['id']
        ]);

        $p->commit();

    } catch (Throwable $e) {

        if ($p->inTransaction()) {
            $p->rollBack();
        }

        out([
            'status' => 'error',
            'message' => 'تعذر تغيير كلمة المرور. حاول مرة أخرى.'
        ], 500);
    }

    /**
     * Security:
     * Do not automatically log the user in after password reset.
     */
    out([
        'status' => 'success',
        'message' => 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
    ]);
}

function decodeStore($row)
{
    $s = json_decode($row['data'] ?? '{}', true);
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
         WHERE id=? AND merchant_user_id=?
         LIMIT 1'
    );

    $q->execute([$id, $uid]);

    return (bool)$q->fetch();
}

/**
 * Return the tenant connection for a store.
 * Falls back to platform DB when no tenant DB is configured.
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
         WHERE store_id=? AND enabled=1
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

/**
 * Create tenant tables inside a vendor database.
 */
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

/**
 * Read heavy vendor data from tenant DB.
 */
function hydrateStore($s)
{
    if (!is_array($s) || empty($s['id'])) {
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

/**
 * Synchronize store.
 */
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

    $p = tenantDb($s['id']);

    $centralStore = $s;

    if ($p !== $central) {
        $centralStore['products'] = [];
        $centralStore['orders'] = [];
        $centralStore['coupons'] = [];
    }

    $q = $central->prepare(
        "INSERT INTO stores
        (id,slug,name,merchant_user_id,data,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
        slug=VALUES(slug),
        name=VALUES(name),
        merchant_user_id=VALUES(merchant_user_id),
        data=VALUES(data),
        updated_at=VALUES(updated_at)"
    );

    $created = $row['created_at'] ?? $now;

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
                (id,sku,title,price,stock,data,updated_at)
                VALUES(?,?,?,?,?,?,?)
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
                (id,code,data,updated_at)
                VALUES(?,?,?,?)
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
                (id,customer_user_id,status,total_amount,data,created_at,updated_at)
                VALUES(?,?,?,?,?,?,?)
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
                (id,status,data,updated_at)
                VALUES(?,?,?,?)
                ON DUPLICATE KEY UPDATE
                status=VALUES(status),
                data=VALUES(data),
                updated_at=VALUES(updated_at)"
            )->execute([
                'sub-' . $s['id'],
                $s['subscription']['status'] ?? 'active_trial',
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
        isset($s['settings']['shippingApiSettings']['apiKey'])
    ) {
        $s['settings']['shippingApiSettings']['apiKey'] = '';
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
            $s = hydrateStore(decodeStore($x));

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

    return hydrateStore(decodeStore($r));
}


/* ============================================================
   API ROUTER
   ============================================================ */

install();

$action = $_GET['action'] ?? 'status';


/* =========================
   STATUS
========================= */

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


/* =========================
   CURRENT USER
========================= */

if ($action === 'me') {

    out([
        'status' => 'success',
        'user' => user()
            ? publicUser(user())
            : null
    ]);
}


/* =========================
   LOGOUT
========================= */

if ($action === 'logout') {

    $_SESSION = [];

    session_destroy();

    out([
        'status' => 'success'
    ]);
}


/* =========================
   REGISTER
========================= */

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
            'message' => 'الاسم والهاتف وكلمة المرور مطلوبة.'
        ], 422);
    }

    $p = db();

    $phone = normalizePhone($d['phone']);

    $q = $p->prepare(
        'SELECT id
         FROM users
         WHERE phone=?
            OR (email IS NOT NULL AND email=?)
         LIMIT 1'
    );

    $q->execute([
        $phone,
        $d['email'] ?? ''
    ]);

    if ($q->fetch()) {
        out([
            'status' => 'error',
            'message' => 'رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل.'
        ], 409);
    }

    $id = 'usr-' . bin2hex(random_bytes(8));

    $p->prepare(
        "INSERT INTO users
        (id,name,phone,email,company_name,role,status,password_hash,created_at)
        VALUES(?,?,?,?,?,?,?,?,?)"
    )->execute([
        $id,
        $d['name'],
        $phone,
        $d['email'] ?? null,
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
        'company_name' => $d['companyName'] ?? null,
        'role' => $role,
        'status' => 'active'
    ];

    out([
        'status' => 'success',
        'user' => publicUser(
            $_SESSION['user']
        )
    ]);
}


/* =========================
   LOGIN
========================= */

if ($action === 'login') {

    $d = body();

    $p = db();

    $login = normalizePhone(
        $d['login'] ?? ''
    );

    $q = $p->prepare(
        'SELECT *
         FROM users
         WHERE phone=? OR email=?
         LIMIT 1'
    );

    $q->execute([
        $login,
        $d['login'] ?? ''
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
            'message' => 'بيانات الدخول غير صحيحة.'
        ], 401);
    }

    if (($u['status'] ?? 'active') === 'suspended') {
        out([
            'status' => 'error',
            'message' => 'حساب البائع موقوف من الإدارة.'
        ], 403);
    }

    $_SESSION['user'] = [
        'id' => $u['id'],
        'name' => $u['name'],
        'phone' => $u['phone'],
        'company_name' => $u['company_name'],
        'role' => $u['role'],
        'status' => $u['status'] ?? 'active'
    ];

    out([
        'status' => 'success',
        'user' => publicUser(
            $_SESSION['user']
        )
    ]);
}


/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

if ($action === 'forgot_password') {

    $d = body();

    createPasswordReset(
        $d['phone'] ?? ''
    );
}


/* ============================================================
   RESET PASSWORD
   ============================================================ */

if ($action === 'reset_password') {

    resetPassword();
}


/* =========================
   ADMIN LOGIN
========================= */

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
           AND (email=? OR name=? OR phone=?)
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
            'message' => 'بيانات المدير غير صحيحة.'
        ], 401);
    }

    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => $u['id'],
        'name' => $u['name'],
        'phone' => $u['phone'],
        'company_name' => $u['company_name'],
        'role' => 'admin',
        'status' => 'active'
    ];

    out([
        'status' => 'success',
        'user' => publicUser(
            $_SESSION['user']
        )
    ]);
}


/* =========================
   STORES
========================= */

if ($action === 'stores') {
    out([
        'status' => 'success',
        'stores' => allStores(true)
    ]);
}


/* =========================
   MY STORES
========================= */

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
        'stores' => array_map(
            fn($x) => decodeStore($x),
            $q->fetchAll()
        )
    ]);
}


/* =========================
   CREATE STORE
========================= */

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
            'message' => 'بيانات المتجر ناقصة.'
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
            'message' => 'رابط المتجر مستخدم بالفعل.'
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
            'message' => 'لديك متجر بالفعل. يُسمح بمتجر واحد فقط لكل بائع.'
        ], 400);
    }

    $s['merchantUserId'] = $u['id'];

    out([
        'status' => 'success',
        'store' => syncStore(
            $s,
            $u['id']
        )
    ]);
}


/* =========================
   SAVE STORE
========================= */

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
        (!$r || $r['merchant_user_id'] !== $u['id'])
    ) {
        out([
            'status' => 'error',
            'message' => 'لا تملك هذا المتجر.'
        ], 403);
    }

    if (
        !$r &&
        $u['role'] !== 'admin'
    ) {
        out([
            'status' => 'error',
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    $old = $r
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
        'store' => syncStore(
            $s,
            $r['merchant_user_id'] ?? null
        )
    ]);
}


/* =========================
   SAVE PRODUCT
========================= */

if (
    $action === 'save_product' ||
    $action === 'merchant_save_product'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s = merchantStore(
        $d['storeId']
    );

    $p = $d['product'] ?? $d;

    if ($u['role'] === 'admin') {
        $r = getStoreRow(
            $d['storeId']
        );

        $s = decodeStore($r);
    }

    if (empty($p['id'])) {
        out([
            'status' => 'error',
            'message' => 'المنتج غير صالح.'
        ], 422);
    }

    $i = -1;

    foreach (
        $s['products'] ?? [] as $k => $x
    ) {
        if ($x['id'] === $p['id']) {
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
        'store' => syncStore($s)
    ]);
}


/* =========================
   DELETE PRODUCT
========================= */

if (
    $action === 'delete_product' ||
    $action === 'merchant_delete_product'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s = $u['role'] === 'admin'
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
        'store' => syncStore($s)
    ]);
}


/* =========================
   COUPONS
========================= */

if (
    $action === 'save_coupon' ||
    $action === 'merchant_save_coupon'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s = $u['role'] === 'admin'
        ? decodeStore(
            getStoreRow(
                $d['storeId']
            )
        )
        : merchantStore(
            $d['storeId']
        );

    $c = $d['coupon'] ?? $d;

    $i = -1;

    foreach (
        $s['coupons'] ?? [] as $k => $x
    ) {
        if ($x['id'] === $c['id']) {
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
        'store' => syncStore($s)
    ]);
}


/* =========================
   DELETE COUPON
========================= */

if (
    $action === 'delete_coupon' ||
    $action === 'merchant_delete_coupon'
) {

    $u = requireUser([
        'merchant',
        'admin'
    ]);

    $d = body();

    $s = $u['role'] === 'admin'
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
        'store' => syncStore($s)
    ]);
}


/* =========================
   SUBSCRIPTIONS
========================= */

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
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    if (
        $u['role'] === 'merchant' &&
        $r['merchant_user_id'] !== $u['id']
    ) {
        out([
            'status' => 'error',
            'message' => 'لا تملك هذا المتجر.'
        ], 403);
    }

    $s = decodeStore($r);

    $incoming =
        $d['subscription'] ?? [];

    $s['subscription'] =
        array_merge(
            $s['subscription'] ?? [],
            $incoming
        );

    out([
        'status' => 'success',
        'store' => syncStore(
            $s,
            $r['merchant_user_id'] ?? null
        )
    ]);
}


/* =========================
   MERCHANT STORE
========================= */

if ($action === 'merchant_store') {

    $u = requireUser(['merchant']);

    $d = body();

    $s = merchantStore(
        $d['storeId'] ?? ''
    );

    out([
        'status' => 'success',
        'store' => $s
    ]);
}


/* =========================
   MERCHANT ORDERS
========================= */

if ($action === 'merchant_orders') {

    $u = requireUser(['merchant']);

    $d = body();

    $s = merchantStore(
        $d['storeId'] ?? ''
    );

    out([
        'status' => 'success',
        'orders' => $s['orders'] ?? []
    ]);
}


/* =========================
   UPDATE ORDER
========================= */

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

    $s = $u['role'] === 'admin'
        ? hydrateStore(
            decodeStore(
                getStoreRow($storeId)
            )
        )
        : merchantStore(
            $storeId
        );

    $orderId =
        $d['orderId'] ?? '';

    $idx = -1;

    foreach (
        $s['orders'] ?? [] as $i => $x
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
            'message' => 'الطلب غير موجود.'
        ], 404);
    }

    $o = $s['orders'][$idx];

    $o['status'] =
        $d['status'] ??
        $o['status'];

    if (isset($d['trackingNumber'])) {
        $o['trackingNumber'] =
            $d['trackingNumber'];
    }

    if (isset($d['shippingProvider'])) {
        $o['shippingProvider'] =
            $d['shippingProvider'];
    }

    $s['orders'][$idx] = $o;

    out([
        'status' => 'success',
        'store' => syncStore($s)
    ]);
}


/* =========================
   CREATE ORDER
========================= */

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
        $d['order'] ?? $d;

    $slug =
        $d['storeSlug'] ?? '';

    if (
        !$slug ||
        empty($order['id'])
    ) {
        out([
            'status' => 'error',
            'message' => 'بيانات الطلب ناقصة.'
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
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    $s = hydrateStore(
        decodeStore($sr)
    );

    $products =
        $s['products'] ?? [];

    foreach (
        $order['items'] ?? [] as $it
    ) {

        $found = false;

        foreach (
            $products as &$prod
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

                if ($prod['stock'] <= 0) {
                    $prod['isAvailable'] = false;
                }
            }
        }

        unset($prod);

        if (!$found) {
            out([
                'status' => 'error',
                'message' => 'أحد المنتجات لم يعد متاحاً.'
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
        (float)($order['totalAmount'] ?? 0);

    $tp = tenantDb($sr['id']);

    ensureTenantSchema($tp);

    $tp->beginTransaction();

    try {

        $tp->prepare(
            'INSERT INTO orders
            (id,customer_user_id,status,total_amount,data,created_at,updated_at)
            VALUES(?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
            data=VALUES(data),
            status=VALUES(status),
            total_amount=VALUES(total_amount),
            updated_at=VALUES(updated_at)'
        )->execute([
            $order['id'],
            user()['id'] ?? null,
            $order['status'],
            (float)($order['totalAmount'] ?? 0),
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
            'message' => 'تعذر حفظ الطلب.'
        ], 500);
    }

    syncStore(
        $s,
        $sr['merchant_user_id'] ?? null
    );

    out([
        'status' => 'success',
        'order' => $order,
        'store' => publicStore($s)
    ]);
}


/* =========================
   TRACK ORDER
========================= */

if ($action === 'track_order') {

    $d = body();

    $term =
        trim($d['query'] ?? '');

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

    foreach ($stores as $st) {

        $tp =
            tenantDb($st['id']);

        ensureTenantSchema($tp);

        $q = $tp->prepare(
            "SELECT data
             FROM orders
             WHERE id=?
                OR JSON_UNQUOTE(
                    JSON_EXTRACT(data,'$.customerPhone')
                )=?
                OR JSON_UNQUOTE(
                    JSON_EXTRACT(data,'$.trackingNumber')
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
        'message' => 'لم يتم العثور على الطلب.'
    ], 404);
}


/* =========================
   ADMIN TENANT
========================= */

if ($action === 'admin_configure_tenant') {

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
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    $now =
        date('Y-m-d H:i:s');

    db()->prepare(
        "INSERT INTO tenant_databases
        (store_id,db_host,db_name,db_user,db_pass,enabled,created_at,updated_at)
        VALUES(?,?,?,?,?,1,?,?)
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


/* =========================
   ADMIN DASHBOARD
========================= */

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
                'SELECT COUNT(*) FROM stores'
            )->fetchColumn(),

        'products' =>
            (int)$p->query(
                'SELECT COUNT(*) FROM products'
            )->fetchColumn(),

        'orders' =>
            (int)$p->query(
                'SELECT COUNT(*) FROM orders'
            )->fetchColumn(),

        'sales' =>
            (float)$p->query(
                "SELECT COALESCE(
                    SUM(total_amount),0
                )
                FROM orders
                WHERE status<>'ملغي'"
            )->fetchColumn()
    ];

    out([
        'status' => 'success',
        'stats' => $stats
    ]);
}


/* =========================
   ADMIN MERCHANTS
========================= */

if (
    $action === 'admin_merchants' ||
    $action === 'merchants'
) {

    admin();

    $r = db()->query(
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


/* =========================
   ADMIN STORES
========================= */

if (
    $action === 'admin_stores' ||
    $action === 'stores_admin'
) {

    admin();

    out([
        'status' => 'success',
        'stores' => allStores(false)
    ]);
}


/* =========================
   ADMIN ORDERS
========================= */

if (
    $action === 'admin_orders' ||
    $action === 'orders'
) {

    admin();

    $r = db()->query(
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

    foreach ($r as &$x) {

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


/* =========================
   MERCHANT STATUS
========================= */

if (
    $action === 'admin_set_merchant_status' ||
    $action === 'set_merchant_status'
) {

    admin();

    $d = body();

    if (
        !in_array(
            $d['status'] ?? '',
            ['active', 'suspended'],
            true
        )
    ) {
        out([
            'status' => 'error',
            'message' => 'حالة غير صالحة.'
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


/* =========================
   DELETE MERCHANT
========================= */

if (
    $action === 'admin_delete_merchant' ||
    $action === 'delete_merchant'
) {

    admin();

    $d = body();

    $id =
        $d['id'] ?? '';

    if (!$id) {
        out([
            'status' => 'error',
            'message' => 'معرف البائع مطلوب.'
        ], 422);
    }

    $p = db();

    $q = $p->prepare(
        "SELECT id
         FROM stores
         WHERE merchant_user_id=?"
    );

    $q->execute([
        $id
    ]);

    $stores =
        $q->fetchAll();

    foreach ($stores as $st) {

        $sid = $st['id'];

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


/* =========================
   DELETE STORE
========================= */

if (
    $action === 'admin_delete_store' ||
    $action === 'delete_store'
) {

    admin();

    $d = body();

    $id =
        $d['id'] ?? '';

    if (!$id) {
        out([
            'status' => 'error',
            'message' => 'معرف المتجر مطلوب.'
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


/* =========================
   ADMIN SAVE PRODUCT
========================= */

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
            'message' => 'المتجر غير موجود.'
        ], 404);
    }

    $s =
        decodeStore($r);

    $p =
        $d['product'] ?? [];

    if (empty($p['id'])) {
        out([
            'status' => 'error',
            'message' => 'المنتج غير صالح.'
        ], 422);
    }

    $found = false;

    foreach (
        $s['products'] ?? [] as $i => $x
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
        'store' => syncStore(
            $s,
            $r['merchant_user_id'] ?? null
        )
    ]);
}


/* =========================
   ADMIN DELETE PRODUCT
========================= */

if ($action === 'admin_delete_product') {

    admin();

    $d = body();

    $r =
        getStoreRow(
            $d['storeId'] ?? ''
        );

    if (!$r) {
        out([
            'status' => 'error',
            'message' => 'المتجر غير موجود.'
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
        'store' => syncStore(
            $s,
            $r['merchant_user_id'] ?? null
        )
    ]);
}


/* =========================
   ADMIN ORDER STATUS
========================= */

if (
    $action === 'admin_set_order_status' ||
    $action === 'set_order_status'
) {

    admin();

    $d = body();

    $q = db()->prepare(
        'SELECT store_id,data
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
            'message' => 'الطلب غير موجود.'
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
        'UPDATE orders
         SET status=?,data=?,updated_at=?
         WHERE id=?'
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
            $store['orders'] ?? [] as &$so
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


/* =========================
   ADMIN SAVE STORE
========================= */

if ($action === 'admin_save_store') {

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
        'store' => syncStore(
            $s,
            $r['merchant_user_id'] ??
            ($s['merchantUserId'] ?? null)
        )
    ]);
}


/* =========================
   SEED
========================= */

if ($action === 'seed') {

    admin();

    $d = body();

    $count = 0;

    foreach (
        ($d['stores'] ?? []) as $s
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


/* =========================
   PLATFORM SETTINGS
========================= */

if ($action === 'get_platform_settings') {

    $p = db();

    $b = json_decode(
        $p->query(
            "SELECT v
             FROM settings
             WHERE k='admin_baridimob'"
        )->fetchColumn() ?: 'null',
        true
    );

    $a = json_decode(
        $p->query(
            "SELECT v
             FROM settings
             WHERE k='platform_announcements'"
        )->fetchColumn() ?: '[]',
        true
    );

    $n = json_decode(
        $p->query(
            "SELECT v
             FROM settings
             WHERE k='merchant_notifications'"
        )->fetchColumn() ?: '[]',
        true
    );

    out([
        'status' => 'success',
        'baridimob' => $b,
        'announcements' => $a,
        'notifications' => $n
    ]);
}


/* =========================
   SAVE PLATFORM SETTINGS
========================= */

if ($action === 'admin_save_platform_settings') {

    admin();

    $d = body();

    $p = db();

    if (isset($d['baridimob'])) {

        $p->prepare(
            "INSERT INTO settings(k,v)
             VALUES('admin_baridimob',?)
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
            "INSERT INTO settings(k,v)
             VALUES('platform_announcements',?)
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
            "INSERT INTO settings(k,v)
             VALUES('merchant_notifications',?)
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


/* =========================
   GEMINI
========================= */

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


/* =========================
   UNKNOWN ACTION
========================= */

out([
    'status' => 'error',
    'message' => 'Action غير معروفة.'
], 404);
