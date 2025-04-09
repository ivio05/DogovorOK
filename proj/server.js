const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config(); // Подключаем .env файл

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.')); // отдача html/css/js

// Создаем пул соединений с базой данных
const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE, // тут должно быть analytics
});


// Проверка соединения
pool.connect()
    .then(() => console.log('Подключено к базе данных PostgreSQL'))
    .catch(err => console.error('Ошибка подключения к базе:', err));

console.log('Подключение к базе:', process.env.PGDATABASE);

// Прием событий
app.post('/track', async (req, res) => {
    const { event, data, timestamp, userAgent, page, referrer } = req.body;

    try {
        const result = await pool.query('SELECT current_database(), current_user, inet_server_port()');
        console.log('Node подключен к базе:', result.rows[0]);

        await pool.query(
            `INSERT INTO public.events (event_type, data, timestamp, user_agent, page, referrer, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [event, data, timestamp, userAgent, page, referrer, Date.now()]
        );

        console.log('Событие сохранено в базу:', event);
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('Ошибка сохранения события:', err);
        res.status(500).json({ status: 'error', message: 'Ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
