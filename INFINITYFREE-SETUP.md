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
شغّل `npm run build` ثم ارفع محتويات `dist/` إلى `htdocs/`، مع استبدال الملفات القديمة. يتضمن البناء `api.php` و`.htaccess`؛ تأكد من وجودهما في جذر `htdocs/`. يحتوي `.htaccess` على استثناء يمنع توجيه طلب `/api.php` إلى `index.html`.

## 3) الاختبار
افتح `/api.php?action=status`. يجب أن يظهر JSON يتضمن `database: connected`. إذا ظهرت صفحة الموقع بدل JSON، ارفع `api.php` و`.htaccess` من البناء الأخير إلى جذر `htdocs/` وتأكد أن PHP مفعّل على الاستضافة.
ثم افتح الموقع؛ أول طلب إلى `/api.php?action=stores` ينشئ البيانات الأولية إذا كانت القاعدة فارغة.

## 4) GitHub Actions
أضف Secrets:
- INFINITYFREE_FTP_SERVER
- INFINITYFREE_FTP_USERNAME
- INFINITYFREE_FTP_PASSWORD

ثم push إلى `main`.
