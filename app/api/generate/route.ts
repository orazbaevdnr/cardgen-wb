import { NextRequest, NextResponse } from 'next/server'
import { complete, aiConfigured } from '@/lib/ai'
import { rateLimit, getIp } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(getIp(req))) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите минуту.' }, { status: 429 })
    }
    const { name, category, features, audience, marketplace = 'WB' } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Введите название товара' }, { status: 400 })
    }
    if (!aiConfigured()) {
      return NextResponse.json({ error: 'Сервис не настроен (нет AI-ключа)' }, { status: 503 })
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

    const raw = await complete({ system, user, json: true, temperature: 0.8 })
    const data = JSON.parse(raw || '{}')
    return NextResponse.json(data)
  } catch (err) {
    console.error('cardgen error:', err)
    return NextResponse.json({ error: 'Ошибка генерации. Попробуйте ещё раз.' }, { status: 500 })
  }
}
