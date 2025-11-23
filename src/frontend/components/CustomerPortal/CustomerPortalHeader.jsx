import React, { useState } from 'react';
import LOGO from '../../../assets/images/FAB_Logo_DarkBlue.png';
import './CustomerPortalHeader.css';

const NAV_ITEMS = [
    { id: 'portal-main', label: 'Main' },
    { id: 'scroll-target-booking', label: 'Booking' },
    { id: 'live-availability', label: 'Available' },
    { id: 'additional-info', label: 'Information' }
];

const CustomerPortalHeader = ({ onNavigate = () => {} }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNavClick = (id) => {
        setMenuOpen(false);
        onNavigate(id);
    };

    return (
        <header className="customer-portal-header">
            <div className="cph-inner">
                <div className="cph-brand" onClick={() => handleNavClick('portal-main')}>
                    <img src={LOGO} alt="Fly Away Ballooning" />
                    <div className="cph-brand-text">
                        <span className="cph-label">Customer Portal</span>
                        <span className="cph-sub">Manage your flight experience</span>
                    </div>
                </div>

                <button
                    className={`cph-burger ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>

                <nav className={`cph-nav ${menuOpen ? 'open' : ''}`}>
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className="cph-link"
                            onClick={() => handleNavClick(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default CustomerPortalHeader;

