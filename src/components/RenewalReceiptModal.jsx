import React from 'react';

/**
 * Modal shown AFTER successful payment to offer print/share options.
 * @param {object} receiptData - Final transaction details (includes pricePaid, totalAmount, balanceDue).
 * @param {string} clientName - The name of the client.
 * @param {string} clientPhone - The phone number of the client.
 * @param {function} onClose - Handler for closing the modal (takes user back to dashboard and clears form).
 */
export const RenewalReceiptModal = React.memo(({ receiptData, clientName, clientPhone, onClose }) => {
    
    // Extract and ensure amounts are treated as numbers
    const { membershipType, renewalStartDate, newEndDate, pricePaid, totalAmount, balanceDue } = receiptData;

    const paid = Number(pricePaid) || 0;
    const total = Number(totalAmount) || paid;
    const balance = (total - paid) || (Number(balanceDue) || 0); // Use balanceDue from payload or calculate

    // Generates the clean, formatted text message content for WhatsApp
    const generateWhatsAppMessage = () => {
        
        // Format prices nicely
        const formattedPaid = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        const formattedTotal = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        const formattedBalance = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
        
        // Build the message text
        let message = 
`*Aayshmaa Fitness Receipt* 🧾
--------------------------------
Member: *${clientName}*
Plan: ${membershipType}
Period: ${renewalStartDate} to ${newEndDate}
Total Fee: ${formattedTotal}
Amount Paid: *${formattedPaid}*
`;
        // Only include balance if it's due
        if (balance > 0) {
            message += `Balance Due: *${formattedBalance}*\n`;
        }

        message += 
`--------------------------------
Thank you for renewing your membership! Keep up the great work. 💪`;

        return encodeURIComponent(message);
    };

    const handleSendReceipt = () => {
        const message = generateWhatsAppMessage();
        
        // Clean the phone number (remove spaces/dashes)
        const phoneNumber = clientPhone ? clientPhone.replace(/[^0-9]/g, '') : '';
        
        // Use the WhatsApp URL scheme to pre-fill the recipient and message
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        // Open the link in a new tab/window
        window.open(whatsappUrl, '_blank');
        
        // Close the modal after opening the WhatsApp link
        // We will keep the modal open to allow the user to click 'Close' manually.
        // We remove the automatic onClose() here to give the user control after opening the new tab.
        // If preferred, you can re-enable the auto-close: onClose(); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 scale-100 border-t-8 border-green-500">
                
                <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-green-700 mb-1">Payment Confirmed!</h3>
                    <p className="text-sm text-gray-600">The renewal for **{clientName}** is complete.</p>
                </div>
                
                {/* Visual Confirmation of the core details */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Total Fee:</span>
                        <span className="font-semibold text-gray-900">₹{total.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </div>
                    <div className="flex justify-between text-md font-extrabold border-t pt-2 border-green-200">
                        <span className="text-gray-800">Amount Paid:</span>
                        <span className="text-green-700">₹{paid.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </div>
                    {balance > 0 && (
                        <div className="flex justify-between text-md font-extrabold pt-1">
                            <span className="text-red-700">Balance Due:</span>
                            <span className="text-red-700">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    {/* Send via WhatsApp Button */}
                    <button
                        onClick={handleSendReceipt}
                        className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-extrabold shadow-md shadow-green-300/50 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" ><path d="M12.031 0C5.405 0 0 5.405 0 12.031 0 14.28 0.635 16.34 1.737 18.067L0.198 23.802 6.007 22.288C7.68 23.367 9.77 24 12.031 24C18.656 24 24 18.595 24 12.031S18.595 0 12.031 0ZM17.155 19.349C16.14 19.034 14.898 18.66 14.618 18.411C14.337 18.162 13.79 17.48 13.255 16.827C12.72 16.173 12.316 16.033 11.912 15.93C11.508 15.827 10.82 15.91 10.19 16.067C9.561 16.225 8.91 16.815 8.352 17.306C7.794 17.797 7.236 17.848 6.643 17.651C6.05 17.454 5.568 17.296 5.061 16.711C4.555 16.126 3.12 14.073 3.12 11.758C3.12 9.443 4.646 8.328 5.152 7.828C5.659 7.327 6.206 6.638 6.779 6.638C7.032 6.638 7.234 6.679 7.421 6.719C7.608 6.76 7.856 6.699 8.082 7.246C8.308 7.793 8.878 9.172 8.971 9.389C9.064 9.606 9.115 9.875 8.958 10.144C8.801 10.413 8.661 10.553 8.392 10.85C8.123 11.147 7.865 11.45 7.639 11.728C7.413 12.007 7.187 12.285 7.466 12.782C7.745 13.279 8.694 14.77 10.046 15.986C11.397 17.202 12.505 17.556 12.894 17.743C13.283 17.93 13.51 17.89 13.736 17.663C13.962 17.437 14.542 16.857 14.79 16.483C15.039 16.109 15.207 16.179 15.461 16.292C15.714 16.405 17.239 17.135 17.584 17.293C17.929 17.45 18.156 17.533 18.235 17.663C18.314 17.792 18.314 18.491 17.779 19.221C17.244 19.951 16.155 19.664 16.031 19.613L17.155 19.349Z"/></svg>
                        Send Receipt (WhatsApp)
                    </button>
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose} 
                        className="flex-1 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Close & Continue
                    </button>
                </div>
            </div>
        </div>
    );
});