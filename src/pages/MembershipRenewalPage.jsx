import React, { useState, useEffect, useMemo, useCallback } from 'react';
// 1. Utility Imports (Assuming these paths are now correct)
import { calculateNewEndDate, retryFetchWithBackoff } from '../utils/membershipHelpers'; 

// 2. Component Imports (Assuming these paths are now correct)
import { ClientTableSection } from '../components/ClientTableSection';
import { RenewalConfirmationModal } from '../components/RenewalConfirmationModal';
import { RenewalForm, EmptyFormContent } from '../components/RenewalForm'; 
import { RenewalReceiptModal } from '../components/RenewalReceiptModal'; 


// =========================================================================
// 🚀 MAIN PAGE COMPONENT (Focus on Logic and State)
// =========================================================================

/**
 * Main component for the Membership Renewal dashboard.
 */
function MembershipRenewalPage({ clients, setMessageBox, onClientUpdate }) {
    // --- State Declarations ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null); 
    const [membershipType, setMembershipType] = useState('1 month'); 
    const [price, setPrice] = useState(''); // Amount Paid
    const [renewalMode, setRenewalMode] = useState('Continuation'); 
    const [startDate, setStartDate] = useState(null); 
    const [showConfirmModal, setShowConfirmModal] = useState(false); 
    const [showReceiptModal, setShowReceiptModal] = useState(false); 
    const [renewalPayload, setRenewalPayload] = useState(null); 
    
    // 🛑 NEW STATE: Total Amount Due
    const [totalAmount, setTotalAmount] = useState(''); 

    // --- Memoized Calculations ---
    
    // Calculates the projected end date based on form inputs
    const projectedEndDate = useMemo(() => {
        if (!startDate) return 'N/A';
        return calculateNewEndDate(startDate, membershipType); 
    }, [startDate, membershipType]);

    // Filters and categorizes clients based on search term and status
    const categorizedClients = useMemo(() => {
        if (!Array.isArray(clients)) return { renewalNeeded: [], active: [] };
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filteredClients = clients.filter(c => 
            (c.name && c.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (c.rollno && String(c.rollno).toLowerCase().includes(lowerCaseSearchTerm))
        );
        return filteredClients.reduce((acc, client) => {
            const status = (client.status || 'inactive').toLowerCase(); 
            if (status === 'active' || status === 'expiring') acc.active.push(client); 
            else acc.renewalNeeded.push(client);
            return acc;
        }, { renewalNeeded: [], active: [] });
    }, [clients, searchTerm]);

    const sortedRenewalNeeded = useMemo(() => {
        return [...categorizedClients.renewalNeeded].sort((a, b) => {
            return new Date(a.membershipEnd || '1970-01-01') - new Date(b.membershipEnd || '1970-01-01');
        });
    }, [categorizedClients.renewalNeeded]);

    const sortedActiveClients = useMemo(() => {
        return [...categorizedClients.active].sort((a, b) => {
            return new Date(a.membershipEnd || '2100-01-01') - new Date(b.membershipEnd || '2100-01-01');
        });
    }, [categorizedClients.active]);
    
    // --- Effects and Handlers ---

    // Effect to set initial form values when a client is selected or renewal mode changes
    useEffect(() => {
        if (!selectedClient) {
            setStartDate(null);
            setMembershipType('1 month');
            setRenewalMode('Continuation'); 
            setPrice(''); 
            setTotalAmount(''); // 🛑 RESET TOTAL AMOUNT
            return;
        }

        const todayDateObj = new Date();
        const year = todayDateObj.getFullYear();
        const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(todayDateObj.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        const clientEndDate = selectedClient.membershipEnd;

        if (renewalMode === 'Continuation' && clientEndDate) {
            const endDate = new Date(clientEndDate + 'T00:00:00');
            if (!isNaN(endDate.getTime())) {
                endDate.setDate(endDate.getDate() + 1); 
                
                const nextYear = endDate.getFullYear();
                const nextMonth = String(endDate.getMonth() + 1).padStart(2, '0');
                const nextDay = String(endDate.getDate()).padStart(2, '0');
                const nextStartDate = `${nextYear}-${nextMonth}-${nextDay}`;

                setStartDate(nextStartDate);
            } else {
                setStartDate(today); 
            }
        } else if (renewalMode === 'New') {
            setStartDate(today);
        } else if (!clientEndDate && renewalMode === 'Continuation') {
            setStartDate(today);
        }
        
        if (selectedClient.membershipType) {
            setMembershipType(selectedClient.membershipType.toLowerCase()); 
        }
        
        // 🛑 IMPORTANT: If switching client, keep amounts empty.
        setPrice('');
        setTotalAmount('');

    }, [selectedClient, renewalMode]);

    // Handler for selecting a client from the table
    const handleClientSelect = (client) => {
        setSelectedClient(client);
        setPrice(''); 
        setTotalAmount(''); // 🛑 RESET totalAmount on new client select
        const status = (client.status || 'inactive').toLowerCase(); 
        if (status === 'active' || status === 'expiring') {
            setRenewalMode('Continuation');
        } else {
            setRenewalMode('New');
        }
    };

    /**
     * Executes the API call to finalize the membership renewal.
     */
    const finalizeRenewal = useCallback(async (renewalData) => {
        // 1. Close the Confirmation Modal
        setShowConfirmModal(false); 
        setMessageBox({ isVisible: true, message: "Processing renewal...", type: "info" });

        if (!selectedClient || !selectedClient.id) {
            setMessageBox({ isVisible: true, message: "❌ Internal Error: Client ID is missing for renewal.", type: "error" });
            return;
        }

        // 🛑 FIXED URL: Using the correct endpoint /api/renewal-history/renew
        const API_BASE_URL = 'http://localhost:5000'; 
        const fullUrl = `${API_BASE_URL}/api/renewal-history/renew`; 
        
        const token = localStorage.getItem('token');
        
        // Payload mapped to backend structure
        const submissionPayload = {
            clientId: renewalData.clientId,
            membershipType: renewalData.membershipType,
            startDate: renewalData.renewalStartDate,
            projectedEndDate: renewalData.newEndDate,
            totalAmount: renewalData.totalAmount, 
            amountPaid: renewalData.pricePaid,
        };

        try {
            const response = await retryFetchWithBackoff(fullUrl, { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(submissionPayload),
            });

            if (response.ok) {
                const result = await response.json(); 
                
                // 2. Show the new receipt modal on success
                setMessageBox({ isVisible: true, message: result.message || `✅ Renewal successful for ${selectedClient.name}!`, type: "success" });
                
                // Set the payload for the receipt modal and show it
                setRenewalPayload({ 
                    ...renewalData, 
                    message: result.message,
                    balanceDue: renewalData.totalAmount - renewalData.pricePaid 
                }); 
                setShowReceiptModal(true); 
                
                if (onClientUpdate) onClientUpdate(); // Refresh client list
            
            } else {
                let errorText = response.statusText;
                try {
                    const errorResult = await response.json();
                    errorText = errorResult.error || errorResult.message || errorText;
                } catch (jsonError) {
                    errorText = `Server returned status ${response.status} with no readable error message.`;
                }
                setMessageBox({ isVisible: true, message: `❌ Renewal Failed: ${errorText}`, type: "error" });
            }
        } catch (error) {
            console.error("Renewal API Error:", error);
            setMessageBox({ isVisible: true, message: `❌ Network Error: Could not connect to the server or fetch failed.`, type: "error" });
        }
    }, [selectedClient, setMessageBox, onClientUpdate]);

    // Prepares the payload and shows the confirmation modal
    const handleRenewalClick = () => {
        // 🛑 Get numerical values (0 if empty or invalid)
        const finalPricePaid = Number(price) || 0; 
        const finalTotalAmount = Number(totalAmount) || 0; 

        // 🛑 UPDATED VALIDATION LOGIC
        const isValid = selectedClient && membershipType && startDate && projectedEndDate !== 'N/A' && finalTotalAmount > 0 && finalPricePaid >= 0;
        
        if (!isValid) {
            setMessageBox({ isVisible: true, message: "Please ensure a Total Fee is entered, and all renewal details are complete.", type: "error" });
            return;
        }
        
        const data = {
            membershipType,
            pricePaid: finalPricePaid, // Amount Paid
            totalAmount: finalTotalAmount, // Total Fee
            renewalStartDate: startDate, 
            newEndDate: projectedEndDate, 
            clientId: selectedClient.id 
        };
        
        setRenewalPayload(data);
        setShowConfirmModal(true);
    };
    
    // 🛑 UPDATED: isRenewalDisabled check logic
    const isRenewalDisabled = !selectedClient || !startDate || !membershipType || !(Number(totalAmount) > 0) || !(Number(price) >= 0) || projectedEndDate === 'N/A';
    
    // --- Render ---

    return (
        <div className="flex flex-col flex-1 p-4 sm:p-6 bg-gray-50 text-gray-900 min-h-screen font-sans">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-amber-600/20 pb-3">
                Membership Renewal Center
            </h2>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Tables Section: xl:col-span-8 */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Search Bar (No change) */}
                    <div className="p-4 bg-white shadow-md rounded-xl w-full"> 
                        <div className="relative">
                            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input
                                type="text"
                                placeholder="Search clients by Name or Roll No..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                            />
                        </div>
                    </div>

                    {/* Client Tables (No change) */}
                    <ClientTableSection
                        title="Expired Clients (Renewal Needed)"
                        clients={sortedRenewalNeeded}
                        selectedClient={selectedClient}
                        handleClientSelect={handleClientSelect}
                        searchTerm={searchTerm}
                        type="renewalNeeded"
                    />
                    <ClientTableSection
                        title="Active & Expiring Clients"
                        clients={sortedActiveClients}
                        selectedClient={selectedClient}
                        handleClientSelect={handleClientSelect}
                        searchTerm={searchTerm}
                        type="active"
                    />
                    
                    {/* Renewal Form (Fallback for non-XL screens) */}
                    <div className="xl:hidden">
                        {selectedClient ? (
                            <RenewalForm 
                                client={selectedClient} 
                                renewalMode={renewalMode}
                                setRenewalMode={setRenewalMode}
                                membershipType={membershipType}
                                setMembershipType={setMembershipType}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                projectedEndDate={projectedEndDate}
                                price={price}
                                setPrice={setPrice} 
                                totalAmount={totalAmount}
                                setTotalAmount={setTotalAmount} 
                                handleRenewalClick={handleRenewalClick}
                                isRenewalDisabled={isRenewalDisabled}
                                setSelectedClient={setSelectedClient}
                            />
                        ) : (
                            <EmptyFormContent />
                        )}
                    </div>
                </div>

                {/* Renewal Form Container: xl:col-span-4 */}
                <div className="hidden xl:block xl:col-span-4">
                    <div className="sticky top-0"> 
                        {selectedClient ? (
                            <RenewalForm 
                                client={selectedClient} 
                                renewalMode={renewalMode}
                                setRenewalMode={setRenewalMode}
                                membershipType={membershipType}
                                setMembershipType={setMembershipType}
                                startDate={startDate}
                                setStartDate={setStartDate}
                                projectedEndDate={projectedEndDate}
                                price={price}
                                setPrice={setPrice} 
                                totalAmount={totalAmount}
                                setTotalAmount={setTotalAmount} 
                                handleRenewalClick={handleRenewalClick}
                                isRenewalDisabled={isRenewalDisabled}
                                setSelectedClient={setSelectedClient}
                            />
                        ) : (
                            <EmptyFormContent />
                        )}
                    </div>
                </div>
            </div>

            {/* 1. Confirmation Modal (No change) */}
            {showConfirmModal && renewalPayload && selectedClient && (
                <RenewalConfirmationModal 
                    renewalData={renewalPayload}
                    clientName={selectedClient.name}
                    onConfirm={() => finalizeRenewal(renewalPayload)}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}

            {/* 2. Final Receipt/Send Modal (No change, payload ensures data) */}
            {showReceiptModal && renewalPayload && selectedClient && (
                <RenewalReceiptModal
                    receiptData={renewalPayload}
                    clientName={selectedClient.name}
                    clientPhone={selectedClient.phone} 
                    onClose={() => {
                        setShowReceiptModal(false);
                        if (onClientUpdate) onClientUpdate(); 
                        setSelectedClient(null); 
                    }}
                />
            )}
        </div>
    );
}

export default MembershipRenewalPage;