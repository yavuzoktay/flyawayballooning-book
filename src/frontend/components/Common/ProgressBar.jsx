import React from 'react';

const ProgressBar = ({ sections, activeSection, onCircleClick, isMobile = false }) => {
  const completedCount = sections.filter(s => s.completed).length;
  const totalCount = sections.length;
  const fillPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
      padding: isMobile ? '15px 0' : '20px 0'
    }}>
      {/* Progress line background */}
      <div className="progress-line" style={{
        height: '4px',
        background: '#e5e7eb',
        position: 'relative',
        borderRadius: '2px',
        margin: `0 ${isMobile ? '16px' : '32px'}`
      }}>
        {/* Progress fill - blue line connecting completed sections */}
        <div 
          className="progress-fill" 
          style={{ 
            width: `${fillPercentage}%`,
            height: '100%',
            background: '#3b82f6', // Blue color for connecting line
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
        top: isMobile ? '-8px' : '-10px',
        width: '100%',
        padding: `0 ${isMobile ? '16px' : '32px'}`
      }}>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`circle ${getCircleClass(section)}`}
            onClick={() => onCircleClick && onCircleClick(section.id)}
            style={{
              width: isMobile ? '20px' : '32px',
              height: isMobile ? '20px' : '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 2,
              ...(section.completed ? {
                background: '#3b82f6',
                color: 'white',
                border: '3px solid #3b82f6',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
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
                ? '0 2px 4px rgba(59, 130, 246, 0.3)'
                : activeSection === section.id 
                ? '0 2px 8px rgba(3, 169, 244, 0.3)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            {section.completed && (
              <svg 
                width={isMobile ? '12' : '16'} 
                height={isMobile ? '12' : '16'} 
                viewBox="0 0 24 24" 
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
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
        marginTop: isMobile ? '25px' : '30px',
        fontSize: isMobile ? '12px' : '14px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        {completedCount} of {totalCount} steps completed
      </div>
    </div>
  );
};

export default ProgressBar;
