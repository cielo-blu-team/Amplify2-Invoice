// Simple toast using browser notification or console (replace Mantine notifications)

export function showSuccess(message: string) {
  if (typeof window !== 'undefined') {
    showToast(message, 'success');
  }
}

export function showError(message: string) {
  if (typeof window !== 'undefined') {
    showToast(message, 'error');
  }
}

export function showWarning(message: string) {
  if (typeof window !== 'undefined') {
    showToast(message, 'warning');
  }
}

export function showInfo(message: string) {
  if (typeof window !== 'undefined') {
    showToast(message, 'info');
  }
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

function showToast(message: string, type: ToastType) {
  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '✓' },
    error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', icon: '✕' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', icon: '⚠' },
    info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', icon: 'ℹ' },
  };
  const c = colors[type];
  const durations = { success: 3000, error: 5000, warning: 4000, info: 3000 };

  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: flex; align-items: center; gap: 10px;
    background: ${c.bg}; border: 1px solid ${c.border}; color: ${c.text};
    padding: 12px 16px; border-radius: 8px;
    font-size: 14px; font-family: -apple-system, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-width: 360px; animation: slideIn 0.2s ease;
  `;
  el.innerHTML = `<span style="font-weight:600">${c.icon}</span><span>${message}</span>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, durations[type]);
}
