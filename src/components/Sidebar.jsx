import { useState } from 'react'
import { MapPin, Route, Plus, Trash2, ChevronDown, ChevronRight, Globe, Pencil } from 'lucide-react'

const LABEL = 'font-mono text-[10px] tracking-[0.22em] uppercase text-[#555]'

function formatDate(d) {
  if (!d) return null
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch { return d }
}

export default function Sidebar({
  locations,
  roadTrips,
  activeTrip,
  onSelectTrip,
  onSelectLocation,
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
}) {
  const [tab, setTab] = useState('locations')
  const [expandedTrip, setExpandedTrip] = useState(null)

  const toggleTrip = (trip) => {
    setExpandedTrip(prev => prev === trip.id ? null : trip.id)
    onSelectTrip(trip)
  }

  return (
    <aside
      className="w-72 flex flex-col shrink-0 overflow-hidden"
      style={{
        background: '#0f0f0f',
        borderRight: '1px solid #1e1e1e',
      }}
    >
      {/* Header */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <Globe className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
          <span className="font-mono text-sm font-bold tracking-[0.28em] text-white uppercase">
            My Journey
          </span>
        </div>
        <div className={LABEL}>
          {locations.length} place{locations.length !== 1 ? 's' : ''}
          {' '}·{' '}
          {roadTrips.length} trip{roadTrips.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
        {[
          { key: 'locations', label: 'Places' },
          { key: 'trips',     label: 'Trips'  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors ${
              tab === key
                ? 'text-white'
                : 'text-[#444] hover:text-[#888]'
            }`}
            style={{
              borderBottom: tab === key ? '1px solid #fff' : '1px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── PLACES ── */}
        {tab === 'locations' && (
          <div>
            {locations.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: '#2a2a2a' }} strokeWidth={1} />
                <p className={`${LABEL} leading-relaxed`}>
                  Click anywhere on the globe to pin a visited location.
                </p>
              </div>
            ) : (
              locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation(loc)}
                  className="w-full text-left px-5 py-3.5 transition-colors group"
                  style={{ borderBottom: '1px solid #161616' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1.5 w-1 h-1 rounded-full shrink-0 transition-colors group-hover:bg-white"
                      style={{ background: '#3a3a3a' }}
                    />
                    <div className="min-w-0">
                      <div className="font-display text-sm font-medium truncate transition-colors group-hover:text-white"
                        style={{ color: '#d0d0d0' }}>
                        {loc.name}
                      </div>
                      {loc.date && (
                        <div className="font-mono text-[10px] mt-0.5 tracking-wider" style={{ color: '#444' }}>
                          {formatDate(loc.date)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── TRIPS ── */}
        {tab === 'trips' && (
          <div className="py-3">
            <div className="px-4 mb-3">
              <button
                onClick={onAddTrip}
                className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors"
                style={{
                  border: '1px dashed #2a2a2a',
                  borderRadius: '6px',
                  color: '#555',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#aaa' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
              >
                <Plus className="w-3 h-3" strokeWidth={1.5} />
                Add Road Trip
              </button>
            </div>

            {roadTrips.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Route className="w-6 h-6 mx-auto mb-3" style={{ color: '#2a2a2a' }} strokeWidth={1} />
                <p className={`${LABEL} leading-relaxed`}>
                  Add a named road trip with ordered stops to draw a route on the globe.
                </p>
              </div>
            ) : (
              roadTrips.map(trip => {
                const isActive   = activeTrip?.id === trip.id
                const isExpanded = expandedTrip === trip.id
                return (
                  <div key={trip.id} style={{ borderBottom: '1px solid #161616' }}>
                    <div
                      className="flex items-center gap-2.5 px-4 py-3.5 cursor-pointer transition-colors"
                      style={{ background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                      onClick={() => toggleTrip(trip)}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: trip.color ?? '#888',
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.6,
                      }} />
                      <span
                        className="flex-1 font-display text-sm font-medium truncate"
                        style={{ color: isActive ? '#fff' : '#888' }}
                      >
                        {trip.name}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); onEditTrip(trip) }}
                        className="p-1 transition-colors"
                        style={{ color: '#333', borderRadius: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#888'}
                        onMouseLeave={e => e.currentTarget.style.color = '#333'}
                        title="Edit trip"
                      >
                        <Pencil className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteTrip(trip.id) }}
                        className="p-1 transition-colors"
                        style={{ color: '#333', borderRadius: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#888'}
                        onMouseLeave={e => e.currentTarget.style.color = '#333'}
                        title="Delete trip"
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                      {isExpanded
                        ? <ChevronDown  className="w-3.5 h-3.5 shrink-0" style={{ color: '#444' }} strokeWidth={1.5} />
                        : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#333' }} strokeWidth={1.5} />
                      }
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(255,255,255,0.015)' }}>
                        <div className={`${LABEL} mb-3 ml-6`}>
                          {trip.stops.length} stop{trip.stops.length !== 1 ? 's' : ''}
                        </div>
                        <div className="space-y-2">
                          {trip.stops.map((stop, i) => (
                            <div key={stop.id} className="flex items-start gap-3 pl-1">
                              <div
                                className="font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                                style={{
                                  width: 18, height: 18,
                                  borderRadius: '50%',
                                  border: '1px solid #3a3a3a',
                                  color: '#888',
                                  lineHeight: 1,
                                }}
                              >
                                {i + 1}
                              </div>
                              <div className="min-w-0">
                                <div className="font-display text-xs font-medium" style={{ color: '#aaa' }}>
                                  {stop.city}, {stop.state}
                                </div>
                                {stop.notes && (
                                  <div className="font-mono text-[10px] mt-0.5 leading-relaxed" style={{ color: '#444' }}>
                                    {stop.notes}
                                  </div>
                                )}
                                {stop.lat == null && (
                                  <div className="font-mono text-[10px] mt-0.5" style={{ color: '#664' }}>
                                    not geocoded
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 shrink-0" style={{ borderTop: '1px solid #1a1a1a' }}>
        <p className={`${LABEL} leading-relaxed`}>
          Click the globe to add · Data saved locally
        </p>
      </div>
    </aside>
  )
}
