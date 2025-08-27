import React from "react";

const Modal = ({ isOpen, onClose, title, bulletPoints = [], extraContent, showCloseButton = false, actionButtons }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="common-modal" style={title === 'Request Date' ? { maxWidth: 420, minWidth: 340, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 0' } : {}}>
                {/* Close Button (X) */}
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '20px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                            fontWeight: 'bold',
                            lineHeight: '1',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Close"
                    >
                        ×
                    </button>
                )}
                
                <h2 className="text-xl font-semibold mb-4" style={{ textAlign: 'center' }}>{title}</h2>
                {bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-2">
                        {bulletPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                        ))}
                        {extraContent && (
                            <li className="mt-4">{extraContent}</li>
                        )}
                    </ul>
                )}
                {bulletPoints.length === 0 && extraContent}
                
                {/* Action Buttons */}
                {actionButtons && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginTop: '24px',
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        {actionButtons}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
