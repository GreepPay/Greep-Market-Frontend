// Modern 2025 Notification System with Sounds and Smart Features

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'milestone';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ModernNotificationOptions {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 0 = persistent
  sound?: boolean;
  priority?: NotificationPriority;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  image?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

class ModernNotificationSystem {
  private static instance: ModernNotificationSystem;
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.5;
  private notifications: Map<string, any> = new Map();
  private container: HTMLDivElement | null = null;

  private constructor() {
    this.initializeAudioContext();
    this.createContainer();
    this.loadSettings();
  }

  public static getInstance(): ModernNotificationSystem {
    if (!ModernNotificationSystem.instance) {
      ModernNotificationSystem.instance = new ModernNotificationSystem();
    }
    return ModernNotificationSystem.instance;
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private createContainer(): void {
    if (typeof document === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.id = 'modern-toast-container';
    this.container.className = 'fixed z-[9999] pointer-events-none';
    this.container.style.top = '20px';
    this.container.style.right = '20px';
    document.body.appendChild(this.container);
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.soundEnabled = settings.soundEnabled !== false;
        this.volume = settings.volume ?? 0.5;
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.saveSettings();
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify({
        soundEnabled: this.soundEnabled,
        volume: this.volume
      }));
    } catch (error) {
      console.warn('Failed to save notification settings:', error);
    }
  }

  private playSound(type: NotificationType, priority?: NotificationPriority): void {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      switch (type) {
        case 'success':
          this.playSuccessSound();
          break;
        case 'error':
          this.playErrorSound(priority);
          break;
        case 'warning':
          this.playWarningSound();
          break;
        case 'achievement':
        case 'milestone':
          this.playAchievementSound();
          break;
        default:
          this.playInfoSound();
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private playSuccessSound(): void {
    if (!this.audioContext) return;

    // Pleasant ascending chord (C-E-G-C)
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.15;
    const startTime = this.audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const noteStart = startTime + index * duration;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + duration);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration);
    });
  }

  private playErrorSound(priority?: NotificationPriority): void {
    if (!this.audioContext) return;

    const isUrgent = priority === 'urgent';
    const frequency = isUrgent ? 400 : 300;
    const duration = isUrgent ? 0.4 : 0.3;
    const startTime = this.audioContext.currentTime;

    // Descending tone for error
    for (let i = 0; i < (isUrgent ? 3 : 2); i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency - (i * 50);
      oscillator.type = 'sawtooth';

      const noteStart = startTime + i * (duration / 2);
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(this.volume * (isUrgent ? 0.3 : 0.2), noteStart + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + duration / 2);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration / 2);
    }
  }

  private playWarningSound(): void {
    if (!this.audioContext) return;

    // Two-tone alert
    const frequencies = [440, 554.37]; // A4, C#5
    const duration = 0.2;
    const startTime = this.audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';

      const noteStart = startTime + index * duration;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.15, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + duration);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration);
    });
  }

  private playAchievementSound(): void {
    if (!this.audioContext) return;

    // Celebratory fanfare (C-E-G-C-E-G-C)
    const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    const duration = 0.1;
    const startTime = this.audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const noteStart = startTime + index * duration;
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.25, noteStart + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + duration * 0.8);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration * 0.8);
    });
  }

  private playInfoSound(): void {
    if (!this.audioContext) return;

    // Gentle single tone
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';

    const startTime = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  }

  public show(options: ModernNotificationOptions): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Play sound
    if (options.sound !== false) {
      this.playSound(options.type, options.priority);
    }

    // Haptic feedback for urgent notifications
    if (options.priority === 'urgent' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Create notification element
    this.createNotificationElement(id, options);

    return id;
  }

  private createNotificationElement(id: string, options: ModernNotificationOptions): void {
    if (!this.container || typeof document === 'undefined') return;

    // This will be handled by the toast library integration
    // For now, we'll dispatch a custom event
    const event = new CustomEvent('modern-notification', {
      detail: { id, ...options }
    });
    window.dispatchEvent(event);
  }

  public dismiss(id: string): void {
    this.notifications.delete(id);
    const event = new CustomEvent('modern-notification-dismiss', {
      detail: { id }
    });
    window.dispatchEvent(event);
  }

  public dismissAll(): void {
    this.notifications.clear();
    const event = new CustomEvent('modern-notification-dismiss-all');
    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const modernNotificationSystem = ModernNotificationSystem.getInstance();

// Convenience functions
export const notify = {
  success: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'success',
      title,
      message,
      ...options
    });
  },
  error: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    });
  },
  warning: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'warning',
      title,
      message,
      ...options
    });
  },
  info: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'info',
      title,
      message,
      ...options
    });
  },
  achievement: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'achievement',
      title,
      message,
      duration: 7000,
      priority: 'high',
      ...options
    });
  },
  milestone: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'milestone',
      title,
      message,
      duration: 7000,
      priority: 'high',
      ...options
    });
  },
  urgent: (title: string, message?: string, options?: Partial<ModernNotificationOptions>) => {
    return modernNotificationSystem.show({
      type: 'error',
      title,
      message,
      priority: 'urgent',
      duration: 0, // Persistent
      ...options
    });
  }
};

