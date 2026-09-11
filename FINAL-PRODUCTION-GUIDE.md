# Youmi — دليل التشغيل النهائي

## النشر على InfinityFree

### 1. GitHub
ارفع المشروع إلى مستودع GitHub، ثم أضف Secrets التالية في Settings → Secrets and variables → Actions:
- INFINITYFREE_FTP_SERVER
- INFINITYFREE_FTP_USERNAME
- INFINITYFREE_FTP_PASSWORD

Workflow البناء يستخدم Node 20 ثم `npm install` و`npm run build` ويرفع `dist/` إلى `/htdocs/`.

### 2. MySQL
من لوحة InfinityFree أنشئ قاعدة MySQL، ثم على السيرفر أنشئ `public/config.php` اعتماداً على `config.example.php`. ضع بيانات MySQL وحساب المدير.

### 3. الاختبار
افتح:
`/api.php?action=status`

يجب أن ترى `database: connected`.

### 4. أول دخول
استخدم بيانات المدير التي وضعتها في `config.php`. لا توجد بيانات مدير ثابتة داخل الواجهة.

### 5. إنشاء البائع
سجل حساب بائع، ثم أنشئ متجره. كل عمليات إدارة المتجر محمية على الخادم بحيث لا يستطيع البائع تعديل متجر بائع آخر.

### 6. التشغيل اليومي
- Admin: إدارة البائعين والمتاجر والمنتجات والطلبات والاشتراكات.
- Merchant: إدارة متجره ومنتجاته وطلباته وكوبوناته واشتراكه.
- Buyer: تصفح المتاجر وإنشاء الطلب وتتبع الطلب.

### 7. ما تم استبعاده
لا توجد إدارة عمولات أو طلبات سحب أرباح أو إدارة سحوبات، حسب نطاق المشروع المطلوب.


### Admin login
Default administrator username: `aymen12`. The administrator password is configured for this deployment as requested. Do not expose administrator credentials in client-side code.
