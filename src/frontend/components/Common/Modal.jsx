import React from "react";

const Modal = ({ isOpen, onClose, title, bulletPoints = [], extraContent, showCloseButton = false, actionButtons }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'rgba(0,0,0,0.35)', zIndex: 1000 }}>
            <div
                className="common-modal"
                style={{
                    width: 'calc(100vw - 16px)', // ensure we never exceed viewport
                    maxWidth: '600px',
                    background: '#fff',
                    borderRadius: 12,
                    padding: window.innerWidth <= 768 ? '12px 8px' : '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    maxHeight: 'calc(100vh - 16px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxSizing: 'border-box'
                }}
            >
                {/* Close Button (X) */}
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '16px',
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

                <h2 className="text-xl font-semibold mb-4" style={{ textAlign: 'center', margin: 0, width: '100%', boxSizing: 'border-box' }}>{title}</h2>

                {bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-2" style={{ width: '100%', padding: 0, margin: '12px 0', boxSizing: 'border-box', overflowX: 'hidden' }}>
                        {bulletPoints.map((point, index) => (
                            <li key={index} style={{ marginLeft: '18px', wordBreak: 'break-word' }}>{point}</li>
                        ))}
                        {extraContent && (
                            <li className="mt-4" style={{ listStyle: 'none' }}>{extraContent}</li>
                        )}
                    </ul>
                )}

                {bulletPoints.length === 0 && (
                    <div style={{ width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>{extraContent}</div>
                )}

                {/* Action Buttons */}
                {actionButtons && (
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            marginTop: '16px',
                            justifyContent: 'center',
                            width: '100%',
                            flexWrap: 'wrap',
                            boxSizing: 'border-box'
                        }}
                    >
                        {actionButtons}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
