import { useEffect, useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { DatePicker } from "react-datepicker";
import { FindParams } from '../../shared/types/FindParams';
import { Calendar } from 'react-calendar';

import 'react-tabs/style/react-tabs.css';
import "react-datepicker/dist/react-datepicker.css";
import 'react-calendar/dist/Calendar.css';

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
 
type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const dateEventMap = new Map<string, [object]>();

export default function Controls (
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
  const [dateValue, setDateValue] = useState<Value>(new Date());
  const [selectedDateContent, setSelectedDateContent] = useState<object[] | null>(null);

  const handleSubmit = () => {
    setFindParams({ selection, selectedCategory, radius, startDate: toLocalISOString(startDate as Date), endDate: toLocalISOString(startDate as Date) });
  };

  const handleRemoveVenueEvent = (key: string, id) => {
    if (!selectedMarkerContent) return;
    setRemoveEventId(id)
    const updatedContent = { ...selectedMarkerContent };
    delete updatedContent[key];
    setSelectedMarkerContent(updatedContent);
  }

  const handleCalendarDeleteEvent = (key: string, id: string) => {
    const events = dateEventMap.get(key) as [object];
    const updatedEvents = events.filter((event: any) => event.id !== id);
    if (updatedEvents.length > 0) {
      dateEventMap.set(key, updatedEvents);
    } else {
      dateEventMap.delete(key);
    }

    fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events/${id}`, {
        method: 'DELETE'
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to delete event');
        }
      }).catch(err => console.error('Error deleting event:', err));
    
    setSelectedDateContent(updatedEvents.length > 0 ? updatedEvents : null);
  }

  const scheduleVenueEvent = (value: any, updateDb: boolean = true) => {
    if (dateEventMap.has(value.localStartDate)) {
      let events = dateEventMap.get(value.localStartDate) as [object];
      if (events.some((event: any) => event.id !== value.id)) { // prevent duplicates
        events.push(value);
        events.sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        dateEventMap.set(value.localStartDate, events);
      }
    } else {
      dateEventMap.set(value.localStartDate, [value]);
    }

    if (updateDb) {
    fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to save event');
        }
      })
      .catch(err => console.error('Error saving event:', err));
    }
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
    // initialization logic here
    console.log("Component mounted");
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`)
      .then(res => res.json())
      .then(json => {
        Object.entries(json).forEach(([key, value]) => {
          scheduleVenueEvent(value as any, false);
        });
      })
      .catch(err => console.error('Error fetching calendar events:', err));

    // optional cleanup
    return () => {
      console.log("Component unmounted");
    };
  }, []);

  useEffect(() => {
    if (selection) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ticket_master/classifications`)
        .then(res => res.json())
        .then(json => setOptions(json))
        .catch(err => console.error('Error fetching classifications:', err));
    } else {
      setOptions([]);
    }
  }, [selection])

  useEffect(() => {
    if (dateValue) {
      const dateStr = (typeof dateValue === 'object' && dateValue !== null) ? (dateValue as Date).toISOString().substring(0, 10) : null;
      setSelectedDateContent(dateEventMap.get(dateStr) || null);
    } else {
      setSelectedDateContent(null);
    }
  }, [dateValue])

  function tileDisabled({ date, view }) {
    if (view === 'month') {
      return !dateEventMap.has(date.toISOString().substring(0, 10));
    }
    return false;
  }

  return (
    <Tabs>
      <TabList>
        <Tab>Find Event</Tab>
        <Tab>Saved To Calendar</Tab>
      </TabList>
      <TabPanel>
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

          <label>Event Date:</label>
          <DatePicker
            selected={startDate}
            selectsStart
            startDate={startDate}
            placeholderText="Event Date"
            onChange={(date: Date | null) => setStartDate(date)}
          />

          <button type="button" onClick={handleSubmit} disabled={!selection && !startDate && !endDate}>
            Find
          </button>


          {selectedMarkerContent && (
            <div className="venue-events">
              {Object.entries(selectedMarkerContent).map(([key, value]) => (
                <div className="venue-event">
                  <div className="button-bar">
                    <button
                      className="calendar-btn"
                      type="button"
                      onClick={(e) => scheduleVenueEvent(value as any)}
                      >&#x1F4C5;</button>
                    <button
                      className="close-btn"
                      type="button"
                      onClick={(e) => handleRemoveVenueEvent(key, value.id as string)}
                    >&#x1F5D1;</button>
                  </div>
                  <p>{value.name}</p>
                  <p>{value.localStartDate} {value.localStartTime} - {value.localEndDate} {value.localEndTime}</p>
                  <p>{value.venue}</p>
                  <p><a href={`${value.url}`} target="_blank">View Event</a></p>
                  {[value.classifications, value.genres, value.subGenres]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              ))}
            </div>
          )}
        </div>
      </TabPanel>
      <TabPanel>
        <div className='controls'>
          <Calendar 
            onChange={setDateValue}
            value={dateValue}
            defaultView="month"
            calendarType="gregory"
            tileDisabled={tileDisabled}
            />
          {selectedDateContent && (
            <div className="date-events">
              {selectedDateContent.map((value: any) => (
                <div className="date-event">
                  <div className="button-bar">
                    <button
                      className="close-btn"
                      type="button"
                      onClick={(e) => handleCalendarDeleteEvent(value.localStartDate, value.id as string)}
                    >&#x1F5D1;</button>
                  </div>
                  <p>{value.name}</p>
                  <p>{value.localStartDate} {value.localStartTime} - {value.localEndDate} {value.localEndTime}</p>
                  <p>{value.venue}</p>
                  <p><a href={`${value.url}`} target="_blank">View Event</a></p>
                  {[value.classifications, value.genres, value.subGenres]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              ))}
            </div>
          )}
        </div>
      </TabPanel>
    </Tabs>
  );
}
