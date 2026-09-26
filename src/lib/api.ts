export type ApiResult<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function request<T = any>(
  action: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(
      `/api.php?action=${encodeURIComponent(action)}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
        ...init,
      }
    );

    /**
     * نقرأ الاستجابة كنص أولاً.
     *
     * السبب:
     * إذا أعاد PHP HTML أو Warning/Fatal Error
     * فلن يظهر خطأ JSON غامض مثل:
     * Unexpected token '<'
     */
    const rawText = await res.text();

    let data: any = {};

    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(
          `[API] ${action} returned invalid JSON:`,
          rawText.slice(0, 1000)
        );

        return {
          ok: false,
          error:
            res.status >= 500
              ? `Server error (${res.status})`
              : `Invalid JSON response from API (${res.status})`,
        };
      }
    }

    /**
     * HTTP error أو API error.
     */
    if (
      !res.ok ||
      data?.status === 'error' ||
      data?.ok === false
    ) {
      return {
        ok: false,
        error:
          data?.message ||
          data?.error ||
          `HTTP ${res.status}`,
      };
    }

    /**
     * نجاح.
     */
    return {
      ok: true,
      data,
    };
  } catch (e: any) {
    console.error(
      `[API] ${action} request failed:`,
      e
    );

    return {
      ok: false,
      error:
        e?.message ||
        'Network error',
    };
  }
}

const post = <T = any>(
  action: string,
  payload: any
) =>
  request<T>(action, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const api = {
  // =====================================================
  // المصادقة
  // =====================================================

  me: () =>
    request('me'),

  status: () =>
    request('status'),

  login: (
    payload: any
  ) =>
    post('login', payload),

  register: (
    payload: any
  ) =>
    post('register', payload),

  logout: () =>
    post('logout', {}),

  // =====================================================
  // المتاجر
  // =====================================================

  /**
   * جميع المتاجر العامة.
   */
  publicStores: () =>
    request('stores'),

  /**
   * متاجر المستخدم الحالي فقط.
   *
   * هذا الـ endpoint مهم جداً للـ Merchant Dashboard.
   */
  myStores: () =>
    request('my_stores'),

  /**
   * جلب متجر محدد للبائع.
   */
  merchantStore: (
    storeId: string
  ) =>
    post('merchant_store', {
      storeId,
    }),

  /**
   * إنشاء متجر جديد.
   */
  createStore: (
    store: any
  ) =>
    post('create_store', store),

  /**
   * حفظ بيانات متجر البائع.
   */
  saveStore: (
    store: any
  ) =>
    post(
      'merchant_save_store',
      store
    ),

  /**
   * حفظ متجر بواسطة Admin.
   */
  adminSaveStore: (
    store: any
  ) =>
    post(
      'admin_save_store',
      store
    ),

  // =====================================================
  // المنتجات
  // =====================================================

  saveProduct: (
    storeId: string,
    product: any
  ) =>
    post(
      'merchant_save_product',
      {
        storeId,
        product,
      }
    ),

  deleteProduct: (
    storeId: string,
    productId: string
  ) =>
    post(
      'merchant_delete_product',
      {
        storeId,
        productId,
      }
    ),

  adminSaveProduct: (
    storeId: string,
    product: any
  ) =>
    post(
      'admin_save_product',
      {
        storeId,
        product,
      }
    ),

  adminDeleteProduct: (
    storeId: string,
    productId: string
  ) =>
    post(
      'admin_delete_product',
      {
        storeId,
        productId,
      }
    ),

  // =====================================================
  // الكوبونات
  // =====================================================

  saveCoupon: (
    storeId: string,
    coupon: any
  ) =>
    post(
      'merchant_save_coupon',
      {
        storeId,
        coupon,
      }
    ),

  deleteCoupon: (
    storeId: string,
    couponId: string
  ) =>
    post(
      'merchant_delete_coupon',
      {
        storeId,
        couponId,
      }
    ),

  // =====================================================
  // اشتراك المتجر الحالي
  // =====================================================

  updateSubscription: (
    storeId: string,
    subscription: any
  ) =>
    post(
      'merchant_update_subscription',
      {
        storeId,
        subscription,
      }
    ),

  // =====================================================
  // الطلبات
  // =====================================================

  merchantOrders: (
    storeId: string
  ) =>
    post(
      'merchant_orders',
      {
        storeId,
      }
    ),

  updateOrder: (
    storeId: string,
    orderId: string,
    status: string,
    extra: any = {}
  ) =>
    post(
      'merchant_update_order',
      {
        storeId,
        orderId,
        status,
        ...extra,
      }
    ),

  createOrder: (
    storeSlug: string,
    order: any
  ) =>
    post(
      'create_order',
      {
        storeSlug,
        order,
      }
    ),

  trackOrder: (
    query: string
  ) =>
    post(
      'track_order',
      {
        query,
      }
    ),

  // =====================================================
  // لوحة تحكم Admin
  // =====================================================

  dashboard: () =>
    request(
      'admin_dashboard'
    ),

  merchants: () =>
    request(
      'admin_merchants'
    ),

  stores: () =>
    request(
      'admin_stores'
    ),

  orders: () =>
    request(
      'admin_orders'
    ),

  merchantStatus: (
    id: string,
    status:
      | 'active'
      | 'suspended'
  ) =>
    post(
      'admin_set_merchant_status',
      {
        id,
        status,
      }
    ),

  deleteMerchant: (
    id: string
  ) =>
    post(
      'admin_delete_merchant',
      {
        id,
      }
    ),

  deleteStore: (
    id: string
  ) =>
    post(
      'admin_delete_store',
      {
        id,
      }
    ),

  orderStatus: (
    id: string,
    status: string
  ) =>
    post(
      'admin_set_order_status',
      {
        id,
        status,
      }
    ),

  adminSubscription: (
    storeId: string,
    subscription: any
  ) =>
    post(
      'admin_update_subscription',
      {
        storeId,
        subscription,
      }
    ),

  // =====================================================
  // إعدادات المنصة
  // =====================================================

  getPlatformSettings: () =>
    request(
      'get_platform_settings'
    ),

  savePlatformSettings: (
    payload: any
  ) =>
    post(
      'admin_save_platform_settings',
      payload
    ),

  // =====================================================
  // إدارة خطط اشتراك البائعين
  // =====================================================

  /**
   * جلب جميع خطط الاشتراك.
   */
  adminSubscriptionPlans: () =>
    request(
      'admin_subscription_plans'
    ),

  /**
   * إضافة أو تعديل خطة اشتراك.
   */
  adminSaveSubscriptionPlan: (
    plan: any
  ) =>
    post(
      'admin_save_subscription_plan',
      {
        plan,
      }
    ),

  /**
   * حذف خطة اشتراك.
   */
  adminDeleteSubscriptionPlan: (
    planId: string
  ) =>
    post(
      'admin_delete_subscription_plan',
      {
        planId,
      }
    ),

  /**
   * تعيين خطة لبائع / متجر.
   */
  adminAssignSubscriptionPlan: (
    storeId: string,
    planId: string,
    options: any = {}
  ) =>
    post(
      'admin_assign_subscription_plan',
      {
        storeId,
        planId,
        ...options,
      }
    ),

  /**
   * تمديد اشتراك بائع.
   */
  adminExtendSubscription: (
    storeId: string,
    days: number
  ) =>
    post(
      'admin_extend_subscription',
      {
        storeId,
        days,
      }
    ),
};
