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
  const fillPercentage = totalCount > 0 ? ((nextFillIndex + 0.5) / totalCount) * 100 : 0;

  const getCircleClass = (section) => {
    if (section.completed) return 'completed';
    if (activeSection === section.id) return 'active';
    return 'incomplete';
  };

  return (
    <div className="progress-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      padding: isMobile ? '10px 0' : '15px 0',
      backgroundColor: '#ffffff'
    }}>
      {/* Progress line background */}
      <div className="progress-line" style={{
        height: '6px',
        background: '#e5e7eb',
        position: 'relative',
        borderRadius: '3px',
        margin: `0 ${isMobile ? '20px' : '40px'}`
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
        top: isMobile ? '-12px' : '-15px',
        width: '100%',
        padding: `0 ${isMobile ? '20px' : '40px'}`
      }}>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`circle ${getCircleClass(section)}`}
            onClick={() => onCircleClick && onCircleClick(section.id)}
            style={{
              width: isMobile ? '24px' : '36px',
              height: isMobile ? '24px' : '36px',
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
                border: '3px solid #00eb5b',
                boxShadow: '0 2px 4px rgba(0, 235, 91, 0.3)'
              } : activeSection === section.id ? {
                background: 'white',
                border: '3px solid #03a9f4',
                boxShadow: '0 2px 8px rgba(3, 169, 244, 0.3)'
              } : {
                background: 'white',
                border: '3px solid #d1d5db',
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
                ? '0 2px 4px rgba(0, 235, 91, 0.3)'
                : activeSection === section.id 
                ? '0 2px 8px rgba(3, 169, 244, 0.3)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            {section.completed && (
              <span
                style={{
                  pointerEvents: 'none',
                  fontSize: isMobile ? '16px' : '20px',
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
        marginTop: isMobile ? '20px' : '25px',
        fontSize: isMobile ? '13px' : '15px',
        color: '#374151',
        fontWeight: '600'
      }}>
        {completedCount} of {totalCount} steps completed
      </div>
    </div>
  );
};

export default ProgressBar;
