import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('aymen');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    fetch('/api.php?action=admin_login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
      body: JSON.stringify({ username: username.trim(), password })
    }).then(async r => {
      const text = await r.text();
      let data: any;
      try { data = JSON.parse(text); }
      catch { throw new Error('خادم PHP لم يُرجع JSON. تأكد من تشغيل وضع التطوير PHP.'); }
      if (!r.ok || data.status === 'error') throw new Error(data.message || 'فشل تسجيل الدخول');
      if (data.user?.role !== 'admin') throw new Error('الحساب لا يملك صلاحية مدير المنصة.');
      localStorage.setItem('youmi_admin_session', JSON.stringify(data.user));
      setLoading(false); onLoginSuccess(data.user);
    }).catch(err => {
      setError(err.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.'); setLoading(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-slate-800 animate-fadeIn font-['Tajawal']">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black font-['Cairo'] text-white">
                دخول مدير المنصة (Admin)
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                لوحة التحكم المركزية لمنصة يومي للجملة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-['Cairo']">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>اسم المستخدم الخاص بالمدير:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="aymen"
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs md:text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition dir-ltr text-right"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-['Cairo']">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>كلمة المرور:</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور المدير"
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs md:text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition dir-ltr text-right"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          </div>


          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 group"
          >
            <span>{loading ? 'جاري التحقق...' : 'دخول لوحة تحكم المدير'}</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          منصة يومي B2B • تسجيل الدخول آمن ومشفر 🔒
        </div>
      </div>
    </div>
  );
};
