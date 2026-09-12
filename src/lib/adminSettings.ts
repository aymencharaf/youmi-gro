import { api } from './api';

export interface AdminBaridimobDetails {
  ripNumber: string;
  ccpAccount: string;
  accountHolder: string;
  phone: string;
  instructions: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  content: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  targetAudience: 'all' | 'merchants' | 'buyers';
  active: boolean;
  createdAt: string;
}

export interface MerchantNotification {
  id: string;
  title: string;
  message: string;
  targetMerchantId: string; // 'all' or merchant/store id
  type: 'info' | 'warning' | 'payment' | 'success';
  createdAt: string;
  readBy: string[];
}

export const DEFAULT_BARIDIMOB: AdminBaridimobDetails = {
  ripNumber: '0079999900238129038201',
  ccpAccount: '002381290 مفتاح 88',
  accountHolder: 'مؤسسة منصة يومي للتجارة والحلول الرقمية',
  phone: '0669964145',
  instructions: 'يرجى تحويل مبلغ الاشتراك ثم رفع أو إرسال وصل التحويل عبر بريدي موب لتأكيد تفعيل المتجر.',
};

export const DEFAULT_ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'تخفيضات اشتراكات الجملة بمناسبة انطلاق منصة يومي ⚡',
    content: 'احصل على خصم خاص عند تفعيل الاشتراك السنوي للمتجر. تواصل مع الإدارة لتفعيل باقتك.',
    badge: 'عرض خاص 🎁',
    ctaText: 'تصفح المتاجر',
    targetAudience: 'all',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    title: 'تحديث خدمات الشحن والتوصيل لجميع المتاجر 🚚',
    content: 'تم تفعيل التوصيل لـ 58 ولاية عبر شركة ياليدين إكسبريس مع احتساب تلقائي للمصاريف.',
    badge: 'تحديث الشحن 📦',
    targetAudience: 'merchants',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_NOTIFICATIONS: MerchantNotification[] = [
  {
    id: 'notif-admin-1',
    title: 'أهلاً بك في منصة Youmi للتجارة بالجملة! 🚀',
    message: 'تم تفعيل فترة التجربة المجانية لمجرك لمدة 30 يوماً. يمكنك إضافة منتجات الجملة ورفع الشعار وتلقي الطلبات.',
    targetMerchantId: 'all',
    type: 'success',
    createdAt: new Date().toISOString(),
    readBy: [],
  },
];

const STORAGE_BARIDIMOB_KEY = 'youmi_admin_baridimob';
const STORAGE_ANNOUNCEMENTS_KEY = 'youmi_platform_announcements';
const STORAGE_NOTIFICATIONS_KEY = 'youmi_merchant_notifications';

export function getAdminBaridimob(): AdminBaridimobDetails {
  try {
    const raw = localStorage.getItem(STORAGE_BARIDIMOB_KEY);
    if (raw) return { ...DEFAULT_BARIDIMOB, ...JSON.parse(raw) };
  } catch (e) {
    // fallback
  }
  return DEFAULT_BARIDIMOB;
}

export function saveAdminBaridimob(details: AdminBaridimobDetails): void {
  localStorage.setItem(STORAGE_BARIDIMOB_KEY, JSON.stringify(details));
  window.dispatchEvent(new CustomEvent('youmi_settings_updated', { detail: { type: 'baridimob', data: details } }));
  api.savePlatformSettings({ baridimob: details }).catch(() => {});
}

export function getPlatformAnnouncements(): PlatformAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_ANNOUNCEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_ANNOUNCEMENTS;
}

export function savePlatformAnnouncements(list: PlatformAnnouncement[]): void {
  localStorage.setItem(STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('youmi_settings_updated', { detail: { type: 'announcements', data: list } }));
  api.savePlatformSettings({ announcements: list }).catch(() => {});
}

export function getMerchantNotifications(): MerchantNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_NOTIFICATIONS;
}

export function saveMerchantNotifications(list: MerchantNotification[]): void {
  localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('youmi_settings_updated', { detail: { type: 'notifications', data: list } }));
  api.savePlatformSettings({ notifications: list }).catch(() => {});
}

export function sendNotificationToMerchants(notif: Omit<MerchantNotification, 'id' | 'createdAt' | 'readBy'>): MerchantNotification {
  const current = getMerchantNotifications();
  const created: MerchantNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    readBy: [],
  };
  const updated = [created, ...current];
  saveMerchantNotifications(updated);
  window.dispatchEvent(new CustomEvent('youmi_new_admin_notification', { detail: created }));
  return created;
}

export function markNotificationAsRead(notifId: string, merchantUserId: string): void {
  const current = getMerchantNotifications();
  const updated = current.map((n) => {
    if (n.id === notifId && !n.readBy.includes(merchantUserId)) {
      return { ...n, readBy: [...n.readBy, merchantUserId] };
    }
    return n;
  });
  saveMerchantNotifications(updated);
}
