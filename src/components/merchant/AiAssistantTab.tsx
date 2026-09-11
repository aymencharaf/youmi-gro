import React, { useState } from 'react';
import { Store } from '../../types';
import { 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  Zap
} from 'lucide-react';

interface AiAssistantTabProps {
  store: Store;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ store }) => {
  const [activeMode, setActiveMode] = useState<'product' | 'slogan' | 'ad'>('product');
  const [promptInput, setPromptInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput) return;

    setIsLoading(true);
    setAiOutput('');

    try {
      const typeMap = {
        product: 'product_desc',
        slogan: 'slogan',
        ad: 'marketing_post',
      };

      const res = await fetch('/api.php?action=gemini_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeMap[activeMode],
          prompt: `لصالح متجر إلكتروني يسمى "${store.name}" في مجال "${store.category}": ${promptInput}`,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setAiOutput(data.result);
      } else if (data.error) {
        setAiOutput(`خطأ: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiOutput('حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 dir-rtl max-w-4xl text-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-6 rounded-3xl border border-purple-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-purple-100 flex items-center justify-center border border-white/20 backdrop-blur-md">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-purple-100 border border-white/20">
              مدعوم بنموذج Gemini 3.8
            </span>
            <h2 className="text-xl font-black text-white font-['Cairo'] mt-1">
              مساعد الذكاء الاصطناعي للتجار (Youmi AI)
            </h2>
            <p className="text-xs text-purple-100 mt-0.5">
              اكتب أفكار منتجاتك أو حملاتك وسيتكفل جيميناي بصياغة النصوص التسويقية الاحترافية فوراً.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveMode('product');
            setPromptInput('اسم المنتج: عطر عود ملوكي فاخر 100مل');
            setAiOutput('');
          }}
          className={`p-4 rounded-2xl border text-right transition flex items-center gap-3 ${
            activeMode === 'product'
              ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <FileText className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold font-['Cairo']">كتابة وصف لمنتج</h4>
            <p className="text-[11px] text-slate-500">مواصفات وفائدية المنتج</p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveMode('slogan');
            setPromptInput('اسم المتجر: يومي للقهوة والمحمصة المختصة');
            setAiOutput('');
          }}
          className={`p-4 rounded-2xl border text-right transition flex items-center gap-3 ${
            activeMode === 'slogan'
              ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Zap className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold font-['Cairo']">توليد شعار لفظي</h4>
            <p className="text-[11px] text-slate-500">عبارات جذابة وقصيرة</p>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveMode('ad');
            setPromptInput('حملة خصومات الشتاء 30% على العطور');
            setAiOutput('');
          }}
          className={`p-4 rounded-2xl border text-right transition flex items-center gap-3 ${
            activeMode === 'ad'
              ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold font-['Cairo']">منشورات إعلانية</h4>
            <p className="text-[11px] text-slate-500">لسناب شات وإنستغرام</p>
          </div>
        </button>
      </div>

      {/* Input Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ادخل الفكرة الأساسية أو الاسم ليصيغها الذكاء الاصطناعي:
            </label>
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="اكتب هنا التفاصيل..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !promptInput}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'جاري توليد المحتوى...' : 'توليد النص بالذكاء الاصطناعي'}</span>
            </button>
          </div>
        </form>

        {aiOutput && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>النتيجة المولدة:</span>
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-['Cairo']">
              {aiOutput}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
