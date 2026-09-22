import { Store, Order, OrderStatus, Coupon, Product } from '../types';
import { INITIAL_STORES } from '../data/initialStores';
import { api } from './api';
const STORAGE_KEY='tajerplus_stores_v1'; const ACTIVE_STORE_KEY='tajerplus_active_store_id';
function cache(stores:Store[]){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(stores));}catch{}}
export async function getCurrentUser(){const r=await api.me();return r.ok?r.data?.user||null:null;}
export async function logoutApi(){await api.logout();}
export async function createStoreOnApi(store:Store){const r=await api.createStore(store);if(!r.ok)throw new Error(r.error);saveStoreLocal(r.data.store);setActiveStore(r.data.store);return r.data.store as Store;}
export async function loadMyStoresFromApi(){const r=await api.myStores();if(!r.ok)throw new Error(r.error);cache(r.data.stores||[]);return r.data.stores||[];}
export async function loadStoresFromApi(){try{const r=await api.publicStores();if(r.ok&&Array.isArray(r.data.stores)){cache(r.data.stores);return r.data.stores;}}catch{}return getStores();}
export function getStores(){try{const raw=localStorage.getItem(STORAGE_KEY);const s=raw?JSON.parse(raw):null;if(Array.isArray(s)&&s.length)return s;}catch{}cache(INITIAL_STORES);return INITIAL_STORES;}
export const getStoresFromStorage=getStores;
export function saveStores(stores:Store[]){cache(stores);}
export const saveStoresToStorage=saveStores;
function saveStoreLocal(updated:Store){const stores=getStores();const i=stores.findIndex(s=>s.id===updated.id);if(i>=0)stores[i]=updated;else stores.push(updated);cache(stores);}
export function getActiveStore(){const id=localStorage.getItem(ACTIVE_STORE_KEY);return getStores().find(s=>s.id===id)||getStores()[0]||null;}
export function setActiveStore(store:Store){try{localStorage.setItem(ACTIVE_STORE_KEY,store.id);}catch{}}
export function getStoreBySlug(slug:string){return getStores().find(s=>s.slug.toLowerCase()===slug.toLowerCase())||null;}
export function saveStore(updated:Store){saveStoreLocal(updated);void api.saveStore(updated).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);else if(!r.ok)console.warn(r.error);});}
export function getMerchantCode(store: Partial<Store> | null | undefined): string {
  if (!store) return 'Y0012';
  if (store.merchantCode) return store.merchantCode;
  if (store.id) {
    const match = store.id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      const padded = String(num + 11).padStart(4, '0');
      return `Y${padded.length > 4 ? padded.slice(-4) : padded}`;
    }
    let hash = 0;
    for (let i = 0; i < store.id.length; i++) {
      hash = (hash << 5) - hash + store.id.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = (Math.abs(hash) % 8999) + 1000;
    return `Y${positiveHash}`;
  }
  return 'Y0012';
}

export function createNewStore(data:any):Store{const cleanSlug=data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-');const now=new Date().toISOString().split('T')[0];const generatedCode=`Y${Math.floor(1000+Math.random()*9000)}`;const newStore:Store={id:`store-${Date.now()}`,merchantCode:data.merchantCode||generatedCode,name:data.name,slug:cleanSlug,category:data.category,merchantName:data.merchantName,email:data.email,phone:data.phone,currency:data.currency||'دج',description:data.description||`متجر ${data.name} المتخصص في ${data.category} بالجملة.`,slogan:data.slogan||'أسعار جملة تنافسية وشحن سريع لـ 58 ولاية',logoUrl:data.logoUrl||'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200',bannerUrl:data.bannerUrl||'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',primaryColor:data.primaryColor||'#4F46E5',theme:data.theme||'modern',createdAt:now,subscription:{planName:'خطة تجار الجملة - Youmi B2B Pro',trialDaysLeft:30,trialStartDate:now,trialEndDate:new Date(Date.now()+30*86400000).toISOString().split('T')[0],isTrialActive:true,status:'active_trial',monthlyFeeDzd:3500,baridimobPaymentDetails:{ripNumber:'0079999900238129038201',ccpAccount:'002381290 مفتاح 88',accountHolder:'مؤسسة منصة يومي للتجارة والحلول الرقمية'}},settings:{paymentMethods:{cod:true,baridimob:false,ccp:false,bank_wire:false,cash:false},shippingFee:600,freeShippingThreshold:50000,minWholesaleCartTotal:10000,announcementBar:`أهلاً بكم في متجر ${data.name}`,shippingApiSettings:{provider:'yalidine',providerName:'ياليدين إكسبريس',apiKey:'',originWilaya:'16 - الجزائر العاصمة',active:true,autoCreateTracking:true,homeDeliveryFee:800,stopDeskFee:400},socialLinks:{whatsapp:data.phone}},products:[],orders:[],coupons:[],stats:{totalSales:0,visitorsCount:0}};return newStore;}
export function addOrderToStore(storeSlug:string,order:Order):Store|null{const store=getStoreBySlug(storeSlug);if(!store)return null;store.orders=[order,...store.orders];saveStoreLocal(store);void api.createOrder(storeSlug,order).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);else if(!r.ok)console.warn(r.error);});if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('new_order_created',{detail:{storeName:store.name,storeSlug:store.slug,order}}));return store;}
export function updateOrderStatus(storeSlug:string,orderId:string,newStatus:OrderStatus,extra:any={}){const store=getStoreBySlug(storeSlug);if(!store)return null;const order=store.orders.find(o=>o.id===orderId);if(order){order.status=newStatus;Object.assign(order,extra);}saveStoreLocal(store);void api.updateOrder(store.id,orderId,newStatus,extra).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);});return store;}
export function saveProductToStore(storeSlug:string,product:Product){const store=getStoreBySlug(storeSlug);if(!store)return null;const i=store.products.findIndex(p=>p.id===product.id);if(i>=0)store.products[i]=product;else store.products.unshift(product);saveStoreLocal(store);void api.saveProduct(store.id,product).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);});return store;}
export function deleteProductFromStore(storeSlug:string,id:string){const store=getStoreBySlug(storeSlug);if(!store)return null;store.products=store.products.filter(p=>p.id!==id);saveStoreLocal(store);void api.deleteProduct(store.id,id).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);});return store;}
export function saveCouponToStore(storeSlug:string,coupon:Coupon){const store=getStoreBySlug(storeSlug);if(!store)return null;const i=store.coupons.findIndex(c=>c.id===coupon.id);if(i>=0)store.coupons[i]=coupon;else store.coupons.unshift(coupon);saveStoreLocal(store);void api.saveCoupon(store.id,coupon).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);});return store;}
export function deleteCouponFromStore(storeSlug:string,id:string){const store=getStoreBySlug(storeSlug);if(!store)return null;store.coupons=store.coupons.filter(c=>c.id!==id);saveStoreLocal(store);void api.deleteCoupon(store.id,id).then(r=>{if(r.ok&&r.data?.store)saveStoreLocal(r.data.store);});return store;}
