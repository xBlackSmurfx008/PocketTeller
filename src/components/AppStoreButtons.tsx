import { useToast } from '@/hooks/useToast';

interface AppStoreButtonsProps {
  className?: string;
  showLabel?: boolean;
}

// TODO: Update these URLs when apps are published
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || '#'; // Will be: https://apps.apple.com/app/pocketbanker/idXXXXXXXXX
const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL || '#'; // Will be: https://play.google.com/store/apps/details?id=com.pocketbanker.app

export function AppStoreButtons({ className = '', showLabel = true }: AppStoreButtonsProps) {
  const { toast } = useToast();
  
  const handleAppStoreClick = (e: React.MouseEvent) => {
    if (APP_STORE_URL === '#') {
      e.preventDefault();
      toast({
        title: 'Coming Soon!',
        description: 'iOS app will be available on the App Store soon.',
      });
    }
    // If real URL is set, link will work normally
  };

  const handlePlayStoreClick = (e: React.MouseEvent) => {
    if (PLAY_STORE_URL === '#') {
      e.preventDefault();
      toast({
        title: 'Coming Soon!',
        description: 'Android app will be available on Google Play soon.',
      });
    }
    // If real URL is set, link will work normally
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 justify-center items-center ${className}`}>
      {showLabel && (
        <p className="text-sm text-muted-foreground font-medium">
          Also available on:
        </p>
      )}
      <div className="flex gap-3">
        {/* App Store Button */}
        <a
          href={APP_STORE_URL}
          onClick={handleAppStoreClick}
          className="inline-block transition-transform hover:scale-105 active:scale-95"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download on the App Store"
        >
          <div className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs opacity-90">Download on the</span>
              <span className="text-sm font-semibold">App Store</span>
            </div>
          </div>
        </a>

        {/* Google Play Button */}
        <a
          href={PLAY_STORE_URL}
          onClick={handlePlayStoreClick}
          className="inline-block transition-transform hover:scale-105 active:scale-95"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get it on Google Play"
        >
          <div className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-xs opacity-90">GET IT ON</span>
              <span className="text-sm font-semibold">Google Play</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

