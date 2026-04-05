import type {Category} from '../types';
import {useFiltersStore} from '../stores/filtersStore';
import {ChevronDown} from "lucide-react";
import {useState} from "react";

const categoryLabels: Record<Category, string> = {
    auto: 'Авто',
    electronics: 'Электроника',
    real_estate: 'Недвижимость',
};

export function Sidebar() {
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
    const {
        categories,
        needsRevision,
        toggleCategory,
        setNeedsRevision,
        resetFilters,
    } = useFiltersStore();

    return (
        <aside className="flex flex-col gap-2.5 w-full md:w-[256px]">
            <div className="flex flex-col gap-2.5 bg-white p-4 rounded-lg">
                <h2 className="text-lg font-semibold">Фильтры</h2>

                <div className="border-b pb-2.5 border-[#F0F0F0]">
                    <button
                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                        className="flex items-center justify-between w-full mb-3 group"
                    >
                        <h3 className="text-sm font-medium dark:text-gray-300">
                            Категория
                        </h3>
                        <ChevronDown className={`
                            w-4 h-4 dark:text-gray-400 
                            transition-transform duration-200
                            ${isCategoriesOpen ? 'rotate-0' : '-rotate-90'}
                        `}
                        />
                    </button>

                    <div
                        className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${isCategoriesOpen ? 'max-h-96' : 'max-h-0'}
                        `}
                    >
                        <div className="space-y-2">
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <label key={value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={categories.includes(value as Category)}
                                        onChange={() => toggleCategory(value as Category)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Только требующие доработок
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={needsRevision}
                        onClick={() => setNeedsRevision(!needsRevision)}
                        className={`
                            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
                            border-2 border-transparent transition-colors duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${needsRevision ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
                        `}
                    >
                        <span
                            aria-hidden="true"
                            className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded-full 
                                bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                                ${needsRevision ? 'translate-x-5' : 'translate-x-0'}
                            `}
                        />
                    </button>
                </div>
            </div>

            <button
                onClick={resetFilters}
                className="flex justify-center text-sm bg-white p-4 rounded-lg text-[#848388] hover:cursor-pointer hover:bg-gray-50 transition-colors"
            >
                Сбросить фильтры
            </button>
        </aside>
    );
}