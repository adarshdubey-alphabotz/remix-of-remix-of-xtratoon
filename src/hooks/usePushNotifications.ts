import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [supported] = useState(() => 'Notification' in window);

  const requestPermission = async () => {
    if (!supported) {
      toast.error('Push notifications not supported in this browser');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success('Notifications enabled! 🔔');
      return true;
    }
    if (result === 'denied') {
      toast.error('Notifications blocked. Enable them in browser settings.');
    }
    return false;
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  };

  return { permission, supported, requestPermission, sendNotification };
};
