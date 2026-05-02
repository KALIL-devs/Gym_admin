import React, { useState, useEffect, useMemo } from 'react';
import { FaMoneyBillAlt, FaEdit } from "react-icons/fa"; // Added FaEdit
import { FiPrinter } from "react-icons/fi"; 
import { RiCloseFill } from 'react-icons/ri'; // Icon for closing modal

const API_BASE_URL = 'http://localhost:5000'; 

/**
 * Triggers the browser's native print dialog.
 */
const handlePrintOrExport = () => {
    window.print(); 
};

const PaymentHistory = ({ setMessageBox }) => { // ⚠️ Ensure setMessageBox is passed down from Dashboard.jsx
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // For forcing data refresh
    
    // State for the payment modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    // --- Data Fetching Logic (Now uses refreshTrigger) ---
    useEffect(() => {
        setLoading(true);
        setError(null);

        // API call always includes showPendingOnly=true
        const query = new URLSearchParams({ 
            showPendingOnly: 'true' 
        }).toString();
        
        const apiUrl = `${API_BASE_URL}/admin/payment-history?${query}`; 
        
        const token = localStorage.getItem('token'); 

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`API returned status ${res.status}. Check backend logs.`);
                }
                return res.json();
            })
            .then(data => {
                setHistoryData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                setError(`Fetch Error: ${err.message}. Ensure backend is running and you are logged in.`);
                setLoading(false);
            });
    }, [refreshTrigger]); // DEPENDENCY: Refresh when trigger changes

    // Memoized calculation of total pending balance
    const totalPendingBalance = useMemo(() => {
        return historyData.reduce((sum, record) => {
            return sum + (parseFloat(record.balanceDue) || 0); 
        }, 0);
    }, [historyData]);


    // --- Payment Update Handler ---
    const handleOpenPaymentModal = (record) => {
        setSelectedPayment(record);
        // Pre-fill amount with the balance due for convenience
        setPaymentAmount(parseFloat(record.balanceDue).toFixed(2)); 
        setIsModalOpen(true);
    };

    const handleClosePaymentModal = () => {
        setIsModalOpen(false);
        setSelectedPayment(null);
        setPaymentAmount('');
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(paymentAmount);
        const maxBalance = parseFloat(selectedPayment.balanceDue);
        
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount greater than zero.");
            return;
        }

        if (amount > maxBalance) {
             alert(`Payment amount ₹${amount.toFixed(2)} exceeds the remaining balance ₹${maxBalance.toFixed(2)}.`);
            return;
        }

        setUpdateLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payment-history/${selectedPayment.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amountPaidNow: amount })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update payment. Status: ${response.status}`);
            }

            // Success: close modal, show message, and refresh data
            handleClosePaymentModal();
            setMessageBox({
                isVisible: true,
                message: `✅ Payment of ₹${amount.toFixed(2)} recorded successfully!`,
                type: "success",
            });
            setRefreshTrigger(prev => prev + 1); // Trigger useEffect re-fetch

        } catch (err) {
            console.error("Update Payment Error:", err);
            setMessageBox({
                isVisible: true,
                message: `❌ Error updating payment: ${err.message}`,
                type: "error",
            });
        } finally {
            setUpdateLoading(false);
        }
    };


    // --- RENDERING LOGIC ---
    
    if (loading) return <div className="loading-message" style={{ padding: '20px' }}>Loading Pending Payments...</div>;
    
    const tableHeaderStyle = { padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#e9e9e9' };
    const tableCellStyle = { padding: '12px', border: '1px solid #ddd', textAlign: 'left' };


    return (
        <>
            <style>
                {`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-content, #printable-content * { visibility: visible; }
                        #printable-content { position: absolute; top: 0; left: 0; width: 100%; padding: 20px !important; }
                        .print-hide { display: none !important; }
                        th, td { border: 1px solid #000 !important; }
                    }
                    .modal-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex; justify-content: center; align-items: center;
                        z-index: 1000;
                    }
                    .modal-content {
                        background: #fff; padding: 30px; border-radius: 8px;
                        width: 90%; max-width: 500px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        position: relative;
                    }
                `}
            </style>
            
            <div id="printable-content" style={{ padding: '20px' }}>
                
                <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaMoneyBillAlt /> Pending Payment Log
                    </span>

                    <button 
                        onClick={handlePrintOrExport}
                        className="print-hide" 
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        <FiPrinter /> Export/Print Report
                    </button>
                </h2>
                
                {error && <div className="error-message print-hide" style={{ color: 'white', backgroundColor: '#f44336', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

                {/* Total Pending Balance Widget */}
                <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#fff1f0', 
                    border: '1px solid #ff4d4f', 
                    borderRadius: '5px',
                    marginBottom: '20px',
                    display: 'inline-block'
                }}>
                    <strong>Total Pending Balance:</strong> 
                    <span style={{ color: '#ff4d4f', fontSize: '1.3em', fontWeight: 'bold', marginLeft: '10px' }}>
                        ₹ {totalPendingBalance.toFixed(2)}
                    </span>
                </div>


                {/* Payment History Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={tableHeaderStyle}>Roll No</th> 
                            <th style={tableHeaderStyle}>Client Name</th>
                            <th style={tableHeaderStyle}>Payment Date</th>
                            <th style={tableHeaderStyle}>Total Amount</th>
                            <th style={tableHeaderStyle}>Amount Paid</th>
                            <th style={tableHeaderStyle}>Balance Due</th>
                            <th style={tableHeaderStyle}>Payment ID</th>
                            <th style={tableHeaderStyle}>Renewal ID</th>
                            <th style={tableHeaderStyle}>Action</th> {/* Added Action column */}
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', border: '1px solid #ddd' }}>
                                    ✅ No records found with a pending balance. All dues are cleared!
                                </td>
                            </tr>
                        ) : (
                            historyData.map((record, index) => (
                                <tr key={record.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{...tableCellStyle, fontWeight: 'bold'}}>{record.RollNo}</td> 
                                    <td style={tableCellStyle}>{record.ClientName}</td>
                                    <td style={tableCellStyle}>{record.paymentDate}</td>
                                    <td style={tableCellStyle}>₹ {parseFloat(record.totalAmount).toFixed(2)}</td>
                                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#006400' }}>
                                        ₹ {parseFloat(record.amountPaid).toFixed(2)}
                                    </td>
                                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#ff4d4f' }}>
                                        ₹ {parseFloat(record.balanceDue).toFixed(2)}
                                    </td>
                                    <td style={tableCellStyle}>{record.id}</td> 
                                    <td style={tableCellStyle}>{record.membershipRenewalId}</td>
                                    <td style={tableCellStyle}>
                                        <button 
                                            onClick={() => handleOpenPaymentModal(record)}
                                            style={{ 
                                                padding: '5px 10px', 
                                                backgroundColor: '#ffc107', 
                                                color: 'black', 
                                                border: 'none', 
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                            disabled={parseFloat(record.balanceDue) <= 0}
                                        >
                                            <FaEdit /> Pay Now
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Update Modal */}
            {isModalOpen && selectedPayment && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button 
                            onClick={handleClosePaymentModal} 
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <RiCloseFill size={24} />
                        </button>
                        
                        <h3 style={{ borderBottom: '2px solid #ff4d4f', paddingBottom: '10px', marginBottom: '20px' }}>
                            Record Payment for {selectedPayment.ClientName}
                        </h3>
                        
                        <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                            Client Roll No: {selectedPayment.RollNo}
                        </p>
                        <p style={{ marginBottom: '20px', color: '#ff4d4f', fontWeight: 'bold', fontSize: '1.1em' }}>
                            Outstanding Balance: ₹ {parseFloat(selectedPayment.balanceDue).toFixed(2)}
                        </p>

                        <form onSubmit={handleUpdatePayment}>
                            <div style={{ marginBottom: '20px' }}>
                                <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px' }}>Amount Client is Paying Now (₹):</label>
                                <input
                                    type="number"
                                    id="amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="0.01"
                                    max={selectedPayment.balanceDue}
                                    step="0.01"
                                    required
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={updateLoading}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: updateLoading ? '#ccc' : '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    cursor: updateLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {updateLoading ? 'Processing...' : 'Record Payment & Update Balance'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PaymentHistory;