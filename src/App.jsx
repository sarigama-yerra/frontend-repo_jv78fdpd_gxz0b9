import { useEffect, useMemo, useState } from 'react'

function Section({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input {...props} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    </label>
  )
}

function NumberInput(props) {
  return <Input type="number" step="any" {...props} />
}

const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [tab, setTab] = useState('orders')

  // Data
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  // Forms
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price_per_kg: '', stock_kg: '' })

  const [orderDraft, setOrderDraft] = useState({ customer_id: '', items: [], notes: '' })
  const [orderItem, setOrderItem] = useState({ product_id: '', quantity_kg: '', unit_price: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchCustomers = async () => {
    const r = await fetch(`${apiBase}/api/customers`)
    if (r.ok) setCustomers(await r.json())
  }
  const fetchProducts = async () => {
    const r = await fetch(`${apiBase}/api/products`)
    if (r.ok) setProducts(await r.json())
  }
  const fetchOrders = async () => {
    const r = await fetch(`${apiBase}/api/orders`)
    if (r.ok) setOrders(await r.json())
  }

  useEffect(() => {
    fetchCustomers(); fetchProducts(); fetchOrders()
  }, [])

  const addCustomer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const r = await fetch(`${apiBase}/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCustomer) })
      if (!r.ok) throw new Error('Failed to create customer')
      setNewCustomer({ name: '', email: '', phone: '', address: '' })
      await fetchCustomers()
      setMessage('Customer added')
    } catch (err) { setMessage(err.message) } finally { setLoading(false) }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const payload = {
      name: newProduct.name,
      sku: newProduct.sku || undefined,
      price_per_kg: Number(newProduct.price_per_kg || 0),
      stock_kg: Number(newProduct.stock_kg || 0),
      is_active: true,
    }
    try {
      const r = await fetch(`${apiBase}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error('Failed to create product')
      setNewProduct({ name: '', sku: '', price_per_kg: '', stock_kg: '' })
      await fetchProducts()
      setMessage('Product added')
    } catch (err) { setMessage(err.message) } finally { setLoading(false) }
  }

  const addItemToDraft = () => {
    if (!orderItem.product_id || !orderItem.quantity_kg) return
    const prod = products.find(p => p._id === orderItem.product_id)
    const unit_price = orderItem.unit_price !== '' ? Number(orderItem.unit_price) : (prod?.price_per_kg || 0)
    const quantity_kg = Number(orderItem.quantity_kg)
    setOrderDraft({
      ...orderDraft,
      items: [...orderDraft.items, { product_id: orderItem.product_id, quantity_kg, unit_price }]
    })
    setOrderItem({ product_id: '', quantity_kg: '', unit_price: '' })
  }

  const removeDraftItem = (idx) => {
    setOrderDraft({ ...orderDraft, items: orderDraft.items.filter((_, i) => i !== idx) })
  }

  const subtotal = useMemo(() => {
    return orderDraft.items.reduce((sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity_kg || 0), 0)
  }, [orderDraft.items])

  const submitOrder = async () => {
    if (!orderDraft.customer_id || orderDraft.items.length === 0) return
    setLoading(true)
    setMessage('')
    try {
      const payload = { customer_id: orderDraft.customer_id, items: orderDraft.items, notes: orderDraft.notes }
      const r = await fetch(`${apiBase}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!r.ok) throw new Error('Failed to create order')
      setOrderDraft({ customer_id: '', items: [], notes: '' })
      await fetchOrders()
      setTab('orders')
      setMessage('Order created')
    } catch (err) { setMessage(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-900">Cheese Factory CRM</h1>
          <nav className="flex gap-2">
            {['orders','customers','products'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${tab===t?'bg-amber-600 text-white':'text-amber-800 hover:bg-amber-200'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
            ))}
            <a href="/test" className="px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-200">Health</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded">{message}</div>
        )}

        {tab === 'customers' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="New Customer">
              <form onSubmit={addCustomer} className="space-y-3">
                <Input label="Name" value={newCustomer.name} onChange={e=>setNewCustomer(v=>({...v,name:e.target.value}))} required />
                <Input label="Email" type="email" value={newCustomer.email} onChange={e=>setNewCustomer(v=>({...v,email:e.target.value}))} />
                <Input label="Phone" value={newCustomer.phone} onChange={e=>setNewCustomer(v=>({...v,phone:e.target.value}))} />
                <Input label="Address" value={newCustomer.address} onChange={e=>setNewCustomer(v=>({...v,address:e.target.value}))} />
                <button disabled={loading} className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">{loading?'Saving...':'Add Customer'}</button>
              </form>
            </Section>

            <Section title="Customers" right={<button onClick={fetchCustomers} className="text-sm text-amber-700 hover:underline">Refresh</button>}>
              <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c._id} className="border-t">
                        <td className="py-2 pr-4">{c.name}</td>
                        <td className="py-2 pr-4">{c.email || '-'}</td>
                        <td className="py-2 pr-4">{c.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {tab === 'products' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="New Cheese">
              <form onSubmit={addProduct} className="space-y-3">
                <Input label="Name" value={newProduct.name} onChange={e=>setNewProduct(v=>({...v,name:e.target.value}))} required />
                <Input label="SKU" value={newProduct.sku} onChange={e=>setNewProduct(v=>({...v,sku:e.target.value}))} />
                <NumberInput label="Price per kg" value={newProduct.price_per_kg} onChange={e=>setNewProduct(v=>({...v,price_per_kg:e.target.value}))} required />
                <NumberInput label="Stock (kg)" value={newProduct.stock_kg} onChange={e=>setNewProduct(v=>({...v,stock_kg:e.target.value}))} />
                <button disabled={loading} className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">{loading?'Saving...':'Add Product'}</button>
              </form>
            </Section>

            <Section title="Products" right={<button onClick={fetchProducts} className="text-sm text-amber-700 hover:underline">Refresh</button>}>
              <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Price/kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className="border-t">
                        <td className="py-2 pr-4">{p.name}</td>
                        <td className="py-2 pr-4">{p.sku || '-'}</td>
                        <td className="py-2 pr-4">${Number(p.price_per_kg).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

        {tab === 'orders' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Section title="New Order">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Customer</span>
                  <select value={orderDraft.customer_id} onChange={e=>setOrderDraft(v=>({...v, customer_id: e.target.value}))}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </label>

                <div className="grid md:grid-cols-4 gap-3 items-end">
                  <label className="md:col-span-2">
                    <span className="text-sm text-gray-600">Product</span>
                    <select value={orderItem.product_id} onChange={e=>setOrderItem(v=>({...v, product_id: e.target.value}))}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option value="">Select product...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </label>
                  <NumberInput label="Quantity (kg)" value={orderItem.quantity_kg} onChange={e=>setOrderItem(v=>({...v, quantity_kg: e.target.value}))} />
                  <NumberInput label="Unit Price (optional)" value={orderItem.unit_price} onChange={e=>setOrderItem(v=>({...v, unit_price: e.target.value}))} />
                  <button onClick={addItemToDraft} className="md:col-span-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">Add Item</button>
                </div>

                {orderDraft.items.length > 0 && (
                  <div className="overflow-auto max-h-64 border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 bg-gray-50">
                          <th className="py-2 pr-4">Product</th>
                          <th className="py-2 pr-4">Qty (kg)</th>
                          <th className="py-2 pr-4">Unit</th>
                          <th className="py-2 pr-4">Line Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDraft.items.map((it, idx) => {
                          const prod = products.find(p => p._id === it.product_id)
                          const line = Number(it.unit_price||0) * Number(it.quantity_kg||0)
                          return (
                            <tr key={idx} className="border-t">
                              <td className="py-2 pr-4">{prod?.name || '-'}</td>
                              <td className="py-2 pr-4">{Number(it.quantity_kg).toFixed(2)}</td>
                              <td className="py-2 pr-4">${Number(it.unit_price||0).toFixed(2)}</td>
                              <td className="py-2 pr-4">${line.toFixed(2)}</td>
                              <td className="py-2 pr-4 text-right">
                                <button onClick={() => removeDraftItem(idx)} className="text-amber-700 hover:underline">Remove</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-gray-700">Items: <span className="font-medium">{orderDraft.items.length}</span></div>
                  <div className="text-lg font-semibold text-amber-900">Subtotal: ${subtotal.toFixed(2)}</div>
                </div>

                <label className="block">
                  <span className="text-sm text-gray-600">Notes</span>
                  <textarea value={orderDraft.notes} onChange={e=>setOrderDraft(v=>({...v, notes: e.target.value}))}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows={3} />
                </label>

                <button disabled={loading || !orderDraft.customer_id || orderDraft.items.length===0}
                  onClick={submitOrder}
                  className="bg-emerald-600 disabled:bg-gray-300 hover:bg-emerald-700 text-white px-4 py-2 rounded">
                  {loading? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </Section>

            <Section title="Recent Orders" right={<button onClick={fetchOrders} className="text-sm text-amber-700 hover:underline">Refresh</button>}>
              <div className="overflow-auto max-h-[28rem]">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice().reverse().map(o => (
                      <tr key={o._id} className="border-t">
                        <td className="py-2 pr-4">{o.order_date || '-'}</td>
                        <td className="py-2 pr-4">{o.customer_id?.slice?.(0,6) || '-'}</td>
                        <td className="py-2 pr-4 capitalize">{o.status}</td>
                        <td className="py-2 pr-4">${Number(o.total||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">Connected to: {apiBase}</footer>
    </div>
  )
}

export default App
