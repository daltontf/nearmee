import React, { useEffect, useState } from 'react';
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
    
    const map = useMap();

    // disable default zoom on double click
    map.doubleClickZoom.disable();

    map.on("dblclick", (e) => {
      const currentZoom = map.getZoom();

      map.setView(e.latlng, currentZoom, {
        animate: true
      });
    });

    const [center, setCenter] = useState<LatLngExpression>(map.getCenter());

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

            let markers: L.CircleMarker[] = [];

            for (const [key, value] of Object.entries(json)) {
              const [lat, lng] = key.split('|').map(parseFloat);
              const marker = L.circleMarker([lat, lng], { _custom: true }).addTo(map);
              marker.addEventListener('click', (e) => {
                setSelectedMarkerContent(value as object);
                map.flyTo([lat, lng], map.getZoom());
              });
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