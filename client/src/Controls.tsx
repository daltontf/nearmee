import { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";
import { FindParams } from '../../shared/types/FindParams';

import "react-datepicker/dist/react-datepicker.css";

interface ControlsProps {
  radius: number,
  selectedCategory?: string,
  setRadius: React.Dispatch<React.SetStateAction<number>>,
  setFindParams: React.Dispatch<React.SetStateAction<FindParams | null>>,
  selectedMarkerContent?: object | null,
  focusedLatLngKey?: string | null,
  setSelectedMarkerContent: React.Dispatch<React.SetStateAction<object | null>>,
  setRemoveMarkerLatLngKey: React.Dispatch<React.SetStateAction<string | null>>,
  setRemoveEventId: React.Dispatch<React.SetStateAction<string | null>>,
}

export default function Controls(
  { radius,
    setRadius,
    setFindParams,
    selectedMarkerContent,
    setSelectedMarkerContent,
    focusedLatLngKey, 
    setRemoveMarkerLatLngKey, 
    setRemoveEventId,
    }: ControlsProps
) {
  const [selection, setSelection] = useState<string>("");
  const [options, setOptions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(new Date);
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const handleSubmit = () => {
    setFindParams({ selection, selectedCategory, radius, startDate: toLocalISOString(startDate as Date), endDate: toLocalISOString(endDate as Date) });
  };

  const handleTrashEvent = () => {
    setSelectedMarkerContent(null);
    if (focusedLatLngKey) {
      setRemoveMarkerLatLngKey(focusedLatLngKey);
    }
  }

  const handleRemoveVenueEvent = (key: string, id) => {
    if (!selectedMarkerContent) return;
    setRemoveEventId(id)
    const updatedContent = { ...selectedMarkerContent };
    delete updatedContent[key];
    setSelectedMarkerContent(updatedContent);
  }

  const toLocalISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  useEffect(() => {
    if (selection) {
      fetch('http://localhost:3001/api/ticket_master/classifications')
        .then(res => res.json())
        .then(json => setOptions(json))
        .catch(err => console.error('Error fetching classifications:', err));
    } else {
      setOptions([]);
    }
  }, [selection])

  return (
    <div className='controls'>
      <label>Dataset:</label>
      <select
        value={selection}
        onChange={(e) => setSelection(e.target.value)}>
        <option value="">--</option>
        <option value="ticket_master">Ticket Master</option>
      </select>


      <label>Sub-Category:</label>
      <select onChange={(e) => setSelectedCategory(e.target.value)} disabled={selection === ""}>
        <option value="">--</option>
        {options.map(opt => (
          <option key={opt.id}>{opt.name}</option>
        ))}
      </select>

      <label>Radius (miles):</label>
      <input
        type="number"
        value={radius}
        min={10}
        onChange={(e) => setRadius(+e.target.value)}
      />

      <label>Start Date:</label>
      <DatePicker
        selected={startDate}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        placeholderText="Start date"
        onChange={(date: Date | null) => setStartDate(date)}
      />
      <label>End Date:</label>
      <DatePicker
        selected={endDate}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        placeholderText="End date"
        onChange={(date: Date | null) => setEndDate(date)}
      />

      <button type="button" onClick={handleSubmit} disabled={!selection && !startDate && !endDate}>
        Find
      </button>
      {selectedMarkerContent && (
        <div className="venue-events">
          <button
                className="trash-btn"
                type="button" 
                onClick={(e) => handleTrashEvent()}              
              >&#x1F5D1;</button>
          {Object.entries(selectedMarkerContent).map(([key, value]) => (
            <div className="venue-event">
              <button
                className="close-btn"
                type="button"
                onClick={(e) => handleRemoveVenueEvent(key, value.id as string)}
              >
                ×
              </button>
              <p>{value.name}</p>
              <p>{value.localDate} {(value as any).localTime}</p>
              <p>{value.venue}</p>
              <p><a href={`${value.url}`} target="_blank">View Event</a></p>
              <p>{value.classifications} {value.genre} {value.subGenre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
