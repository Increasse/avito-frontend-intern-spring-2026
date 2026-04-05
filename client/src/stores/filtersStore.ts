import { create } from 'zustand';
import type {Category} from '../types';

interface FiltersState {
    // Поиск и сортировка
    searchQuery: string;
    sortColumn: 'title' | 'createdAt' | 'price';
    sortDirection: 'asc' | 'desc';

    // Фильтры
    categories: Category[];
    needsRevision: boolean;

    // Пагинация
    page: number;
    limit: number;

    // Actions
    setSearchQuery: (query: string) => void;
    setSort: (column: 'title' | 'createdAt' | 'price', direction: 'asc' | 'desc') => void;
    toggleCategory: (category: Category) => void;
    setNeedsRevision: (value: boolean) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
    searchQuery: '',
    sortColumn: 'createdAt',
    sortDirection: 'desc',
    categories: [],
    needsRevision: false,
    page: 1,
    limit: 10,

    setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),

    setSort: (column, direction) => set({ sortColumn: column, sortDirection: direction, page: 1 }),

    toggleCategory: (category) => set((state) => {
        const isSelected = state.categories.includes(category);
        return {
            categories: isSelected
                ? state.categories.filter(c => c !== category)
                : [...state.categories, category],
            page: 1,
        };
    }),

    setNeedsRevision: (value) => set({ needsRevision: value, page: 1 }),

    setPage: (page) => set({ page }),

    setLimit: (limit) => set({ limit, page: 1 }),

    resetFilters: () => set({
        searchQuery: '',
        categories: [],
        needsRevision: false,
        page: 1,
        limit: 10,
        sortColumn: 'createdAt',
        sortDirection: 'desc',
    }),
}));