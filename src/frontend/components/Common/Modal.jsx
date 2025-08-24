import React from "react";

const Modal = ({ isOpen, onClose, title, bulletPoints = [], extraContent }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="common-modal" style={title === 'Request Date' ? { maxWidth: 420, minWidth: 340, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 0' } : {}}>
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
            </div>
        </div>
    );
};

export default Modal;
