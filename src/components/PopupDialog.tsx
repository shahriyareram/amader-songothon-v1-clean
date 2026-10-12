import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { subscribeToPopupConfig } from '../services/firebaseService';

export const STORAGE_POPUP_IMAGE = 'amader_shongothon_popup_image';
export const STORAGE_POPUP_IMAGE_NAME = 'amader_shongothon_popup_image_name';

// Default high-fidelity sample announcement popup banner (Properly URI-encoded SVG Data URL)
const SAMPLE_SVG_RAW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="600" height="750" rx="36" fill="url(#grad)" />
  <circle cx="300" cy="180" r="160" fill="#ffffff" fill-opacity="0.05" />
  <circle cx="300" cy="180" r="110" fill="#10b981" fill-opacity="0.15" />
  <g transform="translate(250, 130)">
    <circle cx="50" cy="50" r="46" fill="url(#goldGrad)" />
    <path d="M50 24 L56 40 L74 40 L60 52 L65 68 L50 58 L35 68 L40 52 L26 40 L44 40 Z" fill="#ffffff" />
  </g>
  <rect x="200" y="270" width="200" height="36" rx="18" fill="#fbbf24" fill-opacity="0.2" />
  <text x="300" y="294" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fef3c7" text-anchor="middle">📢 বিশেষ সাংগঠনিক বিজ্ঞপ্তি</text>
  <text x="300" y="370" font-family="sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">আমাদের সংগঠন</text>
  <text x="300" y="415" font-family="sans-serif" font-size="20" font-weight="bold" fill="#a7f3d0" text-anchor="middle">স্বচ্ছ হিসাব সবার জন্য</text>
  <rect x="50" y="460" width="500" height="1" fill="#ffffff" fill-opacity="0.2" />
  <text x="300" y="515" font-family="sans-serif" font-size="19" font-weight="600" fill="#ecfdf5" text-anchor="middle">চলতি সপ্তাহের সঞ্চয় ও কিস্তির হিসাব</text>
  <text x="300" y="550" font-family="sans-serif" font-size="19" font-weight="600" fill="#ecfdf5" text-anchor="middle">সঠিক সময়ে পরিশোধ করার অনুরোধ করা হচ্ছে।</text>
  <rect x="100" y="605" width="400" height="65" rx="20" fill="url(#goldGrad)" />
  <text x="300" y="646" font-family="sans-serif" font-size="20" font-weight="bold" fill="#78350f" text-anchor="middle">বিস্তারিত দেখুন ও জমা দিন</text>
</svg>`;

export const DEFAULT_SAMPLE_POPUP = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG_RAW)}`;

export function getActivePopupImage(): string {
  try {
    const cached = localStorage.getItem(STORAGE_POPUP_IMAGE);
    if (cached && cached.trim()) return cached;
  } catch {}
  return DEFAULT_SAMPLE_POPUP;
}

export interface PopupDialogProps {
  isOpen: boolean;
  duration?: number;
  onClose: () => void;
  imageUrl?: string;
}

export const PopupDialog: React.FC<PopupDialogProps> = ({
  isOpen,
  duration = 5,
  onClose,
  imageUrl,
}) => {
  const [effectiveImage, setEffectiveImage] = useState<string>(() => imageUrl || getActivePopupImage());
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (imageUrl) {
      setEffectiveImage(imageUrl);
      return;
    }

    const unsubscribe = subscribeToPopupConfig((config) => {
      if (config && config.imageData && config.imageData.trim()) {
        setEffectiveImage(config.imageData);
        try {
          localStorage.setItem(STORAGE_POPUP_IMAGE, config.imageData);
          if (config.imageName) {
            localStorage.setItem(STORAGE_POPUP_IMAGE_NAME, config.imageName);
          }
        } catch {}
      } else if (config === null) {
        // Fall back to default sample popup only if no local custom image exists in cache
        const localCached = localStorage.getItem(STORAGE_POPUP_IMAGE);
        if (!localCached) {
          setEffectiveImage(DEFAULT_SAMPLE_POPUP);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [imageUrl]);

  // Automatic timer logic based on popupDuration (1–10 seconds)
  useEffect(() => {
    if (!isOpen) return;

    const seconds = Math.max(1, Math.min(10, Number(duration) || 5));
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, seconds * 1000);

    return () => clearTimeout(timer);
  }, [isOpen, duration]);

  if (!isOpen) return null;

  return (
    <div
      id="app-popup-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Centered responsive dialog container */}
      <div
        id="app-popup-dialog-box"
        className="relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Circular X Close Button on Top Right */}
        <button
          id="app-popup-dialog-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-50 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90"
          title="পপআপ বন্ধ করুন"
          aria-label="পপআপ বন্ধ করুন"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Centered Responsive Popup Image */}
        <div className="w-full overflow-hidden bg-slate-900 flex items-center justify-center">
          <img
            src={effectiveImage}
            alt="Popup Announcement"
            className="w-full h-auto max-h-[75vh] sm:max-h-[500px] object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};
