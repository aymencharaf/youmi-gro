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
  role: 'buyer' | 'merchant';
  isLoggedIn: boolean;
}

interface MemberAuthModalProps {
  onClose: () => void;
  onLoginSuccess: (member: B2BMember) => void;
}

export const MemberAuthModal: React.FC<MemberAuthModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'buyer' | 'merchant'>('buyer');
  const [isQuickSuccess, setIsQuickSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!phone || !password || (activeMode === 'register' && !name)) return;
    try {
      const action = activeMode === 'register' ? 'register' : 'login';
      const payload = activeMode === 'register'
        ? {name, phone, companyName, role, password}
        : {login: phone, password};
      const res = await fetch(`/api.php?action=${action}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
      const data = await res.json();
      if (!res.ok || data.status === 'error') throw new Error(data.message || 'تعذر تسجيل الدخول');
      const member = data.user as B2BMember;
      localStorage.setItem('youmi_member_user', JSON.stringify(member));
      setIsQuickSuccess(true);
      setTimeout(() => { onLoginSuccess(member); onClose(); }, 700);
    } catch (err) { setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع'); }
  };

  const handleQuickDemoLogin = (demoRole: 'buyer' | 'merchant') => {
    const demoMember: B2BMember = {
      name: demoRole === 'buyer' ? 'تاجر تجزئة معتمد (مشتري جملة)' : 'مورد ومصنع معتمد',
      phone: '0550123456',
      companyName: demoRole === 'buyer' ? 'مؤسسة الأمل لتجارة التجزئة' : 'مصنع الجزيرة للجملة',
      role: demoRole,
      isLoggedIn: true,
    };

    setPhone(demoMember.phone);
    setPassword('demo1234');
    setActiveMode('login');
    setIsQuickSuccess(false);
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

        {isQuickSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-['Cairo']">تم تسجيل الدخول بنجاح!</h3>
              <p className="text-xs text-emerald-700 font-bold mt-1">
                تم تفعيل إظهار جميع أسعار الجملة والعروض الخاصة بالموردين 🔓
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 font-['Cairo']">
                عرض أسعار الجملة للأعضاء المسجلين فقط 🔐
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                وفقاً لسياسة تجارة الجملة (B2B)، يتم إظهار كشوف الأسعار والخصومات المباشرة حصرياً للتجار والمؤسسات المسجلة في المنصة.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveMode('register')}
                className={`py-2 rounded-xl transition ${
                  activeMode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                إنشاء حساب B2B مجاناً
              </button>
              <button
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
                <span>دخول سريع بنقرة واحدة (للتجربة والرد الفوري):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickDemoLogin('buyer')}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>دخول كمشتري تجزئة</span>
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('merchant')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>دخول كمورد / تاجر</span>
                </button>
              </div>
            </div>

            {/* Registration / Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition" />
                </div>
              </div>

              {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">{error}</div>}

              {activeMode === 'register' && (
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
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{activeMode === 'register' ? 'تأكيد التسجيل وإظهار جميع الأسعار' : 'دخول المنصة وعرض الأسعار'}</span>
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
