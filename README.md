# ZKClear Frontend

ZKClear Frontend — institutional UI for creating, signing, and managing OTC settlements with zero-knowledge guarantees.

## Технологический стек

- **Next.js 14** - React framework с App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Ethers.js** - Web3 integration
- **Axios** - HTTP client для API

## Установка

```bash
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3001` (Next.js по умолчанию использует порт 3000, но API уже на 3000, поэтому можно изменить в `package.json`)

## Сборка

```bash
npm run build
npm start
```

## Структура проекта (Next.js App Router)

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── deposits/          # Deposits page
│   ├── deals/             # Deals pages
│   │   └── [dealId]/     # Dynamic deal details
│   ├── withdrawals/       # Withdrawals page
│   └── account/           # Account page
├── components/            # React компоненты
│   ├── wallet/           # Компоненты для работы с кошельком
│   └── Layout.tsx        # Основной layout
├── services/              # API клиенты (будут добавлены)
├── types/                 # TypeScript типы
└── utils/                 # Утилиты (будут добавлены)
```

## API Integration

Frontend подключается к ZKClear API через rewrites в `next.config.js`:
- `/api/*` → `http://localhost:3000/api/*`
- `/jsonrpc` → `http://localhost:3000/jsonrpc`

Убедитесь, что ZKClear API сервис запущен на порту 3000.

## Следующие шаги

1. ✅ Базовая структура проекта (Next.js + TypeScript)
2. ✅ App Router и Layout
3. ✅ Компонент подключения кошелька
4. ⏳ Интеграция с API
5. ⏳ Страница депозитов
6. ⏳ Страница сделок
7. ⏳ Страница выводов

## Лицензия

MIT
