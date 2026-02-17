import { useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FindParams } from '../../shared/types/FindParams';

interface ControlsProps {
  radius: number,
  setRadius: React.Dispatch<React.SetStateAction<number>>,
  setFindParams: React.Dispatch<React.SetStateAction<FindParams | null>>
}

function Controls(
  { radius, setRadius, setFindParams }: ControlsProps
) {
  const [selection, setSelection] = useState("");
 
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFindParams({ selection, radius, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() });
  };

  return (
    <header className="controls">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 whitespace-nowrap">
        <label>
          Dataset
          <select
            value={selection}
            onChange={(e) => setSelection(e.target.value)}>
            <option value="">--</option>
            <option value="ticket_master">Ticket Master</option>
          </select>
        </label>

        <label>
          Radius (miles)
          <input
            type="number"
            value={radius}
            min={10}
            onChange={(e) => setRadius(+e.target.value)}
          />
        </label>

<label className="inline-flex">
      <span className="text-sm">Date Range:</span>
      <DatePicker
        selected={startDate}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        placeholderText="Start date"
        onChange={(date: Date | null) => setStartDate(date)}
      />
      <DatePicker
        selected={endDate}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        placeholderText="End date"
        onChange={(date: Date | null) => setEndDate(date)}
      />

      </label>
        <button type="submit" disabled={!selection}>
          Find
        </button>
      </form>
    </header>
  );
}

export default Controls
