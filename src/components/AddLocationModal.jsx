import { useState, useRef } from 'react'
import { X, Upload, XCircle } from 'lucide-react'

const LABEL  = 'font-mono text-[10px] tracking-[0.22em] uppercase block mb-1.5'
const INPUT  = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'Syne, sans-serif',
  transition: 'border-color 0.15s',
  resize: 'none',
}

function Field({ label, children }) {
  return (
    <div>
      <label className={LABEL} style={{ color: '#444' }}>{label}</label>
      {children}
    </div>
  )
}

export default function AddLocationModal({ onSave, onClose }) {
  const [form, setForm]   = useState({ name: '', date: '', notes: '', photos: [] })
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.match(/^image\/(jpeg|png)$/)) return
      const reader = new FileReader()
      reader.onload = e => setForm(f => ({ ...f, photos: [...f.photos, e.target.result] }))
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ ...form, name: form.name.trim() })
  }

  const focusStyle  = e => e.target.style.borderColor = '#666'
  const blurStyle   = e => e.target.style.borderColor = '#2a2a2a'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md overflow-hidden"
        style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '12px' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1e1e1e' }}
        >
          <div>
            <h2 className="font-mono text-xs font-bold tracking-[0.24em] uppercase" style={{ color: '#e0e0e0' }}>
              Pin Location
            </h2>
            <p className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: '#444' }}>
              Mark this spot on your globe
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Location name *">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Golden Gate Bridge"
              style={{ ...INPUT, fontFamily: 'Syne, sans-serif' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
              required
              autoFocus
            />
          </Field>

          <Field label="Date visited">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={INPUT}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <Field label="Memories & notes">
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What made this place special?"
              rows={3}
              style={{ ...INPUT, resize: 'none' }}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </Field>

          <Field label="Photos">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 py-5 cursor-pointer transition-colors"
              style={{
                border: `1px dashed ${dragging ? '#666' : '#2a2a2a'}`,
                borderRadius: '8px',
                background: dragging ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}
            >
              <Upload className="w-4 h-4" style={{ color: '#333' }} strokeWidth={1.5} />
              <p className="font-mono text-[10px] tracking-wider" style={{ color: '#444' }}>
                Drop photos or click to upload
              </p>
              <p className="font-mono text-[10px]" style={{ color: '#2e2e2e' }}>JPG · PNG</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={e => processFiles(e.target.files)}
              />
            </div>

            {form.photos.length > 0 && (
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {form.photos.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-16 h-16 object-cover"
                      style={{ borderRadius: 6, opacity: 0.8 }} />
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
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
              style={{ border: '1px solid #2a2a2a', borderRadius: '8px', color: '#555' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#888' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase font-bold transition-colors"
              style={{ background: '#fff', borderRadius: '8px', color: '#000' }}
              onMouseEnter={e => e.currentTarget.style.background = '#d8d8d8'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Save Location
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
