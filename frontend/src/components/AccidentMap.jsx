import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SEVERITY_COLORS = {
    0: '#10b981',
    1: '#f59e0b',
    2: '#f97316',
    3: '#ef4444',
}

export default function AccidentMap({ location, severity }) {
    const { lat, lng, address } = location

    const icon = L.divIcon({
        html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${SEVERITY_COLORS[severity]};
        border:3px solid white;
        box-shadow:0 0 16px ${SEVERITY_COLORS[severity]},0 0 32px ${SEVERITY_COLORS[severity]}80;
        display:flex;align-items:center;justify-content:center;
        animation:pulse 1.5s ease-in-out infinite;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    })

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={14}
            style={{ height: '200px', width: '100%', borderRadius: '12px' }}
            zoomControl={false}
            scrollWheelZoom={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=""
            />
            <Circle
                center={[lat, lng]}
                radius={200}
                pathOptions={{
                    color: SEVERITY_COLORS[severity],
                    fillColor: SEVERITY_COLORS[severity],
                    fillOpacity: 0.15,
                    weight: 2,
                }}
            />
            <Marker position={[lat, lng]} icon={icon}>
                <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                        <strong>Incident Location</strong><br />
                        {address}<br />
                        <span style={{ color: SEVERITY_COLORS[severity], fontWeight: 600 }}>
                            {['No Accident', 'Minor', 'Moderate', 'Severe'][severity]}
                        </span>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    )
}
