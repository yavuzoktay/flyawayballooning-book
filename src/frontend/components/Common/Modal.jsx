import React from "react";

const Modal = ({ isOpen, onClose, title, bulletPoints = [], extraContent, showCloseButton = false, actionButtons, mobileScrollable = false }) => {
    if (!isOpen) return null;

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const useMobileScroll = mobileScrollable && isMobile;

    return (
        <div
            className={`modal-overlay ${useMobileScroll ? 'modal-overlay--mobile-scroll' : ''}`}
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: useMobileScroll ? 'flex-start' : 'center',
                justifyContent: 'center',
                padding: useMobileScroll ? '12px 8px' : '8px',
                background: 'rgba(0,0,0,0.35)',
                zIndex: 1000,
                overflowY: useMobileScroll ? 'auto' : 'visible',
                WebkitOverflowScrolling: useMobileScroll ? 'touch' : 'auto'
            }}
        >
            <div
                className={`common-modal ${useMobileScroll ? 'common-modal--mobile-scroll' : ''}`}
                style={{
                    width: 'calc(100vw - 16px)',
                    maxWidth: isMobile ? 'calc(100vw - 16px)' : '600px',
                    background: '#fff',
                    borderRadius: 12,
                    padding: isMobile ? '12px 8px' : '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    maxHeight: useMobileScroll ? 'calc(100vh - 24px)' : 'calc(100vh - 16px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    boxSizing: 'border-box',
                    margin: isMobile ? '0 4px' : '0'
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

                <h2 className="text-xl font-semibold mb-4" style={{ 
                    textAlign: 'center', 
                    margin: 0, 
                    width: '100%', 
                    boxSizing: 'border-box',
                    fontSize: window.innerWidth <= 768 ? '16px' : '20px',
                    // Previously desktop used ultra-light fontWeight: 100; this has been removed per design request
                    lineHeight: window.innerWidth <= 768 ? '1.3' : '1.5',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    padding: window.innerWidth <= 768 ? '0 8px' : '0'
                }}>{title}</h2>

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
