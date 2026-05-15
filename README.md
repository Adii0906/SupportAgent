# SupportIQ
### Multilingual Avatar Customer Support Agent
**HeyGen Hackathon · Agent Track**

---

## The Problem

A customer in Spain gets a damaged order. They write in Spanish — angry, frustrated.
The support bot replies in English. They don't understand. They leave. Forever.

**This happens 2.5 billion times a day.** Language barriers cost businesses $50B+ annually in lost customers.

---

## What SupportIQ Does

Customer types in ANY language → AI understands → Avatar SPEAKS BACK in their language. Lip-synced. On video.

```
"¡Mi pedido llegó dañado!"  (Spanish)
        ↓
Agent detects: Spanish · Angry · Complaint
        ↓
LLaMA writes empathetic response in Spanish
        ↓
HeyGen Avatar speaks it — perfectly lip-synced
        ↓
Customer feels heard. Problem solved. In 10 seconds.
```

No human agent needed for 80% of tickets.

---

## Why It Wins

**Video is not a chatbot.** When a customer is furious, a text bubble doesn't calm them down. A human face speaking their language does. That's the entire insight.

- 🌍 Works in Spanish, Hindi, French, German, Arabic, Japanese and more
- 🎭 Real avatar. Real lipsync. Not dubbed — generated natively in their language
- ⚡ 10 seconds from complaint to video response
- 🤖 Fully autonomous — no human in the loop

---

## Real World Impact

| Who benefits | How |
|---|---|
| E-commerce brands | Stop losing non-English customers |
| Healthcare | Patients understand discharge instructions in their language |
| Banks & Fintech | Serve emerging markets without hiring multilingual staff |
| Any global business | 24/7 support in every language, zero extra headcount |

The global customer service market is **$500B**. Every company with international customers needs this.

---

## How It Works

```
React UI  →  FastAPI  →  LangGraph Agent  →  Groq LLaMA  →  HeyGen Avatar
```

**5 agent nodes, fully autonomous:**

1. **Detect** — Groq LLaMA identifies language + sentiment + intent
2. **Route** — Non-English or angry? → Avatar. Simple English? → Text
3. **Script** — Writes empathetic response in customer's native language
4. **Generate** — HeyGen Avatar V renders speaking video with lipsync
5. **Deliver** — Video streams to customer in real time

**HeyGen tools used:** Avatar V · Lipsync · Video Translate · Hyperframes · Video Agent

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Agent | LangGraph + LangChain |
| LLM | Groq LLaMA 3.3 70B |
| Avatar + Video | HeyGen API |

---

## Run It

```bash
# 1. Add your keys
cp backend/.env.example backend/.env
# → Add GROQ_API_KEY and HEYGEN_API_KEY

# 2. Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Frontend
cd frontend && npm install && npm run dev

# 4. Open http://localhost:3000
# Click 🇪🇸 ES → watch the avatar speak Spanish
```

**You need 2 keys. That's it.**
- Groq → [console.groq.com](https://console.groq.com) (free)
- HeyGen → [app.heygen.com](https://app.heygen.com) (free trial)

---

## The Demo Moment

> Click the Spanish button. Watch the agent pipeline fire live on screen.
> 10 seconds later — an avatar looks at the camera and speaks Spanish. Lip-synced. Empathetic. Perfect.
>
> **That's the moment that wins the room.**

---

Built in 24 hours · HeyGen Hackathon 2026