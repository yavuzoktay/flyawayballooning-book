import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TermsAndConditions = ({ selectedVoucherType, onAccept }) => {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        console.log('TermsAndConditions useEffect triggered with selectedVoucherType:', selectedVoucherType);
        if (selectedVoucherType) {
            console.log('Fetching terms for voucher type ID:', selectedVoucherType.id);
            fetchTerms();
        } else {
            console.log('No selectedVoucherType, skipping fetch');
        }
    }, [selectedVoucherType]);

    // Add a refresh function to force re-fetch
    const refreshTerms = () => {
        if (selectedVoucherType) {
            fetchTerms();
        }
    };

    // Expose refresh function to parent component
    useEffect(() => {
        if (window.refreshTermsAndConditions) {
            window.refreshTermsAndConditions = refreshTerms;
        }
    }, [selectedVoucherType]);

    const fetchTerms = async () => {
        try {
            setLoading(true);
            console.log('Fetching terms for voucher type:', selectedVoucherType);
            console.log('API URL:', `/api/terms-and-conditions/voucher-type/${selectedVoucherType.id}`);
            
            // Add cache busting parameter
            const timestamp = Date.now();
            const response = await axios.get(`/api/terms-and-conditions/voucher-type/${selectedVoucherType.id}?t=${timestamp}`);
            console.log('Terms API response:', response.data);
            
            if (response.data.success) {
                setTerms(response.data.data);
                console.log('Terms set to:', response.data.data);
            }
        } catch (error) {
            console.error('Error fetching terms and conditions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = () => {
        setAccepted(true);
        if (onAccept) {
            onAccept();
        }
    };

    if (loading) {
        return (
            <div className="terms-loading">
                <p>Loading terms and conditions...</p>
            </div>
        );
    }

    if (terms.length === 0) {
        return (
            <div className="terms-empty">
                <p>No terms and conditions available for this voucher type.</p>
            </div>
        );
    }

    return (
        <div className="terms-and-conditions">
            <h3>Terms & Conditions</h3>
            
            {terms.map((term, index) => (
                <div key={term.id} className="term-item">
                    <h4>{term.title}</h4>
                    <div className="term-content">
                        {term.content.split('\n').map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                        ))}
                    </div>
                </div>
            ))}
            
            <div className="terms-acceptance">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>I have read and agree to the terms and conditions</span>
                </label>
                
                <button
                    className="accept-terms-btn"
                    disabled={!accepted}
                    onClick={handleAccept}
                >
                    Accept Terms & Continue
                </button>
            </div>
        </div>
    );
};

export default TermsAndConditions; 