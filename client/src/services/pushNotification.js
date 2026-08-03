/**
 * Helper utility for HTML5 Web Push Notifications
 */

export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getPushPermissionState = () => {
  if (!isPushSupported()) return 'unsupported';
  return window.Notification.permission;
};

export const requestPushPermission = async () => {
  if (!isPushSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await window.Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
};

export const showPushNotification = (title, options = {}) => {
  if (!isPushSupported()) return null;
  if (window.Notification.permission !== 'granted') return null;

  try {
    const notification = new window.Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: options.tag || 'resolvedesk-notification',
      ...options,
    });

    if (options.onClickUrl) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (typeof options.onClickUrl === 'function') {
          options.onClickUrl();
        }
        notification.close();
      };
    }

    return notification;
  } catch (err) {
    console.error('Error showing push notification:', err);
    return null;
  }
};
