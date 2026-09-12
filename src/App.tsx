import React, { useState, useEffect } from 'react';
import { Store, AppView } from './types';
import { getStoresFromStorage, getActiveStore, setActiveStore, loadStoresFromApi, loadMyStoresFromApi, logoutApi } from './lib/storage';
import { api } from './lib/api';
import { PlatformLanding } from './components/PlatformLanding';
import { CreateStoreWizard } from './components/CreateStoreWizard';
import { MerchantDashboard } from './components/merchant/MerchantDashboard';
import { StoreFrontView } from './components/storefront/StoreFrontView';
import { MemberAuthModal, B2BMember } from './components/MemberAuthModal';
import { InfinityFreeModal } from './components/InfinityFreeModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotificationSystem } from './components/NotificationSystem';
import { X, ArrowLeft, LayoutDashboard, PlusCircle } from 'lucide-react';

export function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  
  const [currentView, setCurrentViewRaw] = useState<AppView>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/admin') {
      return 'ADMIN_DASHBOARD';
    }
    try {
      const saved = localStorage.getItem('youmi_current_view') as AppView;
      return saved || 'PLATFORM_HOME';
    } catch {
      return 'PLATFORM_HOME';
    }
  });

  const setCurrentView = (view: AppView) => {
    setCurrentViewRaw(view);
    try {
      localStorage.setItem('youmi_current_view', view);
    } catch {}
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showInfinityFreeModal, setShowInfinityFreeModal] = useState(false);
  
  // Super Admin authentication is isolated from B2B member state
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('youmi_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [adminSessionChecked, setAdminSessionChecked] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // B2B Member / Merchant Auth State
  const [currentMember, setCurrentMember] = useState<B2BMember | null>(() => {
    try {
      const saved = localStorage.getItem('youmi_member_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showMemberAuthModal, setShowMemberAuthModal] = useState(false);
  const [authModalDefaultRole, setAuthModalDefaultRole] = useState<'buyer' | 'merchant'>('buyer');

  const isLoggedIn = !!currentMember && (currentMember.role === 'buyer' || currentMember.role === 'merchant');

  // Unified Authentication & Navigation Handler
  const handleAuthSuccess = async (member: B2BMember) => {
    setCurrentMember(member);
    localStorage.setItem('youmi_member_user', JSON.stringify(member));
    setShowMemberAuthModal(false);
    setShowLoginModal(false);

    if (member.role === 'admin') {
      setIsSuperAdminLoggedIn(true);
      setAdminUser(member);
      localStorage.setItem('youmi_admin_session', JSON.stringify(member));
      setCurrentView('ADMIN_DASHBOARD');
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
      return;
    }

    if (member.role === 'merchant') {
      try {
        const myStores = await loadMyStoresFromApi();
        if (myStores && myStores.length > 0) {
          const active = getActiveStore();
          const matched = myStores.find((s) => s.id === active?.id) || myStores[0];
          setCurrentStoreState(matched);
          setActiveStore(matched);
          setCurrentView('MERCHANT_DASHBOARD');
        } else {
          setCurrentView('CREATE_STORE');
        }
      } catch (err) {
        console.warn('تعذر تحميل متاجر البائع عند الدخول:', err);
        setCurrentView('CREATE_STORE');
      }
      return;
    }

    if (member.role === 'buyer') {
      if (currentView === 'MERCHANT_DASHBOARD' || currentView === 'CREATE_STORE') {
        setCurrentView('PLATFORM_HOME');
      }
      return;
    }
  };

  const handleMemberLogout = async () => {
    await logoutApi();
    setCurrentMember(null);
    localStorage.removeItem('youmi_member_user');
    if (currentView === 'MERCHANT_DASHBOARD' || currentView === 'CREATE_STORE') {
      setCurrentView('PLATFORM_HOME');
    }
  };

  const handleAdminLogout = async () => {
    await logoutApi();
    setIsSuperAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem('youmi_admin_session');
    setCurrentView('PLATFORM_HOME');
    if (window.location.pathname === '/admin') {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleOpenMerchantAuth = async () => {
    if (currentMember?.role === 'merchant') {
      try {
        const myStores = await loadMyStoresFromApi();
        if (myStores && myStores.length > 0) {
          const matched = currentStore && myStores.some(s => s.id === currentStore.id) ? currentStore : myStores[0];
          setCurrentStoreState(matched);
          setActiveStore(matched);
          setCurrentView('MERCHANT_DASHBOARD');
        } else {
          setCurrentView('CREATE_STORE');
        }
      } catch {
        setCurrentView('CREATE_STORE');
      }
    } else {
      setAuthModalDefaultRole('merchant');
      setShowMemberAuthModal(true);
    }
  };

  // Restore the authoritative API session on reload
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const r = await api.me();
        if (cancelled) return;
        const u = r.ok && r.data?.user ? (r.data.user as B2BMember) : null;

        if (u) {
          if (u.role === 'admin') {
            setIsSuperAdminLoggedIn(true);
            setAdminUser(u);
            localStorage.setItem('youmi_admin_session', JSON.stringify(u));
            if (window.location.pathname.replace(/\/+$/, '') === '/admin' || currentView === 'ADMIN_DASHBOARD') {
              setCurrentView('ADMIN_DASHBOARD');
            }
          } else {
            setCurrentMember(u);
            localStorage.setItem('youmi_member_user', JSON.stringify(u));

            if (u.role === 'merchant') {
              try {
                const myStores = await loadMyStoresFromApi();
                if (!cancelled && myStores && myStores.length > 0) {
                  const savedActive = getActiveStore();
                  const matched = myStores.find((s) => s.id === savedActive?.id) || myStores[0];
                  setCurrentStoreState(matched);
                  setActiveStore(matched);
                }
              } catch (e) {
                console.warn('تعذر استرجاع متاجر البائع عند استعادة الجلسة:', e);
              }
            }
          }
        } else {
          setIsSuperAdminLoggedIn(false);
          setAdminUser(null);
          localStorage.removeItem('youmi_admin_session');
          if (currentView === 'ADMIN_DASHBOARD' || currentView === 'MERCHANT_DASHBOARD' || currentView === 'CREATE_STORE') {
            setCurrentView('PLATFORM_HOME');
          }
        }
      } catch (err) {
        console.warn('Session restore error:', err);
      } finally {
        if (!cancelled) setAdminSessionChecked(true);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const openAdminPanel = async () => {
    const r = await api.me();
    if (r.ok && r.data?.user?.role === 'admin') {
      setIsSuperAdminLoggedIn(true);
      setAdminUser(r.data.user);
      localStorage.setItem('youmi_admin_session', JSON.stringify(r.data.user));
      setCurrentView('ADMIN_DASHBOARD');
      if (window.location.pathname !== '/admin') window.history.pushState({}, '', '/admin');
      return;
    }
    setIsSuperAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem('youmi_admin_session');
    setShowAdminLoginModal(true);
  };

  // Direct admin URL check
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
      openAdminPanel();
    }
  }, []);

  // Load public stores from MySQL
  useEffect(() => {
    const cachedStores = getStoresFromStorage();
    setStores(cachedStores);
    const cachedActive = getActiveStore();
    if (cachedActive) setCurrentStoreState(cachedActive);

    let cancelled = false;
    loadStoresFromApi().then((remoteStores) => {
      if (cancelled) return;
      setStores(remoteStores);
      setCurrentStoreState((prev) => {
        if (!prev) return remoteStores[0] || null;
        return remoteStores.find((s) => s.id === prev.id) || remoteStores[0] || null;
      });
    }).catch((err) => console.warn('تعذر تحميل بيانات MySQL:', err));

    return () => { cancelled = true; };
  }, []);

  const handleSelectStore = (store: Store, targetView?: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => {
    if ((targetView === 'MERCHANT_DASHBOARD' || (!targetView && currentView === 'MERCHANT_DASHBOARD')) && currentMember?.role === 'merchant' && store.merchantUserId && store.merchantUserId !== currentMember.id) {
      return;
    }
    setCurrentStoreState(store);
    setActiveStore(store);
    if (targetView === 'MERCHANT_DASHBOARD') setCurrentView('MERCHANT_DASHBOARD');
    else if (targetView === 'STORE_FRONT') setCurrentView('STORE_FRONT');
  };

  const handleUpdateStore = (updatedStore: Store) => {
    setCurrentStoreState(updatedStore);
    const updatedList = stores.map((s) => (s.id === updatedStore.id ? updatedStore : s));
    setStores(updatedList);
    if (isSuperAdminLoggedIn) {
      api.adminSaveStore(updatedStore).then((r) => { if (!r.ok) console.warn(r.error); });
    }
  };

  const handleStoreCreated = (newStore: Store) => {
    setStores((prev) => [...prev, newStore]);
    handleSelectStore(newStore, 'MERCHANT_DASHBOARD');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-['Tajawal'] text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Real-time Order Notification System */}
      <NotificationSystem
        onSelectStoreOrder={(storeSlug) => {
          const matched = stores.find((s) => s.slug === storeSlug);
          if (matched) {
            handleSelectStore(matched, 'MERCHANT_DASHBOARD');
          }
        }}
      />

      {/* View Switcher Router */}
      {(currentView === 'PLATFORM_HOME' || (currentView as string) === 'landing') && (
        <PlatformLanding
          stores={stores}
          onNavigate={(view) => {
            if ((view as string) === 'create_wizard' || view === 'CREATE_STORE') {
              if (currentMember?.role === 'merchant') {
                setCurrentView('CREATE_STORE');
              } else {
                setAuthModalDefaultRole('merchant');
                setShowMemberAuthModal(true);
              }
            } else if ((view as string) === 'landing' || view === 'PLATFORM_HOME') {
              setCurrentView('PLATFORM_HOME');
            } else {
              setCurrentView(view);
            }
          }}
          onSelectStore={(store, view) => {
            handleSelectStore(store, view);
          }}
          onOpenLoginModal={handleOpenMerchantAuth}
          isLoggedIn={isLoggedIn}
          currentMember={currentMember}
          onOpenMemberAuthModal={() => {
            setAuthModalDefaultRole('buyer');
            setShowMemberAuthModal(true);
          }}
          onLogoutMember={handleMemberLogout}
          onOpenInfinityFreeModal={() => setShowInfinityFreeModal(true)}
          onOpenAdminLoginModal={openAdminPanel}
        />
      )}

      {(currentView === 'ADMIN_DASHBOARD' || (currentView as string) === 'admin_dashboard') && (
        adminSessionChecked && isSuperAdminLoggedIn ? (
          <AdminDashboard
            stores={stores}
            onUpdateStore={handleUpdateStore}
            onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
            onLogoutAdmin={handleAdminLogout}
            onOpenStorefront={(store) => handleSelectStore(store, 'STORE_FRONT')}
            onOpenInfinityFreeModal={() => setShowInfinityFreeModal(true)}
          />
        ) : (
          <PlatformLanding
            stores={stores}
            onNavigate={(view) => setCurrentView(view)}
            onSelectStore={(store, view) => handleSelectStore(store, view)}
            onOpenLoginModal={handleOpenMerchantAuth}
            isLoggedIn={isLoggedIn}
            currentMember={currentMember}
            onOpenMemberAuthModal={() => {
              setAuthModalDefaultRole('buyer');
              setShowMemberAuthModal(true);
            }}
            onLogoutMember={handleMemberLogout}
            onOpenInfinityFreeModal={() => setShowInfinityFreeModal(true)}
            onOpenAdminLoginModal={() => setShowAdminLoginModal(true)}
          />
        )
      )}

      {(currentView === 'CREATE_STORE' || (currentView as string) === 'create_wizard') && (
        <CreateStoreWizard
          currentMember={currentMember}
          onCancel={() => setCurrentView('PLATFORM_HOME')}
          onStoreCreated={handleStoreCreated}
        />
      )}

      {(currentView === 'MERCHANT_DASHBOARD' || (currentView as string) === 'merchant_dashboard') && currentStore && (
        <MerchantDashboard
          currentStore={currentStore}
          allStores={stores}
          onSelectStore={(store) => handleSelectStore(store)}
          onUpdateStore={handleUpdateStore}
          onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
          onOpenStorefront={(store) => handleSelectStore(store, 'STORE_FRONT')}
          onOpenInfinityFreeModal={() => setShowInfinityFreeModal(true)}
        />
      )}

      {(currentView === 'STORE_FRONT' || (currentView as string) === 'storefront') && currentStore && (
        <StoreFrontView
          store={currentStore}
          onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
          onNavigateMerchant={(store) => handleSelectStore(store, 'MERCHANT_DASHBOARD')}
          isLoggedIn={isLoggedIn}
          onOpenMemberAuthModal={() => {
            setAuthModalDefaultRole('buyer');
            setShowMemberAuthModal(true);
          }}
        />
      )}

      {/* Member / Merchant Auth Modal */}
      <MemberAuthModal
        isOpen={showMemberAuthModal}
        defaultRole={authModalDefaultRole}
        onClose={() => setShowMemberAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* InfinityFree Hosting Guide Modal */}
      <InfinityFreeModal
        isOpen={showInfinityFreeModal}
        onClose={() => setShowInfinityFreeModal(false)}
      />

      {/* Super Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={(user) => {
          if (user?.role !== 'admin') {
            setIsSuperAdminLoggedIn(false);
            return;
          }
          setIsSuperAdminLoggedIn(true);
          setAdminUser(user);
          localStorage.setItem('youmi_admin_session', JSON.stringify(user));
          setShowAdminLoginModal(false);
          setCurrentView('ADMIN_DASHBOARD');
          if (window.location.pathname !== '/admin') window.history.pushState({}, '', '/admin');
        }}
      />

      {/* Merchant Quick Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 dir-rtl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Cairo']">تسجيل دخول التُجّار</h3>
                  <p className="text-xs text-slate-500">اختر متجرك للانتقال مباشرة للوحة التحكم</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {stores.filter((s) => currentMember?.role !== 'merchant' || s.merchantUserId === currentMember.id).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleSelectStore(s, 'MERCHANT_DASHBOARD');
                    setShowLoginModal(false);
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition flex items-center justify-between text-right group"
                >
                  <div className="flex items-center gap-3">
                    <img src={s.logoUrl} alt={s.name} className="w-10 h-10 rounded-xl object-cover bg-white border border-slate-200 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition font-['Cairo']">
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">/{s.slug}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-[-2px] transition">
                    لوحة التحكم
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">ليس لديك متجر بعد؟</span>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  if (currentMember?.role === 'merchant') {
                    setCurrentView('CREATE_STORE');
                  } else {
                    setAuthModalDefaultRole('merchant');
                    setShowMemberAuthModal(true);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء متجر جديد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
