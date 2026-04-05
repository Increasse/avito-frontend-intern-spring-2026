const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_CHAT_URL = 'http://localhost:11434/api/chat';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const llmApi = {
    improveDescription: async (item: any): Promise<string> => {
        const prompt = `
            Ты — AI-ассистент для улучшения описаний товаров на Avito.
            
            Категория: ${item.category}
            Название: ${item.title}
            Цена: ${item.price} ₽
            Характеристики: ${JSON.stringify(item.params, null, 2)}
            
            Текущее описание: ${item.description || 'Описание отсутствует'}
            
            Задача: Улучши это описание, сделав его более продающим, информативным и привлекательным.

            Правила:
            1. Сохрани все ключевые факты из исходного описания
            2. Добавь выгоды для покупателя (почему стоит купить именно этот товар)
            3. Сделай текст живым, но без излишнего маркетинга
            4. Используй короткие предложения, разбивай на абзацы
            5. Не добавляй характеристики, которых нет в исходном описании
            6. Максимальная длина — 100-200 символов
            7. Не используй эмодзи
            8. Не добавляй вступлений вроде "Вот улучшенное описание" — пиши сразу текст
            
            Пример улучшения:
            Было: "Ноутбук в хорошем состоянии, работает быстро"
            Стало: "Ноутбук отлично работает: быстрая загрузка, плавный запуск любых программ. Идеален для работы и учёбы. Состояние отличное — всё проверено."
            
            Напиши только улучшенное описание, без лишних комментариев
        `;

        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    model: 'llama3.2',
                    prompt: prompt,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 900,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama вернул ошибку: ${response.status}`);
            }

            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Не удалось подключиться к Ollama.';
            console.error('Ollama Error:', error);
            throw new Error(errorMessage);
        }
    },

    suggestMarketPrice: async (item: any): Promise<string> => {
        const prompt = `
            Ты — AI-ассистент для анализа рыночной стоимости товаров на Avito.
            
            Пользователь предоставил информацию о товаре:
            Категория: ${item.category}
            Название: ${item.title}
            Текущая цена продавца: ${item.price} ₽
            Характеристики: ${JSON.stringify(item.params, null, 2)}
            Описание: ${item.description || 'Нет описания'}
            
            Задача: Определить рыночную цену на этот товар.

            Формат ответа (строго соблюдай структуру):
            
            Средняя цена на {название товара}:
            {минимальная цена} – {максимальная цена} ₽ — отличное состояние.
            От {цена} ₽ — идеал, {причина для высокой цены}.
            {минимальная цена} – {максимальная цена} ₽ — срочно или с дефектами.
            
            Правила:
            1. Замени {название товара} на реальное название товара
            2. Укажи реалистичный ценовой диапазон для отличного состояния (диапазон должен быть не шире 20-30% от минимальной цены)
            3. Для идеального состояния укажи цену выше верхней границы отличного состояния
            4. Для срочной продажи/дефектов укажи цену ниже нижней границы отличного состояния
            5. Причина для высокой цены должна быть конкретной (например: "малый износ", "полная комплектация", "гарантия", "редкая модель")
            6. Все цены указывай в рублях (₽) с округлением до тысяч
            7. Используй форматирование чисел: 115 000 (с пробелом между тысячами)
            8. Не добавляй лишних комментариев, только указанный формат
            
            Пример правильного ответа:
            Средняя цена на MacBook Pro 16" M1 Pro:
            115 000 – 135 000 ₽ — отличное состояние.
            От 140 000 ₽ — идеал, малый износ АКБ.
            90 000 – 110 000 ₽ — срочно или с дефектами.
            
            Ответ должен быть ТОЛЬКО в этом формате, без дополнительного текста.
        `;

        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    model: 'llama3.2',
                    prompt: prompt,
                    stream: false,
                    temperature: 0.6,
                }),
            });

            if (!response.ok) throw new Error('Ошибка Ollama');

            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Не удалось получить рекомендацию цены от Ollama';
            console.error('Ollama Error:', error);
            throw new Error(errorMessage);
        }
    },

    chatWithUser: async (item: any, userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> => {
        // Формируем системный промпт с контекстом объявления
        const systemPrompt = `
            Ты — AI-ассистент продавца на Avito. Ты отвечаешь на вопросы о товаре.
            
            Пользователь предоставил информацию о товаре:
            Категория: ${item.category}
            Название: ${item.title}
            Текущая цена продавца: ${item.price} ₽
            Характеристики: ${JSON.stringify(item.params, null, 2)}
            Описание: ${item.description || 'Нет описания'}
            
            Правила общения:
            1. Отвечай дружелюбно и профессионально
            2. Давай конкретные, полезные советы
            3. Если спрашивают о цене — аргументируй рекомендации
            4. Если спрашивают о характеристиках — объясняй, какие лучше указать
            5. Не выдумывай характеристики, которых нет в описании
            6. Отвечай кратко и по делу (2-4 предложения)
            7. Используй русский язык
            8. Не используй эмодзи
            9. Ты — ассистент продавца, помогай ему продать товар быстрее и дороже
            
            Примеры ответов:
            - Вопрос: "Какую цену поставить?" → "Учитывая состояние и характеристики, рекомендую цену в диапазоне 115 000–135 000 ₽. Это среднерыночная цена для вашей модели."
            - Вопрос: "Что добавить в описание?" → "Добавьте информацию о состоянии батареи, комплектации и причинах продажи — это повышает доверие покупателей."
            - Вопрос: "Почему никто не пишет?" → "Возможно, цена немного завышена или не хватает ключевых характеристик. Укажите пробег (для авто) или состояние (для электроники)."
            
            Теперь ответь на вопрос пользователя, учитывая контекст объявления.
        `;

        // Формируем историю сообщений для Ollama
        const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await fetch(OLLAMA_CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.2',
                    messages: messages,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama вернул ошибку: ${response.status}`);
            }

            const data = await response.json();
            return data.message.content.trim();
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Не удалось подключиться к Ollama.';
            console.error('Ollama Chat Error:', error);
            throw new Error(errorMessage);
        }
    },
};