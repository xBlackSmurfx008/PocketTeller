/**
 * Android UI Utilities
 * Material Design 3 helpers for Android-specific features
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running on Android platform
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS platform
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running in native mobile app (iOS or Android)
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get Android version (API level)
 */
export const getAndroidVersion = async (): Promise<number | null> => {
  if (!isAndroid()) return null;
  
  try {
    // Use dynamic import with error handling for build compatibility
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const Device = (await import('@capacitor/core')).Device;
      const info = await Device.getInfo();
      return parseInt(info.osVersion);
    }
    return null;
  } catch (error) {
    console.error('Failed to get Android version:', error);
    return null;
  }
};

/**
 * Check if device supports Android 12+ features (Material You, dynamic colors)
 */
export const supportsAndroid12Features = async (): Promise<boolean> => {
  const version = await getAndroidVersion();
  return version !== null && version >= 12;
};

/**
 * Add Material Design ripple effect to an element
 * 
 * @param element - HTML element to add ripple effect to
 * @param color - Ripple color (default: primary color with opacity)
 */
export const addRippleEffect = (
  element: HTMLElement, 
  color: string = 'rgba(124, 58, 237, 0.3)'
): void => {
  // Only add on Android
  if (!isAndroid()) return;
  
  // Add necessary styles
  const existingPosition = getComputedStyle(element).position;
  if (existingPosition === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';
  element.classList.add('ripple-effect');
  
  // Add touch event listener
  const handleTouch = (e: TouchEvent) => {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    // Get touch position
    const touch = e.touches[0] || e.changedTouches[0];
    const x = touch.clientX - rect.left - size / 2;
    const y = touch.clientY - rect.top - size / 2;
    
    // Style the ripple
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.background = color;
    ripple.className = 'ripple';
    
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };
  
  element.addEventListener('touchstart', handleTouch, { passive: true });
};

/**
 * Add ripple effect to multiple elements
 * 
 * @param selector - CSS selector for elements
 * @param color - Ripple color (optional)
 */
export const addRippleEffects = (
  selector: string, 
  color?: string
): void => {
  if (!isAndroid()) return;
  
  const elements = document.querySelectorAll<HTMLElement>(selector);
  elements.forEach(element => addRippleEffect(element, color));
};

/**
 * Initialize Android-specific UI enhancements
 * Call this in your app initialization
 */
export const initAndroidUI = (): void => {
  if (!isAndroid()) return;
  
  console.log('🤖 Initializing Android Material Design 3 enhancements');
  
  // Load Android-specific CSS
  import('../styles/android.css').catch(err => {
    console.error('Failed to load Android CSS:', err);
  });
  
  // Add ripple effects to common interactive elements
  setTimeout(() => {
    addRippleEffects('button:not(.no-ripple)');
    addRippleEffects('[role="button"]:not(.no-ripple)');
    addRippleEffects('.card:not(.no-ripple)');
    addRippleEffects('.list-item:not(.no-ripple)');
  }, 100);
  
  // Set up Android system bars
  setupAndroidSystemBars();
};

/**
 * Configure Android status bar and navigation bar
 */
const setupAndroidSystemBars = async (): Promise<void> => {
  try {
    // Only run in Capacitor environment
    if (typeof window === 'undefined' || !(window as any).Capacitor) {
      return;
    }
    
    const { StatusBar, Style } = await import('@capacitor/core').then(m => ({
      StatusBar: m.StatusBar,
      Style: { Light: 'LIGHT' as const, Dark: 'DARK' as const }
    })).catch(() => null) || {} as any;
    
    if (!StatusBar) return;
    
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    
    // Set status bar style
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
    
    // Set status bar background color (violet primary)
    await StatusBar.setBackgroundColor({ 
      color: '#7C3AED' 
    });
    
    console.log('✅ Android system bars configured');
  } catch (error) {
    // StatusBar plugin not available or failed
    console.log('ℹ️ Status bar configuration skipped');
  }
};

/**
 * Update status bar based on theme
 * 
 * @param isDark - Whether dark mode is enabled
 */
export const updateAndroidStatusBar = async (isDark: boolean): Promise<void> => {
  if (!isAndroid() || typeof window === 'undefined') return;
  
  try {
    const { StatusBar, Style } = await import('@capacitor/core').then(m => ({
      StatusBar: m.StatusBar,
      Style: { Light: 'LIGHT' as const, Dark: 'DARK' as const }
    })).catch(() => null) || {} as any;
    
    if (!StatusBar) return;
    
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
    
    // Adjust background color for dark mode
    await StatusBar.setBackgroundColor({ 
      color: isDark ? '#1C1B1F' : '#7C3AED'
    });
  } catch (error) {
    console.log('Failed to update status bar');
  }
};

/**
 * Apply Material Design 3 elevation to an element
 * 
 * @param element - HTML element
 * @param level - Elevation level (0-5)
 */
export const applyElevation = (element: HTMLElement, level: 0 | 1 | 2 | 3 | 4 | 5): void => {
  // Remove existing elevation classes
  for (let i = 0; i <= 5; i++) {
    element.classList.remove(`elevation-${i}`);
  }
  
  // Add new elevation class
  element.classList.add(`elevation-${level}`);
};

/**
 * Check if device has hardware back button
 */
export const hasHardwareBackButton = (): boolean => {
  return isAndroid();
};

/**
 * Handle Android hardware back button
 * 
 * @param callback - Function to call when back button is pressed
 * @returns Cleanup function to remove listener
 */
export const onAndroidBackButton = (callback: () => boolean | void): (() => void) => {
  if (!isAndroid() || typeof window === 'undefined') return () => {};
  
  import('@capacitor/core').then(({ App }) => {
    if (!App) return;
    
    const listener = App.addListener('backButton', ({ canGoBack }: any) => {
      const shouldPreventDefault = callback();
      if (shouldPreventDefault === false && canGoBack) {
        window.history.back();
      }
    });
    
    return () => {
      listener.remove();
    };
  }).catch(() => {
    // Back button listener not available
  });
  
  return () => {}; // Fallback cleanup function
};

/**
 * Optimize touch scrolling for Android
 * 
 * @param element - Scrollable element
 */
export const optimizeAndroidScrolling = (element: HTMLElement): void => {
  if (!isAndroid()) return;
  
  element.style.webkitOverflowScrolling = 'touch';
  element.style.overscrollBehavior = 'contain';
};

/**
 * Add Android-specific accessibility attributes
 * 
 * @param element - HTML element
 * @param label - Accessibility label
 */
export const addAndroidA11y = (element: HTMLElement, label: string): void => {
  if (!isAndroid()) return;
  
  element.setAttribute('aria-label', label);
  element.setAttribute('role', element.tagName === 'BUTTON' ? 'button' : 'button');
};

/**
 * Get platform-specific class names
 * 
 * @returns Object with platform-specific classes
 */
export const getPlatformClasses = () => {
  return {
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    isNative: isNative(),
    platform: Capacitor.getPlatform(),
  };
};

/**
 * Apply Android Material Design motion
 * 
 * @param element - Element to animate
 * @param animation - Animation type
 */
export const applyAndroidMotion = (
  element: HTMLElement, 
  animation: 'fade' | 'slide' | 'scale'
): void => {
  if (!isAndroid()) return;
  
  switch (animation) {
    case 'fade':
      element.style.transition = 'opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard)';
      break;
    case 'slide':
      element.style.transition = 'transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized)';
      break;
    case 'scale':
      element.style.transition = 'transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)';
      break;
  }
};

export default {
  isAndroid,
  isIOS,
  isNative,
  getAndroidVersion,
  supportsAndroid12Features,
  addRippleEffect,
  addRippleEffects,
  initAndroidUI,
  updateAndroidStatusBar,
  applyElevation,
  hasHardwareBackButton,
  onAndroidBackButton,
  optimizeAndroidScrolling,
  addAndroidA11y,
  getPlatformClasses,
  applyAndroidMotion,
};

