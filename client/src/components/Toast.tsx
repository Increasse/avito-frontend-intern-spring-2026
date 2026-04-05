import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    };

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    };

    const textColors = {
        success: 'text-green-800 dark:text-green-200',
        error: 'text-red-800 dark:text-red-200',
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColors[type]}`}>
                {icons[type]}
                <span className={`text-sm font-medium ${textColors[type]}`}>{message}</span>
                <button
                    onClick={onClose}
                    className={`ml-2 hover:opacity-70 transition-opacity ${textColors[type]}`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}