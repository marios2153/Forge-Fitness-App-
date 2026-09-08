// Example backend for the Forge AI Coach.
//
// The API key must never live in the browser. This small server sits between your app
// and the model provider, so the key stays on the machine you control.
//
// Setup:
//   npm init -y
//   npm install express cors @anthropic-ai/sdk
//   export ANTHROPIC_API_KEY=sk-ant-...
//   node coach-server-example.js
//
// Then in your app, before app.js loads, add:
//   <script>window.FORGE_COACH_ENDPOINT = 'http://localhost:8787/coach';</script>

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Very small in-memory rate limiter. Replace with a real database in production,
// because anything held in memory resets when the server restarts.
const usage = new Map();
const FREE_DAILY_LIMIT = 3;

function checkQuota(userId, premium) {
  if (premium) return true;
  const today = new Date().toDateString();
  const record = usage.get(userId);
  if (!record || record.day !== today) {
    usage.set(userId, { day: today, count: 1 });
    return true;
  }
  if (record.count >= FREE_DAILY_LIMIT) return false;
  record.count += 1;
  return true;
}

const SYSTEM_PROMPT = `You are the coaching assistant inside Forge, a gym tracking app.

Scope: you answer questions about strength training, cardio, nutrition, recovery, sleep,
supplements and exercise technique. If a question falls outside that, say briefly that you
only cover training and nutrition, and suggest what the person could ask instead.

Style: direct and practical. Give a concrete number or recommendation rather than hedging.
Two or three short paragraphs. No bullet lists unless the answer is genuinely a list.

Safety: you are not a doctor. If someone describes pain that is sharp, persistent or
joint-related, or asks about injury, medication, an eating disorder or extreme dieting,
tell them plainly to see a qualified professional and do not improvise a treatment plan.`;

app.post('/coach', async (req, res) => {
  const { question, premium, history = [], userId = 'anonymous' } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'A question is required.' });
  }

  // IMPORTANT: trust the server, not the browser. In a real app you would verify the
  // subscription against your own database or Stripe, never take `premium` from the client.
  if (!checkQuota(userId, premium)) {
    return res.status(429).json({ error: 'Daily question limit reached.' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: premium ? 900 : 350,
      system: premium
        ? `${SYSTEM_PROMPT}\n\nThis user is a Premium subscriber. Give a fuller answer: explain the reasoning, cover edge cases, and offer specific numbers they can act on immediately.`
        : `${SYSTEM_PROMPT}\n\nThis user is on the free tier. Keep the answer to one short, useful paragraph covering only the essentials.`,
      messages: [
        ...history.map((item) => ({
          role: item.role === 'coach' ? 'assistant' : 'user',
          content: item.text,
        })),
        { role: 'user', content: question },
      ],
    });

    const reply = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'The coaching service is unavailable.' });
  }
});

app.listen(8787, () => console.log('Coach server listening on http://localhost:8787'));
