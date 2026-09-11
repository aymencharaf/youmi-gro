import React, { useState } from 'react';
import { Store, Product } from '../../types';
import { saveProductToStore, deleteProductFromStore } from '../../lib/storage';
import { BUSINESS_CATEGORIES } from '../../data/algeriaData';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Package, 
  X
} from 'lucide-react';

interface ProductsTabProps {
  store: Store;
  onUpdateStore: (updatedStore: Store) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ store, onUpdateStore }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(store.category);
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(5);
  const [packageUnit, setPackageUnit] = useState<string>('كرتونة (10 قطع)');
  const [stock, setStock] = useState<number>(50);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [badge, setBadge] = useState<Product['badge']>(undefined);

  const filteredProducts = store.products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setCategory(store.category);
    setPrice(3500);
    setCompareAtPrice(undefined);
    setMinOrderQuantity(10);
    setPackageUnit('كرتونة (10 قطع)');
    setStock(100);
    setSku(`WHOLESALE-${Math.floor(Math.random() * 8999 + 1000)}`);
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
    setBadge('أصل جملة');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setCategory(product.category);
    setPrice(product.price);
    setCompareAtPrice(product.compareAtPrice);
    setMinOrderQuantity(product.minOrderQuantity || 5);
    setPackageUnit(product.packageUnit || 'كرتونة');
    setStock(product.stock);
    setSku(product.sku);
    setDescription(product.description);
    setImageUrl(product.images[0] || '');
    setBadge(product.badge);
    setIsModalOpen(true);
  };

  const handleGenerateAiDescription = async () => {
    if (!title) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_desc',
          prompt: `اكتب وصفاً تسويقياً جذاباً ومواصفات واضحة لمنتج اسمه "${title}" ضمن فئة "${category}". السعر: ${price} ${store.currency}.`,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setDescription(data.result);
      }
    } catch (err) {
      console.error(err);
      setDescription('منتج عالي الجودة مصمم بعناية لتلبية تطلعات عملاء متجرنا.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || price <= 0) return;

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title,
      category,
      price,
      compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : undefined,
      minOrderQuantity: minOrderQuantity || 1,
      packageUnit: packageUnit || 'قطعة',
      stock,
      sku: sku || `SKU-${Date.now()}`,
      description: description || 'منتج عالي الجودة متوفر لدى المتجر.',
      images: [imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'],
      badge,
      isAvailable: stock > 0,
      ratings: editingProduct ? editingProduct.ratings : { score: 5.0, count: 1 },
    };

    const updated = saveProductToStore(store.slug, productToSave);
    if (updated) {
      onUpdateStore(updated);
      setIsModalOpen(false);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('هل أنت تأكد من حذف هذا المنتج نهائياً من المتجر؟')) {
      const updated = deleteProductFromStore(store.slug, productId);
      if (updated) {
        onUpdateStore(updated);
      }
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-['Cairo'] flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>إدارة منتجات المتجر ({store.products.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أضف المنتجات، حدد الأسعار والمخزون، واستخدم الذكاء الاصطناعي لكتابة تفاصيل منتجاتك.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم المنتج، الفئة أو رمز SKU..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition shadow-sm"
        />
      </div>

      {/* Products Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition shadow-sm"
          >
            <div className="flex items-start gap-3">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {product.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">
                      {product.badge}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm truncate font-['Cairo']">{product.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-500">السعر: </span>
                <strong className="text-emerald-700 font-bold font-['Cairo'] text-sm">
                  {product.price} {store.currency}
                </strong>
                {product.compareAtPrice && (
                  <span className="text-slate-400 line-through mr-1 text-[11px]">{product.compareAtPrice}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500">المخزون: </span>
                <strong
                  className={`font-semibold ${
                    product.stock > 5 ? 'text-slate-800' : product.stock > 0 ? 'text-amber-600' : 'text-rose-600'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} قطعة` : 'نفذت الكمية'}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => openEditModal(product)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>تعديل</span>
              </button>

              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">لا توجد منتجات مطابقة للبحث</p>
          <button
            onClick={openAddModal}
            className="mt-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-sm"
          >
            أضف أول منتج الآن
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 font-['Cairo']">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد لمتجرك'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: دهن عود كلمنتان سوبر، عباية حرير..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سعر الجملة للوحدة ({store.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">السعر السابق للمقارنة</label>
                  <input
                    type="number"
                    value={compareAtPrice || ''}
                    onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="السعر قبل الخصم"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Wholesale MOQ & Package Unit */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-1">أصل الجملة (أقل كمية للطلب MOQ) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={minOrderQuantity}
                    onChange={(e) => setMinOrderQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-950 mb-1">وصف العبوة / الشحنة (Package Unit)</label>
                  <input
                    type="text"
                    value={packageUnit}
                    onChange={(e) => setPackageUnit(e.target.value)}
                    placeholder="مثال: كرتونة (12 قطعة)، طرد..."
                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-indigo-900 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المخزون المتاح</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تصنيف المنتج *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition font-medium"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رمز المنتج (SKU)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رابط صورة المنتج (Image URL)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">وصف المنتج والمواصفات</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isGeneratingAi || !title}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAi ? 'جاري الصياغة...' : 'ولّد بالذكاء الاصطناعي'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل وميزات هذا المنتج..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">وسام شارة المنتج (Badge)</label>
                <select
                  value={badge || ''}
                  onChange={(e) => setBadge((e.target.value as Product['badge']) || undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 transition"
                >
                  <option value="">بدون شارة</option>
                  <option value="الأكثر مبيعاً">الأكثر مبيعاً 🔥</option>
                  <option value="جديد">جديد ✨</option>
                  <option value="عرض خاص">عرض خاص 🏷️</option>
                  <option value="كمية محدودة">كمية محدودة ⚡</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
