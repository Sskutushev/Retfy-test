import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Message, User } from '@/lib/types'; 

let model: any = null;

function initializeModel() {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });
}

function constructPrompt(messages: Message[], userInfo: User): string {
    const userName = userInfo.username ? `@${userInfo.username}` : `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
    const messageCount = messages.length;
    const messageSamples = messages.map(m => `- ${m.messageText}`).join('\n');

    return `
Проанализируй стиль общения пользователя в групповом чате на основе его сообщений.

Пользователь: ${userName}
Количество сообщений для анализа: ${messageCount}

Сообщения:
${messageSamples}

Проанализируй и выдай структурированный результат:

1.  **Стиль общения**: (формальный/неформальный/дружелюбный/сдержанный/юмористический и т.д.)
2.  **Основные темы**: (Какие темы чаще всего обсуждает пользователь?)
3.  **Тональность**: (В основном позитивная, нейтральная или негативная?)
4.  **Активность**: (Насколько часто пишет? Есть ли закономерности во времени суток?)
5.  **Особенности языка**: (Использует ли эмодзи, сленг, сложные предложения, задает ли вопросы?)

Будь кратким, структурированным и объективным. Используй эмодзи для наглядности в каждом пункте. Ответ должен быть только на русском языке.
`;
}


export async function analyzeUserOnWeb(messages: Message[], userInfo: User): Promise<string> {
    // Initialize model only when needed (during runtime)
    if (!model) {
        initializeModel();
    }

    const prompt = constructPrompt(messages, userInfo);
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Error calling Gemini API from web:', error);
        if (error instanceof Error && error.message.includes('SAFETY')) {
            return "Не удалось сгенерировать анализ из-за ограничений безопасности контента.";
        }
        throw new Error('Failed to get analysis from Gemini API.');
    }
}
