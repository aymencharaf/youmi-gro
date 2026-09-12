import { Advertisement, AdPaymentStatus } from '../types';
import { updateAdvertisementStatus } from './adSystem';

export interface AdPaymentRequest {
  adId: string;
  amountDzd: number;
  paymentMethod: 'BaridiMob' | 'CCP' | 'BankWire' | 'Gateway';
  txNumber?: string;
  notes?: string;
}

export interface AdPaymentResponse {
  success: boolean;
  paymentStatus: AdPaymentStatus;
  messageAr: string;
  messageFr: string;
  txId?: string;
}

export interface AdPaymentProvider {
  processPayment(request: AdPaymentRequest): Promise<AdPaymentResponse>;
  verifyPayment(adId: string, txId: string): Promise<AdPaymentResponse>;
  refundPayment(adId: string): Promise<AdPaymentResponse>;
}

/**
 * Clean Payment Abstraction Layer for Youmi Ad System.
 * Supports BaridiMob/CCP verification, local offline recording, and ready for automated gateway integration (e.g. SATIM, CIB, Stripe).
 */
export class YoumiAdPaymentService implements AdPaymentProvider {
  async processPayment(request: AdPaymentRequest): Promise<AdPaymentResponse> {
    try {
      if (!request.adId || request.amountDzd <= 0) {
        return {
          success: false,
          paymentStatus: 'failed',
          messageAr: 'بيانات طلب الدفع غير صحيحة.',
          messageFr: 'Données de paiement invalides.',
        };
      }

      // Record transaction ID and set payment to pending verification
      const txId = request.txNumber || `TX-AD-${Date.now()}`;
      
      return {
        success: true,
        paymentStatus: 'pending',
        txId,
        messageAr: 'تم تسجيل معلومات السداد بنجاح. الإعلان في انتظار المراجعة والتأكيد.',
        messageFr: 'Informations de paiement enregistrées. Publicité en attente de vérification.',
      };
    } catch (e: any) {
      return {
        success: false,
        paymentStatus: 'failed',
        messageAr: e?.message || 'فشلت عملية معالجة السداد.',
        messageFr: 'Échec du traitement du paiement.',
      };
    }
  }

  async verifyPayment(adId: string, txId: string): Promise<AdPaymentResponse> {
    try {
      const updated = updateAdvertisementStatus(adId, 'approved', 'paid');
      if (updated) {
        return {
          success: true,
          paymentStatus: 'paid',
          txId,
          messageAr: 'تمت إجازة وتأكيد عملية السداد بنجاح. الإعلان نشط الآن.',
          messageFr: 'Paiement confirmé avec succès. La publicité est active.',
        };
      }
      return {
        success: false,
        paymentStatus: 'pending',
        messageAr: 'لم يتم العثور على الإعلان.',
        messageFr: 'Publicité introuvable.',
      };
    } catch (e: any) {
      return {
        success: false,
        paymentStatus: 'failed',
        messageAr: 'خطأ في تأكيد السداد.',
        messageFr: 'Erreur lors de la vérification.',
      };
    }
  }

  async refundPayment(adId: string): Promise<AdPaymentResponse> {
    const updated = updateAdvertisementStatus(adId, 'expired', 'refunded');
    return {
      success: !!updated,
      paymentStatus: 'refunded',
      messageAr: 'تم تسجيل استرداد مبلغ الإعلان.',
      messageFr: 'Remboursement enregistré.',
    };
  }
}

export const adPaymentService = new YoumiAdPaymentService();
