# Youmi — وضع التطوير الكامل

## تشغيل المشروع

```bash
npm install
npm run dev
```

يفتح التطبيق على:

```text
http://localhost:3000
```

و`server.ts` يشغّل تلقائيًا PHP Built-in Server على المنفذ `8787` ويحوّل:

```text
/api.php?action=...
```

إلى `public/api.php`.

## قاعدة البيانات

انسخ:

```text
public/config.example.php
```

إلى:

```text
public/config.php
```

ثم ضع بيانات MySQL المحلية أو بيانات قاعدة الاختبار في `config.php`.

لا ترفع `public/config.php` إلى GitHub.

## Admin

الرابط:

```text
http://localhost:3000/admin
```

بيانات المدير الافتراضية التي ينشئها API عند تشغيل `install`:

```text
username: aymen
phone: 0669964145
password: ay120012
```

## إذا كان PHP غير مثبت

ثبّت PHP 8.x ثم أعد:

```bash
npm run dev
```

## منفذ PHP

يمكن تغييره:

```bash
PHP_PORT=8788 npm run dev
```
