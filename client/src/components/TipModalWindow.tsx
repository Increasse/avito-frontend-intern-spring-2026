import {useEffect, useRef, useState} from 'react';

interface TipModalWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onApply?: () => void;
    title: string;
    content: string;
    showApplyButton?: boolean;
    applyButtonText?: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    type?: 'error' | 'success';
}

export function TipModalWindow({
                                   isOpen,
                                   onClose,
                                   onApply,
                                   title,
                                   content,
                                   showApplyButton = false,
                                   applyButtonText = 'Применить',
                                   anchorRef,
                                   type = 'success'
                               }: TipModalWindowProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({top: 0, left: 0});
    const [modalHeight, setModalHeight] = useState(0);
    const [modalWidth, setModalWidth] = useState(400);
    const [, setShowAbove] = useState(true);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            const height = modalRef.current.offsetHeight;
            const width = modalRef.current.offsetWidth;
            setModalHeight(height);
            setModalWidth(width);
        }
    }, [isOpen, content]);

    useEffect(() => {
        if (isOpen && anchorRef.current && modalHeight > 0) {
            const calculatePosition = () => {
                const rect = anchorRef.current!.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                // Получаем абсолютную позицию кнопки на странице
                const buttonAbsoluteTop = rect.top;
                const buttonAbsoluteBottom = rect.bottom + scrollY;

                // Проверяем, помещается ли окно сверху
                const spaceAbove = buttonAbsoluteTop;
                const spaceBelow = document.body.scrollHeight - buttonAbsoluteBottom;
                const fitsAbove = spaceAbove >= modalHeight + 16;
                const fitsBelow = spaceBelow >= modalHeight + 16;

                // Решаем, где показывать окно
                let top: number;
                let showAboveFlag: boolean;

                if (fitsAbove) {
                    // Показываем сверху
                    top = buttonAbsoluteTop - modalHeight - 8;
                    showAboveFlag = true;
                } else if (fitsBelow) {
                    // Показываем снизу
                    top = buttonAbsoluteBottom + 8;
                    showAboveFlag = false;
                } else {
                    // Если не помещается нигде, центрируем по вертикали
                    top = scrollY + viewportHeight / 2 - modalHeight / 2;
                    showAboveFlag = true;
                }

                // Горизонтальное позиционирование
                let left = rect.left + scrollX;

                // Корректировка по горизонтали
                if (left + modalWidth > scrollX + viewportWidth) {
                    left = scrollX + viewportWidth - modalWidth - 16;
                }
                if (left < scrollX + 16) {
                    left = scrollX + 16;
                }

                setPosition({top, left});
                setShowAbove(showAboveFlag);
            };

            // Небольшая задержка для полного рендера
            const timeoutId = setTimeout(calculatePosition, 10);

            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition);

            return () => {
                clearTimeout(timeoutId);
                window.removeEventListener('resize', calculatePosition);
                window.removeEventListener('scroll', calculatePosition);
            };
        }
    }, [isOpen, anchorRef, modalHeight, modalWidth]);

    if (!isOpen) return null;

    // Цветовая схема в зависимости от типа
    const styles = {
        success: {
            bg: 'bg-white dark:bg-gray-900',
            title: 'text-[#1E1E1E] dark:text-white',
            button_apply: 'px-3 py-1 bg-[#1890FF] text-white rounded-sm hover:bg-[#007cee] transition-colors text-sm',
            button_close: 'hover:bg-gray-50 dark:hover:bg-gray-800'
        },
        error: {
            bg: 'bg-[#FEE9E7] dark:bg-red-900/20',
            title: 'text-[#C00F0C]',
            button_apply: 'hidden',
            button_close: 'bg-[#FCB3AD]'
        }
    };

    const currentStyle = styles[type];

    return (
        <>
            <div
                ref={modalRef}
                className={`fixed max-w-4xl z-50 p-2 ${currentStyle.bg} overflow-hidden animate-in fade-in zoom-in duration-200`}
                style={{
                    top: position.top,
                    left: position.left,
                    boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.15)",
                }}
            >

                <h3 className={`text-[16px] font-medium ${currentStyle.title}`}>
                    {title}
                </h3>

                <div className="overflow-auto">
                    <div
                        className="whitespace-pre-wrap text-[#1E1E1E] font-normal dark:text-gray-300 text-sm leading-relaxed">
                        {content}
                    </div>
                </div>

                <div className="py-2 flex gap-2">
                    {showApplyButton && onApply && (
                        <button
                            onClick={onApply}
                            className={`${currentStyle.button_apply}`}
                        >
                            {applyButtonText}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${currentStyle.button_close} px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-sm dark:text-gray-300 transition-colors text-sm`}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </>
    );
}