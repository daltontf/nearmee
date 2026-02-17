import React, { useEffect, useState } from 'react';
import L, { LatLngExpression } from 'leaflet';
import { Circle, GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import Controls from './Controls';
import { buildUrl } from 'build-url-ts';

import "leaflet/dist/leaflet.css"
import { FindParams } from '../../shared/types/FindParams';

type GeoJsonData = GeoJSON.GeoJsonObject;

interface MapControllerProps {
  radius: number;
  findParams: FindParams | null;
  setGeoJson: React.Dispatch<React.SetStateAction<any>>;
}

function MapController({ radius, findParams, setGeoJson }: MapControllerProps) {
  const map = useMap();

  const [center, setCenter] = useState<LatLngExpression>(map.getCenter());

  useMapEvents({
    moveend: () => {
      setCenter(map.getCenter());
    },
  });

  useEffect(() => {
    if (!findParams) return;

    const coords = map.getCenter();

    console.log('find:', findParams);

    if (findParams.selection === 'ticket_master') {
      fetch(
        buildUrl('http://localhost:3001', {
          path: '/api/ticket_master',
          queryParams: {
            apikey: 'XgA5FIqeWKjUegq2BoG9W1k7HMqrGFn4',
            latlong: `${coords.lat},${coords.lng}`,
            radius: findParams.radius,
            unit: 'miles',
            locale: '*',
            startDateTime: findParams.startDate?.replace(/\.\d{3}Z$/, "Z"),
            endDateTime: findParams.endDate?.replace(/\.\d{3}Z$/, "Z"),
            page: 1,
          },
        })
      ).then((res) => res.json())
        .then((json) => {
          console.log('Fetched data:', json);

          let markers: L.Marker[] = [];

          for (const [key, value] of Object.entries(json)) {
            const [lat, lng] = key.split('|').map(parseFloat);
            const marker = L.marker([lat, lng], { _custom: true }).addTo(map);
            marker.bindPopup(value as string);
            markers.push(marker);
          }

          return () => {
            markers?.forEach((marker: any) => {
              if ((marker as any)._custom) {
                map.removeLayer(marker);
              }
            })
          }
        })
    }
  }, [findParams, map, setGeoJson]); 

  return (
    <Circle
      center={center}
      radius={radius * 1000} // if radius is in km
      pathOptions={{ 
        color: "blue",
        fillOpacity: 0.001,
      }}
    />
  );

}

function App() {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [radius, setRadius] = useState(10);
  const [findParams, setFindParams] = useState<{
    selection: string;
    radius: number;
    startDate: string | undefined;
    endDate: string | undefined;
  } | null>(null);
  return (
    <div>
      <Controls radius={radius} setRadius={setRadius} setFindParams={setFindParams} />
      <MapContainer
        center={[40, -95]}
        zoom={4}
        style={{ height: '96vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoJson && <GeoJSON data={geoJson} />}
        <MapController radius={radius} findParams={findParams} setGeoJson={setGeoJson} />
      </MapContainer>
    </div>
  );
}

export default App;
