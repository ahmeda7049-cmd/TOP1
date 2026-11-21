import React, { useState } from 'react';
import { Download, Smartphone, Share2, Check, Copy, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'card' | 'compact';
  inviteCode?: string | null;
}

const SHARED_APP_URL =
  'https://ais-pre-53t42vbdzliaz2iofsi66b-92334257386.europe-west2.run.app';

export function buildShareUrl(inviteCode?: string | null): string {
  const origin =
    typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? window.location.origin
      : SHARED_APP_URL;
  return inviteCode ? `${origin}/?addFriend=${encodeURIComponent(inviteCode)}` : origin;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  inviteCode,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = buildShareUrl(inviteCode);
  const shareText = inviteCode
    ? `تطبيق TOP1 - رقم 1 في أولى ثانوي! ثبّته على موبايلك ونافسني بكود الصداقة (${inviteCode}):`
    : 'تطبيق TOP1 - رقم 1 في أولى ثانوي! 7 مواد و65 درساً واختبارات وتحديات بين الأصحاب:';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleShareApp = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TOP1 - رقم 1 في أولى ثانوي',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or Web Share unavailable in iframe — fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowGuideModal(true);
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <>
      {variant === 'card' ? (
        <div className="bg-white rounded-[22px] p-5 border border-slate-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-black text-[#0F172A] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FF5A7A]" aria-hidden="true" />
                <span>تثبيت TOP1 كتطبيق وإرساله لأصحابك</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isInstalled
                  ? 'التطبيق مثبت بالفعل على جهازك! تقدر تبعت رابط TOP1 لأصحابك على واتساب عشان يثبتوه ويتنافسوا معاك.'
                  : 'ثبّت TOP1 على موبايلك كتطبيق مستقل بدون متصفح (أو صدّره كملف APK)، وابعته لأصحابك.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="min-h-[44px] px-4 py-2 rounded-full bg-[#0F172A] text-white font-display font-extrabold text-xs sm:text-sm hover:bg-[#1E293B] active:scale-[0.98] transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                <span>
                  {isInstallable
                    ? 'تثبيت التطبيق الآن'
                    : isIOS
                    ? 'تثبيت على آيفون'
                    : 'تثبيت كتطبيق / APK'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareApp}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#FFF3CD] text-[#7A5A00] font-display font-extrabold text-xs sm:text-sm hover:brightness-95 active:scale-[0.98] transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>مشاركة التطبيق مع أصحابك</span>
                </>
              )}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-full border border-slate-200 bg-white text-[#0F172A] font-display font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>إرسال عبر واتساب</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#0F172A] text-white font-display font-extrabold text-xs sm:text-sm hover:bg-[#1E293B] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
              <span>{isInstallable ? 'تثبيت TOP1' : 'تثبيت كتطبيق / APK'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleShareApp}
            className="min-h-[44px] px-4 py-2 rounded-full border border-slate-200 bg-white text-[#0F172A] font-display font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#17B8A6]" aria-hidden="true" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#FF5A7A]" aria-hidden="true" />
                <span>ابعت لأصحابك</span>
              </>
            )}
          </button>
        </div>
      )}

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white rounded-[24px] p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-right">
            <div className="flex items-center justify-between gap-3">
              <h3 id="pwa-guide-title" className="font-display text-lg font-black text-[#0F172A]">
                تثبيت TOP1 على الموبايل أو استخراج APK
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="إغلاق"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm text-slate-700 leading-relaxed">
                <p className="font-display font-bold text-[#0F172A]">على آيفون وآيباد (Safari):</p>
                <p>1. اضغط على زر <strong>المشاركة (Share)</strong> أسفل المتصفح.</p>
                <p>2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm text-slate-700 leading-relaxed">
                <p className="font-display font-bold text-[#0F172A]">
                  {isAndroid ? 'على أندرويد (Chrome):' : 'لتثبيت التطبيق مباشرة على الموبايل:'}
                </p>
                <p>
                  1. افتح رابط التطبيق المباشر في متصفح <strong>Chrome</strong> على الموبايل.
                </p>
                <p>
                  2. اضغط قائمة المتصفح (⋮) ثم اختر <strong>تثبيت التطبيق (Install app)</strong> ليظهر بأيقونة TOP1 ويعمل بدون إنترنت.
                </p>
                <p className="pt-1 text-xs text-slate-500">
                  لو عايز ملف <strong>.apk</strong> جاهز تبعته كملف على تليجرام أو واتساب: انسخ رابط TOP1 أدناه واستخدمه مجاناً في موقع{' '}
                  <span dir="ltr" className="font-bold text-[#0F172A]">
                    pwabuilder.com
                  </span>{' '}
                  لتوليد ملف Android APK في دقيقة واحدة.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-2.5">
              <span dir="ltr" className="text-xs text-slate-700 truncate flex-1 font-mono">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleShareApp}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-display font-bold inline-flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] rounded-full bg-[#17B8A6] text-white font-display font-bold text-sm flex items-center justify-center"
              >
                مشاركة عبر واتساب
              </a>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="min-h-[44px] px-5 rounded-full bg-slate-100 text-[#0F172A] font-display font-bold text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
