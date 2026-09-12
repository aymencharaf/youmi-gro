import React, { useEffect, useState } from 'react';
import { getAdSettings } from '../../lib/adSystem';

interface GoogleAdProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  position?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  slotId = '',
  format = 'auto',
  responsive = true,
  className = '',
  position = 'content_inline',
}) => {
  const [adSettings, setAdSettings] = useState(() => getAdSettings());

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAdSettings(getAdSettings());
    };
    window.addEventListener('youmi_ad_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('youmi_ad_settings_updated', handleSettingsUpdate);
  }, []);

  const enabled = adSettings.googleAdsenseEnabled;
  const clientId = adSettings.googleAdsenseClientId || ((import.meta as any).env?.VITE_ADSENSE_CLIENT_ID as string) || '';

  // Do not render anything if Google Ads disabled or client ID missing or slot ID missing
  if (!enabled || !clientId || !slotId) {
    return null;
  }

  useEffect(() => {
    try {
      // Inject script tag if not present
      const scriptId = 'google-adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Push ad initialization
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.warn('AdSense script initialization error:', err);
    }
  }, [clientId, slotId]);

  return (
    <div className={`google-ad-container my-4 text-center overflow-hidden ${className}`} data-ad-position={position}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};
