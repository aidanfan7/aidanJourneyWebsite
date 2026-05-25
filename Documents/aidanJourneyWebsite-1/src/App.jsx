import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import AddLocationModal from './components/AddLocationModal'
import LocationDetail from './components/LocationDetail'
import AddRoadTripModal from './components/AddRoadTripModal'

const STORAGE_KEY = 'travel_data'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { locations: [], roadTrips: [] }
}

export default function App() {
  const [data, setData] = useState(loadData)
  const [pendingCoords, setPendingCoords] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeTrip, setActiveTrip] = useState(null)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const handleMapClick = (latlng) => {
    if (selectedLocation) {
      setSelectedLocation(null)
      return
    }
    setPendingCoords(latlng)
  }

  const handleSaveLocation = (locationData) => {
    const newLocation = {
      id: crypto.randomUUID(),
      ...locationData,
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
    }
    setData(d => ({ ...d, locations: [...d.locations, newLocation] }))
    setPendingCoords(null)
  }

  const handleUpdateLocation = (updated) => {
    setData(d => ({
      ...d,
      locations: d.locations.map(l => l.id === updated.id ? updated : l),
    }))
    setSelectedLocation(updated)
  }

  const handleDeleteLocation = (id) => {
    setData(d => ({ ...d, locations: d.locations.filter(l => l.id !== id) }))
    setSelectedLocation(null)
  }

  const handleSaveTrip = (trip) => {
    const newTrip = { id: crypto.randomUUID(), ...trip }
    setData(d => ({ ...d, roadTrips: [...d.roadTrips, newTrip] }))
    setShowAddTrip(false)
  }

  const handleUpdateTrip = (updated) => {
    setData(d => ({
      ...d,
      roadTrips: d.roadTrips.map(t => t.id === updated.id ? { ...t, ...updated } : t),
    }))
    if (activeTrip?.id === updated.id) setActiveTrip(prev => ({ ...prev, ...updated }))
    setEditingTrip(null)
  }

  const handleDeleteTrip = (id) => {
    setData(d => ({ ...d, roadTrips: d.roadTrips.filter(t => t.id !== id) }))
    if (activeTrip?.id === id) setActiveTrip(null)
  }

  const handleSelectTrip = (trip) => {
    setActiveTrip(prev => prev?.id === trip.id ? null : trip)
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: '#000' }}>
      <Sidebar
        locations={data.locations}
        roadTrips={data.roadTrips}
        activeTrip={activeTrip}
        onSelectTrip={handleSelectTrip}
        onSelectLocation={setSelectedLocation}
        onAddTrip={() => setShowAddTrip(true)}
        onEditTrip={setEditingTrip}
        onDeleteTrip={handleDeleteTrip}
      />

      <div className="flex-1 relative">
        <MapView
          locations={data.locations}
          roadTrips={data.roadTrips}
          activeTrip={activeTrip}
          selectedLocation={selectedLocation}
          onMapClick={handleMapClick}
          onMarkerClick={setSelectedLocation}
        />
        {selectedLocation && (
          <LocationDetail
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
          />
        )}
      </div>

      {pendingCoords && (
        <AddLocationModal
          onSave={handleSaveLocation}
          onClose={() => setPendingCoords(null)}
        />
      )}
      {showAddTrip && (
        <AddRoadTripModal
          onSave={handleSaveTrip}
          onClose={() => setShowAddTrip(false)}
        />
      )}
      {editingTrip && (
        <AddRoadTripModal
          initialData={editingTrip}
          onSave={handleUpdateTrip}
          onClose={() => setEditingTrip(null)}
        />
      )}
    </div>
  )
}
