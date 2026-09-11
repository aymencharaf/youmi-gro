export type ApiResult<T = any> = { ok: boolean; data?: T; error?: string };

async function request<T = any>(action: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api.php?action=${encodeURIComponent(action)}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === 'error') return { ok: false, error: data.message || data.error || `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (e: any) { return { ok: false, error: e?.message || 'Network error' }; }
}
const post = <T = any>(action:string, payload:any) => request<T>(action,{method:'POST',body:JSON.stringify(payload)});

export const api = {
  me: () => request('me'), status: () => request('status'),
  login: (payload:any) => post('login',payload), register:(payload:any)=>post('register',payload), logout:()=>post('logout',{}),
  publicStores:()=>request('stores'), myStores:()=>request('my_stores'), merchantStore:(storeId:string)=>post('merchant_store',{storeId}), createStore:(store:any)=>post('create_store',store),
  saveStore:(store:any)=>post('merchant_save_store',store), adminSaveStore:(store:any)=>post('admin_save_store',store),
  saveProduct:(storeId:string,product:any)=>post('merchant_save_product',{storeId,product}), deleteProduct:(storeId:string,productId:string)=>post('merchant_delete_product',{storeId,productId}),
  saveCoupon:(storeId:string,coupon:any)=>post('merchant_save_coupon',{storeId,coupon}), deleteCoupon:(storeId:string,couponId:string)=>post('merchant_delete_coupon',{storeId,couponId}),
  updateSubscription:(storeId:string,subscription:any)=>post('merchant_update_subscription',{storeId,subscription}),
  merchantOrders:(storeId:string)=>post('merchant_orders',{storeId}), updateOrder:(orderId:string,status:string,extra:any={})=>post('merchant_update_order',{orderId,status,...extra}),
  createOrder:(storeSlug:string,order:any)=>post('create_order',{storeSlug,order}), trackOrder:(query:string)=>post('track_order',{query}),
  dashboard:()=>request('admin_dashboard'), merchants:()=>request('admin_merchants'), stores:()=>request('admin_stores'), orders:()=>request('admin_orders'),
  merchantStatus:(id:string,status:'active'|'suspended')=>post('admin_set_merchant_status',{id,status}), orderStatus:(id:string,status:string)=>post('admin_set_order_status',{id,status}), adminSubscription:(storeId:string,subscription:any)=>post('admin_update_subscription',{storeId,subscription}), adminSaveProduct:(storeId:string,product:any)=>post('admin_save_product',{storeId,product}), adminDeleteProduct:(storeId:string,productId:string)=>post('admin_delete_product',{storeId,productId}),
};
