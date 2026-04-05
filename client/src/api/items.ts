import apiClient from './client';
import type { ItemsGetParams, ItemsGetOut, Item, ItemUpdateIn } from '../types';

export const itemsApi = {
    // Получить список объявлений с фильтрами и пагинацией
    getItems: async (params: ItemsGetParams = {}): Promise<ItemsGetOut> => {
        const { data } = await apiClient.get<ItemsGetOut>('/items', { params });
        return data;
    },

    // Получить одно объявление по ID
    getItemById: async (id: string): Promise<Item> => {
        const { data } = await apiClient.get<Item>(`/items/${id}`);
        return data;
    },

    // Обновить объявление (полная замена)
    updateItem: async (id: string, payload: ItemUpdateIn): Promise<Item> => {
        const { data } = await apiClient.put<Item>(`/items/${id}`, payload);
        return data;
    },
};