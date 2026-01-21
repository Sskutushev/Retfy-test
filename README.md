# Telegram Chat Analytics Bot

Telegram-бот для сбора и анализа статистики групповых чатов с веб-интерфейсом. Использует Google Gemini API для анализа стиля общения пользователей.

## Быстрый старт

### Требования

- Docker и Docker Compose
- Telegram Bot Token ([@BotFather](https://t.me/BotFather))
- Google Gemini API Key ([AI Studio](https://aistudio.google.com/app/apikey))

### Установка

```bash
git clone <repository-url>
cd telegram-analytics-bot
cp .env.example .env
# Отредактировать .env и добавить токены
docker-compose up --build
```

**Важно:** Отключите Privacy Mode у бота через @BotFather, чтобы он видел все сообщения.

Веб-интерфейс: http://localhost:3000

## Архитектура

### Стек

**Backend:**
- Node.js 20 + TypeScript 5
- Telegraf 4
- PostgreSQL 15
- Redis 7
- Google Generative AI SDK

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3

### Структура

```
telegram-analytics-bot/
├── bot/
│   ├── src/
│   │   ├── models/          # Repository pattern
│   │   ├── services/        # Бизнес-логика
│   │   ├── handlers/        # Обработчики
│   │   ├── database/        # БД
│   │   └── types/           # TypeScript типы
│   └── Dockerfile
├── web/
│   ├── src/
│   │   ├── app/             # Pages & API routes
│   │   ├── components/      # React компоненты
│   │   └── lib/             # Утилиты
│   └── Dockerfile
└── docker-compose.yml
```

### База данных

```sql
users (id, telegram_id, username, first_name, last_name, created_at)
messages (id, user_id, chat_id, message_text, message_date, created_at)

-- Индексы
idx_messages_user_date ON messages(user_id, message_date)
idx_messages_chat_date ON messages(chat_id, message_date)
```

## Функционал

### Команды бота

- `/start` - Приветствие
- `/stats` - Статистика чата (топ-10, фильтры по периодам)
- `/analyze @username` - AI-анализ стиля общения
- `/wordcloud` - Облако популярных слов

### Возможности

**Статистика:**
- Топ-10 активных пользователей
- Фильтры: сегодня/неделя/месяц/всё время
- Личная статистика
- Кэширование (TTL: 20 минут)

**AI-анализ:**
- Стиль общения (формальный/неформальный)
- Основные темы
- Тональность (позитивная/негативная/нейтральная)
- Паттерны активности
- Особенности языка

**Word Cloud:**
- Топ-20 популярных слов
- Фильтрация стоп-слов (40+ RU/EN)
- Исключение ссылок, упоминаний, хештегов

## Архитектурные решения

### Repository Pattern
SQL-запросы инкапсулированы в моделях `UserModel` и `MessageModel`. Разделение бизнес-логики и данных, упрощение тестирования.

### Кэширование Redis
Ключи вида `stats:${chatId}:${period}`. Настраиваемый TTL через конфиг. Singleton для CacheService.

### TypeScript Strict Mode
Полная типизация. Интерфейсы для всех моделей. Generic типы для кэша.

### Fallback логика
`/analyze` пытается получить данные из Telegram API если их нет в БД.

## Использование AI

### Инструменты

- Claude 3.5 Sonnet (Claude.ai)
- Cursor (Composer mode)
- GitHub Copilot

### Эффективность по задачам

**1. Инфраструктура (95% AI)**

Генерация: docker-compose.yml, Dockerfile, SQL-схема, env конфигурация

Промпт:
```
Создай docker-compose.yml с PostgreSQL 15, Redis 7, bot и web сервисами.
Bot зависит от postgres и redis. Добавь volumes для персистентности.
Используй env_file для конфигурации.
```

Результат: 15 минут вместо 45 минут  
Доработка: Оптимизация Dockerfile для production

**2. SQL-запросы (90% AI)**

Генерация: агрегации (COUNT, AVG, GROUP BY, JOIN), параметризация, индексы

Промпт:
```
Напиши SQL для топ-10 пользователей по количеству сообщений.
JOIN users и messages, GROUP BY user_id, фильтр по дате, ORDER BY DESC.
Используй параметры $1 и $2.
```

Результат: 20 минут вместо 60 минут  
Доработка: Обработка NULL values

**3. Unit-тесты (100% AI)**

Генерация: Vitest конфиг, моки для PostgreSQL/Redis, 14 тестов

Промпт:
```
Напиши unit-тесты на Vitest для StatsService.
Мокай pg Pool. Тестируй getTopUsers, getUserStats, getChatStats.
Проверь корректность параметров моков.
```

Результат: 15 минут вместо 35 минут  
Доработка: Не требовалась

**4. WordCloud сервис (75% AI)**

Генерация: парсинг текста, фильтрация стоп-слов, подсчёт частоты

Результат: 35 минут вместо 90 минут  
Доработка: Расширение списка стоп-слов с 20 до 40+, фильтрация хештегов

**5. React компоненты (70% AI)**

Генерация: AnalyzeForm с состояниями, Skeleton loader, Tailwind стили

Результат: 30 минут вместо 80 минут  
Доработка: Детальные сообщения об ошибках

### Ручная доработка

1. Русская локализация - AI генерировал английские тексты
2. Склонение числительных - функция `getMessagesNoun()` требовала знания русской грамматики
3. Fallback логика - попытка получения пользователя из Telegram API
4. Error handling - расширенная обработка для UX

### Итоговая оценка

| Метрика | Значение |
|---------|----------|
| Без AI | 20-25 часов |
| С AI | 5-6 часов |
| Экономия | 75-80% |

**Распределение времени с AI:**
- Генерация: 40%
- Доработка: 30%
- Тестирование: 15%
- Документация: 10%
- Настройка: 5%

### Выводы

AI эффективен для: boilerplate код, SQL-запросы, unit-тесты, Docker конфигурация

Требует ручной работы: локализация, UX-улучшения, edge cases, production оптимизация

Ускорение разработки в 4-5 раз. Финальные 20-30% требуют экспертизы разработчика.

## Тестирование

```bash
cd bot
npm install
npm test
```

Покрытие: MessageModel (3), StatsService (4), CacheService (5), WordCloudService (2)

Всего: 14 unit-тестов

## Отладка

### Логи

```bash
docker-compose logs -f           # Все сервисы
docker-compose logs -f bot       # Только бот
docker-compose logs -f web       # Только web
```

### PostgreSQL

```bash
docker exec -it <postgres_container_id> psql -U postgres -d telegram_analytics
\dt                              # Список таблиц
SELECT COUNT(*) FROM messages;   # Проверка данных
```

### Redis

```bash
docker exec -it <redis_container_id> redis-cli
KEYS *                           # Все ключи
GET "stats:12345:week"          # Получить значение
```

## Дополнительная фича: Word Cloud

**Идея:** Визуализация часто используемых слов для быстрого понимания тем обсуждения.

**Реализация:**
- WordCloudService анализирует тексты
- Фильтрация 40+ стоп-слов (RU/EN)
- Исключение упоминаний, ссылок, хештегов
- Периоды: сегодня/неделя/месяц/всё время
- Кэширование результатов

**Использование:** `/wordcloud` в боте, выбор периода через inline-кнопки

**Зачем:** Быстрое определение популярных тем без чтения всех сообщений. Полезно для модераторов и участников.

## Переменные окружения

```env
TELEGRAM_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_key
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=telegram_analytics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_HOST=redis
REDIS_PORT=6379
CACHE_TTL=1200
```

