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
  const [stores, setStores] = useState<Store[]>(() =>
    getStoresFromStorage()
  );

  const [currentStore, setCurrentStore] = useState<Store | null>(() =>
    getActiveStore()
  );

  const [currentView, setCurrentView] =
    useState<AppView>('PLATFORM_HOME');

  const [currentMember, setCurrentMember] =
    useState<B2BMember | null>(() => {
      try {
        return JSON.parse(
          localStorage.getItem(MEMBER_KEY) || 'null'
        );
      } catch {
        return null;
      }
    });

  const [adminUser, setAdminUser] = useState<any>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(ADMIN_KEY) || 'null'
      );
    } catch {
      return null;
    }
  });

  const [memberAuthOpen, setMemberAuthOpen] = useState(false);

  const [memberAuthRole, setMemberAuthRole] =
    useState<'buyer' | 'merchant'>('buyer');

  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [infinityFreeOpen, setInfinityFreeOpen] = useState(false);

  const isAdminLoggedIn = !!adminUser;

  const isLoggedIn =
    !!currentMember?.isLoggedIn || isAdminLoggedIn;

  /**
   * تحميل المتاجر العامة
   */
  const refreshPublicStores = async () => {
    try {
      const next = await loadStoresFromApi();

      if (next?.length) {
        setStores(next);

        if (currentStore) {
          const updated = next.find(
            (store) => store.id === currentStore.id
          );

          if (updated) {
            setCurrentStore(updated);
          }
        }
      }
    } catch (error) {
      console.warn('تعذر تحميل المتاجر:', error);
    }
  };

  /**
   * استعادة جلسة المستخدم عند فتح التطبيق
   */
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
            companyName:
              u.company_name || u.companyName,
            role:
              u.role === 'merchant' || u.role === 'admin'
                ? u.role
                : 'buyer',
            status: u.status,
            isLoggedIn: true,
          };

          if (member.role === 'admin') {
            setAdminUser(u);
            localStorage.setItem(
              ADMIN_KEY,
              JSON.stringify(u)
            );
          } else {
            setCurrentMember(member);
            localStorage.setItem(
              MEMBER_KEY,
              JSON.stringify(member)
            );
          }
        }
      } catch {
        // لا توجد جلسة API صالحة
      }

      await refreshPublicStores();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * فتح تسجيل الدخول للأعضاء
   */
  const openMemberAuth = (
    role: 'buyer' | 'merchant' = 'buyer'
  ) => {
    setMemberAuthRole(role);
    setMemberAuthOpen(true);
  };

  /**
   * نجاح تسجيل دخول / تسجيل عضو
   */
  const handleMemberSuccess = async (
    member: B2BMember
  ) => {
    setCurrentMember(member);

    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify(member)
    );

    if (member.role === 'merchant') {
      try {
        const mine = await loadMyStoresFromApi();

        setStores(
          mine.length
            ? mine
            : getStoresFromStorage()
        );

        if (mine.length) {
          setCurrentStore(mine[0]);
          setActiveStore(mine[0]);
        }
      } catch (error) {
        console.warn(
          'تعذر تحميل متاجر البائع:',
          error
        );
      }
    } else {
      await refreshPublicStores();
    }

    setMemberAuthOpen(false);
  };

  /**
   * تسجيل خروج العضو
   */
  const handleMemberLogout = async () => {
    await logoutApi().catch(() => {});

    localStorage.removeItem(MEMBER_KEY);

    setCurrentMember(null);
    setCurrentView('PLATFORM_HOME');

    await refreshPublicStores();
  };

  /**
   * نجاح تسجيل دخول المدير
   */
  const handleAdminSuccess = (user: any) => {
    setAdminUser(user);

    localStorage.setItem(
      ADMIN_KEY,
      JSON.stringify(user)
    );

    setAdminLoginOpen(false);
    setCurrentView('ADMIN_DASHBOARD');
  };

  /**
   * تسجيل خروج المدير
   */
  const handleAdminLogout = async () => {
    await logoutApi().catch(() => {});

    localStorage.removeItem(ADMIN_KEY);

    setAdminUser(null);
    setCurrentView('PLATFORM_HOME');
  };

  /**
   * تحديث متجر
   *
   * تم تحديد نوع prev صراحةً لتجنب
   * مشكلة TypeScript في updater callback.
   */
  const updateStore = (updated: Store) => {
    setStores((prev: Store[]) => {
      const copy = [...prev];

      const index = copy.findIndex(
        (store) => store.id === updated.id
      );

      if (index >= 0) {
        copy[index] = updated;
      } else {
        copy.push(updated);
      }

      return copy;
    });

    setCurrentStore((prev: Store | null) =>
      prev?.id === updated.id
        ? updated
        : prev
    );

    setActiveStore(updated);
  };

  /**
   * اختيار متجر
   */
  const selectStore = (
    store: Store,
    view:
      | 'MERCHANT_DASHBOARD'
      | 'STORE_FRONT'
  ) => {
    setCurrentStore(store);
    setActiveStore(store);
    setCurrentView(view);
  };

  /**
   * التنقل بين شاشات التطبيق
   */
  const handleNavigate = (view: AppView) => {
    // ==============================
    // لوحة الإدارة محمية
    // ==============================
    if (
      view === 'ADMIN_DASHBOARD' &&
      !isAdminLoggedIn
    ) {
      setAdminLoginOpen(true);
      return;
    }

    // ==============================
    // إنشاء متجر
    // ==============================
    if (view === 'CREATE_STORE') {
      if (isAdminLoggedIn) {
        setCurrentView(view);
        return;
      }

      if (
        !currentMember ||
        currentMember.role !== 'merchant'
      ) {
        openMemberAuth('merchant');
        return;
      }

      setCurrentView(view);
      return;
    }

    // ==============================
    // لوحة تحكم البائع
    // ==============================
    if (view === 'MERCHANT_DASHBOARD') {
      if (isAdminLoggedIn) {
        setCurrentView(view);
        return;
      }

      if (
        !currentMember ||
        currentMember.role !== 'merchant'
      ) {
        openMemberAuth('merchant');
        return;
      }

      if (!currentStore || currentStore.merchantUserId !== currentMember.id) {
        loadMyStoresFromApi()
          .then((mine) => {
            if (mine.length > 0) {
              setStores(mine);

              setCurrentStore(mine[0]);
              setActiveStore(mine[0]);

              setCurrentView(
                'MERCHANT_DASHBOARD'
              );
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

  /**
   * فتح لوحة تحكم البائع مباشرة
   *
   * يستخدمه زر "لوحة تحكم البائع"
   * في PlatformLanding.
   */
  const openMerchantDashboard = async () => {
    // إذا لم يسجل الدخول كبائع
    if (
      !currentMember ||
      currentMember.role !== 'merchant'
    ) {
      openMemberAuth('merchant');
      return;
    }

    // استعمال المتجر الحالي إذا كان ملكًا للبائع
    if (
      currentStore &&
      currentStore.merchantUserId === currentMember.id
    ) {
      setCurrentView('MERCHANT_DASHBOARD');
      return;
    }

    // البحث عن متجر البائع في المتاجر الموجودة
    const merchantStore = stores.find(
      (store) =>
        store.merchantUserId === currentMember.id
    );

    if (merchantStore) {
      setCurrentStore(merchantStore);
      setActiveStore(merchantStore);
      setCurrentView('MERCHANT_DASHBOARD');
      return;
    }

    // محاولة تحميل متاجر البائع من API
    try {
      const mine = await loadMyStoresFromApi();

      if (mine.length > 0) {
        setStores(mine);
        setCurrentStore(mine[0]);
        setActiveStore(mine[0]);
        setCurrentView('MERCHANT_DASHBOARD');
      } else {
        // البائع ليس لديه متجر بعد
        setCurrentView('CREATE_STORE');
      }
    } catch {
      setCurrentView('CREATE_STORE');
    }
  };

  /**
   * المتاجر التي يسمح للبائع برؤيتها
   */
  const merchantStores = useMemo(() => {
    if (currentMember?.role !== 'merchant') {
      return stores;
    }

    return stores.filter(
      (store) =>
        !store.merchantUserId ||
        store.merchantUserId === currentMember.id
    );
  }, [stores, currentMember]);

  return (
    <>
      {/* ======================================
          PLATFORM HOME
      ====================================== */}
      {currentView === 'PLATFORM_HOME' && (
        <PlatformLanding
          stores={stores}
          onNavigate={handleNavigate}
          onSelectStore={selectStore}
          onOpenLoginModal={() =>
            openMemberAuth('merchant')
          }
          onOpenMerchantDashboard={
            openMerchantDashboard
          }
          isLoggedIn={isLoggedIn}
          isAdminLoggedIn={isAdminLoggedIn}
          currentMember={currentMember}
          onOpenMemberAuthModal={() =>
            openMemberAuth('buyer')
          }
          onLogoutMember={handleMemberLogout}
          onOpenInfinityFreeModal={() =>
            setInfinityFreeOpen(true)
          }
          onOpenAdminLoginModal={() =>
            setAdminLoginOpen(true)
          }
        />
      )}

      {/* ======================================
          CREATE STORE
      ====================================== */}
      {currentView === 'CREATE_STORE' && (
        <CreateStoreWizard
          currentMember={currentMember}
          onBackToHome={() =>
            setCurrentView('PLATFORM_HOME')
          }
          onCancel={() =>
            setCurrentView('PLATFORM_HOME')
          }
          onStoreCreated={(store) => {
            updateStore(store);

            setCurrentStore(store);
            setActiveStore(store);

            setCurrentView(
              'MERCHANT_DASHBOARD'
            );
          }}
        />
      )}

      {/* ======================================
          MERCHANT DASHBOARD
      ====================================== */}
      {currentView === 'MERCHANT_DASHBOARD' &&
        currentStore && (
          <MerchantDashboard
            currentStore={currentStore}
            allStores={merchantStores}
            onSelectStore={(store) => {
              setCurrentStore(store);
              setActiveStore(store);
            }}
            onUpdateStore={updateStore}
            onNavigateHome={() =>
              setCurrentView('PLATFORM_HOME')
            }
            onOpenStorefront={(store) =>
              selectStore(store, 'STORE_FRONT')
            }
            onOpenInfinityFreeModal={() =>
              setInfinityFreeOpen(true)
            }
          />
        )}

      {/* ======================================
          STORE FRONT
      ====================================== */}
      {currentView === 'STORE_FRONT' &&
        currentStore && (
          <StoreFrontView
            store={currentStore}
            isLoggedIn={isLoggedIn}
            onNavigateHome={() =>
              setCurrentView('PLATFORM_HOME')
            }
            onNavigateMerchant={(store) =>
              selectStore(
                store,
                'MERCHANT_DASHBOARD'
              )
            }
            onOpenMemberAuthModal={() =>
              openMemberAuth('buyer')
            }
          />
        )}

      {/* ======================================
          ADMIN DASHBOARD
      ====================================== */}
      {currentView === 'ADMIN_DASHBOARD' &&
        isAdminLoggedIn && (
          <AdminDashboard
            stores={stores}
            onUpdateStore={updateStore}
            onNavigateHome={() =>
              setCurrentView('PLATFORM_HOME')
            }
            onLogoutAdmin={handleAdminLogout}
            onOpenStorefront={(store) =>
              selectStore(
                store,
                'STORE_FRONT'
              )
            }
            onOpenInfinityFreeModal={() =>
              setInfinityFreeOpen(true)
            }
          />
        )}

      {/* ======================================
          MEMBER AUTH
      ====================================== */}
      <MemberAuthModal
        isOpen={memberAuthOpen}
        defaultRole={memberAuthRole}
        onClose={() =>
          setMemberAuthOpen(false)
        }
        onSuccess={handleMemberSuccess}
        onLoginSuccess={handleMemberSuccess}
      />

      {/* ======================================
          ADMIN LOGIN
      ====================================== */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() =>
          setAdminLoginOpen(false)
        }
        onLoginSuccess={handleAdminSuccess}
      />

      {/* ======================================
          INFINITY FREE
      ====================================== */}
      <InfinityFreeModal
        isOpen={infinityFreeOpen}
        onClose={() =>
          setInfinityFreeOpen(false)
        }
      />
    </>
  );
}
