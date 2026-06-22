'use client'
import { useState, useEffect } from 'react'
import { remaining, canUse, recordUse, FREE_LIMIT } from '@/lib/freemium'

const UPGRADE_URL = process.env.NEXT_PUBLIC_STRIPE_URL || '#'

interface Card {
  title: string
  description: string
  keywords: string[]
  bullets: string[]
  rich: string
}

export default function Home() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [features, setFeatures] = useState('')
  const [audience, setAudience] = useState('')
  const [marketplace, setMarketplace] = useState('WB')
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => { setLeft(remaining()) }, [])

  async function run() {
    if (!name.trim()) return
    if (!canUse()) { setError('limit'); return }
    setLoading(true); setError(''); setCard(null)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, features, audience, marketplace }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Ошибка'); setLoading(false); return }
    recordUse(); setLeft(remaining()); setCard(data); setLoading(false)
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2"><span className="text-2xl">🛒</span><span className="font-bold text-xl">CardGen WB</span></div>
        {left !== null && <span className="text-zinc-400 text-sm">Осталось: <span className="text-fuchsia-400 font-semibold">{left}</span>/{FREE_LIMIT}</span>}
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Карточки товаров<br /><span className="text-fuchsia-400">за секунды</span></h1>
        <p className="text-zinc-400 text-lg">SEO-заголовок, описание и ключевые слова под алгоритмы Wildberries и Ozon.</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20 space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex gap-2">
            {['WB', 'Ozon'].map(m => (
              <button key={m} onClick={() => setMarketplace(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${marketplace === m ? 'bg-fuchsia-600 border-fuchsia-500' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                {m === 'WB' ? 'Wildberries' : 'Ozon'}
              </button>
            ))}
          </div>
          <input className={inputCls} placeholder="Название товара *" value={name} onChange={e => setName(e.target.value)} />
          <input className={inputCls} placeholder="Категория (напр. Женская одежда)" value={category} onChange={e => setCategory(e.target.value)} />
          <textarea className={inputCls + ' resize-none'} rows={3} placeholder="Характеристики (материал, размеры, цвет...)" value={features} onChange={e => setFeatures(e.target.value)} />
          <input className={inputCls} placeholder="Целевая аудитория (опционально)" value={audience} onChange={e => setAudience(e.target.value)} />
          <button onClick={run} disabled={loading || !name.trim()}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">⟳</span> Генерирую...</> : 'Создать карточку →'}
          </button>
          {error === 'limit' ? (
            <div className="bg-zinc-800 rounded-xl p-5 text-center">
              <p className="font-semibold mb-2">Лимит исчерпан</p>
              <p className="text-zinc-400 text-sm mb-4">Безлимит — 990₽/мес</p>
              <a href={UPGRADE_URL} className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 font-semibold px-6 py-3 rounded-xl">Перейти на Pro →</a>
            </div>
          ) : error ? <p className="text-red-400 text-sm">{error}</p> : null}
        </div>

        {card && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <Field label="Заголовок" value={card.title} />
            <Field label="Описание" value={card.description} multiline />
            <div>
              <Label>Ключевые слова</Label>
              <div className="flex flex-wrap gap-2">
                {card.keywords?.map((k, i) => <span key={i} className="bg-zinc-800 text-zinc-300 text-sm px-3 py-1 rounded-full">{k}</span>)}
              </div>
            </div>
            <div>
              <Label>Преимущества</Label>
              <ul className="space-y-1">{card.bullets?.map((b, i) => <li key={i} className="text-zinc-300 text-sm flex gap-2"><span className="text-fuchsia-400">✓</span>{b}</li>)}</ul>
            </div>
            <Field label="Rich-контент" value={card.rich} multiline />
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-400 text-sm mb-2">{children}</p>
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <Label>{label}</Label>
        <button onClick={() => navigator.clipboard.writeText(value)} className="text-fuchsia-400 text-sm hover:text-fuchsia-300">Копировать</button>
      </div>
      <p className={`text-zinc-200 text-sm bg-zinc-800 rounded-xl p-3 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>{value}</p>
    </div>
  )
}
