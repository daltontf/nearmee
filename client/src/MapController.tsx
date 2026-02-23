import React, { useEffect, useRef, useState } from 'react';
import L, { LatLngExpression } from 'leaflet';
import { Circle, useMap, useMapEvents } from 'react-leaflet';
import { buildUrl } from 'build-url-ts';
import { FindParams } from '../../shared/types/FindParams';

export interface MapControllerProps {
  radius: number;
  findParams: FindParams | null;
  setSelectedMarkerContent: React.Dispatch<React.SetStateAction<object | null>>;
}

export default function MapController(
  { radius, findParams, setSelectedMarkerContent }: MapControllerProps ) {

    const markerColor = "dodgerblue";
       
    const map = useMap();

    const [center, setCenter] = useState<LatLngExpression>(map.getCenter());
    const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
    const [focusedLatLngKey, setFocusedLatLngKey] = useState<string | null>(null);

    // disable default zoom on double click
    map.doubleClickZoom.disable();

    map.on("dblclick", (e) => {
      const currentZoom = map.getZoom();

      map.setView(e.latlng, currentZoom, {
        animate: true
      });
    });

    useMapEvents({
      move: () => {
        setCenter(map.getCenter());
      },
    });

    // Watch for container resize (e.g. divider drag) and notify Leaflet
    useEffect(() => {
      const container = map.getContainer();
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, [map]);

    useEffect(() => {
      markersRef.current.forEach((marker, _) => {
        marker.setStyle({
          color: marker.options.latlngKey === focusedLatLngKey ? "green" : markerColor
        });
      });
    }, [focusedLatLngKey]);

    useEffect(() => {
      if (!findParams) return;

      const coords = map.getCenter();

      console.log('find:', findParams);

      if (findParams.selection === 'ticket_master') {
        fetch(
          buildUrl('http://localhost:3001', {
            path: '/api/ticket_master/events',
            queryParams: {
              latlong: `${coords.lat},${coords.lng}`,
              segmentName: findParams.selectedCategory,
              radius: findParams.radius,
              unit: 'miles',
              locale: '*',
              localStartEndDateTime: findParams.startDate?.substring(0, 10) + 'T00:00:00,' +
                                     findParams.endDate?.substring(0, 10) + 'T23:59:59'
            },
          })
        ).then((res) => res.json())
          .then((json) => {
            console.log('Fetched data:', json);


            for (const [key, value] of Object.entries(json)) {
              const [lat, lng] = key.split('|').map(parseFloat);
              const marker = L.circleMarker([lat, lng], { 
                 color: markerColor,
                 latlngKey: key 
                }).addTo(map);
              marker.addEventListener('click', (e) => {
                setFocusedLatLngKey(key)
                setSelectedMarkerContent(value as object);
                map.flyTo([lat, lng], map.getZoom());
              });
              markersRef.current.set(key, marker);
            }
          })
      }
    }, [findParams, map]);

    return (
      <Circle
        center={center}
        radius={radius * 1609.344}
        pathOptions={{
          color: "blue",
          fillOpacity: 0.001,
        }}
      />
    );
  }