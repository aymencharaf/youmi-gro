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
import {
  MemberAuthModal,
  B2BMember,
} from './components/MemberAuthModal';
import { InfinityFreeModal } from './components/InfinityFreeModal';

const MEMBER_KEY = 'youmi_member_user';
const ADMIN_KEY = 'youmi_admin_session';

/**
 * تحويل أي ID إلى String للمقارنة الآمنة.
 *
 * هذا مهم لأن API قد يعيد ID كرقم بينما
 * currentMember.id قد يكون String.
 */
const normalizeId = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

/**
 * التحقق من ملكية المتجر.
 */
const isStoreOwnedByMember = (
  store: Store | null | undefined,
  member: B2BMember | null | undefined
): boolean => {
  if (!store || !member) {
    return false;
  }

  const storeOwnerId = normalizeId(store.merchantUserId);
  const memberId = normalizeId(member.id);

  return (
    storeOwnerId !== '' &&
    memberId !== '' &&
    storeOwnerId === memberId
  );
};

export default function App() {
  const [stores, setStores] = useState<Store[]>(() =>
    getStoresFromStorage()
  );

  const [currentStore, setCurrentStore] =
    useState<Store | null>(() => getActiveStore());

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

  const [memberAuthOpen, setMemberAuthOpen] =
    useState(false);

  const [memberAuthRole, setMemberAuthRole] =
    useState<'buyer' | 'merchant'>('buyer');

  const [adminLoginOpen, setAdminLoginOpen] =
    useState(false);

  const [infinityFreeOpen, setInfinityFreeOpen] =
    useState(false);

  const isAdminLoggedIn = !!adminUser;

  const isLoggedIn =
    !!currentMember?.isLoggedIn || isAdminLoggedIn;

  /**
   * تحميل المتاجر العامة.
   */
  const refreshPublicStores = async () => {
    try {
      const next = await loadStoresFromApi();

      if (next?.length) {
        setStores(next);

        setCurrentStore((previousStore) => {
          if (!previousStore) {
            return null;
          }

          const previousId =
            normalizeId(previousStore.id);

          const updated = next.find(
            (store) =>
              normalizeId(store.id) === previousId
          );

          return updated || previousStore;
        });
      }
    } catch (error) {
      console.warn(
        'تعذر تحميل المتاجر:',
        error
      );
    }
  };

  /**
   * استعادة جلسة المستخدم عند فتح التطبيق.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await api.me();

        if (
          !cancelled &&
          me.ok &&
          me.data?.user
        ) {
          const u = me.data.user;

          const member: B2BMember = {
            id: u.id,
            name:
              u.name ||
              u.username ||
              '',
            phone: u.phone || '',
            companyName:
              u.company_name ||
              u.companyName,
            role:
              u.role === 'merchant' ||
              u.role === 'admin'
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

      if (!cancelled) {
        await refreshPublicStores();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * فتح تسجيل الدخول للأعضاء.
   */
  const openMemberAuth = (
    role: 'buyer' | 'merchant' = 'buyer'
  ) => {
    setMemberAuthRole(role);
    setMemberAuthOpen(true);
  };

  /**
   * نجاح تسجيل دخول / تسجيل عضو.
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
        const mine =
          await loadMyStoresFromApi();

        if (mine.length > 0) {
          setStores(mine);

          const ownedStore =
            mine.find((store) =>
              isStoreOwnedByMember(
                store,
                member
              )
            ) || mine[0];

          setCurrentStore(ownedStore);
          setActiveStore(ownedStore);
        } else {
          setStores(getStoresFromStorage());
          setCurrentStore(null);
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
   * تسجيل خروج العضو.
   */
  const handleMemberLogout = async () => {
    await logoutApi().catch(() => {});

    localStorage.removeItem(MEMBER_KEY);

    setCurrentMember(null);
    setCurrentStore(null);

    setCurrentView('PLATFORM_HOME');

    await refreshPublicStores();
  };

  /**
   * نجاح تسجيل دخول المدير.
   */
  const handleAdminSuccess = (
    user: any
  ) => {
    setAdminUser(user);

    localStorage.setItem(
      ADMIN_KEY,
      JSON.stringify(user)
    );

    setAdminLoginOpen(false);
    setCurrentView('ADMIN_DASHBOARD');
  };

  /**
   * تسجيل خروج المدير.
   */
  const handleAdminLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // تجاهل الخطأ حتى يتم تسجيل الخروج محلياً
    }

    localStorage.removeItem(
      ADMIN_KEY
    );

    localStorage.removeItem(
      MEMBER_KEY
    );

    setAdminUser(null);
    setCurrentMember(null);
    setCurrentStore(null);

    setCurrentView('PLATFORM_HOME');

    await refreshPublicStores();
  };

  /**
   * تحديث متجر.
   */
  const updateStore = (
    updated: Store
  ) => {
    setStores((prev: Store[]) => {
      const copy = [...prev];

      const index =
        copy.findIndex(
          (store) =>
            normalizeId(store.id) ===
            normalizeId(updated.id)
        );

      if (index >= 0) {
        copy[index] = updated;
      } else {
        copy.push(updated);
      }

      return copy;
    });

    setCurrentStore(
      (prev: Store | null) =>
        prev &&
        normalizeId(prev.id) ===
          normalizeId(updated.id)
          ? updated
          : prev
    );

    setActiveStore(updated);
  };

  /**
   * اختيار متجر.
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
   * فتح لوحة تحكم البائع.
   *
   * هذه هي الدالة الأساسية التي يستخدمها
   * زر "لوحة تحكم البائع".
   */
  const openMerchantDashboard =
    async () => {
      /**
       * Admin يستطيع الدخول مباشرة.
       */
      if (isAdminLoggedIn) {
        if (!currentStore) {
          try {
            const allStores =
              await loadStoresFromApi();

            if (allStores.length > 0) {
              setStores(allStores);
              setCurrentStore(allStores[0]);
              setActiveStore(allStores[0]);
            } else {
              setCurrentView(
                'PLATFORM_HOME'
              );
              return;
            }
          } catch {
            setCurrentView(
              'PLATFORM_HOME'
            );
            return;
          }
        }

        setCurrentView(
          'MERCHANT_DASHBOARD'
        );

        return;
      }

      /**
       * يجب أن يكون المستخدم مسجلاً
       * بدور merchant.
       */
      if (
        !currentMember ||
        currentMember.role !== 'merchant'
      ) {
        openMemberAuth('merchant');
        return;
      }

      /**
       * إذا كان المتجر الحالي ملكاً للبائع
       * نفتحه مباشرة.
       */
      if (
        isStoreOwnedByMember(
          currentStore,
          currentMember
        )
      ) {
        setCurrentView(
          'MERCHANT_DASHBOARD'
        );

        return;
      }

      /**
       * البحث أولاً داخل المتاجر الموجودة
       * محلياً.
       */
      const merchantStore =
        stores.find((store) =>
          isStoreOwnedByMember(
            store,
            currentMember
          )
        );

      if (merchantStore) {
        setCurrentStore(
          merchantStore
        );

        setActiveStore(
          merchantStore
        );

        setCurrentView(
          'MERCHANT_DASHBOARD'
        );

        return;
      }

      /**
       * إذا لم نجد متجر البائع محلياً،
       * نطلبه من API.
       */
      try {
        const mine =
          await loadMyStoresFromApi();

        /**
         * API يفترض أن يعيد متاجر
         * المستخدم الحالي فقط.
         *
         * مع ذلك نتحقق من merchantUserId
         * قبل فتح لوحة التحكم.
         */
        const ownedStores =
          mine.filter((store) =>
            isStoreOwnedByMember(
              store,
              currentMember
            )
          );

        if (ownedStores.length > 0) {
          const firstStore =
            ownedStores[0];

          setStores(ownedStores);

          setCurrentStore(
            firstStore
          );

          setActiveStore(
            firstStore
          );

          setCurrentView(
            'MERCHANT_DASHBOARD'
          );
        } else if (mine.length > 0) {
          /**
           * إذا كان API يعيد المتجر ولكن
           * merchantUserId غير موجود بسبب
           * اختلاف اسم الحقل، storage.ts
           * يجب أن يكون قد طبّع الحقل.
           *
           * نستخدم أول متجر كحل توافق
           * فقط لأن myStores API يفترض
           * أنه يعيد متاجر المستخدم الحالي.
           */
          const firstStore =
            mine[0];

          setStores(mine);

          setCurrentStore(
            firstStore
          );

          setActiveStore(
            firstStore
          );

          setCurrentView(
            'MERCHANT_DASHBOARD'
          );
        } else {
          /**
           * البائع ليس لديه متجر.
           */
          setCurrentStore(null);
          setCurrentView(
            'CREATE_STORE'
          );
        }
      } catch (error) {
        console.warn(
          'تعذر تحميل متاجر البائع:',
          error
        );

        setCurrentStore(null);
        setCurrentView(
          'CREATE_STORE'
        );
      }
    };

  /**
   * التنقل بين شاشات التطبيق.
   */
  const handleNavigate = async (
    view: AppView
  ) => {
    /**
     * لوحة الإدارة محمية.
     */
    if (
      view === 'ADMIN_DASHBOARD'
    ) {
      if (!isAdminLoggedIn) {
        setAdminLoginOpen(true);
        return;
      }

      setCurrentView(
        'ADMIN_DASHBOARD'
      );

      return;
    }

    /**
     * إنشاء متجر.
     */
    if (
      view === 'CREATE_STORE'
    ) {
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

      setCurrentView(
        'CREATE_STORE'
      );

      return;
    }

    /**
     * لوحة تحكم البائع.
     */
    if (
      view === 'MERCHANT_DASHBOARD'
    ) {
      await openMerchantDashboard();
      return;
    }

    /**
     * باقي الشاشات.
     */
    setCurrentView(view);
  };

  /**
   * المتاجر التي يمكن للبائع التعامل معها.
   *
   * إذا كان Merchant فلا نعرض له إلا
   * المتاجر المرتبطة بحسابه.
   */
  const merchantStores =
    useMemo(() => {
      if (
        currentMember?.role !==
        'merchant'
      ) {
        return stores;
      }

      const memberId =
        normalizeId(
          currentMember.id
        );

      return stores.filter(
        (store) =>
          normalizeId(
            store.merchantUserId
          ) === memberId
      );
    }, [
      stores,
      currentMember,
    ]);

  return (
    <>
      {/* ======================================
          PLATFORM HOME
      ====================================== */}

      {currentView ===
        'PLATFORM_HOME' && (
        <PlatformLanding
          stores={stores}

          onNavigate={
            handleNavigate
          }

          onSelectStore={
            selectStore
          }

          onOpenLoginModal={() =>
            openMemberAuth(
              'merchant'
            )
          }

          onOpenMerchantDashboard={
            openMerchantDashboard
          }

          isLoggedIn={
            isLoggedIn
          }

          currentMember={
            currentMember
          }

          onOpenMemberAuthModal={() =>
            openMemberAuth(
              'buyer'
            )
          }

          onLogoutMember={
            isAdminLoggedIn
              ? handleAdminLogout
              : handleMemberLogout
          }

          onOpenAdminDashboard={() =>
            handleNavigate(
              'ADMIN_DASHBOARD'
            )
          }

          onOpenInfinityFreeModal={() =>
            setInfinityFreeOpen(
              true
            )
          }

          onOpenAdminLoginModal={() =>
            setAdminLoginOpen(
              true
            )
          }
        />
      )}

      {/* ======================================
          CREATE STORE
      ====================================== */}

      {currentView ===
        'CREATE_STORE' && (
        <CreateStoreWizard
          currentMember={
            currentMember
          }

          onBackToHome={() =>
            setCurrentView(
              'PLATFORM_HOME'
            )
          }

          onCancel={() =>
            setCurrentView(
              'PLATFORM_HOME'
            )
          }

          onStoreCreated={(
            store
          ) => {
            updateStore(store);

            setCurrentStore(
              store
            );

            setActiveStore(
              store
            );

            setCurrentView(
              'MERCHANT_DASHBOARD'
            );
          }}
        />
      )}

      {/* ======================================
          MERCHANT DASHBOARD
      ====================================== */}

      {currentView ===
        'MERCHANT_DASHBOARD' &&
        currentStore && (
          <MerchantDashboard
            currentStore={
              currentStore
            }

            allStores={
              merchantStores
            }

            onSelectStore={(
              store
            ) => {
              setCurrentStore(
                store
              );

              setActiveStore(
                store
              );
            }}

            onUpdateStore={
              updateStore
            }

            onNavigateHome={() =>
              setCurrentView(
                'PLATFORM_HOME'
              )
            }

            onOpenStorefront={(
              store
            ) =>
              selectStore(
                store,
                'STORE_FRONT'
              )
            }

            onOpenInfinityFreeModal={() =>
              setInfinityFreeOpen(
                true
              )
            }
          />
        )}

      {/* ======================================
          حماية إضافية من حالة Dashboard
          بدون متجر
      ====================================== */}

      {currentView ===
        'MERCHANT_DASHBOARD' &&
        !currentStore && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <h2>
              لا يوجد متجر مرتبط بحسابك
            </h2>

            <p>
              يجب إنشاء متجر أولاً
              للوصول إلى لوحة تحكم البائع.
            </p>

            <button
              onClick={() =>
                setCurrentView(
                  'CREATE_STORE'
                )
              }
            >
              إنشاء متجر
            </button>

            <button
              onClick={() =>
                setCurrentView(
                  'PLATFORM_HOME'
                )
              }
              style={{
                marginLeft: '10px',
              }}
            >
              العودة للرئيسية
            </button>
          </div>
        )}

      {/* ======================================
          STORE FRONT
      ====================================== */}

      {currentView ===
        'STORE_FRONT' &&
        currentStore && (
          <StoreFrontView
            store={
              currentStore
            }

            isLoggedIn={
              isLoggedIn
            }

            onNavigateHome={() =>
              setCurrentView(
                'PLATFORM_HOME'
              )
            }

            onNavigateMerchant={(
              store
            ) =>
              selectStore(
                store,
                'MERCHANT_DASHBOARD'
              )
            }

            onOpenMemberAuthModal={() =>
              openMemberAuth(
                'buyer'
              )
            }
          />
        )}

      {/* ======================================
          ADMIN DASHBOARD
      ====================================== */}

      {currentView ===
        'ADMIN_DASHBOARD' &&
        isAdminLoggedIn && (
          <AdminDashboard
            stores={
              stores
            }

            onUpdateStore={
              updateStore
            }

            onNavigateHome={() =>
              setCurrentView(
                'PLATFORM_HOME'
              )
            }

            onLogoutAdmin={
              handleAdminLogout
            }

            onOpenStorefront={(
              store
            ) =>
              selectStore(
                store,
                'STORE_FRONT'
              )
            }

            onOpenInfinityFreeModal={() =>
              setInfinityFreeOpen(
                true
              )
            }
          />
        )}

      {/* ======================================
          MEMBER AUTH
      ====================================== */}

      <MemberAuthModal
        isOpen={
          memberAuthOpen
        }

        defaultRole={
          memberAuthRole
        }

        onClose={() =>
          setMemberAuthOpen(
            false
          )
        }

        onSuccess={
          handleMemberSuccess
        }

        onLoginSuccess={
          handleMemberSuccess
        }
      />

      {/* ======================================
          ADMIN LOGIN
      ====================================== */}

      <AdminLoginModal
        isOpen={
          adminLoginOpen
        }

        onClose={() =>
          setAdminLoginOpen(
            false
          )
        }

        onLoginSuccess={
          handleAdminSuccess
        }
      />

      {/* ======================================
          INFINITY FREE
      ====================================== */}

      <InfinityFreeModal
        isOpen={
          infinityFreeOpen
        }

        onClose={() =>
          setInfinityFreeOpen(
            false
          )
        }
      />
    </>
  );
}
