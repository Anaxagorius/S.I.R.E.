import React, { useEffect, useRef } from 'react';

const SEVERITY_LABELS = { info: 'ℹ Info', warning: '⚠ Warning', critical: '🚨 Critical' };
const SEVERITY_CLASSES = { info: 'severity-info', warning: 'severity-warning', critical: 'severity-critical' };

const EventLog = ({ events }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getEventClass = (event) => {
    if (event.actorRole === 'admin') {
      const sev = event.rationale;
      if (sev === 'critical') return 'event-admin event-critical';
      if (sev === 'warning') return 'event-admin event-warning';
      return 'event-admin event-info';
    }
    if (event.actorRole === 'timeline') return 'event-timeline';
    if (event.actorRole === 'trainee') return 'event-trainee';
    return 'event-default';
  };

  const getEventIcon = (event) => {
    if (event.actorRole === 'admin') {
      if (event.rationale === 'critical') return '🚨';
      if (event.rationale === 'warning') return '⚠️';
      return 'ℹ️';
    }
    if (event.actorRole === 'timeline') return '🕐';
    if (event.actorRole === 'trainee') return '👤';
    return '•';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityBadge = (event) => {
    if (event.actorRole !== 'admin' || !event.rationale) return null;
    const label = SEVERITY_LABELS[event.rationale];
    const cls = SEVERITY_CLASSES[event.rationale] || '';
    if (!label) return null;
    return <span className={`severity-badge ${cls}`}>{label}</span>;
  };

  return (
    <div className="event-log">
      <h3>Activity Feed</h3>
      <div className="event-list">
        {events.length === 0 ? (
          <p className="no-events">No events yet. Waiting for session to start…</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className={`event-item ${getEventClass(event)}`}>
              <div className="event-header">
                <span className="event-icon">{getEventIcon(event)}</span>
                <span className="event-time">{formatTime(event.timestampIso)}</span>
                {event.displayName && (
                  <span className="event-author">{event.displayName}</span>
                )}
                {getSeverityBadge(event)}
              </div>
              <div className="event-content">
                <p className="event-action">{event.action}</p>
                {event.actorRole !== 'admin' && event.rationale && (
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
