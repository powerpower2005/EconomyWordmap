import { useEffect } from 'react';

interface AdBannerProps {
  adClient: string;
  adSlot: string;
  adFormat?: string;
  className?: string;
}

export default function AdBanner({ 
  adClient, 
  adSlot, 
  adFormat = 'auto',
  className = ''
}: AdBannerProps) {
  useEffect(() => {
    try {
      // AdSense 초기화
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
