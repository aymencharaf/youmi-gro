# تشغيل Youmi على InfinityFree

## 1) قاعدة البيانات
أنشئ MySQL Database من لوحة InfinityFree، ثم انسخ `public/config.example.php` إلى `public/config.php` وضع بيانات MySQL.

مثال:
- host: خادم MySQL الظاهر في لوحة الحساب
- dbname: اسم قاعدة البيانات
- user: مستخدم قاعدة البيانات
- pass: كلمة مرور قاعدة البيانات
- admin_username: اسم مدير المنصة
- admin_password: كلمة مرور قوية للمدير

لا ترفع `config.php` إلى GitHub.

## 2) رفع الملفات
ارفع محتويات `dist/` إلى `htdocs/`. يجب أيضًا أن يكون `api.php` داخل نفس المسار الذي تستعمله الواجهة، لذلك تأكد أن `public/api.php` يدخل إلى `dist/api.php` أثناء البناء/النشر. إذا لم ينسخه Vite، انسخه إلى `dist/` قبل الرفع.

## 3) الاختبار
افتح `/api.php?action=status`. يجب أن يظهر `database: connected`.
ثم افتح الموقع؛ أول طلب إلى `/api.php?action=stores` ينشئ البيانات الأولية إذا كانت القاعدة فارغة.

## 4) GitHub Actions
أضف Secrets:
- INFINITYFREE_FTP_SERVER
- INFINITYFREE_FTP_USERNAME
- INFINITYFREE_FTP_PASSWORD

ثم push إلى `main`.
