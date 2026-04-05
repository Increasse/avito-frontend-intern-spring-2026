import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Edit3, AlertCircle, ChevronLeft, ChevronRight, X} from 'lucide-react';
import {itemsApi} from '../api/items';
import type {Item, AutoItemParams, RealEstateItemParams, ElectronicsItemParams} from '../types';
import {useState} from "react";


const formatDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const Characteristic = ({label, value}: { label: string; value?: string | number }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="font-semibold dark:text-gray-400">{label}</span>
            <span className="dark:text-gray-100">{value}</span>
        </div>
    );
};

export default function AdDetailPage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {data: item, isLoading, error} = useQuery({
        queryKey: ['item', id],
        queryFn: () => itemsApi.getItemById(id!),
        enabled: !!id,
    });

    const getPlaceholderImages = () => {
        return [
            'https://placehold.co/1200x800/F7F5F8/848388?text=Нет+изображения',
            'https://placehold.co/1200x800/F7F5F8/848388?text=Нет+изображения',
            'https://placehold.co/1200x800/F7F5F8/848388?text=Нет+изображения',

        ];
    };

    // Получаем незаполненные поля для предупреждения
    const getMissingFields = (item: Item): string[] => {
        const missing: string[] = [];

        if (!item.description) missing.push('Описание');

        const params = item.params;

        if (item.category === 'electronics') {
            const electronicsParams = params as ElectronicsItemParams;
            if (!electronicsParams.color) missing.push('Цвет');
            if (!electronicsParams.condition) missing.push('Состояние');
            if (!electronicsParams.brand) missing.push('Бренд');
            if (!electronicsParams.model) missing.push('Модель');
        } else if (item.category === 'auto') {
            const autoParams = params as AutoItemParams;
            if (!autoParams.brand) missing.push('Марка');
            if (!autoParams.model) missing.push('Модель');
            if (!autoParams.yearOfManufacture) missing.push('Год выпуска');
            if (!autoParams.mileage) missing.push('Пробег');
        } else if (item.category === 'real_estate') {
            const realEstateParams = params as RealEstateItemParams;
            if (!realEstateParams.type) missing.push('Тип недвижимости');
            if (!realEstateParams.area) missing.push('Площадь');
            if (!realEstateParams.address) missing.push('Адрес');
        }

        return missing;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F5F8]">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 bg-gray-200 rounded w-64"></div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="h-100 bg-gray-200"></div>
                            <div className="p-6 space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-[#F7F5F8]">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                        <h3 className="text-red-800 dark:text-red-200 font-semibold text-lg mb-2">
                            Объявление не найдено
                        </h3>
                        <p className="text-red-600 dark:text-red-300 mb-4">
                            Запрашиваемое объявление не существует или было удалено.
                        </p>
                        <button
                            onClick={() => navigate('/ads')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Вернуться к списку
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const missingFields = getMissingFields(item);
    const needsRevision = missingFields.length > 0;

    // Получаем характеристики для отображения
    const getCharacteristics = () => {
        const params = item.params;
        const characteristics: { label: string; value: string | number | undefined }[] = [];

        if (item.category === 'electronics') {
            const p = params as ElectronicsItemParams;
            characteristics.push({
                label: 'Тип',
                value: p.type === 'phone' ? 'Телефон' : p.type === 'laptop' ? 'Ноутбук' : p.type === 'misc' ? 'Другое' : undefined
            });
            characteristics.push({label: 'Бренд', value: p.brand});
            characteristics.push({label: 'Модель', value: p.model});
            characteristics.push({label: 'Цвет', value: p.color});
            characteristics.push({
                label: 'Состояние',
                value: p.condition === 'new' ? 'Новый' : p.condition === 'used' ? 'Б/У' : undefined
            });
        } else if (item.category === 'auto') {
            const p = params as AutoItemParams;
            characteristics.push({label: 'Марка', value: p.brand});
            characteristics.push({label: 'Модель', value: p.model});
            characteristics.push({label: 'Год выпуска', value: p.yearOfManufacture});
            characteristics.push({
                label: 'Коробка передач',
                value: p.transmission === 'automatic' ? 'Автомат' : p.transmission === 'manual' ? 'Механика' : undefined
            });
            characteristics.push({label: 'Пробег (км)', value: p.mileage?.toLocaleString()});
            characteristics.push({label: 'Мощность (л.с.)', value: p.enginePower});
        } else if (item.category === 'real_estate') {
            const p = params as RealEstateItemParams;
            characteristics.push({
                label: 'Тип',
                value: p.type === 'flat' ? 'Квартира' : p.type === 'house' ? 'Дом' : p.type === 'room' ? 'Комната' : undefined
            });
            characteristics.push({label: 'Адрес', value: p.address});
            characteristics.push({label: 'Площадь (м²)', value: p.area});
            characteristics.push({label: 'Этаж', value: p.floor});
        }

        return characteristics.filter(c => c.value);
    };

    const goToPrevious = () => {
        if (!item) return;
        const images = getPlaceholderImages();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        if (!item) return;
        const images = getPlaceholderImages();
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const characteristics = getCharacteristics();
    const images = getPlaceholderImages();

    return (
        <div className="flex flex-col p-8 pb-12 min-h-screen w-full gap-8 bg-white">
            <div className="flex flex-col gap-4 pb-6 sm:pb-8 border-b border-b-[#F0F0F0]">
                <div className='flex sm:flex-row flex-col justify-between text-[24px] sm:text-[30px] leading-10 font-semibold'>
                    <span>{item.title}</span>
                    <span>{item.price} ₽</span>
                </div>
                <div className='flex sm:flex-row flex-col justify-between'>
                    <button
                        onClick={() => navigate(`/ads/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <span className='text-[16px]'>Редактировать</span>
                        <Edit3 className="w-4 h-4"/>
                    </button>
                    <div className='flex sm:mt-4 mt-4 sm:flex-row flex-col sm:text-end'>
                        <span>Опубликовано: {formatDate(item.createdAt)}</span>
                        <span>Отредактировано: {formatDate(item.updatedAt)}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8">
                <div>
                    <div>
                        <div className="relative xl:h-100">
                            <img
                                src={images[currentImageIndex]}
                                alt={`${item.title} - фото ${currentImageIndex + 1}`}
                                className="w-full h-full object-contain cursor-pointer rounded-lg"
                                onClick={() => setIsModalOpen(true)}
                            />

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

                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="relative group">
                                <div
                                    className="flex justify-center gap-2 py-4 overflow-x-auto scrollbar-hide"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}
                                >
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`
                                                shrink-0 w-24 h-24 rounded-lg overflow-hidden
                                                border-2 transition-all duration-200
                                                ${currentImageIndex === index
                                                    ? 'border-blue-500'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <img
                                                src={image}
                                                alt={`Миниатюра ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/F7F5F8/848388?text=Нет';
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {isModalOpen && (
                        <div
                            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <div className="relative max-w-7xl w-full h-full flex items-center justify-center p-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                                    aria-label="Закрыть"
                                >
                                    <X className="w-8 h-8" />
                                </button>

                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${item.title} - фото ${currentImageIndex + 1}`}
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
                                            className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                                        >
                                            <ChevronLeft className="w-2 h-2 sm:w-8 sm:h-8" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                goToNext();
                                            }}
                                            className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                                        >
                                            <ChevronRight className="w-2 h-2 sm:w-8 sm:h-8" />
                                        </button>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                            {currentImageIndex + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {item.description ? (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-medium dark:text-white">
                                Описание
                            </h2>
                            <p className="dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-medium dark:text-white">
                                Описание
                            </h2>
                            <p className="dark:text-gray-400">
                                Отсутствует
                            </p>
                        </div>
                    )}
                </div>

                <div className='flex flex-col gap-9'>
                    {needsRevision && (
                        <div className="flex w-full sm:w-64 md:w-sm lg:w-md xl:w-lg gap-4 bg-[#F9F1E6] dark:bg-yellow-900/20 rounded-lg px-4 py-3">
                            <AlertCircle className="mt-0.75 w-5 h-5 text-yellow-600 dark:text-yellow-400"/>
                            <div className='flex flex-col gap-2'>
                                <div className="flex items-center gap-2">
                                    <h3 className="dark:text-gray-100 font-semibold">
                                        Требуются доработки
                                    </h3>
                                </div>
                                <p className="dark:text-gray-100 text-sm">
                                    У объявления не заполнены поля:
                                </p>
                                <ul className="list-disc list-inside space-y-1 dark:text-gray-100 text-sm">
                                    {missingFields.map((field, index) => (
                                        <li key={index} className="ml-2">
                                            {field}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {characteristics.length > 0 && (
                        <div className="w-full sm:w-64 md:w-sm lg:w-md xl:w-lg">
                            <h2 className="text-[24px] font-semibold dark:text-white">
                                Характеристики
                            </h2>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {characteristics.map((char, index) => (
                                    <Characteristic key={index} label={char.label} value={char.value}/>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}