import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function NeoDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize view date to value or today
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Derived state for calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Format the display value
  const displayValue = value 
    ? new Date(value).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: 'numeric', minute: '2-digit', hour12: true 
      }) 
    : 'Select Date & Time';

  const handlePrevMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(year, month, day);
    // preserve time if value exists
    if (value) {
      const prev = new Date(value);
      newDate.setHours(prev.getHours(), prev.getMinutes());
    } else {
      newDate.setHours(18, 0); // Default to 6 PM
    }
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (e) => {
    const [h, m] = e.target.value.split(':');
    const newDate = value ? new Date(value) : new Date(year, month, new Date().getDate());
    newDate.setHours(parseInt(h, 10), parseInt(m, 10));
    onChange(newDate.toISOString());
  };

  // Get HH:MM format for native time input
  const timeValue = value ? (() => {
    const d = new Date(value);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  })() : '18:00';

  const isSelected = (day) => {
    if (!value) return false;
    const v = new Date(value);
    return v.getDate() === day && v.getMonth() === month && v.getFullYear() === year;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="neo-datepicker" ref={containerRef} style={{ position: 'relative' }}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '8px',
          border: '2px solid var(--color-black)',
          backgroundColor: 'var(--color-white)',
          fontFamily: 'var(--font-secondary)',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: isOpen ? 'inset 2px 2px 0 var(--color-black)' : '2px 2px 0 var(--color-black)',
          transition: 'all 0.1s ease',
        }}
      >
        <span>{displayValue}</span>
        <Calendar size={18} />
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '280px',
            backgroundColor: 'var(--color-cream)',
            border: '2.5px solid var(--color-black)',
            borderRadius: '10px',
            boxShadow: '4px 4px 0 var(--color-black)',
            zIndex: 1000,
            padding: '14px',
            animation: 'slideUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button 
              type="button" 
              onClick={handlePrevMonth}
              style={{
                background: 'var(--color-white)', border: '2px solid var(--color-black)', borderRadius: '6px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '2px 2px 0 var(--color-black)', cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontWeight: 900, fontSize: '15px', textTransform: 'uppercase' }}>
              {MONTHS[month]} {year}
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              style={{
                background: 'var(--color-white)', border: '2px solid var(--color-black)', borderRadius: '6px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '2px 2px 0 var(--color-black)', cursor: 'pointer'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#666' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
            {/* Empty slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Day slots */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: selected ? 900 : (today ? 800 : 600),
                    backgroundColor: selected ? 'var(--color-yellow)' : (today ? 'var(--color-mint)' : 'var(--color-white)'),
                    border: '2px solid var(--color-black)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: selected ? 'inset 2px 2px 0 var(--color-black)' : '2px 2px 0 var(--color-black)',
                    transition: 'all 0.1s ease',
                    color: 'var(--color-black)'
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Selector */}
          <div style={{ borderTop: '2px dashed var(--color-black)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-black)' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', flex: 1 }}>Time</span>
            <input 
              type="time" 
              value={timeValue}
              onChange={handleTimeChange}
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                fontWeight: 800,
                borderRadius: '6px',
                border: '2px solid var(--color-black)',
                backgroundColor: 'var(--color-white)',
                fontFamily: 'var(--font-secondary)',
                boxShadow: '2px 2px 0 var(--color-black)',
                outline: 'none',
              }}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '8px',
              backgroundColor: 'var(--color-blue)',
              border: '2px solid var(--color-black)',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '12px',
              textTransform: 'uppercase',
              boxShadow: '2px 2px 0 var(--color-black)',
              cursor: 'pointer',
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
