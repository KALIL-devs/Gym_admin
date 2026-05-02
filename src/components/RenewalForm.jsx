// src/components/RenewalForm.jsx (Updated conditional styling for balance)
import React from 'react';
// Import the necessary helper
import { getMonthsDuration } from '../utils/membershipHelpers';

/**
 * The main content of the renewal form used in the sidebar/right panel.
 */
export const RenewalForm = React.memo(({ client, renewalMode, setRenewalMode, membershipType, setMembershipType, startDate, setStartDate, projectedEndDate, price, setPrice, totalAmount, setTotalAmount, handleRenewalClick, isRenewalDisabled, setSelectedClient }) => {
    
    const isStartDateDisabled = renewalMode === 'Continuation';

    // Helper to format price for display 
    const displayPaid = isNaN(price) || price === '' ? 0 : Number(price);
    const displayTotal = isNaN(totalAmount) || totalAmount === '' ? 0 : Number(totalAmount);
    const balanceDue = displayTotal - displayPaid;

    // The form is ready if NOT disabled, Total Fee is entered (> 0), and Amount Paid is valid (>= 0).
    // The main disabled check will come from the parent (isRenewalDisabled prop)
    const isRenewalReady = !isRenewalDisabled && displayTotal > 0 && displayPaid >= 0;

    return (
        <div className="p-6 bg-white shadow-xl rounded-xl border border-gray-100 h-full"> 
            <h3 className="text-xl font-bold mb-5 text-gray-800 truncate border-b pb-3">Renewing: {client.name}</h3>
            <div className="space-y-4">
                
                {/* Renewal Mode Selection (No change) */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-sm mb-2 text-gray-700">Renewal Mode:</p>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-800">
                            <input 
                                type="radio"
                                value="Continuation"
                                name="renewalMode"
                                checked={renewalMode === 'Continuation'}
                                onChange={() => setRenewalMode('Continuation')}
                                className="text-amber-600 focus:ring-amber-500"
                            />
                            Continuation
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-800">
                            <input 
                                type="radio"
                                value="New"
                                name="renewalMode"
                                checked={renewalMode === 'New'}
                                onChange={() => setRenewalMode('New')}
                                className="text-amber-600 focus:ring-amber-500"
                            />
                            New/Restart
                        </label>
                    </div>
                </div>

                {/* Membership Plan (No change) */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Membership Plan:</label>
                    <select
                        value={membershipType}
                        onChange={(e) => setMembershipType(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-amber-600 focus:border-amber-600"
                    >
                        <option value="1 month">1 Month (Monthly)</option>
                        <option value="3 months">3 Months (Quarterly)</option>
                        <option value="6 months">6 Months (Half-Year)</option>
                        <option value="1 year">1 year (Annual)</option>
                    </select>
                </div>
                
                {/* Start Date (No change) */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Start Date:</label>
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => setStartDate(e.target.value)}
                        readOnly={isStartDateDisabled}
                        className={`w-full p-2.5 border rounded-lg transition-colors ${
                            isStartDateDisabled
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                                : 'bg-white text-gray-900 border-gray-300 focus:ring-amber-600 focus:border-amber-600'
                            }`}
                    />
                    {renewalMode === 'Continuation' && (
                        <p className="text-xs text-amber-600 mt-1">Start date automatically set to 1 day after current membership end.</p>
                    )}
                </div>
                
                {/* Total Price Input Field (No change) */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Total Membership Fee (₹):</label>
                    <input
                        type="number"
                        placeholder="Enter total fee"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value.replace(/[^0-9]/g, ''))} 
                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-amber-600 focus:border-amber-600 font-extrabold text-lg"
                    />
                </div>

                {/* Price Paid Input Field (No change) */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Amount Paid Now (₹):</label>
                    <input
                        type="number"
                        placeholder="Enter amount paid"
                        value={price}
                        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} 
                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-green-600 focus:border-green-600 font-extrabold text-lg"
                    />
                </div>

                {/* Summary Block */}
                <div className="mt-5 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg space-y-2">
                    {/* Display Total Amount (No change) */}
                    <p className="font-semibold text-gray-800 flex justify-between">
                        Total Fee: 
                        <span className="text-xl font-bold text-gray-700">₹ {displayTotal.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </p>
                    
                    {/* Display Amount Paid (No change) */}
                    <p className="font-semibold text-gray-800 flex justify-between border-t pt-2 border-green-200">
                        Amount Paid: 
                        <span className="text-2xl font-bold text-green-700">₹ {displayPaid.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </p>

                    {/* 🛑 FIX: Updated Balance Due color logic: Red only if balanceDue is strictly greater than 0 */}
                    <p className={`font-semibold text-gray-800 flex justify-between ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Balance Due: 
                        <span className="text-xl font-bold">₹ {balanceDue.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </p>

                    <p className="text-sm flex justify-between text-gray-700 pt-2 border-t border-green-200">
                        Renewal Period: 
                        <span className="font-semibold">{getMonthsDuration(membershipType)} months</span>
                    </p>
                    <p className="text-sm flex justify-between text-gray-700">
                        New End Date: 
                        <span className="font-semibold text-amber-700">{projectedEndDate}</span>
                    </p>
                </div>
                
                {/* Renewal Button (No change) */}
                <button 
                    onClick={handleRenewalClick} 
                    disabled={!isRenewalReady} 
                    className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-lg py-3 px-4 rounded-xl shadow-md shadow-amber-300/50 transition-all duration-300 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
                >
                    {isRenewalReady ? `CONFIRM RENEWAL (Paid ₹ ${displayPaid.toLocaleString('en-IN', {minimumFractionDigits: 0})})` : 'Missing/Invalid Amount Details'}
                </button>
                
                <button 
                    onClick={() => setSelectedClient(null)}
                    className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors mt-2"
                >
                    Cancel/Clear Selection
                </button>
            </div>
        </div>
    );
});


export const EmptyFormContent = React.memo(() => (
    <div className="p-8 bg-white shadow-xl rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 text-center border border-gray-100">
        <svg className="w-14 h-14 mb-4 text-amber-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        <p className="font-bold text-xl text-gray-600">Select a Member to Renew</p>
        <p className="text-sm mt-2">Click on any row in the tables to load the renewal details here.</p>
    </div>
));