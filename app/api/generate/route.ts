import { NextRequest, NextResponse } from 'next/server'
import { getGroq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { name, category, features, audience, marketplace = 'WB' } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Введите название товара' }, { status: 400 })
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Сервис не настроен (нет GROQ_API_KEY)' }, { status: 503 })
    }

    const mp = marketplace === 'Ozon' ? 'Ozon' : 'Wildberries'
    const system = `Ты — эксперт по SEO-карточкам для маркетплейса ${mp}.
Создаёшь продающие карточки товаров, оптимизированные под поисковый алгоритм ${mp}.
Отвечай СТРОГО в формате JSON без markdown-обёртки:
{
  "title": "SEO-заголовок до 60 символов с главными ключами",
  "description": "Продающее описание 800-1500 символов с ключевыми словами, структурой и выгодами",
  "keywords": ["ключ1", "ключ2", ...20 поисковых запросов],
  "bullets": ["преимущество 1", "преимущество 2", ...5 буллетов],
  "rich": "Текст для rich-контента / инфографики, 3-4 блока"
}`

    const user = `Товар: ${name}
Категория: ${category || 'не указана'}
Характеристики: ${features || 'не указаны'}
Целевая аудитория: ${audience || 'широкая'}`

    const completion = await getGroq().chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

    const raw = completion.choices[0]?.message?.content || '{}'
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ошибка генерации' }, { status: 500 })
  }
}
