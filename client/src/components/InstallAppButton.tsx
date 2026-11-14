import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallAppButton({
  className = '',
  onAction,
}: {
  className?: string;
  onAction?: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIos =
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isInstalled) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      onAction?.();
      return;
    }

    if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded border border-[#14472B] bg-[#1B5E3A] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#14472B] ${className}`}
      >
        <Download className="h-4 w-4" />
        Install App
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded border border-[#DDD6C8] bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-[#1C1917]">
                Install ChoiceCLASH
              </h3>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="rounded p-1 text-[#57534E] hover:bg-[#F6F3EC]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#57534E]">
              Install ChoiceCLASH on your iPhone or iPad for full-screen play:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-[#1C1917]">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B5E3A] text-xs font-bold text-white">
                  1
                </span>
                <span>
                  Tap the <Share className="mx-0.5 inline h-4 w-4 text-[#1B5E3A]" />{' '}
                  <strong>Share</strong> button in Safari.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B5E3A] text-xs font-bold text-white">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                onAction?.();
              }}
              className="mt-4 w-full rounded border border-[#14472B] bg-[#1B5E3A] py-2 text-sm font-semibold text-white hover:bg-[#14472B]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
