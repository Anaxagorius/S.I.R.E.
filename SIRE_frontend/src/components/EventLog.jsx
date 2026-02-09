import React, { useEffect, useRef } from 'react';

const EventLog = ({ events }) => {
  const logEndRef = useRef(null);
  
  useEffect(() => {
    // Auto-scroll to latest event
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);
  
  const getEventClass = (event) => {
    if (event.actorRole === 'admin') return 'event-admin';
    if (event.actorRole === 'timeline') return 'event-timeline';
    if (event.actorRole === 'trainee') return 'event-trainee';
    return 'event-default';
  };
  
  const getEventIcon = (event) => {
    if (event.actorRole === 'admin') return '⚠️';
    if (event.actorRole === 'timeline') return '🕐';
    if (event.actorRole === 'trainee') return '👤';
    return '•';
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className="event-log">
      <h3>Activity Feed</h3>
      <div className="event-list">
        {events.length === 0 ? (
          <p className="no-events">No events yet. Waiting for session to start...</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className={`event-item ${getEventClass(event)}`}>
              <div className="event-header">
                <span className="event-icon">{getEventIcon(event)}</span>
                <span className="event-time">{formatTime(event.timestampIso)}</span>
                {event.displayName && (
                  <span className="event-author">{event.displayName}</span>
                )}
              </div>
              <div className="event-content">
                <p className="event-action">{event.action}</p>
                {event.rationale && (
                  <p className="event-rationale">Rationale: {event.rationale}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default EventLog;
