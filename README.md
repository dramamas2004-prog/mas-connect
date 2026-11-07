# MAS CONNECT — Connect Beyond Messages

المرحلة 0 + 1: هيكل المشروع، بناء APK عبر GitHub Actions، الحسابات والملف الشخصي والإعدادات على Supabase.

## الشغّال فعليًا في هذه المرحلة
- إنشاء حساب (بريد + كلمة مرور + اسم ظاهر + username) وتسجيل الدخول والخروج
- استعادة كلمة المرور (رابط بالبريد ← شاشة كلمة مرور جديدة)
- MAS ID فريد يُنشأ تلقائيًا
- تعديل الاسم والـ username والنبذة والحالة، ورفع الصورة الشخصية (تُصغَّر إلى 512px قبل الرفع)
- إعدادات الخصوصية والإشعارات (تُحفظ في قاعدة البيانات)
- تغيير كلمة المرور، تسجيل الخروج من الأجهزة الأخرى، تعطيل الحساب مؤقتًا وإعادة تفعيله، حذف الحساب نهائيًا
- عربي RTL / English LTR، فاتح / داكن / حسب الجهاز، PWA، شريط انقطاع الاتصال
- أقسام Chats / Communities / Calls / Stories / Discover / MAS AI / MAS Cloud تظهر كصفحات "قريبًا" مع رقم المرحلة، بدون بيانات وهمية

## غير موجود بعد
المحادثات، المكالمات، المجتمعات، القصص، Discover، MAS AI، MAS Cloud، الإشعارات الفورية، لوحة الإدارة، الاشتراكات.
إعدادات الخصوصية تُحفظ الآن لكن لا تُطبَّق إلا عند بناء الأقسام المرتبطة بها.

## 1) إعداد Supabase (مرة واحدة)
1. أنشئ مشروعًا جديدًا على supabase.com.
2. SQL Editor ← الصق محتوى `supabase/migrations/0001_accounts.sql` كاملًا ← Run.
3. Authentication ← URL Configuration: ضع رابط موقعك في Site URL وفي Redirect URLs (للتجربة المحلية أضف `http://localhost:5173`).
4. Authentication ← Providers ← Email: فعّل أو عطّل "Confirm email" حسب رغبتك (عند تعطيله يدخل المستخدم مباشرة بعد التسجيل).
5. Project Settings ← API: انسخ `Project URL` و `anon public key`.

## 2) التشغيل محليًا (اختياري)
```bash
cp .env.example .env.local   # ثم ضع القيمتين
npm install
npm run dev
```

## 3) بناء الـ APK عبر GitHub
1. أنشئ مستودعًا جديدًا على GitHub وارفع المشروع:
   ```bash
   git init && git add . && git commit -m "MAS CONNECT phase 1"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mas-connect.git
   git push -u origin main
   ```
2. Settings ← Secrets and variables ← Actions ← New repository secret، أضف:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. تبويب Actions ← Build Android APK ← يعمل تلقائيًا مع كل push، أو Run workflow يدويًا.
4. بعد انتهائه (حوالي 5–10 دقائق) افتح التشغيل ← Artifacts ← حمّل `mas-connect-debug-apk` ← فك الضغط ← ثبّت `app-debug.apk` على الموبايل.

## ملاحظات
- الـ APK الحالي Debug (موقّع بمفتاح debug) ومناسب للتجربة. نسخة Release للنشر تحتاج Keystore نضيفه كـ Secrets في مرحلة لاحقة.
- مجلد `android/` يُنشأ داخل GitHub Actions في كل بناء ولا يُرفع للمستودع. سنثبّته لاحقًا عند تخصيص أيقونة التطبيق والصلاحيات.
- رابط استعادة كلمة المرور يفتح في المتصفح (الويب/PWA). فتحه داخل تطبيق الأندرويد يحتاج Deep Links ونضيفه لاحقًا.
- مفتاح `anon` عام بطبيعته؛ الحماية من Row Level Security. لا تضع `service_role` في الواجهة أبدًا.
- لا يوجد تشفير طرف إلى طرف (E2EE) ولن يُدّعى وجوده قبل تنفيذه واختباره.
