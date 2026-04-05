import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Если нет изображений, показываем плейсхолдер
    if (!images || images.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="relative h-[400px] bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-gray-500">Нет изображений</p>
                    </div>
                </div>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            {/* Основная карусель */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                {/* Главное изображение */}
                <div className="relative h-[400px] bg-gray-200">
                    <img
                        src={images[currentIndex]}
                        alt={`${title} - фото ${currentIndex + 1}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={openModal}
                    />

                    {/* Кнопки навигации */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                aria-label="Предыдущее фото"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                aria-label="Следующее фото"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Счётчик фотографий */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                </div>

                {/* Миниатюры */}
                {images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50 dark:bg-gray-900">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`
                  flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden
                  border-2 transition-all duration-200
                  ${currentIndex === index
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }
                `}
                            >
                                <img
                                    src={image}
                                    alt={`Миниатюра ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальное окно для полноэкранного просмотра */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={closeModal}
                >
                    <div className="relative max-w-7xl w-full h-full flex items-center justify-center p-4">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                            aria-label="Закрыть"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <img
                            src={images[currentIndex]}
                            alt={`${title} - фото ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToPrevious();
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToNext();
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}