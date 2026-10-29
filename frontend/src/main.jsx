import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const blank = { name: '', category: 'CPU', manufacturer: '', price: '0', description: '' }
function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function load() {
    try { const r = await fetch('/api/items'); if (!r.ok) throw new Error('Не вдалося завантажити каталог'); setItems(await r.json()); setError('') }
    catch (e) { setError(`${e.message}. Перевір, чи запущені API та база даних.`) }
  }
  useEffect(() => { load() }, [])
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function reset() { setForm(blank); setEditing(null) }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const payload = { ...form, price: Number(form.price) }
      const r = await fetch(editing ? `/api/items/${editing}` : '/api/items', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) { const body = await r.json().catch(() => ({})); throw new Error(body.detail || 'Не вдалося зберегти запис') }
      reset(); await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  function edit(item) { setEditing(item.id); setForm({ name: item.name, category: item.category, manufacturer: item.manufacturer, price: String(item.price), description: item.description }) ; window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function remove(item) {
    if (!window.confirm(`Видалити «${item.name}»?`)) return
    try { const r = await fetch(`/api/items/${item.id}`, { method: 'DELETE' }); if (!r.ok) throw new Error('Не вдалося видалити запис'); await load() } catch (e) { setError(e.message) }
  }
  return <main className="shell">
    <header className="hero"><div className="eyebrow">PC HARDWARE · LAB 04</div><h1>Каталог комплектуючих</h1><p>Керуй компонентами ПК в одному місці. Дані зберігаються в базі даних.</p><div className="stats"><span><b>{items.length}</b> записів у каталозі</span><span><b>CRUD</b> API</span><span><b>PostgreSQL</b> database</span></div></header>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className="panel"><div className="section-head"><div><span className="eyebrow">КЕРУВАННЯ</span><h2>{editing ? 'Редагувати компонент' : 'Додати компонент'}</h2></div>{editing && <button className="secondary" onClick={reset} type="button">Скасувати</button>}</div>
      <form onSubmit={submit} className="form-grid">
        <label>Назва *<input name="name" value={form.name} onChange={change} required maxLength="120" placeholder="Наприклад, Ryzen 7 7800X3D" /></label>
        <label>Категорія *<select name="category" value={form.category} onChange={change}><option>CPU</option><option>GPU</option><option>RAM</option><option>Motherboard</option><option>Storage</option><option>Power supply</option><option>Cooling</option><option>Case</option><option>Other</option></select></label>
        <label>Виробник<input name="manufacturer" value={form.manufacturer} onChange={change} placeholder="AMD, NVIDIA, ASUS…" /></label>
        <label>Ціна, грн *<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={change} required /></label>
        <label className="wide">Опис<textarea name="description" value={form.description} onChange={change} rows="3" maxLength="2000" placeholder="Основні характеристики компонента" /></label>
        <div className="wide actions"><button disabled={busy} type="submit">{busy ? 'Збереження…' : editing ? 'Зберегти зміни' : 'Додати компонент'}</button></div>
      </form>
    </section>
    <section className="catalog"><div className="section-head"><div><span className="eyebrow">БАЗА ДАНИХ</span><h2>Компоненти</h2></div><button className="secondary" onClick={load}>Оновити список ↻</button></div>
      {items.length === 0 ? <div className="empty"><div className="empty-icon">▦</div><h3>Каталог поки порожній</h3><p>Додай перший компонент за допомогою форми вище.</p></div> : <div className="cards">{items.map(item => <article className="item-card" key={item.id}><div className="item-top"><span className="tag">{item.category}</span><span className="item-id">#{item.id}</span></div><h3>{item.name}</h3><p className="manufacturer">{item.manufacturer || 'Виробник не вказаний'}</p><p className="description">{item.description || 'Опис відсутній.'}</p><div className="item-bottom"><strong>{Number(item.price).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴</strong><div className="item-actions"><button className="secondary" onClick={() => edit(item)}>Редагувати</button><button className="danger" onClick={() => remove(item)}>Видалити</button></div></div></article>)}</div>}
    </section><footer>Лабораторна робота №4 · Kubernetes + Helm + GitHub Actions</footer>
  </main>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
