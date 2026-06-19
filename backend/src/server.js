const express = require('express');
const { OpenAI } = require('openai');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chatia',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id         SERIAL PRIMARY KEY,
          role       VARCHAR(20) NOT NULL,
          content    TEXT        NOT NULL,
          created_at TIMESTAMP   DEFAULT NOW()
        )
      `);
      console.log('Database ready');
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`DB not ready, retrying in 3s... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/messages', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role, content, created_at FROM messages ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensagem obrigatória' });

  try {
    await pool.query('INSERT INTO messages (role, content) VALUES ($1, $2)', ['user', message]);

    const history = await pool.query(
      'SELECT role, content FROM messages ORDER BY created_at ASC'
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente inteligente e prestativo. Responda sempre em português do Brasil.',
        },
        ...history.rows.map(r => ({ role: r.role, content: r.content })),
      ],
    });

    const reply = completion.choices[0].message.content;

    await pool.query('INSERT INTO messages (role, content) VALUES ($1, $2)', ['assistant', reply]);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages', async (_req, res) => {
  try {
    await pool.query('DELETE FROM messages');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('Failed to initialize DB:', err); process.exit(1); });
