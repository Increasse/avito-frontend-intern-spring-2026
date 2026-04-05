import {useEffect, useState} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from '@mantine/hooks';
import { itemsApi } from '../api/items';
import { useFiltersStore } from '../stores/filtersStore';
import { Sidebar } from '../components/Sidebar';
import { AdCard } from '../components/AdCard';
import { Pagination } from '../components/Pagination';
import { LayoutGrid, List, Search } from 'lucide-react';

export default function AdsListPage() {
    const [layout, setLayout] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('ads-layout');
        return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    });

    const {
        searchQuery,
        sortColumn,
        sortDirection,
        categories,
        needsRevision,
        page,
        limit,
        setPage,
        setLimit,
        setSearchQuery,
        setSort,
    } = useFiltersStore();

    useEffect(() => {
        if (layout === 'list') {
            setLimit(4);
        } else {
            setLimit(10);
        }
    }, [layout, setLimit]);

    const categoriesParam = categories.length > 0 ? categories.join(',') : undefined;

    const {data, isLoading, error} = useQuery({
        queryKey: ['items', {searchQuery, sortColumn, sortDirection, categoriesParam, needsRevision, page, limit}],
        queryFn: () =>
            itemsApi.getItems({
                q: searchQuery || undefined,
                sortColumn,
                sortDirection,
                categories: categoriesParam,
                needsRevision: needsRevision || undefined,
                skip: (page - 1) * limit,
                limit,
            }),
        placeholderData: (previousData) => previousData,
    });

    const handleSearch = useDebouncedCallback((value: string) => {
        setSearchQuery(value);
    }, 300);

    const handleLayoutChange = (newLayout: 'grid' | 'list') => {
        setLayout(newLayout);
        localStorage.setItem('ads-layout', newLayout);
    };

    const items = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    console.log('items data:', items);

    if (isLoading && !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Ошибка загрузки</h3>
                        <p className="text-red-600 dark:text-red-300">
                            Не удалось загрузить объявления. Проверьте подключение к серверу.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-4 min-h-screen bg-[#F7F5F8] py-3 px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32 2xl:px-48'>
            <div className='flex flex-col gap-2.5 p-2'>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Мои объявления</h1>
                <p className="text-[18px] font-normal text-[#848388] dark:text-gray-400">{total} объявлений</p>
            </div>

            <div className="flex flex-col sm:flex-row rounded-lg bg-white gap-2 md:gap-6 w-full sm:h-14 p-3">
                <div className='relative flex-1'>
                    <input
                        type="text"
                        placeholder="Найти объявление..."
                        defaultValue={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full flex-1 bg-[#F6F6F8] rounded-lg py-1 px-3 text-[#707176] leading-5.5 placeholder-current text-[14px]"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" />
                </div>

                <div className="hidden sm:flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => handleLayoutChange('grid')}
                        className={`flex items-center justify-center p-1 w-6 h-6 rounded-md transition-all duration-200
                            ${layout === 'grid'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }
                        `}
                        title="Сетка"
                    >
                        <LayoutGrid className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={() => handleLayoutChange('list')}
                        className={`flex items-center justify-center p-1 w-6 h-6 rounded-md transition-all duration-200
                            ${layout === 'list'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }
                        `}
                        title="Список"
                    >
                        <List className="w-5 h-5"/>
                    </button>
                </div>

                <select
                    value={`${sortColumn}-${sortDirection}`}
                    onChange={(e) => {
                        const [col, dir] = e.target.value.split('-');
                        setSort(col as 'title' | 'createdAt' | 'price', dir as 'asc' | 'desc');
                    }}
                    className="rounded-lg border-4 border-[#F6F6F8] text-sm"
                >
                    <option value="createdAt-desc">По новизне (сначала новые)</option>
                    <option value="createdAt-asc">По новизне (сначала старые)</option>
                    <option value="title-asc">По названию (А-Я)</option>
                    <option value="title-desc">По названию (Я-А)</option>
                    <option value="price-asc">По цене (сначала дешевые)</option>
                    <option value="price-desc">По цене (сначала дорогие)</option>
                </select>
            </div>

            <div className='flex flex-col md:flex-row gap-6'>
                <Sidebar/>

                <div className="flex-1">
                    {items.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500">Объявления не найдены</p>
                        </div>
                    ) : (
                        <>
                            {layout === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                                    {items.map((item) => (
                                        <AdCard key={item.id} item={item} variant="grid" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {items.map((item) => (
                                        <AdCard key={item.id} item={item} variant="list" />
                                    ))}
                                </div>
                            )}

                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                siblingCount={1}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}