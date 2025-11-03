import React from 'react';

const ProgressBar = ({ sections, activeSection, onCircleClick, isMobile = false }) => {
  const completedCount = sections.filter(s => s.completed).length;
  const totalCount = sections.length;
  
  // Find the next section to fill up to (either completed or active)
  const getNextFillIndex = () => {
    // Find the last completed section
    const lastCompletedIndex = sections.findLastIndex(s => s.completed);
    
    // If there's an active section after the last completed, fill to that
    const activeIndex = sections.findIndex(s => s.id === activeSection);
    
    if (activeIndex > lastCompletedIndex) {
      return activeIndex;
    }
    
    // Otherwise, fill to the last completed section
    return lastCompletedIndex;
  };
  
  const nextFillIndex = getNextFillIndex();
  // Calculate percentage to stop at the center of the next circle
  // For space-between layout, adjust the calculation
  const fillPercentage = totalCount > 0 ? (() => {
    if (totalCount === 1) return 100;
    // If all sections are completed, fill to 100%
    if (nextFillIndex === totalCount - 1 && sections[nextFillIndex]?.completed) {
      return 100;
    }
    // For space-between, each section takes up equal space
    // The formula accounts for the spacing between circles
    const sectionWidth = 100 / (totalCount - 1);
    const fillTo = nextFillIndex * sectionWidth;
    return Math.min(fillTo, 100);
  })() : 0;

  const getCircleClass = (section) => {
    if (section.completed) return 'completed';
    if (activeSection === section.id) return 'active';
    return 'incomplete';
  };

  return (
    <div className="progress-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '700px', // Reduced from 900px
      margin: '0 auto',
      padding: isMobile ? '8px 0' : '12px 0' // Reduced padding
    }}>
      {/* Progress line background */}
      <div className="progress-line" style={{
        height: '4px', // Reduced from 6px
        background: '#e5e7eb',
        position: 'relative',
        borderRadius: '2px',
        margin: `0 ${isMobile ? '16px' : '32px'}` // Reduced margins
      }}>
        {/* Progress fill - green line connecting completed sections */}
        <div 
          className="progress-fill" 
          style={{ 
            width: `${fillPercentage}%`,
            height: '100%',
            background: '#00eb5b', // Exact same green as summary screen
            transition: 'width 0.5s ease',
            borderRadius: '2px'
          }} 
        />
      </div>

      {/* Circles container */}
      <div className="progress-circles" style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'absolute',
        top: isMobile ? '-10px' : '-12px', // Adjusted for smaller circles
        width: '100%',
        padding: `0 ${isMobile ? '16px' : '32px'}` // Reduced padding
      }}>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`circle ${getCircleClass(section)}`}
            onClick={() => onCircleClick && onCircleClick(section.id)}
            style={{
              width: isMobile ? '20px' : '28px', // Reduced sizes
              height: isMobile ? '20px' : '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 2,
              ...(section.completed ? {
                background: '#00eb5b',
                color: 'white',
                border: '2px solid #00eb5b', // Reduced border thickness
                boxShadow: '0 1px 3px rgba(0, 235, 91, 0.3)' // Reduced shadow
              } : activeSection === section.id ? {
                background: 'white',
                border: '2px solid #03a9f4', // Reduced border thickness
                boxShadow: '0 1px 6px rgba(3, 169, 244, 0.3)' // Reduced shadow
              } : {
                background: 'white',
                border: '2px solid #d1d5db', // Reduced border thickness
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = section.completed 
                ? '0 1px 3px rgba(0, 235, 91, 0.3)'
                : activeSection === section.id 
                ? '0 1px 6px rgba(3, 169, 244, 0.3)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            {section.completed && (
              <span
                style={{
                  pointerEvents: 'none',
                  fontSize: isMobile ? '12px' : '14px', // Reduced font size
                  fontWeight: 'bold',
                  lineHeight: 1,
                  color: 'white'
                }}
              >
                ✓
              </span>
            )}
            
            {/* Tooltip */}
            <div 
              className="circle-tooltip" 
              style={{
                position: 'absolute',
                bottom: '-35px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? '10px' : '11px',
                whiteSpace: 'nowrap',
                color: '#6b7280',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              {section.title}
            </div>
          </div>
        ))}
      </div>

      {/* Progress percentage text */}
      <div style={{
        textAlign: 'center',
        marginTop: isMobile ? '15px' : '18px', // Reduced margin
        fontSize: isMobile ? '11px' : '13px', // Reduced font size
        color: '#374151',
        fontWeight: '600'
      }}>
        {completedCount} of {totalCount} steps completed
      </div>
    </div>
  );
};

export default ProgressBar;
