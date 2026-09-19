import React, { useState } from 'react';
import { YoumiLogo } from './YoumiLogo';
import {
  X,
  Lock,
  Building2,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  LogIn,
  KeyRound,
  CheckCircle2,
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

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const MemberAuthModal: React.FC<MemberAuthModalProps> = ({
  isOpen = false,
  onClose,
  onSuccess,
  onLoginSuccess,
  defaultRole = 'buyer',
}) => {
  const [activeMode, setActiveMode] =
    useState<AuthMode>('register');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] =
    useState<'buyer' | 'merchant'>(defaultRole);

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSuccessCallback = (member: B2BMember) => {
    if (onSuccess) onSuccess(member);
    if (onLoginSuccess) onLoginSuccess(member);
  };

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const normalizePhone = (value: string) => {
    return value.replace(/\s+/g, '').trim();
  };

  /* =========================
     LOGIN / REGISTER
     ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    resetMessages();
    setLoading(true);

    try {
      const action =
        activeMode === 'register'
          ? 'register'
          : 'login';

      const payload =
        activeMode === 'register'
          ? {
              name: name.trim(),
              phone: normalizePhone(phone),
              companyName:
                companyName.trim() || undefined,
              role,
              password,
            }
          : {
              login: normalizePhone(phone),
              password,
            };

      const res = await fetch(
        `/api.php?action=${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(
          data.message ||
            'فشل التسجيل / دخول الحساب'
        );
      }

      if (!data.user) {
        throw new Error(
          'لم يتم استلام بيانات الحساب من الخادم'
        );
      }

      const member = data.user as B2BMember;

      localStorage.setItem(
        'youmi_member_user',
        JSON.stringify(member)
      );

      handleSuccessCallback(member);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ غير متوقع أثناء المصادقة'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FORGOT PASSWORD
     ========================= */

  const handleForgotPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    resetMessages();

    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        '/api.php?action=forgot_password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            phone: cleanPhone,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(
          data.message ||
            'تعذر إرسال رمز استعادة كلمة المرور'
        );
      }

      setSuccessMessage(
        data.message ||
          'تم إرسال رمز التحقق. أدخل الرمز للمتابعة.'
      );

      setActiveMode('reset');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء طلب استعادة كلمة المرور'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RESET PASSWORD
     ========================= */

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    resetMessages();

    if (!resetCode.trim()) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    if (!newPassword) {
      setError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      setError(
        'كلمة المرور الجديدة يجب أن تحتوي على 6 أحرف على الأقل'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        '/api.php?action=reset_password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            phone: normalizePhone(phone),
            code: resetCode.trim(),
            password: newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(
          data.message ||
            'تعذر تغيير كلمة المرور'
        );
      }

      setSuccessMessage(
        data.message ||
          'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
      );

      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetCode('');

      setTimeout(() => {
        setSuccessMessage('');
        setActiveMode('login');
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تغيير كلمة المرور'
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    resetMessages();
    setActiveMode('login');
  };

  const goToRegister = () => {
    resetMessages();
    setActiveMode('register');
  };

  const goToForgotPassword = () => {
    resetMessages();
    setActiveMode('forgot');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl text-slate-800">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <YoumiLogo variant="full" size="md" />
          </div>

          <h2 className="text-xl font-black text-slate-900 font-['Cairo']">
            {activeMode === 'forgot'
              ? 'استعادة كلمة المرور 🔐'
              : activeMode === 'reset'
              ? 'تعيين كلمة مرور جديدة 🔑'
              : 'حساب التجار والمشترين 👤'}
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {activeMode === 'forgot'
              ? 'أدخل رقم الهاتف المرتبط بحسابك لاستعادة كلمة المرور.'
              : activeMode === 'reset'
              ? 'أدخل رمز التحقق وكلمة المرور الجديدة لحسابك.'
              : 'قم بتسجيل الدخول أو إنشاء حساب جديد لإدارة المتاجر أو الاستفادة من مزايا المنصة.'}
          </p>
        </div>

        {/* LOGIN / REGISTER */}
        {(activeMode === 'login' ||
          activeMode === 'register') && (
          <>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={goToRegister}
                className={`py-2 rounded-xl transition ${
                  activeMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                إنشاء حساب B2B مجاناً
              </button>

              <button
                type="button"
                onClick={goToLogin}
                className={`py-2 rounded-xl transition ${
                  activeMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                تسجيل الدخول
              </button>
            </div>

            {/* Registration / Login Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Registration Fields */}
              {activeMode === 'register' && (
                <>
                  {/* Account Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      نوع الحساب المطلوب *
                    </label>

                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setRole('buyer')
                        }
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                          role === 'buyer'
                            ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🛒 مشتري تجزئة
                        <br />
                        (عرض أسعار الجملة)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRole('merchant')
                        }
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                          role === 'merchant'
                            ? 'bg-white border-indigo-600 text-indigo-900 shadow-xs'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🏪 تاجر / مورد
                        <br />
                        (عرض وإدارة المتجر)
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      اسم العضو / التاجر *
                    </label>

                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) =>
                          setName(e.target.value)
                        }
                        placeholder="مثال: أحمد بلقاسم (مؤسسة الأمل)"
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم المحل أو الشركة (اختياري)
                    </label>

                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) =>
                          setCompanyName(e.target.value)
                        }
                        placeholder="مثال: محلات النور للحلويات والجملة"
                        className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رقم الهاتف (الجزائر) *
                </label>

                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="0550 12 34 56"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 dir-ltr text-right focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  كلمة المرور *
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="6 أحرف على الأقل"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              {activeMode === 'login' && (
                <div className="flex justify-start -mt-2">
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      نسيت كلمة المرور؟
                    </span>
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    {activeMode === 'login' ? (
                      <LogIn className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}

                    <span>
                      {activeMode === 'register'
                        ? 'تأكيد التسجيل وتفعيل الحساب'
                        : 'تسجيل الدخول إلى الحساب'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* FORGOT PASSWORD */}
        {activeMode === 'forgot' && (
          <form
            onSubmit={handleForgotPassword}
            className="space-y-4"
          >
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                </div>

                <div>
                  <p className="text-xs font-black text-indigo-900">
                    استعادة حسابك
                  </p>

                  <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                    أدخل رقم الهاتف المستخدم عند إنشاء حسابك.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رقم الهاتف (الجزائر) *
              </label>

              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="0550 12 34 56"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 dir-ltr text-right focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  إرسال رمز التحقق
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goToLogin}
              className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {activeMode === 'reset' && (
          <form
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs font-black text-emerald-900">
                    رمز التحقق
                  </p>

                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    أدخل الرمز الذي تم إرساله إلى رقم هاتفك.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رمز التحقق *
              </label>

              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) =>
                    setResetCode(e.target.value)
                  }
                  placeholder="أدخل رمز التحقق"
                  inputMode="numeric"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 dir-ltr text-right focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                كلمة المرور الجديدة *
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="6 أحرف على الأقل"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                تأكيد كلمة المرور الجديدة *
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="أعد كتابة كلمة المرور"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري تغيير كلمة المرور...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  تغيير كلمة المرور
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goToLogin}
              className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
};



