import { useState, useRef } from 'react'
import { X, Edit2, Trash2, Check, ChevronLeft, ChevronRight, XCircle, Upload } from 'lucide-react'

const LABEL = 'font-mono text-[10px] tracking-[0.22em] uppercase block mb-1.5'

const inputStyle = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'Syne, sans-serif',
  transition: 'border-color 0.15s',
}

export default function LocationDetail({ location, onClose, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({
    name:   location.name,
    date:   location.date   ?? '',
    notes:  location.notes  ?? '',
    photos: location.photos ?? [],
  })
  const [photoIdx, setPhotoIdx] = useState(0)
  const fileRef = useRef(null)

  const handleSave = () => {
    if (!form.name.trim()) return
    onUpdate({ ...location, ...form, name: form.name.trim() })
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({
      name:   location.name,
      date:   location.date   ?? '',
      notes:  location.notes  ?? '',
      photos: location.photos ?? [],
    })
    setEditing(false)
  }

  const addPhotos = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.match(/^image\/(jpeg|png)$/)) return
      const reader = new FileReader()
      reader.onload = e =>
        setForm(f => ({ ...f, photos: [...f.photos, e.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  const photos     = editing ? form.photos : (location.photos ?? [])
  const photoCount = photos.length
  const prev       = () => setPhotoIdx(i => (i - 1 + photoCount) % photoCount)
  const next       = () => setPhotoIdx(i => (i + 1) % photoCount)

  const formatDate = d => {
    if (!d) return null
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
      })
    } catch { return d }
  }

  return (
    <div
      className="absolute top-4 right-4 bottom-4 w-80 flex flex-col overflow-hidden"
      style={{
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        zIndex: 500,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid #1e1e1e' }}
      >
        {editing ? (
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="flex-1 font-display text-sm font-semibold bg-transparent outline-none pb-0.5"
            style={{ color: '#f0f0f0', borderBottom: '1px solid #555' }}
            autoFocus
          />
        ) : (
          <h2 className="flex-1 font-display text-sm font-semibold truncate" style={{ color: '#f0f0f0' }}>
            {location.name}
          </h2>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {editing ? (
            <>
              <IconBtn onClick={handleSave}   title="Save"   color="#888" hoverColor="#fff">
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
              </IconBtn>
              <IconBtn onClick={handleCancel} title="Cancel" color="#555" hoverColor="#888">
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </IconBtn>
            </>
          ) : (
            <IconBtn onClick={() => setEditing(true)} title="Edit" color="#555" hoverColor="#aaa">
              <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </IconBtn>
          )}
          <IconBtn onClick={() => onDelete(location.id)} title="Delete" color="#555" hoverColor="#ff5555">
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </IconBtn>
          <IconBtn onClick={onClose} title="Close" color="#555" hoverColor="#aaa">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Photo carousel */}
        {photoCount > 0 && (
          <div className="relative shrink-0 overflow-hidden" style={{ height: 190, background: '#111' }}>
            <img
              src={photos[Math.min(photoIdx, photoCount - 1)]}
              alt=""
              className="w-full h-full object-cover opacity-90"
            />
            {photoCount > 1 && (
              <>
                <button onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)' }}>
                  <ChevronLeft className="w-4 h-4 text-white" strokeWidth={1.5} />
                </button>
                <button onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)' }}>
                  <ChevronRight className="w-4 h-4 text-white" strokeWidth={1.5} />
                </button>
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.35)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-5">
          {editing ? (
            <>
              <div>
                <label className={LABEL} style={{ color: '#444' }}>Date Visited</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                  onFocus={e  => e.target.style.borderColor = '#666'}
                  onBlur={e   => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
              <div>
                <label className={LABEL} style={{ color: '#444' }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#666'}
                  onBlur={e  => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
              <div>
                <label className={LABEL} style={{ color: '#444' }}>Photos</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors"
                  style={{ border: '1px dashed #2a2a2a', borderRadius: '6px', color: '#444' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#444' }}
                >
                  <Upload className="w-3 h-3" strokeWidth={1.5} />
                  Add photos
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  className="hidden"
                  onChange={e => addPhotos(e.target.files)}
                />
                {form.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {form.photos.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-14 h-14 object-cover" style={{ borderRadius: 6, opacity: 0.85 }} />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                          className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: '#888' }}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {location.date && (
                <div>
                  <span className={LABEL} style={{ color: '#444' }}>Date Visited</span>
                  <div className="font-display text-sm" style={{ color: '#c0c0c0' }}>{formatDate(location.date)}</div>
                </div>
              )}
              {location.notes && (
                <div>
                  <span className={LABEL} style={{ color: '#444' }}>Notes</span>
                  <div className="font-display text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#aaa' }}>
                    {location.notes}
                  </div>
                </div>
              )}
              {!location.date && !location.notes && photoCount === 0 && (
                <div className="py-6 text-center">
                  <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#333' }}>
                    No details added yet
                  </p>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-3 font-mono text-[10px] tracking-widest uppercase transition-colors"
                    style={{ color: '#555' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                  >
                    Add notes →
                  </button>
                </div>
              )}
              <div style={{ paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
                <span className={LABEL} style={{ color: '#333' }}>Coordinates</span>
                <div className="font-mono text-[11px]" style={{ color: '#444' }}>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function IconBtn({ onClick, title, color, hoverColor, children }) {
  const ref = useRef(null)
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title}
      className="p-1.5 transition-colors"
      style={{ color, borderRadius: '6px' }}
      onMouseEnter={() => { if (ref.current) ref.current.style.color = hoverColor }}
      onMouseLeave={() => { if (ref.current) ref.current.style.color = color }}
    >
      {children}
    </button>
  )
}
