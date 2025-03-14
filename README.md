# Реєстрація слухачів на навчання

Система реєстрації слухачів на навчання з адміністративною панеллю для управління групами.

## Функціональність

### Для адміністраторів:
- Вхід в адміністративну панель
- Додавання нових груп
- Видалення існуючих груп

### Для слухачів:
- Реєстрація на навчання
- Вибір доступних груп
- Валідація даних форми

## Технології

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Зберігання даних: Google Sheets API

## Встановлення та запуск

1. Клонуйте репозиторій:
```
git clone https://github.com/your-username/new_students_reg.git
```

2. Встановіть залежності:
```
npm install
```

3. Створіть файл `.env` з наступними змінними:
```
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_APP_SCRIPT_ID=your_google_app_script_id
```

4. Запустіть сервер:
```
node server.js
```

5. Відкрийте в браузері:
- Форма реєстрації: http://localhost:3001/index.html
- Адмін-панель: http://localhost:3001/admin.html

## Ліцензія

MIT
