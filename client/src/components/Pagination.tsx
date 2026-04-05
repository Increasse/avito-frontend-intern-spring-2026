import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number; // Количество видимых страниц слева и справа от текущей
}

export function Pagination({
                               currentPage,
                               totalPages,
                               onPageChange,
                               siblingCount = 1
                           }: PaginationProps) {

    // Генерация массива страниц для отображения
    const getPageNumbers = () => {
        const totalPageNumbers = siblingCount * 2 + 3; // Первая + последняя + текущая + siblingCount*2
        const pages: (number | 'dots')[] = [];

        if (totalPages <= totalPageNumbers) {
            // Если страниц мало, показываем все
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
            const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

            const showLeftDots = leftSiblingIndex > 2;
            const showRightDots = rightSiblingIndex < totalPages - 1;

            // Всегда показываем первую страницу
            pages.push(1);

            if (showLeftDots) {
                pages.push('dots');
            }

            // Показываем страницы вокруг текущей
            for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }

            if (showRightDots) {
                pages.push('dots');
            }

            // Всегда показываем последнюю страницу
            if (totalPages !== 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pages = getPageNumbers();

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 mt-8">
            {/* Кнопка "Назад" */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
          flex items-center justify-center bg-white border border-[#D9D9D9] w-8 h-8 rounded-lg
          transition-colors duration-200
          ${currentPage === 1
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
        `}
                aria-label="Предыдущая страница"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Страницы */}
            {pages.map((page, index) => {
                if (page === 'dots') {
                    return (
                        <span
                            key={`dots-${index}`}
                            className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400"
                        >
              <MoreHorizontal className="w-4 h-4" />
            </span>
                    );
                }

                return (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`
              flex items-center justify-center bg-white min-w-8 h-8 px-2 rounded-lg
              text-sm font-medium transition-colors duration-200
              ${currentPage === page
                            ? 'border border-[#1890FF] text-[#1890FF]'
                            : 'border border-[#D9D9D9] hover:bg-gray-100'
                        }
            `}
                        aria-label={`Страница ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                    >
                        {page}
                    </button>
                );
            })}

            {/* Кнопка "Вперёд" */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
          flex items-center justify-center bg-white border border-[#D9D9D9] w-8 h-8 rounded-lg
          transition-colors duration-200
          ${currentPage === totalPages
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
        `}
                aria-label="Следующая страница"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}