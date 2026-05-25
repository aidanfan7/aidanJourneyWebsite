import { useState, useRef } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { geocode } from '../utils/geocode'

const LABEL = 'font-mono text-[10px] tracking-[0.22em] uppercase block mb-1.5'
const INPUT = {
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'Syne, sans-serif',
  width: '100%',
  transition: 'border-color 0.15s',
}

const focus = e => e.target.style.borderColor = '#666'
const blur  = e => e.target.style.borderColor = '#2a2a2a'

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f97316',
  '#a855f7', '#ec4899', '#14b8a6', '#eab308',
]

export default function AddRoadTripModal({ onSave, onClose, initialData }) {
  const isEditing = Boolean(initialData)
  const [name,      setName]      = useState(initialData?.name ?? '')
  const [stops,     setStops]     = useState(initialData?.stops ?? [])
  const [stopCity,  setStopCity]  = useState('')
  const [stopState, setStopState] = useState('')
  const [stopNotes, setStopNotes] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [geoError,  setGeoError]  = useState('')
  const [color,     setColor]     = useState(initialData?.color ?? PRESET_COLORS[0])
  const colorInputRef = useRef(null)

  const handleAddStop = async () => {
    const city  = stopCity.trim()
    const state = stopState.trim()
    if (!city || !state) return

    setLoading(true)
    setGeoError('')
    const coords = await geocode(city, state)
    setLoading(false)

    const stop = {
      id:    crypto.randomUUID(),
      city, state,
      notes: stopNotes.trim(),
      lat:   coords?.lat ?? null,
      lng:   coords?.lng ?? null,
    }

    if (!coords) {
      setGeoError(`Couldn't locate "${city}, ${state}" — added without a map marker.`)
    }

    setStops(prev => [...prev, stop])
    setStopCity('')
    setStopState('')
    setStopNotes('')
  }

  const removeStop = id => setStops(prev => prev.filter(s => s.id !== id))

  const moveStop = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= stops.length) return
    const arr = [...stops]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    setStops(arr)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed || stops.length < 2) return
    onSave({ ...(isEditing ? { id: initialData.id } : {}), name: trimmed, stops, color })
  }

  const canSave = name.trim().length > 0 && stops.length >= 2

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg flex flex-col"
        style={{
          maxHeight: '90vh',
          background: '#0f0f0f',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1e1e1e' }}
        >
          <div>
            <h2 className="font-mono text-xs font-bold tracking-[0.24em] uppercase" style={{ color: '#e0e0e0' }}>
              {isEditing ? 'Edit Road Trip' : 'Add Road Trip'}
            </h2>
            <p className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: '#444' }}>
              {isEditing ? 'Update your trip details and stops' : 'Name your trip and add ordered stops'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 transition-colors"
            style={{ color: '#444', borderRadius: '6px' }}
            onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Trip name */}
          <div>
            <label className={LABEL} style={{ color: '#444' }}>
              Trip name <span style={{ color: '#555' }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pacific Coast Highway 2024"
              style={INPUT}
              onFocus={focus}
              onBlur={blur}
              autoFocus
            />
          </div>

          {/* Route color */}
          <div>
            <label className={LABEL} style={{ color: '#444' }}>Route color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    outline: color === c ? '1px solid #555' : 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s, outline 0.12s',
                    flexShrink: 0,
                  }}
                  title={c}
                />
              ))}
              {/* Custom color swatch */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: PRESET_COLORS.includes(color) ? 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' : color,
                  border: !PRESET_COLORS.includes(color) ? '2px solid #fff' : '2px solid transparent',
                  outline: !PRESET_COLORS.includes(color) ? '1px solid #555' : 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Custom color"
              />
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="hidden"
              />
              <div
                className="font-mono text-[10px] tracking-wider ml-1"
                style={{ color: '#555' }}
              >
                {color.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Add stop */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px' }}>
            <div className={LABEL} style={{ color: '#444', marginBottom: 12 }}>Add a stop</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                value={stopCity}
                onChange={e => setStopCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStop()}
                placeholder="City"
                style={INPUT}
                onFocus={focus}
                onBlur={blur}
              />
              <input
                value={stopState}
                onChange={e => setStopState(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStop()}
                placeholder="State (e.g. CA)"
                style={INPUT}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            <input
              value={stopNotes}
              onChange={e => setStopNotes(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStop()}
              placeholder="Stop notes (optional)"
              style={{ ...INPUT, marginBottom: 10 }}
              onFocus={focus}
              onBlur={blur}
            />
            <button
              onClick={handleAddStop}
              disabled={loading || !stopCity.trim() || !stopState.trim()}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase font-bold transition-colors"
              style={{
                background: '#fff',
                borderRadius: '7px',
                color: '#000',
                opacity: (loading || !stopCity.trim() || !stopState.trim()) ? 0.35 : 1,
                cursor:  (loading || !stopCity.trim() || !stopState.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" strokeWidth={2} />}
              {loading ? 'Locating…' : 'Add Stop'}
            </button>

            {geoError && (
              <div
                className="flex items-start gap-1.5 mt-3 font-mono text-[10px] leading-relaxed"
                style={{ color: '#888', background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '8px 10px' }}
              >
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={1.5} />
                {geoError}
              </div>
            )}
          </div>

          {/* Stops list */}
          {stops.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={LABEL} style={{ color: '#444', marginBottom: 0 }}>
                  Stops ({stops.length})
                </span>
                {stops.length < 2 && (
                  <span className="font-mono text-[10px] tracking-wider" style={{ color: '#555' }}>
                    Need at least 2 to save
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {stops.map((stop, i) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-2.5 px-3 py-2.5"
                    style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px' }}
                  >
                    <div
                      className="font-mono text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #3a3a3a', color: '#666' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm font-medium" style={{ color: '#c0c0c0' }}>
                        {stop.city}, {stop.state}
                      </div>
                      {stop.notes && (
                        <div className="font-mono text-[10px] truncate mt-0.5" style={{ color: '#444' }}>
                          {stop.notes}
                        </div>
                      )}
                      {stop.lat == null && (
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: '#554' }}>
                          not geocoded
                        </div>
                      )}
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => moveStop(i, -1)}
                        disabled={i === 0}
                        className="p-1 font-mono text-xs font-bold transition-colors"
                        style={{ color: i === 0 ? '#222' : '#555' }}
                        onMouseEnter={e => { if (i !== 0) e.currentTarget.style.color = '#aaa' }}
                        onMouseLeave={e => { if (i !== 0) e.currentTarget.style.color = '#555' }}
                        title="Move up"
                      >↑</button>
                      <button
                        onClick={() => moveStop(i, 1)}
                        disabled={i === stops.length - 1}
                        className="p-1 font-mono text-xs font-bold transition-colors"
                        style={{ color: i === stops.length - 1 ? '#222' : '#555' }}
                        onMouseEnter={e => { if (i !== stops.length - 1) e.currentTarget.style.color = '#aaa' }}
                        onMouseLeave={e => { if (i !== stops.length - 1) e.currentTarget.style.color = '#555' }}
                        title="Move down"
                      >↓</button>
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="p-1 transition-colors ml-1"
                        style={{ color: '#333' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#888'}
                        onMouseLeave={e => e.currentTarget.style.color = '#333'}
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex gap-2 shrink-0"
          style={{ borderTop: '1px solid #1e1e1e' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
            style={{ border: '1px solid #2a2a2a', borderRadius: '8px', color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase font-bold transition-colors"
            style={{
              background: '#fff',
              borderRadius: '8px',
              color: '#000',
              opacity: canSave ? 1 : 0.3,
              cursor:  canSave ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (canSave) e.currentTarget.style.background = '#d8d8d8' }}
            onMouseLeave={e => { if (canSave) e.currentTarget.style.background = '#fff' }}
          >
            {isEditing ? 'Save Changes' : 'Save Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}
