import React from 'react';

const TimelineDisplay = ({ timeline, currentIndex }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="timeline-display">
        <p className="no-timeline">No timeline available. Start the scenario to begin.</p>
      </div>
    );
  }
  
  const currentEvent = timeline[currentIndex];
  const pastEvents = timeline.slice(0, currentIndex);
  
  return (
    <div className="timeline-display">
      <h3>Scenario Timeline</h3>
      
      {currentEvent && (
        <div className="timeline-current">
          <div className="timeline-badge">Current Event</div>
          <h4>{currentEvent.title}</h4>
          <p>{currentEvent.description}</p>
          <span className="timeline-index">Event {currentEvent.index + 1} of {timeline.length}</span>
        </div>
      )}
      
      {pastEvents.length > 0 && (
        <div className="timeline-past">
          <h4>Previous Events</h4>
          <div className="timeline-past-list">
            {pastEvents.map((event) => (
              <div key={event.index} className="timeline-past-item">
                <span className="timeline-past-number">{event.index + 1}</span>
                <span className="timeline-past-title">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {currentIndex < timeline.length - 1 && (
        <div className="timeline-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / timeline.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            {currentIndex + 1} / {timeline.length} events completed
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineDisplay;
