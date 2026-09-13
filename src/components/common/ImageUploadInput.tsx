import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface ImageUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  className?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'صورة المنتج',
  helperText = 'يمكنك رفع صورة عالية الجودة من هاتفك أو حاسوبك المباشر أو إدخال رابط صورة',
  placeholder = 'https://...',
  aspectRatio = 'square',
  className = '',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP...)');
      return;
    }
    // Limit file size to 5MB for performance
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة بحجم أقل من 5 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {label && <label className="block text-xs font-bold text-slate-800">{label}</label>}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mode === 'upload'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📁 رفع من الجهاز
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mode === 'url'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔗 رابط مباشر
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          {value ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img
                src={value}
                alt="Product Preview"
                className={`w-full object-contain rounded-xl ${
                  aspectRatio === 'banner' ? 'h-32' : 'h-44'
                }`}
              />
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تغيير الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 scale-[1.01]'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50/80 hover:bg-indigo-50/30 text-slate-600'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 font-['Cairo']">
                  اضغط هنا لاختيار صورة من جهازك أو اسحب الصورة هنا
                </p>
                <p className="text-[11px] text-slate-400 font-medium">يدعم PNG, JPG, WEBP (حجم أقصى 5MB)</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition pl-10"
            />
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          {value && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <img src={value} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
              <span className="text-[11px] text-slate-500 truncate flex-1">{value}</span>
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-[10px] text-slate-400 font-medium">{helperText}</p>}
    </div>
  );
};
