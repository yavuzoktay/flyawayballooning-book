import React from "react";

const Modal = ({ isOpen, onClose, onConfirm, title, bulletPoints = [], extraContent, submitButtonProps = {} }) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        // Önce submitButtonProps.onClick ile error gösterimini tetikle
        if (typeof submitButtonProps.onClick === 'function') {
            submitButtonProps.onClick();
        }
        // Sonra submitButtonProps.onSubmit varsa onu çağır (ör: form submit)
        if (typeof submitButtonProps.onSubmit === 'function') {
            submitButtonProps.onSubmit();
        } else if (typeof onConfirm === 'function') {
            onConfirm();
        } else {
            onClose();
        }
    };

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
                <div className="modal-buttons">
                    <button 
                        className="confirm-btn"
                        style={{ backgroundColor: "#61D836" }}
                        onClick={handleConfirm}
                        disabled={submitButtonProps?.disabled}
                    >
                        {title === 'Request Date' ? 'Submit' : 'Confirm'}
                    </button>
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
