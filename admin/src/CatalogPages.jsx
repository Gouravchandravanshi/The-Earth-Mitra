import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ImagePlus, LoaderCircle } from 'lucide-react'
import { Btn, Card, Head, Loading, Modal } from './ui.jsx'
import { useListQuery, useSendMutation } from './store.js'

const config = {
  products: { title: 'Products', path: '/products/admin?page=1&limit=100', key: 'products', singular: 'product' },
  collections: { title: 'Collections', path: '/collections/admin', key: 'collections', singular: 'collection' },
  blogs: { title: 'Blogs', path: '/blogs/admin', key: 'posts', singular: 'blog' },
  recipes: { title: 'Recipes', path: '/recipes/admin', key: 'posts', singular: 'recipe' },
  banners: { title: 'Homepage banners', path: '/banners/admin', key: 'banners', singular: 'banner' },
}
const blank = kind => kind === 'products'
  ? { name: '', description: '', category: '', sku: '', mrp: '', price: '', discountPrice: '', stock: 0, origin: '', packContains: '', suitableUses: '', certifications: '', eco_certified: false, allergenInfo: { status: 'unknown', allergens: [], warnings: [] }, storage: { instructions: '', minTemperatureC: '', maxTemperatureC: '' }, faqs: [{ question: '', answer: '' }] }
  : kind === 'collections'
    ? { name: '', description: '', image: '', products: [], isActive: true, sortOrder: 0 }
    : ['blogs', 'recipes'].includes(kind)
      ? { title: '', excerpt: '', content: '', coverImage: '', category: '', author: '', readTime: 5, tags: '', isPublished: false }
      : { title: '', altText: '', desktopImage: '', mobileImage: '', link: '', placement: 'hero', sortOrder: 0, isActive: true }

function Input({ label, name, value, onChange, type = 'text', required = false, ...props }) {
  const cls = 'w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-forest-600'
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
    {type === 'textarea' ? <textarea className={cls} rows={name === 'content' ? 9 : 3} name={name} value={value ?? ''} onChange={onChange} required={required} />
      : type === 'checkbox' ? <input className="size-4 accent-[#1e6e53]" type="checkbox" name={name} checked={Boolean(value)} onChange={onChange} />
        : type === 'file' ? <input className={cls} type="file" name={name} onChange={onChange} {...props} />
          : <input className={cls} type={type} name={name} value={value ?? ''} onChange={onChange} required={required} {...props} />}
  </label>
}

function RecordForm({ kind, initial, products, categories, onSave, busy, message, onCancel }) {
  const [form, setForm] = useState(() => {
    const value = { ...blank(kind), ...(initial || {}) }
    if (kind === 'products') {
      value.packContains = (initial?.packContains || []).join(', ')
      value.suitableUses = (initial?.suitableUses || []).join(', ')
      value.certifications = (initial?.certifications || []).join(', ')
      value.allergenInfo = { ...blank(kind).allergenInfo, ...(initial?.allergenInfo || {}), allergens: (initial?.allergenInfo?.allergens || []).join(', '), warnings: (initial?.allergenInfo?.warnings || []).join(', ') }
      value.storage = { ...blank(kind).storage, ...(initial?.storage || {}) }
      value.faqs = initial?.faqs?.length ? initial.faqs.map(faq => ({ ...faq })) : [{ question: '', answer: '' }]
    }
    return value
  })
  const [previews, setPreviews] = useState({})
  const change = event => {
    const { name, value, checked, type } = event.target
    setForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }
  const file = key => event => {
    const selected = event.target.files?.[0]
    if (!selected) return
    setPreviews(current => ({ ...current, [key]: URL.createObjectURL(selected) }))
    setForm(current => ({ ...current, [`${key}File`]: selected }))
  }
  const productImages = initial?.gallery?.length ? initial.gallery : initial?.images || []
  const selectedProducts = Array.isArray(form.products) ? form.products.map(p => typeof p === 'object' ? p._id : p) : []
  return <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
    {kind === 'products' && <>
      <Input label="Product name" name="name" value={form.name} onChange={change} required />
      <Input label="Description" name="description" value={form.description} onChange={change} type="textarea" required />
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Category</span><select className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink" name="category" value={form.category?._id || form.category || ''} onChange={change} required><option value="">Select category</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
        <Input label="SKU" name="sku" value={form.sku} onChange={change} />
        <Input label="Stock" name="stock" value={form.stock} onChange={change} type="number" min="0" required />
        <Input label="MRP (₹)" name="mrp" value={form.mrp} onChange={change} type="number" min="0" step="0.01" required />
        <Input label="Overall price (₹)" name="price" value={form.price} onChange={change} type="number" min="0" step="0.01" required />
        <Input label="Discounted price (₹)" name="discountPrice" value={form.discountPrice} onChange={change} type="number" min="0" step="0.01" />
        <Input label="Origin" name="origin" value={form.origin} onChange={change} />
        <Input label="Certifications (comma separated)" name="certifications" value={Array.isArray(form.certifications) ? form.certifications.join(', ') : form.certifications} onChange={change} />
        <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="eco_certified" checked={Boolean(form.eco_certified)} onChange={change} className="accent-[#1e6e53]" />Eco certified</label>
      </div>
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-ink">Product details</h3>
        <p className="text-xs text-mute">Packed measurements are required for courier availability before checkout. Include packaging.</p>
        <div className="grid grid-cols-2 gap-3">{[['weightKg', 'Packed weight (kg)'], ['lengthCm', 'Length (cm)'], ['breadthCm', 'Breadth (cm)'], ['heightCm', 'Height (cm)']].map(([key, label]) => <Input key={key} label={label} name={key} type="number" min="0.001" step="0.001" value={form.shippingParcel?.[key]} onChange={e => setForm(current => ({ ...current, shippingParcel: { ...current.shippingParcel, [key]: e.target.value } }))} />)}</div>
        <Input label="Pack contains (comma separated)" name="packContains" value={form.packContains} onChange={change} />
        <Input label="Ideal for making (comma separated)" name="suitableUses" value={form.suitableUses} onChange={change} />
      </div>
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-ink">Allergen information</h3>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Status</span><select name="allergenStatus" value={form.allergenInfo.status || 'unknown'} onChange={e => setForm(current => ({ ...current, allergenInfo: { ...current.allergenInfo, status: e.target.value } }))} className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink"><option value="unknown">Not specified</option><option value="contains">Contains allergens</option><option value="none_confirmed">No known allergens</option></select></label>
        <Input label="Allergens (comma separated)" name="allergens" value={form.allergenInfo.allergens} onChange={e => setForm(current => ({ ...current, allergenInfo: { ...current.allergenInfo, allergens: e.target.value } }))} />
        <Input label="Allergen warnings (comma separated)" name="allergenWarnings" value={form.allergenInfo.warnings} onChange={e => setForm(current => ({ ...current, allergenInfo: { ...current.allergenInfo, warnings: e.target.value } }))} />
      </div>
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-sm font-semibold text-ink">Storage conditions</h3>
        <Input label="Instructions" name="storageInstructions" value={form.storage.instructions} onChange={e => setForm(current => ({ ...current, storage: { ...current.storage, instructions: e.target.value } }))} type="textarea" />
        <div className="grid grid-cols-2 gap-3"><Input label="Minimum temperature (°C)" name="minTemperatureC" value={form.storage.minTemperatureC ?? ''} onChange={e => setForm(current => ({ ...current, storage: { ...current.storage, minTemperatureC: e.target.value } }))} type="number" min="-100" max="100" /><Input label="Maximum temperature (°C)" name="maxTemperatureC" value={form.storage.maxTemperatureC ?? ''} onChange={e => setForm(current => ({ ...current, storage: { ...current.storage, maxTemperatureC: e.target.value } }))} type="number" min="-100" max="100" /></div>
      </div>
      <div className="space-y-3 rounded-lg border border-line p-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">Frequently asked questions</h3><Btn type="button" v="ghost" className="h-8 px-2" onClick={() => setForm(current => ({ ...current, faqs: [...current.faqs, { question: '', answer: '' }] }))}><Plus size={14} />Add FAQ</Btn></div>
        {form.faqs.map((faq, index) => <div key={index} className="space-y-2 rounded-lg bg-bg p-3">
          <Input label={`Question ${index + 1}`} value={faq.question} onChange={e => setForm(current => ({ ...current, faqs: current.faqs.map((row, rowIndex) => rowIndex === index ? { ...row, question: e.target.value } : row) }))} />
          <Input label="Answer" value={faq.answer} onChange={e => setForm(current => ({ ...current, faqs: current.faqs.map((row, rowIndex) => rowIndex === index ? { ...row, answer: e.target.value } : row) }))} type="textarea" />
          {form.faqs.length > 1 && <button type="button" onClick={() => setForm(current => ({ ...current, faqs: current.faqs.filter((_, rowIndex) => rowIndex !== index) }))} className="text-xs font-medium text-red-700">Remove FAQ</button>}
        </div>)}
      </div>
      <Input label="Add product images (up to 5)" name="productFiles" type="file" accept="image/*" multiple onChange={e => { const files = [...e.target.files]; setForm(current => ({ ...current, productFiles: files })); setPreviews(Object.fromEntries(files.slice(0, 5).map((f, i) => [i, URL.createObjectURL(f)]))) }} />
      {(Object.values(previews).length > 0 || productImages.length > 0) && <div className="flex flex-wrap gap-2">{productImages.map((image, i) => <img key={image.public_id || image.url || i} src={image.url || image} alt="Product" className="size-16 rounded-lg border object-cover" />)}{Object.values(previews).map((src, i) => <img key={src} src={src} alt="Selected product upload" className="size-16 rounded-lg border object-cover" />)}</div>}
    </>}
    {kind === 'collections' && <>
      <Input label="Collection name" name="name" value={form.name} onChange={change} required />
      <Input label="Description" name="description" value={form.description} onChange={change} type="textarea" />
      <Input label="Upload collection image" name="imageFile" type="file" accept="image/*" onChange={file('image')} />
      {(previews.image || form.image) && <img src={previews.image || form.image} className="h-32 w-full rounded-lg object-cover" alt="Collection image preview" />}
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Products in collection</span><select multiple className="h-40 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink" value={selectedProducts} onChange={e => setForm(current => ({ ...current, products: [...e.target.selectedOptions].map(o => o.value) }))}>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select><small className="text-mute">Use Ctrl or Cmd to select multiple products.</small></label>
      <div className="grid grid-cols-2 gap-3"><Input label="Sort order" name="sortOrder" value={form.sortOrder} onChange={change} type="number" min="0" /><label className="flex items-end gap-2 pb-2 text-sm text-ink"><input type="checkbox" name="isActive" checked={Boolean(form.isActive)} onChange={change} className="accent-[#1e6e53]" />Published</label></div>
    </>}
    {['blogs', 'recipes'].includes(kind) && <>
      <Input label="Title" name="title" value={form.title} onChange={change} required />
      <Input label="Short summary" name="excerpt" value={form.excerpt} onChange={change} type="textarea" required />
      <Input label="Article content" name="content" value={form.content} onChange={change} type="textarea" required />
      <Input label="Upload cover image" name="coverImageFile" type="file" accept="image/*" onChange={file('coverImage')} />
      {(previews.coverImage || form.coverImage) && <img src={previews.coverImage || form.coverImage} className="h-32 w-full rounded-lg object-cover" alt="Cover image preview" />}
      <div className="grid grid-cols-2 gap-3"><Input label="Category" name="category" value={form.category} onChange={change} /><Input label="Author" name="author" value={form.author} onChange={change} /><Input label="Read time (minutes)" name="readTime" value={form.readTime} onChange={change} type="number" min="1" max="240" /><Input label="Tags (comma separated)" name="tags" value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={change} /></div>
      <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="isPublished" checked={Boolean(form.isPublished)} onChange={change} className="accent-[#1e6e53]" />Published</label>
    </>}
    {kind === 'banners' && <>
      <Input label="Banner title" name="title" value={form.title} onChange={change} required />
      <Input label="Alt text" name="altText" value={form.altText} onChange={change} />
      {['desktopImage', 'mobileImage'].map((key, i) => <div key={key} className="space-y-2"><Input label={i === 0 ? 'Desktop banner image URL' : 'Mobile banner image URL'} name={key} value={form[key]} onChange={change} type="url" required={!form[key] && !previews[key]} />{(previews[key] || form[key]) && <img src={previews[key] || form[key]} className="max-h-36 w-full rounded-lg border object-cover" alt={`${key} preview`} />}<Input label={`Upload ${i === 0 ? 'desktop' : 'mobile'} image`} name={`${key}File`} type="file" accept="image/*" onChange={file(key)} /></div>)}
      <Input label="Link" name="link" value={form.link} onChange={change} />
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Placement</span><select className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink" name="placement" value={form.placement} onChange={change}><option value="hero">Homepage carousel</option><option value="midpage">Mid page</option><option value="promo">Promo</option></select></label>
      <div className="grid grid-cols-2 gap-3"><Input label="Sort order" name="sortOrder" value={form.sortOrder} onChange={change} type="number" min="0" /><label className="flex items-end gap-2 pb-2 text-sm text-ink"><input type="checkbox" name="isActive" checked={Boolean(form.isActive)} onChange={change} className="accent-[#1e6e53]" />Active</label></div>
    </>}
    {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
    <div className="flex justify-end gap-2 pt-2"><Btn type="button" v="ghost" onClick={onCancel}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16} />}{busy ? 'Saving…' : 'Save'}</Btn></div>
  </form>
}

export function ManagedCatalog({ kind }) {
  const cfg = config[kind], navigate = useNavigate()
  const { data, isLoading, isFetching, error, refetch } = useListQuery(cfg.path)
  const { data: categoryData, isLoading: categoriesLoading } = useListQuery('/categories', { skip: kind !== 'products' })
  const { data: productData, isLoading: productsLoading } = useListQuery('/products/admin?page=1&limit=100', { skip: kind !== 'collections' })
  const records = data?.[cfg.key] || []
  const products = productData?.products || []
  const categories = Array.isArray(categoryData) ? categoryData : categoryData?.categories || []
  const [send, { isLoading: busy }] = useSendMutation()
  const [selected, setSelected] = useState(null), [open, setOpen] = useState(false), [message, setMessage] = useState('')
  const isCreate = selected === 'new'
  const formRecord = selected && selected !== 'new' ? selected : null
  const openNew = () => { setSelected('new'); setMessage(''); setOpen(true) }
  const openEdit = record => { setSelected(record); setMessage(''); setOpen(true) }
  const save = async value => {
    setMessage('')
    try {
      let body
      if (kind === 'products') {
        const list = value => (Array.isArray(value) ? value : String(value || '').split(',')).map(item => String(item).trim()).filter(Boolean)
        const faqs = value.faqs.filter(faq => faq.question.trim() || faq.answer.trim())
        if (faqs.some(faq => !faq.question.trim() || !faq.answer.trim())) throw new Error('Complete both the question and answer for each FAQ.')
        body = {
          name: value.name.trim(), description: value.description.trim(), category: value.category?._id || value.category,
          sku: value.sku.trim() || undefined, mrp: Number(value.mrp), price: Number(value.price), discountPrice: Number(value.discountPrice || 0), stock: Number(value.stock || 0),
          origin: value.origin.trim(), eco_certified: Boolean(value.eco_certified),
          packContains: list(value.packContains), suitableUses: list(value.suitableUses), certifications: list(value.certifications), faqs,
          ...(Object.values(value.shippingParcel || {}).some(v => v !== '' && v != null) ? { shippingParcel: Object.fromEntries(['weightKg', 'lengthCm', 'breadthCm', 'heightCm'].map(key => [key, Number(value.shippingParcel?.[key])])) } : {}),
          allergenInfo: { status: value.allergenInfo.status, allergens: list(value.allergenInfo.allergens), warnings: list(value.allergenInfo.warnings) },
          storage: { instructions: value.storage.instructions || '', minTemperatureC: value.storage.minTemperatureC === '' ? null : Number(value.storage.minTemperatureC), maxTemperatureC: value.storage.maxTemperatureC === '' ? null : Number(value.storage.maxTemperatureC) },
        }
      }
      else if (kind === 'collections') body = { name: value.name.trim(), description: value.description, image: value.image, products: value.products.map(p => typeof p === 'object' ? p._id : p), isActive: Boolean(value.isActive), sortOrder: Number(value.sortOrder || 0) }
      else if (['blogs', 'recipes'].includes(kind)) body = { title: value.title.trim(), excerpt: value.excerpt.trim(), content: value.content.trim(), coverImage: value.coverImage, category: value.category, author: (value.author || 'Earth Mitra').trim(), readTime: Number(value.readTime || 5), tags: (Array.isArray(value.tags) ? value.tags.join(',') : value.tags).split(',').map(x => x.trim()).filter(Boolean), isPublished: Boolean(value.isPublished) }
      else body = { title: value.title.trim(), altText: value.altText, desktopImage: value.desktopImage, mobileImage: value.mobileImage, link: value.link, placement: value.placement, sortOrder: Number(value.sortOrder || 0), isActive: Boolean(value.isActive) }
      if (kind === 'products' && value.productFiles?.length > 5) throw new Error('Upload a maximum of 5 product images at a time.')
      const uploadOne = async file => {
        if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
        if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.')
        const fd = new FormData(); fd.append('images', file)
        const uploaded = await send({ url: '/uploads/images', body: fd }).unwrap()
        const url = uploaded.images?.[0]?.url
        if (!url) throw new Error('Image upload did not return a hosted image URL.')
        return url
      }
      if (kind === 'collections' && value.imageFile) body.image = await uploadOne(value.imageFile)
      if (['blogs', 'recipes'].includes(kind) && value.coverImageFile) body.coverImage = await uploadOne(value.coverImageFile)
      if (kind === 'banners') {
        for (const key of ['desktopImage', 'mobileImage']) if (value[`${key}File`]) body[key] = await uploadOne(value[`${key}File`])
      }
      const base = kind === 'products' ? '/products' : kind === 'collections' ? '/collections' : kind === 'banners' ? '/banners' : `/${kind}`
      const result = await send({ url: isCreate ? base : `${base}/${selected._id}`, method: isCreate ? 'POST' : 'PUT', body }).unwrap()
      if (kind === 'products' && value.productFiles?.length) {
        const fd = new FormData(); value.productFiles.slice(0, 5).forEach(file => fd.append('images', file))
        await send({ url: `/products/${result._id}/images`, body: fd }).unwrap()
      }
      setOpen(false); setSelected(null); refetch()
    } catch (err) { setMessage(err?.data?.message || err.message || 'Unable to save this record.') }
  }
  const remove = async record => {
    if (!window.confirm(`Delete this ${cfg.singular}?`)) return
    try { await send({ url: `${kind === 'products' ? '/products' : kind === 'collections' ? '/collections' : kind === 'banners' ? '/banners' : `/${kind}`}/${record._id}`, method: 'DELETE' }).unwrap(); refetch() }
    catch (err) { window.alert(err?.data?.message || `Could not delete ${cfg.singular}.`) }
  }
  const columns = useMemo(() => records.map(record => ({ record, image: kind === 'products' ? (record.gallery?.[0]?.url || record.images?.[0]?.url) : kind === 'collections' ? record.image : ['blogs', 'recipes'].includes(kind) ? record.coverImage : record.desktopImage })), [records, kind])
  return <>
    <Head title={cfg.title} sub={`Manage ${cfg.title.toLowerCase()} from the API.`}><Btn onClick={kind === 'products' ? () => navigate('/products/new') : openNew}><Plus size={16} />Add {cfg.singular}</Btn></Head>
    {(isLoading || isFetching) && <div className="flex items-center gap-2 py-4 text-sm text-mute"><LoaderCircle size={16} className="animate-spin" />{isLoading ? 'Loading ' + cfg.title.toLowerCase() + '…' : 'Refreshing ' + cfg.title.toLowerCase() + '…'}</div>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load records. Check your connection and admin session.</p>}
    {!isLoading && !isFetching && !error && !records.length && <Card><div className="py-8 text-center text-sm text-mute">No {cfg.title.toLowerCase()} yet. Use “Add {cfg.singular}” to create one.</div></Card>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{columns.map(({ record, image }) => <Card key={record._id}>
      <div className="flex gap-4">{image ? <img src={image} alt={record.name || record.title} className="size-20 shrink-0 rounded-lg border border-line object-cover" /> : <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-600"><ImagePlus /></div>}
        <div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-ink">{record.name || record.title}</h2><p className="mt-1 line-clamp-2 text-xs text-mute">{record.description || record.excerpt || record.altText || record.slug || ''}</p>
          {kind === 'products' && <p className="mt-2 text-xs text-mute">MRP ₹{record.mrp ?? record.price} · Price ₹{record.price} · Discount ₹{record.discountPrice || 0} · Stock {record.stock}</p>}
          {kind === 'collections' && <p className="mt-2 text-xs text-mute">{record.products?.length || 0} products · {record.isActive ? 'Active' : 'Hidden'}</p>}
          {kind === 'banners' && <p className="mt-2 text-xs text-mute">{record.placement} · {record.isActive ? 'Active' : 'Hidden'}</p>}
          {['blogs', 'recipes'].includes(kind) && <p className="mt-2 text-xs text-mute">{record.isPublished ? 'Published' : 'Draft'} · {record.category || 'Uncategorised'}</p>}
        </div></div>
      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-3"><Btn v="ghost" className="h-9 px-3" onClick={() => openEdit(record)}><Pencil size={14} />Edit</Btn><Btn v="danger" className="h-9 px-3" onClick={() => remove(record)}><Trash2 size={14} />Delete</Btn></div>
    </Card>)}</div>
    <Modal open={open} onClose={() => { setOpen(false); setSelected(null) }} title={`${isCreate ? 'Add' : 'Edit'} ${cfg.singular}`} side>
      {(kind === 'products' && categoriesLoading) || (kind === 'collections' && productsLoading) ? <Loading label={kind === 'products' ? 'Loading categories…' : 'Loading products…'} /> : <RecordForm key={`${kind}-${formRecord?._id || 'new'}`} kind={kind} initial={formRecord} products={products} categories={categories} onSave={save} busy={busy} message={message} onCancel={() => { setOpen(false); setSelected(null) }} />}
    </Modal>
  </>
}
