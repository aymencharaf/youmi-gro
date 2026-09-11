import React, { useState } from 'react';
import { Store, Order, OrderStatus } from '../../types';
import { updateOrderStatus } from '../../lib/storage';
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  Printer, 
  X, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  ChevronDown
} from 'lucide-react';

interface OrdersTabProps {
  store: Store;
  onUpdateStore: (updatedStore: Store) => void;
  selectedOrderForModal?: Order | null;
  onClearSelectedOrderModal?: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  store,
  onUpdateStore,
  selectedOrderForModal,
  onClearSelectedOrderModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(selectedOrderForModal || null);

  const statusOptions: OrderStatus[] = ['جديد', 'قيد المعالجة', 'تم الشحن', 'تم التوصيل', 'ملغي'];

  const filteredOrders = store.orders.filter((order) => {
    const matchesStatus = activeTab === 'الكل' || order.status === activeTab;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.customerCity.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(store.slug, orderId, newStatus);
    if (updated) {
      onUpdateStore(updated);
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder({ ...viewingOrder, status: newStatus });
      }
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const closeModal = () => {
    setViewingOrder(null);
    if (onClearSelectedOrderModal) onClearSelectedOrderModal();
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            <span>إدارة طلبيات المتجر ({store.orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة الطلبيات الواردة، تحديث حالة الشحن، وطباعة بوليصات الفواتير المعتمدة.
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {['الكل', ...statusOptions].map((st) => (
            <button
              key={st}
              onClick={() => setActiveTab(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث برقم الطلب، اسم العميل أو المدينة..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition shadow-sm"
        />
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                    #{order.id.slice(-4)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm font-['Cairo']">{order.customerName}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">{order.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {order.customerCity} • {order.customerAddress}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <span>المنتجات:</span>
                      <span className="font-semibold text-slate-800">
                        {order.items.map((i) => `${i.productTitle} (x${i.quantity})`).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 font-['Cairo']">
                      {order.totalAmount} {store.currency}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {order.paymentMethod === 'apple_pay'
                        ? 'Apple Pay'
                        : order.paymentMethod === 'mada'
                        ? 'مدى'
                        : order.paymentMethod === 'cod'
                        ? 'الدفع عند الاستلام'
                        : 'بطاقة ائتمانية'}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-2 pr-7 rounded-xl focus:outline-none focus:border-indigo-600 transition cursor-pointer"
                    >
                      <option value="جديد">جديد</option>
                      <option value="قيد المعالجة">قيد المعالجة</option>
                      <option value="تم الشحن">تم الشحن</option>
                      <option value="تم التوصيل">تم التوصيل</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setViewingOrder(order)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="معاينة بوليصة الطلب"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">لا توجد طلبات في هذا القسم</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Cairo']">
                  تفاصيل بوليصة الطلب #{viewingOrder.id}
                </h3>
                <p className="text-xs text-slate-500">تاريخ الطلب: {viewingOrder.createdAt}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 sm:space-y-0">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>اسم العميل: {viewingOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>الهاتف: {viewingOrder.customerPhone}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>المدينة والعنوان:</span>
                </div>
                <p className="text-slate-500 mr-6">
                  {viewingOrder.customerCity} - {viewingOrder.customerAddress}
                </p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">المنتجات المطلوبة:</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {viewingOrder.items.map((item, i) => (
                  <div key={i} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.productTitle} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{item.productTitle}</p>
                        {item.selectedVariant && (
                          <p className="text-[10px] text-slate-500">النوع: {item.selectedVariant}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-slate-900">
                        {item.price} x {item.quantity} = {item.price * item.quantity} {store.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span>{viewingOrder.subtotal} {store.currency}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>رسوم الشحن:</span>
                <span>{viewingOrder.shippingFee === 0 ? 'مجاني' : `${viewingOrder.shippingFee} ${store.currency}`}</span>
              </div>
              {viewingOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم الكوبون:</span>
                  <span>- {viewingOrder.discount} {store.currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>إجمالي المبلغ المطلوب:</span>
                <span>{viewingOrder.totalAmount} {store.currency}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
