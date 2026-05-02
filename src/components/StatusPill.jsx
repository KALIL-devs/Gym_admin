import React from 'react';

/**
 * Displays the membership status in a colored pill format.
 * Maps statuses from calculateStatus helper: 'active', 'expiring soon', 'expired', 'unknown'.
 */
export const StatusPill = React.memo(({ status }) => {
    let bgColor = 'bg-gray-200 text-gray-800'; 
    let displayStatus = status ? status.toUpperCase() : 'N/A';
    
    switch (status) {
        case 'active':
            bgColor = 'bg-green-100 text-green-700 font-semibold';
            displayStatus = 'ACTIVE';
            break;
        case 'expiring soon': // 🛑 MATCHING HELPER OUTPUT
            bgColor = 'bg-amber-100 text-amber-700 font-semibold'; 
            displayStatus = 'EXPIRING SOON';
            break;
        case 'expired': // 🛑 MATCHING HELPER OUTPUT
            bgColor = 'bg-red-100 text-red-700 font-semibold';
            displayStatus = 'EXPIRED';
            break;
        case 'unknown':
        default:
            bgColor = 'bg-gray-200 text-gray-800 font-semibold';
            displayStatus = 'N/A';
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs tracking-wider ${bgColor}`}>
            {displayStatus}
        </span>
    );
});