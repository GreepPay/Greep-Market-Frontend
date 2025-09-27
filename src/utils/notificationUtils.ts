// Notification utilities for goal achievements
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: boolean;
  requireInteraction?: boolean;
  tag?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private permissionGranted: boolean = false;

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async checkPermission(): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
      }
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permissionGranted = permission === 'granted';
    return this.permissionGranted;
  }

  public async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Cannot show notification: permission not granted');
        return;
      }
    }

    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Play notification sound
    if (options.sound) {
      this.playNotificationSound();
    }

    // Show browser notification
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      requireInteraction: options.requireInteraction || false,
      tag: options.tag || 'goal-achievement',
      silent: !options.sound
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Handle click to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  private playNotificationSound(): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant achievement sound using Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a celebratory melody (C-E-G-C)
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const duration = 0.3;
      
      frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * duration);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, audioContext.currentTime + index * duration);
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + index * duration + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * duration + duration);
        
        osc.start(audioContext.currentTime + index * duration);
        osc.stop(audioContext.currentTime + index * duration + duration);
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
      // Fallback: try to play a simple beep
      this.playFallbackSound();
    }
  }

  private playFallbackSound(): void {
    try {
      // Create a simple beep sound as fallback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play fallback sound:', error);
    }
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();


