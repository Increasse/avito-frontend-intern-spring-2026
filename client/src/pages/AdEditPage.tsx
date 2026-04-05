import {useState, useEffect, useCallback, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, Clock, AlertCircle, Lightbulb, TrendingUp, RefreshCw, MessageSquare} from 'lucide-react';
import {itemsApi} from '../api/items';
import {llmApi} from '../api/llm'
import {Toast, type ToastType} from '../components/Toast';
import type {
    Category,
    AutoItemParams,
    RealEstateItemParams,
    ElectronicsItemParams
} from '../types';
import {TipModalWindow} from "../components/TipModalWindow.tsx";
import {AIChat} from "../components/AIChat.tsx";

type FormData = {
    category: Category;
    title: string;
    price: number;
    description: string;
    params: AutoItemParams | RealEstateItemParams | ElectronicsItemParams;
};

type FieldValue = string | number | undefined | null;

const getFieldClass = (
    fieldName: string,
    value: FieldValue,
    formData: FormData,
    touched: Record<string, boolean>,
    validationErrors: ValidationErrors
): string => {
    const baseClass = "w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2";

    // Обязательные поля
    const isRequired = ['title', 'price'].includes(fieldName);

    if (isRequired) {
        const hasError = touched[fieldName] && validationErrors[fieldName as keyof ValidationErrors];
        if (hasError) {
            return `${baseClass} border-red-500 focus:ring-red-500`;
        }
        return `${baseClass} border-gray-300 dark:border-gray-600 focus:ring-blue-500`;
    }

    // Необязательные поля
    const optionalFields = getOptionalFields(formData.category);
    const isOptional = optionalFields.includes(fieldName);

    if (isOptional) {
        const isEmpty = !value ||
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'number' && (isNaN(value) || value <= 0));

        if (isEmpty) {
            return `${baseClass} border-[#FFA940] focus:ring-yellow-500`;
        }
    }

    // По умолчанию
    return `${baseClass} border-gray-300 dark:border-gray-600 focus:ring-blue-500`;
};

const categoryLabels: Record<Category, string> = {
    auto: 'Авто',
    electronics: 'Электроника',
    real_estate: 'Недвижимость',
};

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

// Интерфейс для черновика
interface DraftData {
    id: string;
    data: FormData;
    updatedAt: string;
}

// Интерфейс для ошибок валидации
interface ValidationErrors {
    title?: string;
    price?: string;
}

// Определяем необязательные поля
const getOptionalFields = (category: Category): string[] => {
    if (category === 'electronics') {
        return ['description', 'type', 'brand', 'model', 'color', 'condition'];
    } else if (category === 'auto') {
        return ['description', 'brand', 'model', 'yearOfManufacture', 'transmission', 'mileage', 'enginePower'];
    } else if (category === 'real_estate') {
        return ['description', 'type', 'address', 'area', 'floor'];
    }

    return ['description'];
};

export default function AdEditPage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        category: 'electronics' as Category,
        title: '',
        price: 0,
        description: '',
        params: {} as AutoItemParams | RealEstateItemParams | ElectronicsItemParams,
    });

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDraftRestore, setShowDraftRestore] = useState(false);
    const [draftDate, setDraftDate] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const [isImprovingDescription, setIsImprovingDescription] = useState(false);
    const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);

    const [aiMode, setAiMode] = useState<'description' | 'price' | null>(null);
    const [modalType, setModalType] = useState<'error' | 'success'>('success');

    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);

    const [descriptionResult, setDescriptionResult] = useState('');
    const [priceResult, setPriceResult] = useState('');

    const [showChat, setShowChat] = useState(false);

    const improveDescriptionRef = useRef<HTMLButtonElement>(null);
    const suggestPriceRef = useRef<HTMLButtonElement>(null);

    const {data: item, isLoading, error} = useQuery({
        queryKey: ['item', id],
        queryFn: () => itemsApi.getItemById(id!),
        enabled: !!id,
    });

    // Валидация формы
    const validateForm = useCallback(() => {
        const errors: ValidationErrors = {};

        if (!formData.title.trim()) errors.title = 'Название обязательно для заполнения';
        if (formData.price <= 0) errors.price = 'Цена должна быть больше 0';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData.title, formData.price]);

    const canSave = () => {
        return formData.title.trim() && formData.price > 0;
    };

    const handleImproveDescription = async () => {
        if (!item) return;
        setIsImprovingDescription(true);
        try {
            const improved = await llmApi.improveDescription({
                ...item,
                description: formData.description,
            });
            setDescriptionResult(improved);
            setModalType('success');
            setShowDescriptionModal(true);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Не удалось улучшить описание';
            setToast({message: errorMessage, type: 'error'});
            setModalType('error');

            setDescriptionResult('Не удалось улучшить описание');
            setShowDescriptionModal(true);
        } finally {
            setIsImprovingDescription(false);
        }
    };

    const handleSuggestPrice = async () => {
        if (!item) return;
        setIsSuggestingPrice(true);

        try {
            const suggestion = await llmApi.suggestMarketPrice(item);
            setPriceResult(suggestion);
            setShowPriceModal(true);
            setAiMode('price');
            setModalType('success');
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Не удалось получить рекомендацию по цене';
            setPriceResult('Не удалось получить рекомендацию по цене');
            setToast({message: errorMessage, type: 'error'});
            setAiMode('price');
            setModalType('error');
            setShowPriceModal(true);
        } finally {
            setIsSuggestingPrice(false);
        }
    };

    // Проверка, какие необязательные поля не заполнены
    const getMissingOptionalFields = (): string[] => {
        const optionalFields = getOptionalFields(formData.category);
        const missing: string[] = [];

        if (!formData.description && optionalFields.includes('description')) {
            missing.push('Описание');
        }

        const params = formData.params;

        if (formData.category === 'electronics') {
            const p = params as ElectronicsItemParams;
            if (!p.type && optionalFields.includes('type')) missing.push('Тип');
            if (!p.brand && optionalFields.includes('brand')) missing.push('Бренд');
            if (!p.model && optionalFields.includes('model')) missing.push('Модель');
            if (!p.color && optionalFields.includes('color')) missing.push('Цвет');
            if (!p.condition && optionalFields.includes('condition')) missing.push('Состояние');
        } else if (formData.category === 'auto') {
            const p = params as AutoItemParams;
            if (!p.brand && optionalFields.includes('brand')) missing.push('Марка');
            if (!p.model && optionalFields.includes('model')) missing.push('Модель');
            if (!p.yearOfManufacture && optionalFields.includes('yearOfManufacture')) missing.push('Год выпуска');
            if (!p.transmission && optionalFields.includes('transmission')) missing.push('Коробка передач');
            if (!p.mileage && optionalFields.includes('mileage')) missing.push('Пробег');
            if (!p.enginePower && optionalFields.includes('enginePower')) missing.push('Мощность');
        } else if (formData.category === 'real_estate') {
            const p = params as RealEstateItemParams;
            if (!p.type && optionalFields.includes('type')) missing.push('Тип недвижимости');
            if (!p.address && optionalFields.includes('address')) missing.push('Адрес');
            if (!p.area && optionalFields.includes('area')) missing.push('Площадь');
            if (!p.floor && optionalFields.includes('floor')) missing.push('Этаж');
        }

        return missing;
    };

    // Загрузка черновика
    useEffect(() => {
        if (!id) return;

        const savedDraft = localStorage.getItem(`ad_draft_${id}`);
        if (savedDraft) {
            try {
                const draft: DraftData = JSON.parse(savedDraft);
                setDraftDate(draft.updatedAt);
                setShowDraftRestore(true);
                setFormData(draft.data);
            } catch (e) {
                console.error('Failed to parse draft', e);
            }
        }
    }, [id])

    // Инициализация формы данными из API
    useEffect(() => {
        if (item) {
            setFormData({
                category: item.category,
                title: item.title,
                price: item.price,
                description: item.description || '',
                params: item.params || {},
            });
        }
    }, [item]);

    // Сохранение черновика
    useEffect(() => {
        if (!id) return;

        const timeout = setTimeout(() => {
            const draft: DraftData = {
                id,
                data: formData,
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(`ad_draft_${id}`, JSON.stringify(draft));
            setHasUnsavedChanges(true);
        }, 800);

        return () => clearTimeout(timeout);
    }, [formData, id]);

    // Валидация при изменении полей
    useEffect(() => {
        validateForm();
    }, [validateForm]);

    const restoreDraft = () => {
        if (id) {
            const draftKey = `ad_draft_${id}`;
            const savedDraft = localStorage.getItem(draftKey);

            if (savedDraft) {
                try {
                    const draft: DraftData = JSON.parse(savedDraft);
                    setFormData(draft.data);
                    setShowDraftRestore(false);
                    setHasUnsavedChanges(true);
                } catch (e) {
                    console.error('Failed to restore draft', e);
                }
            }
        }
    };

    const clearDraft = () => {
        if (id) {
            const draftKey = `ad_draft_${id}`;
            localStorage.removeItem(draftKey);
            setShowDraftRestore(false);
            setHasUnsavedChanges(false);
        }
    };

    const showToast = (message: string, type: ToastType) => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3000);
    };

    const updateMutation = useMutation({
        mutationFn: (data: any) => itemsApi.updateItem(id!, data),
        onSuccess: () => {
            clearDraft();
            queryClient.invalidateQueries({queryKey: ['item', id]});
            queryClient.invalidateQueries({queryKey: ['items']});
            showToast('Объявление успешно сохранено!', 'success');
            setTimeout(() => {
                navigate(`/ads/${id}`);
            }, 500);
        },
        onError: (error) => {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Ошибка при сохранении. Попробуйте снова.';
            showToast(errorMessage, 'error');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const allFields = ['title', 'price'];
        const touchedState: Record<string, boolean> = {};
        allFields.forEach(field => {
            touchedState[field] = true;
        });
        setTouched(touchedState);

        if (validateForm() && canSave()) {
            updateMutation.mutate(formData);
        } else {
            showToast('Пожалуйста, заполните все обязательные поля', 'error');
        }
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            if (confirm('У вас есть несохранённые изменения. Вы уверены, что хотите выйти?')) {
                clearDraft();
                navigate(`/ads/${id}`);
            }
        } else {
            navigate(`/ads/${id}`);
        }
    };

    const handleChange = (field: string, value: FieldValue) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({...prev, [field]: true}));
    };

    const handleParamsChange = (key: string, value: FieldValue) => {
        setFormData(prev => ({
            ...prev,
            params: {...prev.params, [key]: value},
        }));
    };

    const missingOptionalFields = getMissingOptionalFields();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F5F8]">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 bg-gray-200 rounded w-64"></div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                            <div className="flex gap-4">
                                <div className="h-10 bg-gray-200 rounded w-24"></div>
                                <div className="h-10 bg-gray-200 rounded w-24"></div>
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

    return (
        <div className="min-h-screen bg-[#F7F5F8]">

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5"/>
                        <span>Назад к объявлению</span>
                    </button>
                </div>

                {missingOptionalFields.length > 0 && (
                    <div
                        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400"/>
                            <div>
                                <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold text-sm">
                                    Поля, требующие внимания
                                </h3>
                                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                    Рекомендуем заполнить: {missingOptionalFields.join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {showDraftRestore && (
                    <div
                        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"/>
                                <div>
                                    <h3 className="text-blue-800 dark:text-blue-200 font-semibold">
                                        Найден черновик
                                    </h3>
                                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                                        Последнее сохранение: {draftDate ? formatDate(draftDate) : 'неизвестно'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex mt-4 sm:mt-0 gap-2">
                                <button
                                    onClick={restoreDraft}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Восстановить
                                </button>
                                <button
                                    onClick={clearDraft}
                                    className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 bg-white rounded-lg shadow-md p-6">
                    <h1 className='text-2xl font-bold'>Редактирование объявления</h1>
                    <div className="border-b border-[#F0F0F0] pb-6">
                        <label className="block text-[16px] font-semibold  dark:text-gray-300 mb-2">
                            Категория <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value as Category)}
                            className={getFieldClass('category', formData.title, formData, touched, validationErrors)}
                        >
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-b border-[#F0F0F0] pb-6">
                        <label className="block text-[16px] font-semibold  dark:text-gray-300 mb-2">
                            Название <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            onBlur={() => handleBlur('title')}
                            className={getFieldClass('title', formData.title, formData, touched, validationErrors)}
                        />
                        {touched.title && validationErrors.title && (
                            <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
                        )}
                    </div>

                    <div className="border-b border-[#F0F0F0] pb-6">
                        <label className="block text-[16px] font-semibold dark:text-gray-300 mb-2">
                            Цена (₽) <span className="text-red-500">*</span>
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
                                onBlur={() => handleBlur('price')}
                                className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    touched.price && validationErrors.price
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                                min="0"
                                placeholder="150000"
                            />

                            <button
                                ref={suggestPriceRef}
                                type="button"
                                onClick={handleSuggestPrice}
                                disabled={isSuggestingPrice}
                                className="flex items-center gap-2 px-4 py-2 bg-[#F9F1E6] hover:cursor-pointer hover:bg-[#f5e8d6] text-[#FFA940] font-medium text-sm rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSuggestingPrice ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#FFA940] border-t-transparent rounded-full animate-spin" />
                                        Выполняется запрос...
                                    </>
                                ) : priceResult && aiMode === 'price' ? (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Повторить запрос
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-4 h-4" />
                                        Узнать рыночную цену
                                    </>
                                )}
                            </button>
                        </div>

                        {touched.price && validationErrors.price && (
                            <p className="mt-1 text-sm text-red-500">{validationErrors.price}</p>
                        )}
                    </div>

                    <div className="border-b border-[#F0F0F0] pb-6">
                        <h3 className="text-[16px] font-semibold dark:text-white mb-4">
                            Характеристики
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {formData.category === 'electronics' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Тип устройства</label>
                                        <input
                                            type="text"
                                            placeholder="Телефон, ТВ, ноутбук..."
                                            value={(formData.params as ElectronicsItemParams).type || ''}
                                            onChange={(e) => handleParamsChange('type', e.target.value)}
                                            className={getFieldClass('type', (formData.params as ElectronicsItemParams).type, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Бренд</label>
                                        <input
                                            type="text"
                                            placeholder="Apple, Samsung..."
                                            value={(formData.params as ElectronicsItemParams).brand || ''}
                                            onChange={(e) => handleParamsChange('brand', e.target.value)}
                                            className={getFieldClass('brand', (formData.params as ElectronicsItemParams).brand, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Модель</label>
                                        <input
                                            type="text"
                                            placeholder="iPhone 15 Pro, Galaxy S24..."
                                            value={(formData.params as ElectronicsItemParams).model || ''}
                                            onChange={(e) => handleParamsChange('model', e.target.value)}
                                            className={getFieldClass('model', (formData.params as ElectronicsItemParams).model, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Цвет</label>
                                        <input
                                            type="text"
                                            placeholder="Чёрный, Белый, Синий..."
                                            value={(formData.params as ElectronicsItemParams).color || ''}
                                            onChange={(e) => handleParamsChange('color', e.target.value)}
                                            className={getFieldClass('color', (formData.params as ElectronicsItemParams).color, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Состояние</label>
                                        <select
                                            value={(formData.params as ElectronicsItemParams).condition || ''}
                                            onChange={(e) => handleParamsChange('condition', e.target.value)}
                                            className={getFieldClass('condition', (formData.params as ElectronicsItemParams).condition, formData, touched, validationErrors)}
                                        >
                                            <option value="">Выберите состояние</option>
                                            <option value="new">Новый</option>
                                            <option value="used">Б/У</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {formData.category === 'auto' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Марка</label>
                                        <input
                                            type="text"
                                            placeholder="Toyota, BMW..."
                                            value={(formData.params as AutoItemParams).brand || ''}
                                            onChange={(e) => handleParamsChange('brand', e.target.value)}
                                            className={getFieldClass('brand', (formData.params as AutoItemParams).brand, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Модель</label>
                                        <input
                                            type="text"
                                            placeholder="Camry, X5..."
                                            value={(formData.params as AutoItemParams).model || ''}
                                            onChange={(e) => handleParamsChange('model', e.target.value)}
                                            className={getFieldClass('model', (formData.params as AutoItemParams).model, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Год выпуска</label>
                                        <input
                                            type="number"
                                            placeholder="2023"
                                            value={(formData.params as AutoItemParams).yearOfManufacture || ''}
                                            onChange={(e) => handleParamsChange('yearOfManufacture', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={getFieldClass('yearOfManufacture', (formData.params as AutoItemParams).yearOfManufacture, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Коробка
                                            передач</label>
                                        <select
                                            value={(formData.params as AutoItemParams).transmission || ''}
                                            onChange={(e) => handleParamsChange('transmission', e.target.value)}
                                            className={getFieldClass('transmission', (formData.params as AutoItemParams).transmission, formData, touched, validationErrors)}
                                        >
                                            <option value="">Выберите тип</option>
                                            <option value="automatic">Автомат</option>
                                            <option value="manual">Механика</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Пробег (км)</label>
                                        <input
                                            type="number"
                                            placeholder="45000"
                                            value={(formData.params as AutoItemParams).mileage || ''}
                                            onChange={(e) => handleParamsChange('mileage', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={getFieldClass('mileage', (formData.params as AutoItemParams).mileage, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Мощность
                                            (л.с.)</label>
                                        <input
                                            type="number"
                                            placeholder="150"
                                            value={(formData.params as AutoItemParams).enginePower || ''}
                                            onChange={(e) => handleParamsChange('enginePower', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={getFieldClass('enginePower', (formData.params as AutoItemParams).enginePower, formData, touched, validationErrors)}
                                        />
                                    </div>
                                </>
                            )}

                            {formData.category === 'real_estate' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Тип
                                            недвижимости</label>
                                        <select
                                            value={(formData.params as RealEstateItemParams).type || ''}
                                            onChange={(e) => handleParamsChange('type', e.target.value)}
                                            className={getFieldClass('type', (formData.params as RealEstateItemParams).type, formData, touched, validationErrors)}
                                        >
                                            <option value="">Выберите тип</option>
                                            <option value="flat">Квартира</option>
                                            <option value="house">Дом</option>
                                            <option value="room">Комната</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Адрес</label>
                                        <input
                                            type="text"
                                            placeholder="г. Москва, ул. Ленина, 15"
                                            value={(formData.params as RealEstateItemParams).address || ''}
                                            onChange={(e) => handleParamsChange('address', e.target.value)}
                                            className={getFieldClass('address', (formData.params as RealEstateItemParams).address, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Площадь (м²)</label>
                                        <input
                                            type="number"
                                            placeholder="65"
                                            value={(formData.params as RealEstateItemParams).area || ''}
                                            onChange={(e) => handleParamsChange('area', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={getFieldClass('area', (formData.params as RealEstateItemParams).area, formData, touched, validationErrors)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium dark:text-gray-300">Этаж</label>
                                        <input
                                            type="number"
                                            placeholder="7"
                                            value={(formData.params as RealEstateItemParams).floor || ''}
                                            onChange={(e) => handleParamsChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={getFieldClass('floor', (formData.params as RealEstateItemParams).floor, formData, touched, validationErrors)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="block text-[16px] font-semibold dark:text-gray-300 mb-2">
                            Описание
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={6}
                            maxLength={1000}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-32"
                            placeholder="Опишите ваш товар..."
                        />
                        <div className="flex justify-between mt-1">
                            <button
                                ref={improveDescriptionRef}
                                type="button"
                                onClick={handleImproveDescription}
                                disabled={isImprovingDescription}
                                className="flex items-center gap-2.5 bg-[#F9F1E6] text-[#FFA940] text-[14px] rounded-lg py-1 px-2 hover:cursor-pointer hover:bg-[#f5e8d6]"
                            >
                                {isImprovingDescription ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#FFA940] border-t-transparent rounded-full animate-spin" />
                                        Выполняется запрос...
                                    </>
                                ) : formData.description.trim().length > 0 ? (
                                    <>
                                        <Lightbulb className="w-4 h-4" />
                                        Улучшить описание
                                    </>
                                ) : (
                                    <>
                                        <Lightbulb className="w-4 h-4" />
                                        Придумать описание
                                    </>
                                )}
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formData.description.length} / 1000 символов
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending || !canSave()}
                            className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-6 py-2 bg-gray-200 dark:bg-gray-700  dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Отменить
                        </button>
                    </div>
                </form>
            </div>

            <button
                onClick={() => setShowChat(true)}
                className="fixed bottom-8 right-6 shadow-md border border-[#FFA940] bg-[#F9F1E6] text-[#FFA940] text-[14px] rounded-lg py-2 px-4 hover:cursor-pointer hover:bg-[#f5e8d6] flex items-center gap-4 text-lg"
            >
                <MessageSquare className='w-5 h-5' />
                Открыть чат с ИИ
            </button>

            <TipModalWindow
                isOpen={showDescriptionModal}
                onClose={() => setShowDescriptionModal(false)}
                onApply={() => {
                    setFormData(prev => ({ ...prev, description: descriptionResult }));
                    setShowDescriptionModal(false);
                }}
                title="Улучшенное описание"
                content={descriptionResult}
                showApplyButton={true}
                applyButtonText="Применить описание"
                anchorRef={improveDescriptionRef}
                type={modalType}
            />

            {/* Модальное окно для рыночной цены */}
            <TipModalWindow
                isOpen={showPriceModal}
                onClose={() => setShowPriceModal(false)}
                title="Рекомендация по рыночной цене"
                content={priceResult}
                showApplyButton={false}
                anchorRef={suggestPriceRef}
                type={modalType}
            />

            <AIChat
                item={item}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
            />

        </div>
    );
}