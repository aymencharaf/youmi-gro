import React, { useEffect, useMemo, useState } from 'react';
import { Store, AppView } from './types';
import {
  getStoresFromStorage,
  getActiveStore,
  setActiveStore,
  loadStoresFromApi,
  loadMyStoresFromApi,
  logoutApi,
} from './lib/storage';
import { api } from './lib/api';
import { PlatformLanding } from './components/PlatformLanding';
import { CreateStoreWizard } from './components/CreateStoreWizard';
import { MerchantDashboard } from './components/merchant/MerchantDashboard';
import { StoreFrontView } from './components/storefront/StoreFrontView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { MemberAuthModal, B2BMember } from './components/MemberAuthModal';
import { InfinityFreeModal } from './components/InfinityFreeModal';

const MEMBER_KEY = 'youmi_member_user';
const ADMIN_KEY = 'youmi_admin_session';

export default function App() {
  const [stores, setStores] = useState<Store[]>(() => getStoresFromStorage());
  const [currentStore, setCurrentStore] = useState<Store | null>(() => getActiveStore());
  const [currentView, setCurrentView] = useState<AppView>('PLATFORM_HOME');
  const [currentMember, setCurrentMember] = useState<B2BMember | null>(() => {
    try { return JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null'); } catch { return null; }
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'); } catch { return null; }
  });
  const [memberAuthOpen, setMemberAuthOpen] = useState(false);
  const [memberAuthRole, setMemberAuthRole] = useState<'buyer' | 'merchant'>('buyer');
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [infinityFreeOpen, setInfinityFreeOpen] = useState(false);

  const isAdminLoggedIn = !!adminUser;
  const isLoggedIn = !!currentMember?.isLoggedIn || isAdminLoggedIn;

  const refreshPublicStores = async () => {
    try {
      const next = await loadStoresFromApi();
      if (next?.length) {
        setStores(next);
        if (currentStore) {
          const updated = next.find(s => s.id === currentStore.id);
          if (updated) setCurrentStore(updated);
        }
      }
    } catch (e) { console.warn('تعذر تحميل المتاجر:', e); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (!cancelled && me.ok && me.data?.user) {
          const u = me.data.user;
          const member: B2BMember = {
            id: u.id,
            name: u.name || u.username || '',
            phone: u.phone || '',
            companyName: u.company_name || u.companyName,
            role: u.role === 'merchant' || u.role === 'admin' ? u.role : 'buyer',
            status: u.status,
            isLoggedIn: true,
          };
          if (member.role === 'admin') {
            setAdminUser(u);
            localStorage.setItem(ADMIN_KEY, JSON.stringify(u));
          } else {
            setCurrentMember(member);
            localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
          }
        }
      } catch {}
      await refreshPublicStores();
    })();
    return () => { cancelled = true; };
  }, []);

  const openMemberAuth = (role: 'buyer' | 'merchant' = 'buyer') => {
    setMemberAuthRole(role);
    setMemberAuthOpen(true);
  };

  const handleMemberSuccess = async (member: B2BMember) => {
    setCurrentMember(member);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    if (member.role === 'merchant') {
      try {
        const mine = await loadMyStoresFromApi();
        setStores(mine.length ? mine : getStoresFromStorage());
        if (mine.length) {
          setCurrentStore(mine[0]);
          setActiveStore(mine[0]);
        }
      } catch {}
    } else {
      await refreshPublicStores();
    }
  };

  const handleMemberLogout = async () => {
    await logoutApi().catch(() => {});
    localStorage.removeItem(MEMBER_KEY);
    setCurrentMember(null);
    setCurrentView('PLATFORM_HOME');
    await refreshPublicStores();
  };

  const handleAdminSuccess = (user: any) => {
    setAdminUser(user);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
    setAdminLoginOpen(false);
    setCurrentView('ADMIN_DASHBOARD');
  };

  const handleAdminLogout = async () => {
    await logoutApi().catch(() => {});
    localStorage.removeItem(ADMIN_KEY);
    setAdminUser(null);
    setCurrentView('PLATFORM_HOME');
  };

  const updateStore = (updated: Store) => {
    setStores(prev => {
      const copy = [...prev];
      const i = copy.findIndex(s => s.id === updated.id);
      if (i >= 0) copy[i] = updated; else copy.push(updated);
      return copy;
    });
    setCurrentStore(prev => prev?.id === updated.id ? updated : prev);
    setActiveStore(updated);
  };

  const selectStore = (store: Store, view: 'MERCHANT_DASHBOARD' | 'STORE_FRONT') => {
    setCurrentStore(store);
    setActiveStore(store);
    setCurrentView(view);
  };

  const handleNavigate = (view: AppView) => {
  // لوحة الإدارة محمية
  if (view === 'ADMIN_DASHBOARD' && !isAdminLoggedIn) {
    setAdminLoginOpen(true);
    return;
  }

  // إنشاء متجر
  if (view === 'CREATE_STORE') {
    if (isAdminLoggedIn) {
      setCurrentView(view);
      return;
    }

    if (!currentMember || currentMember.role !== 'merchant') {
      openMemberAuth('merchant');
      return;
    }

    setCurrentView(view);
    return;
  }

  // لوحة تحكم البائع
  if (view === 'MERCHANT_DASHBOARD') {
    if (isAdminLoggedIn) {
      setCurrentView(view);
      return;
    }

    if (!currentMember || currentMember.role !== 'merchant') {
      openMemberAuth('merchant');
      return;
    }

    if (!currentStore) {
      loadMyStoresFromApi()
        .then((mine) => {
          if (mine.length > 0) {
            setStores(mine);
            setCurrentStore(mine[0]);
            setActiveStore(mine[0]);
            setCurrentView('MERCHANT_DASHBOARD');
          } else {
            setCurrentView('CREATE_STORE');
          }
        })
        .catch(() => {
          setCurrentView('CREATE_STORE');
        });

      return;
    }
  }

  setCurrentView(view);
};

  const merchantStores = useMemo(() => {
    if (currentMember?.role !== 'merchant') return stores;
    return stores.filter(s => !s.merchantUserId || s.merchantUserId === currentMember.id);
  }, [stores, currentMember]);

  return (
    <>
      {currentView === 'PLATFORM_HOME' && (
        <PlatformLanding
          stores={stores}
          onNavigate={handleNavigate}
          onSelectStore={selectStore}
          onOpenLoginModal={() => openMemberAuth('merchant')}
          isLoggedIn={isLoggedIn}
          isAdminLoggedIn={isAdminLoggedIn}
          currentMember={currentMember}
          onOpenMemberAuthModal={() => openMemberAuth('buyer')}
          onLogoutMember={handleMemberLogout}
          onOpenInfinityFreeModal={() => setInfinityFreeOpen(true)}
          onOpenAdminLoginModal={() => setAdminLoginOpen(true)}
        />
      )}

      {currentView === 'CREATE_STORE' && (
        <CreateStoreWizard
          currentMember={currentMember}
          onBackToHome={() => setCurrentView('PLATFORM_HOME')}
          onCancel={() => setCurrentView('PLATFORM_HOME')}
          onStoreCreated={(store) => {
            updateStore(store);
            setCurrentView('MERCHANT_DASHBOARD');
          }}
        />
      )}

      {currentView === 'MERCHANT_DASHBOARD' && currentStore && (
        <MerchantDashboard
          currentStore={currentStore}
          allStores={merchantStores}
          onSelectStore={(store) => { setCurrentStore(store); setActiveStore(store); }}
          onUpdateStore={updateStore}
          onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
          onOpenStorefront={(store) => selectStore(store, 'STORE_FRONT')}
          onOpenInfinityFreeModal={() => setInfinityFreeOpen(true)}
        />
      )}

      {currentView === 'STORE_FRONT' && currentStore && (
        <StoreFrontView
          store={currentStore}
          isLoggedIn={isLoggedIn}
          onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
          onNavigateMerchant={(store) => selectStore(store, 'MERCHANT_DASHBOARD')}
          onOpenMemberAuthModal={() => openMemberAuth('buyer')}
        />
      )}

      {currentView === 'ADMIN_DASHBOARD' && isAdminLoggedIn && (
        <AdminDashboard
          stores={stores}
          onUpdateStore={updateStore}
          onNavigateHome={() => setCurrentView('PLATFORM_HOME')}
          onLogoutAdmin={handleAdminLogout}
          onOpenStorefront={(store) => selectStore(store, 'STORE_FRONT')}
          onOpenInfinityFreeModal={() => setInfinityFreeOpen(true)}
        />
      )}

      <MemberAuthModal
        isOpen={memberAuthOpen}
        defaultRole={memberAuthRole}
        onClose={() => setMemberAuthOpen(false)}
        onSuccess={handleMemberSuccess}
        onLoginSuccess={handleMemberSuccess}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onLoginSuccess={handleAdminSuccess}
      />

      <InfinityFreeModal
        isOpen={infinityFreeOpen}
        onClose={() => setInfinityFreeOpen(false)}
      />
    </>
  );
}
