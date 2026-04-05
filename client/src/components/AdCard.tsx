import {useNavigate} from 'react-router-dom';
import type {Category, Item} from '../types';

const categoryLabels: Record<Category, string> = {
    auto: 'Авто',
    electronics: 'Электроника',
    real_estate: 'Недвижимость',
};

const categoryColors: Record<Category, string> = {
    auto: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    electronics: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    real_estate: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

interface AdCardProps {
    item: Item;
    variant?: 'grid' | 'list';
    onClick?: () => void;
}

export function AdCard({item, variant = 'grid', onClick}: AdCardProps) {
    const navigate = useNavigate();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-RU').format(price);
    };

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(`/ads/${item.id}`);
        }
    };

    // List
    if (variant === 'list') {
        return (
            <div
                onClick={handleClick}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex h-33"
            >
                <div className="w-45 shrink-0 bg-gray-200">
                    <img
                        src={`#`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                'https://placehold.co/128x128?text=Нет+изображения';
                        }}
                    />
                </div>
                <div className="flex-1 p-4 pl-6 gap-1">
                    <span className='text-[#848388] text-[14px]'>
                        {categoryLabels[item.category]}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                    </h3>
                    <p className="text-[16px] font-medium text-blue-600 dark:text-blue-400">
                        {formatPrice(item.price)} ₽
                    </p>
                    {item.needsRevision && (
                        <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 leading-5.5 text-[#FAAD14] text-[14px] rounded-lg bg-[#F9F1E6] dark:bg-yellow-900 dark:text-yellow-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FAAD14] dark:bg-yellow-400"></span>
                            Требует доработок
                        </span>
                    )}
                    {item.createdAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Grid (по умолчанию)
    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        >
            <div className="h-60 sm:h-37.5 w-full bg-gray-200 shrink-0">
                <img
                    src={`#`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src =
                            'https://placehold.co/128x128?text=Нет+изображения';
                    }}
                />
            </div>
            <div className="relative flex flex-col gap-1 p-4 pt-5.5">
                <div className="absolute -top-3 left-3 flex items-center justify-between mb-2">
                    <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryColors[item.category]}`}
                    >
                        {categoryLabels[item.category]}
                    </span>
                </div>
                <h3 className="leading-6 text-[16px] font-normal dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.title}
                </h3>
                <p className="text-[16px] font-medium text-blue-600 dark:text-blue-400">
                    {formatPrice(item.price)} ₽
                </p>
                {item.needsRevision && (
                    <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 leading-5.5 text-[#FAAD14] text-[14px] rounded-lg bg-[#F9F1E6] dark:bg-yellow-900 dark:text-yellow-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FAAD14] dark:bg-yellow-400"></span>
                        Требует доработок
                    </span>
                )}
                {item.createdAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                )}
            </div>
        </div>
    );
}