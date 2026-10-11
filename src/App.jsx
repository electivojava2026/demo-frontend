import { useState, useEffect, useRef } from 'react'
import './App.css'

const SERVICES = {
  auth:    'http://localhost:8081',
  eventos: 'http://localhost:8082',
  ordenes: 'http://localhost:8083',
  tickets: 'http://localhost:8084',
}

const PRESETS = [
  { label: 'Staff (STAFF)',  email: 'staff@eventpass.com', password: 'staff123', cls: 'staff' },
  { label: 'User (USER)',    email: 'user@eventpass.com',  password: 'user123',  cls: 'user'  },
]

function ResponseBox({ state }) {
  if (!state) return null
  const cls = state.loading ? 'loading' : state.error ? 'error' : ''
  const text = state.loading
    ? 'Sending request…'
    : state.error
    ? state.error
    : JSON.stringify(state.data, null, 2)
  return <pre className={`response-box ${cls}`}>{text}</pre>
}

function useRequest(token) {
  const tokenRef = useRef(token)
  tokenRef.current = token          // always reflects latest value, no stale closure

  const [state, setState] = useState(null)

  async function run(method, url, body) {
    setState({ loading: true })
    try {
      const headers = { 'Content-Type': 'application/json' }
      const t = tokenRef.current
      if (t) headers['Authorization'] = `Bearer ${t}`
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = text }
      if (!res.ok) setState({ error: `HTTP ${res.status}\n\n${JSON.stringify(data, null, 2)}` })
      else setState({ data })
    } catch (e) {
      setState({ error: `Network error: ${e.message}` })
    }
  }

  return { state, run, clear: () => setState(null) }
}

// ─── Auth Tab ────────────────────────────────────────────────────────────────
function AuthTab({ token, onLogin, onLogout }) {
  const [email, setEmail] = useState('user@eventpass.com')
  const [password, setPassword] = useState('user123')
  const loginReq  = useRequest(null)
  const usersReq  = useRequest(token)

  useEffect(() => {
    if (loginReq.state?.data?.token) onLogin(loginReq.state.data)
  }, [loginReq.state])

  return (
    <div>
      <div className="endpoint-block">
        <div className="endpoint-title">
          <span className="method-tag POST">POST</span>
          /api/v1/auth/login
        </div>
        <div className="section-label">Quick presets</div>
        <div className="preset-row">
          {PRESETS.map(p => (
            <button key={p.email} className={`preset-btn ${p.cls}`}
              onClick={() => { setEmail(p.email); setPassword(p.password) }}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="form-row">
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
          </div>
          <button className="btn" onClick={() => loginReq.run('POST', `${SERVICES.auth}/api/v1/auth/login`, { email, password })}>
            Login
          </button>
          {token && <button className="btn danger" onClick={onLogout}>Logout</button>}
        </div>
        {loginReq.state?.data?.token && (
          <>
            <div className="section-label" style={{marginTop:10}}>Token</div>
            <div className="token-box">{loginReq.state.data.token}</div>
          </>
        )}
        <ResponseBox state={loginReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title">
          <span className="method-tag GET">GET</span>
          /api/v1/users &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(requires JWT)</span>
        </div>
        <button className="btn" disabled={!token} onClick={() => usersReq.run('GET', `${SERVICES.auth}/api/v1/users`)}>
          {token ? 'Fetch Users' : 'Login first'}
        </button>
        <ResponseBox state={usersReq.state} />
      </div>
    </div>
  )
}

// ─── Events Tab ──────────────────────────────────────────────────────────────
function EventosTab({ token }) {
  const listReq   = useRequest(token)
  const getReq    = useRequest(token)
  const createReq = useRequest(token)
  const updateReq = useRequest(token)
  const deleteReq = useRequest(token)
  const tipoReq   = useRequest(token)
  const reservaReq = useRequest(token)
  const [eventId, setEventId] = useState('1')
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: 'Platea', precio: 20000, aforo: 50 })
  const [tipoId, setTipoId] = useState('1')
  const [cantidadReserva, setCantidadReserva] = useState(1)
  const [newEvent, setNewEvent] = useState({
    nombre: 'Nuevo Evento',
    descripcion: 'Descripción del evento',
    lugar: 'Santiago',
    fechaEvento: '2025-12-01T20:00:00',
    tiposEntrada: [{ nombre: 'General', precio: 15000, aforo: 100 }],
  })

  return (
    <div>
      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/eventos</div>
        <button className="btn" onClick={() => listReq.run('GET', `${SERVICES.eventos}/api/v1/eventos`)}>Fetch All Eventos</button>
        <ResponseBox state={listReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/eventos/&#123;id&#125;</div>
        <div className="form-row">
          <div className="field">
            <label>ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="id" style={{maxWidth:100}} />
          </div>
          <button className="btn" onClick={() => getReq.run('GET', `${SERVICES.eventos}/api/v1/eventos/${eventId}`)}>Fetch Evento</button>
        </div>
        <ResponseBox state={getReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag POST">POST</span>/api/v1/eventos &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Nombre</label>
            <input value={newEvent.nombre} onChange={e => setNewEvent(p=>({...p,nombre:e.target.value}))} placeholder="nombre" />
          </div>
          <div className="field">
            <label>Descripción</label>
            <input value={newEvent.descripcion} onChange={e => setNewEvent(p=>({...p,descripcion:e.target.value}))} placeholder="descripción" />
          </div>
          <div className="field">
            <label>Lugar</label>
            <input value={newEvent.lugar} onChange={e => setNewEvent(p=>({...p,lugar:e.target.value}))} placeholder="lugar" />
          </div>
          <div className="field">
            <label>Fecha Evento (ISO)</label>
            <input value={newEvent.fechaEvento} onChange={e => setNewEvent(p=>({...p,fechaEvento:e.target.value}))} placeholder="fechaEvento (ISO)" />
          </div>
          <button className="btn" disabled={!token} onClick={() => createReq.run('POST', `${SERVICES.eventos}/api/v1/eventos`, newEvent)}>Create</button>
        </div>
        <ResponseBox state={createReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag PUT">PUT</span>/api/v1/eventos/&#123;id&#125; &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <div style={{color:'#64748b',fontSize:'0.75rem',marginBottom:8}}>Usa los campos del formulario de creación de arriba.</div>
        <div className="form-row">
          <div className="field">
            <label>ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="id" style={{maxWidth:100}} />
          </div>
          <button className="btn" disabled={!token} onClick={() => updateReq.run('PUT', `${SERVICES.eventos}/api/v1/eventos/${eventId}`, newEvent)}>Update</button>
        </div>
        <ResponseBox state={updateReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag DELETE">DELETE</span>/api/v1/eventos/&#123;id&#125; &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <div className="form-row">
          <div className="field">
            <label>ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="id" style={{maxWidth:100}} />
          </div>
          <button className="btn danger" disabled={!token} onClick={() => deleteReq.run('DELETE', `${SERVICES.eventos}/api/v1/eventos/${eventId}`)}>Delete</button>
        </div>
        <ResponseBox state={deleteReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag POST">POST</span>/api/v1/eventos/&#123;eventoId&#125;/tipos-entrada &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Evento ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="eventoId" style={{maxWidth:100}} />
          </div>
          <div className="field">
            <label>Nombre</label>
            <input value={nuevoTipo.nombre} onChange={e => setNuevoTipo(p=>({...p,nombre:e.target.value}))} placeholder="nombre" />
          </div>
          <div className="field">
            <label>Precio</label>
            <input value={nuevoTipo.precio} onChange={e => setNuevoTipo(p=>({...p,precio:Number(e.target.value)}))} type="number" />
          </div>
          <div className="field">
            <label>Aforo</label>
            <input value={nuevoTipo.aforo} onChange={e => setNuevoTipo(p=>({...p,aforo:Number(e.target.value)}))} type="number" />
          </div>
          <button className="btn" disabled={!token} onClick={() => tipoReq.run('POST', `${SERVICES.eventos}/api/v1/eventos/${eventId}/tipos-entrada`, nuevoTipo)}>Add Tipo</button>
        </div>
        <ResponseBox state={tipoReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag POST">POST</span>/api/v1/eventos/&#123;eventoId&#125;/tipos-entrada/&#123;tipoId&#125;/reservas &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF / SERVICE)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Evento ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="eventoId" style={{maxWidth:100}} />
          </div>
          <div className="field">
            <label>Tipo ID</label>
            <input value={tipoId} onChange={e => setTipoId(e.target.value)} placeholder="tipoId" style={{maxWidth:100}} />
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input value={cantidadReserva} onChange={e => setCantidadReserva(Number(e.target.value))} type="number" style={{maxWidth:100}} />
          </div>
          <button className="btn" disabled={!token} onClick={() => reservaReq.run('POST', `${SERVICES.eventos}/api/v1/eventos/${eventId}/tipos-entrada/${tipoId}/reservas`, { cantidad: cantidadReserva })}>Reservar</button>
        </div>
        <ResponseBox state={reservaReq.state} />
      </div>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdenesTab({ token }) {
  const listReq   = useRequest(token)
  const getReq    = useRequest(token)
  const createReq = useRequest(token)
  const misReq    = useRequest(token)
  const comprarReq = useRequest(token)
  const estadoReq  = useRequest(token)
  const [orderId, setOrderId] = useState('1')
  const [cambioEstado, setCambioEstado] = useState({ estado: 'EMITIDA', motivo: '' })
  const [newOrder, setNewOrder] = useState({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 })

  return (
    <div>
      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/ordenes &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <button className="btn" disabled={!token} onClick={() => listReq.run('GET', `${SERVICES.ordenes}/api/v1/ordenes`)}>Fetch All Ordenes</button>
        <ResponseBox state={listReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/ordenes/&#123;id&#125;</div>
        <div className="form-row">
          <div className="field">
            <label>ID</label>
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="id" style={{maxWidth:100}} />
          </div>
          <button className="btn" disabled={!token} onClick={() => getReq.run('GET', `${SERVICES.ordenes}/api/v1/ordenes/${orderId}`)}>Fetch Orden</button>
        </div>
        <ResponseBox state={getReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag POST">POST</span>/api/v1/ordenes &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(USER)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Evento ID</label>
            <input value={newOrder.eventoId} onChange={e => setNewOrder(p=>({...p,eventoId:Number(e.target.value)}))} placeholder="eventoId" type="number" style={{maxWidth:110}} />
          </div>
          <div className="field">
            <label>Tipo Entrada ID</label>
            <input value={newOrder.tipoEntradaId} onChange={e => setNewOrder(p=>({...p,tipoEntradaId:Number(e.target.value)}))} placeholder="tipoEntradaId" type="number" style={{maxWidth:120}} />
          </div>
          <div className="field">
            <label>Cantidad</label>
            <input value={newOrder.cantidad} onChange={e => setNewOrder(p=>({...p,cantidad:Number(e.target.value)}))} placeholder="cantidad" type="number" style={{maxWidth:100}} />
          </div>
          <button className="btn" disabled={!token} onClick={() => createReq.run('POST', `${SERVICES.ordenes}/api/v1/ordenes`, newOrder)}>Create</button>
          <button className="btn secondary" disabled={!token} onClick={() => comprarReq.run('POST', `${SERVICES.ordenes}/api/v1/ordenes/comprar`, newOrder)}>Comprar</button>
        </div>
        <div style={{color:'#64748b',fontSize:'0.75rem'}}>
          Create → POST /api/v1/ordenes (queda PENDIENTE_EMISION) · Comprar → POST /api/v1/ordenes/comprar (descuenta aforo y emite tickets)
        </div>
        <ResponseBox state={createReq.state} />
        <ResponseBox state={comprarReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/ordenes/mis-ordenes &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(USER)</span></div>
        <button className="btn" disabled={!token} onClick={() => misReq.run('GET', `${SERVICES.ordenes}/api/v1/ordenes/mis-ordenes`)}>Fetch Mis Ordenes (con tickets)</button>
        <ResponseBox state={misReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag PATCH">PATCH</span>/api/v1/ordenes/&#123;id&#125;/estado &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF)</span></div>
        <div className="form-row">
          <div className="field">
            <label>ID</label>
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="id" style={{maxWidth:100}} />
          </div>
          <div className="field">
            <label>Estado</label>
            <select value={cambioEstado.estado} onChange={e => setCambioEstado(p=>({...p,estado:e.target.value}))}>
              <option>EMITIDA</option>
              <option>RECHAZADA</option>
            </select>
          </div>
          <div className="field">
            <label>Motivo (si RECHAZADA)</label>
            <input value={cambioEstado.motivo} onChange={e => setCambioEstado(p=>({...p,motivo:e.target.value}))} placeholder="motivo" />
          </div>
          <button className="btn" disabled={!token} onClick={() => estadoReq.run('PATCH', `${SERVICES.ordenes}/api/v1/ordenes/${orderId}/estado`, cambioEstado)}>Cambiar Estado</button>
        </div>
        <ResponseBox state={estadoReq.state} />
      </div>
    </div>
  )
}

// ─── Tickets Tab ──────────────────────────────────────────────────────────────
function TicketsTab({ token }) {
  const listReq     = useRequest(token)
  const generateReq = useRequest(token)
  const byOrderReq  = useRequest(token)
  const [eventId, setEventId]   = useState('1')
  const [orderId, setOrderId]   = useState('1')

  return (
    <div>
      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/tickets &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(requires JWT)</span></div>
        <button className="btn" disabled={!token} onClick={() => listReq.run('GET', `${SERVICES.tickets}/api/v1/tickets`)}>
          {token ? 'Fetch All Tickets' : 'Login first'}
        </button>
        <ResponseBox state={listReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag POST">POST</span>/api/v1/tickets/generate &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(requires JWT)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Event ID</label>
            <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="eventId" type="number" style={{maxWidth:120}} />
          </div>
          <div className="field">
            <label>Order ID</label>
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="orderId" type="number" style={{maxWidth:120}} />
          </div>
          <button className="btn" disabled={!token}
            onClick={() => generateReq.run('POST', `${SERVICES.tickets}/api/v1/tickets/generate?eventId=${eventId}&orderId=${orderId}`)}>
            Generate
          </button>
        </div>
        <ResponseBox state={generateReq.state} />
      </div>

      <div className="endpoint-block">
        <div className="endpoint-title"><span className="method-tag GET">GET</span>/api/v1/tickets/order/&#123;orderId&#125; &nbsp;<span style={{color:'#ef4444',fontSize:'0.72rem'}}>(STAFF / SERVICE)</span></div>
        <div className="form-row">
          <div className="field">
            <label>Order ID</label>
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="orderId" type="number" style={{maxWidth:120}} />
          </div>
          <button className="btn" disabled={!token} onClick={() => byOrderReq.run('GET', `${SERVICES.tickets}/api/v1/tickets/order/${orderId}`)}>Fetch Tickets by Order</button>
        </div>
        <ResponseBox state={byOrderReq.state} />
      </div>
    </div>
  )
}

// ─── Comprar Tab (flujo de compra simulada para USER) ─────────────────────────
function ComprarTab({ session }) {
  const token = session?.token
  const eventosReq = useRequest(token)
  const compraReq  = useRequest(token)
  const [evento, setEvento]   = useState(null)
  const [tipoId, setTipoId]   = useState('')
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    if (token) eventosReq.run('GET', `${SERVICES.eventos}/api/v1/eventos`)
  }, [token])

  // Tras una compra, recarga los eventos para mostrar el aforo actualizado
  useEffect(() => {
    if (compraReq.state?.data) eventosReq.run('GET', `${SERVICES.eventos}/api/v1/eventos`)
  }, [compraReq.state])

  useEffect(() => {
    const lista = eventosReq.state?.data
    if (evento && Array.isArray(lista)) setEvento(lista.find(e => e.id === evento.id) ?? evento)
  }, [eventosReq.state])

  if (session?.role !== 'USER') {
    return <div className="response-box error">Inicia sesión como USER para comprar entradas.</div>
  }

  function elegir(ev) {
    setEvento(ev)
    setTipoId(ev.tiposEntrada?.[0]?.id ?? '')
    setCantidad(1)
    compraReq.clear()
  }

  const compra = compraReq.state?.data
  const tipo = evento?.tiposEntrada?.find(t => t.id === Number(tipoId))

  return (
    <div>
      <div className="endpoint-block">
        <div className="section-label">Eventos disponibles</div>
        {eventosReq.state?.error && <ResponseBox state={eventosReq.state} />}
        <div className="event-grid">
          {(Array.isArray(eventosReq.state?.data) ? eventosReq.state.data : []).map(ev => (
            <button key={ev.id} className={`event-card ${evento?.id === ev.id ? 'active' : ''}`} onClick={() => elegir(ev)}>
              <strong>{ev.nombre}</strong>
              <span>{ev.lugar} · {ev.fechaEvento?.replace('T', ' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {evento && (
        <div className="endpoint-block">
          <div className="section-label">Completar orden — {evento.nombre}</div>
          <div className="form-row">
            <div className="field">
              <label>Tipo de entrada</label>
              <select value={tipoId} onChange={e => setTipoId(e.target.value)}>
                {evento.tiposEntrada?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} — ${t.precio} ({t.aforoDisponible} disp.)
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{maxWidth:110}}>
              <label>Cantidad</label>
              <input type="number" min="1" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
            </div>
            <button className="btn" disabled={!tipoId || cantidad < 1 || compraReq.state?.loading}
              onClick={() => compraReq.run('POST', `${SERVICES.ordenes}/api/v1/ordenes/comprar`,
                { eventoId: evento.id, tipoEntradaId: Number(tipoId), cantidad })}>
              Comprar{tipo ? ` · $${tipo.precio * cantidad}` : ''}
            </button>
          </div>

          {compra ? (
            <div className="response-box">
              <div className="section-label">Orden #{compra.orden.id} — {compra.orden.estado}</div>
              {compra.orden.motivo && <div style={{color:'#fca5a5'}}>{compra.orden.motivo}</div>}
              <div>Evento: {evento.nombre} ({evento.lugar}, {evento.fechaEvento?.replace('T', ' ')})</div>
              <div>Entrada: {tipo?.nombre} × {compra.orden.cantidad}</div>
              <div>Comprador: {compra.orden.compradorEmail}</div>
              <div>Fecha: {compra.orden.fechaCreacion?.replace('T', ' ')}</div>
              {compra.tickets.length > 0 && <div className="section-label" style={{marginTop:10}}>Tickets</div>}
              {compra.tickets.map(t => (
                <div key={t.id}>🎟 {t.ticketNumber} — {t.status}</div>
              ))}
            </div>
          ) : (
            <ResponseBox state={compraReq.state} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = ['auth', 'comprar', 'eventos', 'ordenes', 'tickets']

export default function App() {
  const [tab, setTab]     = useState('auth')
  // { token, name, email, role } — persistido en sessionStorage para sobrevivir recargas
  const [session, setSession] = useState(() => JSON.parse(sessionStorage.getItem('session')))

  function handleLogin(data) {
    const s = { token: data.token, name: data.name, email: data.email, role: data.role }
    sessionStorage.setItem('session', JSON.stringify(s))
    setSession(s)
  }

  function handleLogout() {
    sessionStorage.removeItem('session')
    setSession(null)
  }

  return (
    <>
      <header>
        <div>
          <h1>EventPass — API Tester</h1>
          <div style={{color:'#64748b',fontSize:'0.8rem',marginTop:4}}>
            auth :8081 · eventos :8082 · ordenes :8083 · tickets :8084
          </div>
        </div>
        {session ? (
          <div className="user-pill">
            <span className={`badge ${session.role}`}>{session.role}</span>
            <span style={{fontSize:'0.8rem'}}>{session.name ?? session.email}</span>
          </div>
        ) : (
          <span className="badge none">not logged in</span>
        )}
      </header>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'auth'    && <AuthTab    token={session?.token} onLogin={handleLogin} onLogout={handleLogout} />}
        {tab === 'comprar' && <ComprarTab session={session} />}
        {tab === 'eventos' && <EventosTab token={session?.token} />}
        {tab === 'ordenes' && <OrdenesTab token={session?.token} />}
        {tab === 'tickets' && <TicketsTab token={session?.token} />}
      </div>
    </>
  )
}
