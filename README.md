# shop-sessions

Учебный интернет-магазин на Node.js и Express с сессиями (express-session).
Проект для практической работы «Организация работы в команде разработчиков».

## Возможности

- счётчик посещений в сессии;
- каталог товаров и корзина (добавление, изменение количества, удаление);
- вход и выход, защищённые страницы `/profile` и `/dashboard`;
- роли пользователей: админ-панель `/admin` только для администратора;
- таймер времени жизни сессии;
- хранение сессий в файлах (session-file-store).

## Запуск

Нужен Node.js 20 или новее.

```bash
git clone https://github.com/atomaii/shop-sessions.git
cd shop-sessions
npm install
npm start
```

Сайт откроется по адресу http://localhost:3000

Тестовые пользователи:

| Логин | Пароль | Роль  |
|-------|--------|-------|
| admin | admin  | admin |
| user  | user   | user  |

## Проверка кода

```bash
npm run lint   # проверка ESLint
npm test       # автотесты (node:test)
```

Те же проверки автоматически запускаются в GitHub Actions при каждом push и Pull Request
в ветки `main` и `develop` (файл `.github/workflows/ci.yml`).

## Работа с ветками (упрощённый Git Flow)

| Ветка       | Назначение                | Кто создаёт   | Кто сливает |
|-------------|---------------------------|---------------|-------------|
| `main`      | релизная версия           | Team Lead     | Team Lead   |
| `develop`   | ветка разработки          | Team Lead     | Team Lead   |
| `feature/*` | новая функциональность    | разработчик   | Team Lead после ревью |
| `release/*` | подготовка релиза         | Team Lead     | Team Lead   |
| `hotfix/*`  | срочное исправление       | разработчик   | Team Lead   |

1. Создайте ветку от `develop`: `git checkout -b feature/название`.
2. Сделайте изменения, проверьте `npm run lint` и `npm test`.
3. Отправьте ветку: `git push -u origin feature/название`.
4. Откройте Pull Request в `develop`, заполните описание и чек-лист.
5. После ревью и зелёного CI ветка сливается, затем удаляется.

Прямые коммиты в `main` запрещены — только через Pull Request.

## Структура проекта

```
app.js              сервер и маршруты
views/              шаблоны Handlebars
public/             статика (css)
test/               автотесты
.github/workflows/  CI (GitHub Actions)
```

## Команда

| Роль                      | Участник |
|---------------------------|----------|
| Project Manager           | Качалов С. |
| Team Lead / Архитектор    | Качалов С. |
| Разработчик (Backend/Frontend) | Качалов С. |
| QA Engineer               | Качалов С. |
