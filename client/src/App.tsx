import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Controls from './Controls';
import MapController from './MapController';

import "leaflet/dist/leaflet.css";
import { FindParams } from '../../shared/types/FindParams';

export default function App() {
  const [radius, setRadius] = useState(25);
  const [findParams, setFindParams] = useState<FindParams | null>(null);
  const [selectedMarkerContent, setSelectedMarkerContent] = useState<object | null>(null);

  const startDrag = (e: React.MouseEvent) => {
  const startX = e.clientX;

  const startWidth =
    document.querySelector(".controls")!.getBoundingClientRect().width;

  const onMove = (moveEvent: MouseEvent) => {
    const newWidth = startWidth + (moveEvent.clientX - startX);

    document.querySelector(".app")!.style.gridTemplateColumns =
      `${newWidth}px 6px 1fr`;
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

  return (
    <div className="app">
      <Controls radius={radius}
        setRadius={setRadius} 
        setFindParams={setFindParams} 
        selectedMarkerContent={selectedMarkerContent} 
        setSelectedMarkerContent={setSelectedMarkerContent}
        />
      <div
        className="divider"
        onMouseDown={startDrag}
       />  
      <div className="map">
      <MapContainer
        center={[40, -95]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController radius={radius} 
          findParams={findParams} 
          setSelectedMarkerContent={setSelectedMarkerContent} />
      </MapContainer>
      </div>
    </div>
  );
}