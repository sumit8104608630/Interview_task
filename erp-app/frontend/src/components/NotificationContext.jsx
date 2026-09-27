import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
} from 'lucide-react';

const NotificationContext = createContext(null);

const TOAST_ICONS = {
  success: { Icon: CheckCircle2, ring: 'ring-emerald-500/20', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  error:   { Icon: XCircle,     ring: 'ring-rose-500/20',     text: 'text-rose-600',    bar: 'bg-rose-500' },
  warning: { Icon: AlertTriangle, ring: 'ring-amber-500/20',  text: 'text-amber-600',   bar: 'bg-amber-500' },
  info:    { Icon: Info,          ring: 'ring-sky-500/20',    text: 'text-sky-600',     bar: 'bg-sky-500' },
};

const DIALOG_ICONS = {
  success: { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  error:   { Icon: XCircle,     color: 'text-rose-500',    bg: 'bg-rose-50' },
  warning: { Icon: AlertCircle, color: 'text-amber-500',   bg: 'bg-amber-50' },
  info:    { Icon: Info,        color: 'text-sky-500',     bg: 'bg-sky-50' },
  confirm: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
};

let toastIdSeq = 0;

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message, duration = 3800 }) => {
    const id = ++toastIdSeq;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  const notify = {
    success: (title, message, opts) => toast({ type: 'success', title, message, ...opts }),
    error:   (title, message, opts) => toast({ type: 'error',   title, message, ...opts }),
    warning: (title, message, opts) => toast({ type: 'warning', title, message, ...opts }),
    info:    (title, message, opts) => toast({ type: 'info',    title, message, ...opts }),
  };

  const showDialog = useCallback(({
    type = 'info',
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm,
    onCancel,
  }) => {
    return new Promise((resolve) => {
      setDialog({
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancel,
        resolve,
        onConfirm,
        onCancel,
      });
    });
  }, []);

  const alertDialog = useCallback((message, opts = {}) => {
    return showDialog({
      type: opts.type || 'info',
      title: opts.title || (opts.type === 'error' ? 'Error' : opts.type === 'success' ? 'Success' : 'Notice'),
      message,
      confirmText: opts.confirmText || 'OK',
      showCancel: false,
    });
  }, [showDialog]);

  const confirmDialog = useCallback((message, opts = {}) => {
    return showDialog({
      type: 'confirm',
      title: opts.title || 'Confirm Action',
      message,
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      showCancel: true,
    });
  }, [showDialog]);

  const closeDialog = useCallback((confirmed) => {
    setDialog((prev) => {
      if (!prev) return null;
      if (confirmed) prev.onConfirm?.();
      else prev.onCancel?.();
      prev.resolve(confirmed);
      return null;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ toast, notify, showDialog, alert: alertDialog, confirm: confirmDialog }}>
      {children}

      <div className="fixed top-4 right-4 z-[100] w-[min(400px,calc(100vw-2rem))] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const cfg = TOAST_ICONS[t.type] || TOAST_ICONS.info;
          const { Icon, ring, text, bar } = cfg;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-200 ring-1 ${ring} animate-[slideIn_0.25s_ease-out]`}
              role="alert"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
              <div className="flex items-start gap-3 p-4 pl-3.5">
                <div className={`shrink-0 p-1.5 rounded-lg ${ring} ring-1 ${text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <p className="font-semibold text-gray-900 text-sm leading-5">{t.title}</p>
                  )}
                  {t.message && (
                    <p className={`mt-0.5 text-sm text-gray-600 leading-5 ${t.title ? '' : 'font-medium text-gray-800'}`}>
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => dialog.showCancel && closeDialog(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 animate-[popIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                {(() => {
                  const cfg = DIALOG_ICONS[dialog.type] || DIALOG_ICONS.info;
                  const { Icon, color, bg } = cfg;
                  return (
                    <div className={`shrink-0 w-12 h-12 rounded-full ${bg} flex items-center justify-center ${color}`}>
                      <Icon className="w-6 h-6" strokeWidth={2.25} />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 leading-6">
                    {dialog.title}
                  </h3>
                  {dialog.message && (
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {dialog.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              {dialog.showCancel && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="btn-secondary min-w-[92px]"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`min-w-[92px] ${
                  dialog.type === 'error'
                    ? 'btn-secondary !bg-rose-600 !text-white hover:!bg-rose-700 border-transparent'
                    : 'btn-primary'
                }`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
