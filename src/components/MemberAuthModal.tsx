import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  UserCheck, 
  Building2, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  LogIn
} from 'lucide-react';

export interface B2BMember {
  id?: string;
  name: string;
  phone: string;
  companyName?: string;
  role: 'buyer' | 'merchant' | 'admin';
  status?: string;
  isLoggedIn: boolean;
}

interface MemberAuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (member: B2BMember) => void;
  onLoginSuccess?: (member: B2BMember) => void;
  defaultRole?: 'buyer' | 'merchant';
}

export const MemberAuthModal: React.FC<MemberAuthModalProps> = ({
  isOpen = false,
  onClose,
  onSuccess,
  onLoginSuccess,
  defaultRole = 'buyer',
}) => {
  if (!isOpen) return null;

  const handleSuccessCallback = (member: B2BMember) => {
    if (onSuccess) onSuccess(member);
    if (onLoginSuccess) onLoginSuccess(member);
  };

  const [activeMode, setActiveMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'buyer' | 'merchant'>(defaultRole);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const action = activeMode === 'register' ? 'register' : 'login';
      const payload = activeMode === 'register'
        ? { name: name.trim(), phone: phone.trim(), companyName: companyName.trim() || undefined, role, password }
        : { login: phone.trim(), password };

      const res = await fetch(`/api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'فشل التسجيل / دخول الحساب');
      }

      const member = data.user as B2BMember;
      localStorage.setItem('youmi_member_user', JSON.stringify(member));
      handleSuccessCallback(member);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: 'buyer' | 'merchant') => {
    setError('');
    setLoading(true);

    const demoPhone = demoRole === 'buyer' ? '0550123456' : '0660000000';
    const demoPassword = 'demo1234';

    try {
      // 1. Try direct login with demo credentials
      let res = await fetch('/api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login: demoPhone, password: demoPassword }),
      });
      let data = await res.json();

      // 2. If login fails, register the demo user on the fly via API
      if (!res.ok || data.status === 'error') {
        res = await fetch('/api.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: demoRole === 'buyer' ? 'تاجر تجزئة معتمد (مشتري جملة)' : 'مورد ومصنع معتمد',
            phone: demoPhone,
            companyName: demoRole === 'buyer' ? 'مؤسسة الأمل لتجارة التجزئة' : 'مصنع الجزيرة للجملة',
            role: demoRole,
            password: demoPassword,
          }),
        });
        data = await res.json();
      }

      if (!res.ok || data.status === 'error' || !data.user) {
        throw new Error(data.message || 'تعذر إكمال الدخول التجريبي');
      }

      const member = data.user as B2BMember;
      localStorage.setItem('youmi_member_user', JSON.stringify(member));
      handleSuccessCallback(member);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في الدخول السريع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo']">
            حساب التجار والمشترين 👤
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            قم بتسجيل الدخول أو إنشاء حساب جديد لإدارة المتاجر أو الاستفادة من مزايا المنصة.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveMode('register')}
            className={`py-2 rounded-xl transition ${
              activeMode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            إنشاء حساب B2B مجاناً
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('login')}
            className={`py-2 rounded-xl transition ${
              activeMode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            تسجيل الدخول
          </button>
        </div>

        {/* Quick 1-Click Demo Login Bar */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>دخول سريع بنقرة واحدة (تجربة فورية بالـ API):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('buyer')}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>دخول كمشتري تجزئة</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin('merchant')}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>دخول كمورد / تاجر</span>
            </button>
          </div>
        </div>

        {/* Registration / Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeMode === 'register' && (
            <>
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">نوع الحساب المطلوب *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      role === 'buyer'
                        ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛒 مشتري تجزئة (عرض أسعار الجملة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                      role === 'merchant'
                        ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏪 تاجر / مورد (عرض وإدارة المتجر)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">اسم العضو / التاجر *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد بلقاسم (مؤسسة الأمل)"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المحل أو الشركة (اختياري)</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: محلات النور للحلويات والجملة"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">رقم الهاتف (الجزائر) *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0550 12 34 56"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 dir-ltr text-right focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">كلمة المرور *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'جاري التحقق...' : (activeMode === 'register' ? 'تأكيد التسجيل وتفعيل الحساب' : 'تسجيل الدخول إلى الحساب')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
