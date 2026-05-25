import { useRef, useEffect, useState, useCallback } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const MAX_SPIN  = 5
const SLOW_SPIN = 3
const SPIN_DPS  = 12

async function fetchRoadRoute(stops) {
  const pts = stops.filter(s => s.lat != null && s.lng != null)
  if (pts.length < 2) return null
  const coords = pts.map(p => `${p.lng},${p.lat}`).join(';')
  try {
    const res  = await fetch(`${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false`)
    if (!res.ok) return null
    const data = await res.json()
    return data.routes?.[0]?.geometry ?? null
  } catch {
    return null
  }
}

export default function MapView({
  locations, roadTrips, activeTrip, selectedLocation,
  onMapClick, onMarkerClick,
}) {
  const mapRef        = useRef(null)
  const wrapperRef    = useRef(null)
  const dragging      = useRef(false)
  const resumeTimer   = useRef(null)
  const spinRunning   = useRef(false) // true only while spin easeTo is in flight
  // Track where the left-button was pressed so we can tell clicks from drags
  const clickStart    = useRef(null)
  // OSRM route cache
  const fetchedSet    = useRef(new Set())
  const [routes, setRoutes] = useState({})

  // ── Fetch road routes for every trip, cache by stops fingerprint ──────────
  useEffect(() => {
    const tripFingerprint = trip =>
      trip.id + ':' + trip.stops.filter(s => s.lat != null).map(s => `${s.lat},${s.lng}`).join('|')

    const liveFingerprints = new Set(roadTrips.map(tripFingerprint))
    const liveIds          = new Set(roadTrips.map(t => t.id))

    // Drop cache entries for deleted or changed trips
    fetchedSet.current.forEach(fp => { if (!liveFingerprints.has(fp)) fetchedSet.current.delete(fp) })
    setRoutes(prev => {
      const next = {}
      Object.keys(prev).forEach(k => { if (liveIds.has(k)) next[k] = prev[k] })
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })

    // Fetch any trip whose stops we haven't fetched yet
    roadTrips.forEach(async trip => {
      const fp = tripFingerprint(trip)
      if (fetchedSet.current.has(fp)) return
      const valid = trip.stops.filter(s => s.lat != null && s.lng != null)
      if (valid.length < 2) return
      fetchedSet.current.add(fp)
      // Clear stale geometry while re-fetching
      setRoutes(prev => { const n = { ...prev }; delete n[trip.id]; return n })
      const geo = await fetchRoadRoute(trip.stops)
      if (geo) setRoutes(prev => ({ ...prev, [trip.id]: geo }))
    })
  }, [roadTrips])

  // ── Record left-mousedown pixel position (native, so it fires before MapLibre) ──
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onDown = e => {
      if (e.button === 0) clickStart.current = { x: e.clientX, y: e.clientY }
    }
    el.addEventListener('mousedown', onDown)
    return () => el.removeEventListener('mousedown', onDown)
  }, [])

  // ── Globe auto-spin ───────────────────────────────────────────────────────
  const spinGlobe = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || dragging.current) return
    const zoom = map.getZoom()
    if (zoom >= MAX_SPIN) return
    let dps = SPIN_DPS
    if (zoom > SLOW_SPIN) dps *= (MAX_SPIN - zoom) / (MAX_SPIN - SLOW_SPIN)
    const c = map.getCenter()
    c.lng -= dps
    spinRunning.current = true
    map.easeTo({ center: c, duration: 1000, easing: n => n })
  }, [])

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    try { map.setProjection({ type: 'globe' }) } catch {}
    try {
      map.setFog({
        color:            'rgba(210,215,225,0.85)',
        'high-color':     '#c8d0e0',
        'space-color':    '#000000',
        'star-intensity': 0.35,
        'horizon-blend':  0.03,
      })
    } catch {}
    spinGlobe()
  }, [spinGlobe])

  const handleMoveEnd = useCallback(() => {
    spinRunning.current = false
    if (!dragging.current) spinGlobe()
  }, [spinGlobe])

  const handleInteractionStart = useCallback(() => {
    dragging.current = true
    clearTimeout(resumeTimer.current)
    // Only stop the spin easeTo — never stop user-initiated pan/zoom animations
    if (spinRunning.current) {
      spinRunning.current = false
      mapRef.current?.getMap()?.stop()
    }
  }, [])

  const handleInteractionEnd = useCallback(() => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      dragging.current = false
      spinGlobe()
    }, 2000)
  }, [spinGlobe])

  // ── Click handler — only fires if the mouse barely moved (not a pan) ──────
  const handleMapClick = useCallback(e => {
    const start = clickStart.current
    clickStart.current = null
    if (start) {
      const dist = Math.hypot(
        e.originalEvent.clientX - start.x,
        e.originalEvent.clientY - start.y,
      )
      if (dist > 6) return // was a drag, suppress
    }
    onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
  }, [onMapClick])

  // ── Fly to selected location ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!selectedLocation || !map) return
    map.flyTo({
      center:   [selectedLocation.lng, selectedLocation.lat],
      zoom:     Math.max(map.getZoom(), 8),
      duration: 1200,
    })
  }, [selectedLocation])

  // ── Fit bounds when a trip is selected ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!activeTrip || !map) return
    const pts = activeTrip.stops.filter(s => s.lat != null && s.lng != null)
    if (!pts.length) return
    if (pts.length === 1) {
      map.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 8, duration: 1200 })
      return
    }
    const lngs = pts.map(p => p.lng)
    const lats  = pts.map(p => p.lat)
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1200 },
    )
  }, [activeTrip])

  // ── GeoJSON: all trips always visible ─────────────────────────────────────
  const tripsGeoJson = {
    type: 'FeatureCollection',
    features: roadTrips
      .map(trip => {
        const pts = trip.stops.filter(s => s.lat != null && s.lng != null)
        if (pts.length < 2) return null
        return {
          type: 'Feature',
          properties: { tripId: trip.id, isActive: activeTrip?.id === trip.id, color: trip.color ?? '#888888' },
          // Use fetched road geometry once available; straight line until then
          geometry: routes[trip.id] ?? {
            type:        'LineString',
            coordinates: pts.map(s => [s.lng, s.lat]),
          },
        }
      })
      .filter(Boolean),
  }

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: -98.35, latitude: 39.5, zoom: 2 }}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        onDragStart={handleInteractionStart}
        onDragEnd={handleInteractionEnd}
        onZoomStart={handleInteractionStart}
        onZoomEnd={handleInteractionEnd}
        onRotateStart={handleInteractionStart}
        onRotateEnd={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onClick={handleMapClick}
        attributionControl={false}
      >
        {/* ── All trip routes (always rendered) ── */}
        {tripsGeoJson.features.length > 0 && (
          <Source id="trips" type="geojson" data={tripsGeoJson}>
            {/* Inactive trips: thin and faint */}
            <Layer
              id="trips-inactive"
              type="line"
              filter={['!', ['boolean', ['get', 'isActive'], false]]}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': ['coalesce', ['get', 'color'], '#888888'], 'line-width': 1.5, 'line-opacity': 0.5 }}
            />
            {/* Active trip: thick, dashed */}
            <Layer
              id="trips-active"
              type="line"
              filter={['boolean', ['get', 'isActive'], false]}
              layout={{ 'line-cap': 'butt', 'line-join': 'round' }}
              paint={{
                'line-color':     ['coalesce', ['get', 'color'], '#888888'],
                'line-width':     ['interpolate', ['linear'], ['zoom'], 2, 2.5, 10, 5],
                'line-dasharray': [4, 2],
                'line-opacity':   1,
              }}
            />
          </Source>
        )}

        {/* ── Visited location pins (always rendered) ── */}
        {locations.map(loc => {
          const sel = selectedLocation?.id === loc.id
          return (
            <Marker
              key={loc.id}
              longitude={loc.lng}
              latitude={loc.lat}
              anchor="center"
              onClick={e => { e.originalEvent.stopPropagation(); onMarkerClick(loc) }}
            >
              <div style={{
                width:        sel ? 14 : 10,
                height:       sel ? 14 : 10,
                borderRadius: '50%',
                background:   sel ? '#fff' : '#111',
                border:       `${sel ? 2.5 : 2}px solid ${sel ? '#111' : '#fff'}`,
                boxShadow:    sel
                  ? '0 0 0 3px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.5)'
                  : '0 1px 5px rgba(0,0,0,0.4)',
                cursor:     'pointer',
                transition: 'all 0.18s ease',
              }} />
            </Marker>
          )
        })}

        {/* ── Numbered stop markers for the active trip ── */}
        {(activeTrip?.stops ?? [])
          .filter(s => s.lat != null && s.lng != null)
          .map((stop, i) => (
            <Marker key={stop.id} longitude={stop.lng} latitude={stop.lat} anchor="center">
              <div style={{
                width:          20,
                height:         20,
                borderRadius:   '50%',
                background:     '#000',
                border:         '1.5px solid rgba(255,255,255,0.9)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontFamily:     '"Space Mono", monospace',
                fontSize:       8,
                color:          '#fff',
                fontWeight:     'bold',
                boxShadow:      '0 1px 6px rgba(0,0,0,0.5)',
              }}>
                {i + 1}
              </div>
            </Marker>
          ))}
      </Map>

      <div style={{
        position:      'absolute',
        bottom:        6,
        right:         8,
        fontFamily:    '"Space Mono", monospace',
        fontSize:      9,
        color:         'rgba(0,0,0,0.35)',
        pointerEvents: 'none',
      }}>
        © OpenStreetMap contributors
      </div>
    </div>
  )
}
