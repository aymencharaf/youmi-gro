import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check, 
  Server, 
  ExternalLink, 
  UploadCloud, 
  FolderCheck, 
  FileCode, 
  Terminal,
  Zap,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface InfinityFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfinityFreeModal: React.FC<InfinityFreeModalProps> = ({ isOpen, onClose }) => {
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  if (!isOpen) return null;

  const htaccessCode = `# InfinityFree Apache Configuration for Youmi B2B React SPA
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression on InfinityFree
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>`;

  const copyHtaccess = () => {
    navigator.clipboard.writeText(htaccessCode);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2500);
  };

  const handleTestPHP = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api.php?action=status');
      if (res.ok) {
        const data = await res.json();
        setTestResult(`✅ تم الاتصال بنجاح بـ PHP Bridge:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`⚠️ الاستجابة غير مباشرة (${res.status}). سيتم العمل محلياً كـ SPA.`);
      }
    } catch {
      setTestResult('ℹ️ التطبيق يعمل كـ React SPA متكامل. عند الرفع على InfinityFree سيتم تفعيل سيرفر PHP تلقائياً.');
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-slate-800 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col justify-between shadow-2xl overflow-hidden font-['Tajawal']">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Globe className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-['Cairo'] text-white">
                  رفع واستضافة المنصة على InfinityFree
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>جاهز 100%</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                دليل الاستضافة المجانية على https://www.infinityfree.com لربط النطاق وإطلاق المتاجر
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs leading-relaxed">
          
          {/* InfinityFree Banner Status */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-indigo-950 text-sm font-['Cairo']">
                المنصة مهيأة بالكامل للعمل على استضافة InfinityFree المجانية
              </p>
              <p className="text-indigo-800">
                تم إضافة ملف <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-900 font-mono">.htaccess</code> تلقائياً لحل مشكلة إعادة التوجيه (Rewrite Rules) لضمان عمل صفحات المتاجر والأقسام بدون أخطاء 404، مع وجود جسر PHP اختياري.
              </p>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>خطوات الرفع والتفعيل على InfinityFree (في 4 دقائق):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono flex items-center justify-center text-xs">1</span>
                  <span>إنشاء الحساب والنطاق</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  سجّل حساب جديد مجاناً في موقع{' '}
                  <a href="https://www.infinityfree.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold inline-flex items-center gap-0.5">
                    InfinityFree.com <ExternalLink className="w-3 h-3" />
                  </a>
                  أو اربط دومينك الخاص (.com / .dz).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono flex items-center justify-center text-xs">2</span>
                  <span>تصدير مجلد dist المترجم</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  قم بتشغيل خيار التصدير أو بناء المشروع <code className="bg-slate-200 px-1 rounded font-mono">npm run build</code> لإنتاج مجلد <code className="bg-slate-200 px-1 rounded font-mono">dist</code> المكتمل.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono flex items-center justify-center text-xs">3</span>
                  <span>فتح cPanel و File Manager</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  في لوحة تحكم InfinityFree، افتح **Control Panel** ثم اختر **File Manager** وانتقل مباشرة إلى المجلد الرئيسي <code className="bg-amber-100 text-amber-900 px-1 rounded font-bold font-mono">htdocs</code>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono flex items-center justify-center text-xs">4</span>
                  <span>رفع المحتويات في htdocs</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  قم برفع جميع محتويات مجلد <code className="bg-slate-200 px-1 rounded font-mono">dist</code> مباشرة داخل <code className="bg-slate-200 px-1 rounded font-mono">htdocs</code> مع التأكد من وجود ملف <code className="bg-slate-200 px-1 rounded font-mono">.htaccess</code>.
                </p>
              </div>

            </div>
          </div>

          {/* Htaccess Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>محتوى ملف .htaccess الجاهز لـ InfinityFree:</span>
              </span>
              <button
                onClick={copyHtaccess}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
              >
                {copiedHtaccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-2xl text-[10px] font-mono overflow-x-auto border border-slate-800 leading-relaxed dir-ltr">
              {htaccessCode}
            </pre>
          </div>

          {/* Test PHP Bridge Button */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">اختبار اتصال PHP Bridge المرفق (api.php)</p>
                <p className="text-[11px] text-slate-500">تحقق من توفر الاستجابة السريعة لخادم PHP المحلي أو المرفوع</p>
              </div>

              <button
                onClick={handleTestPHP}
                disabled={loadingTest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Terminal className="w-4 h-4" />
                <span>{loadingTest ? 'جاري التحقق...' : 'اختبار السيرفر'}</span>
              </button>
            </div>

            {testResult && (
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap dir-ltr">
                {testResult}
              </pre>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href="https://www.infinityfree.com"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <span>الانتقال لموقع InfinityFree.com</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
