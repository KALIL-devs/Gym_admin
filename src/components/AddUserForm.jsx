import React, { useState, useEffect } from "react";

// Helper: Calculate membership end date only if both startDate & membershipType are given
const calculateFrontendEndDate = (startDate, membershipType) => {
    if (!startDate || !membershipType) return "";

    const parts = startDate.split('-').map(Number); // [YYYY, MM, DD]
    let end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

    switch (membershipType) {
        case "1 Month":
            end.setUTCMonth(end.getUTCMonth() + 1);
            break;
        case "3 Months":
            end.setUTCMonth(end.getUTCMonth() + 3);
            break;
        case "6 Months":
            end.setUTCMonth(end.getUTCMonth() + 6);
            break;
        case "1 Year":
            end.setUTCFullYear(end.getUTCFullYear() + 1);
            break;
        default:
            return "";
    }

    end.setUTCDate(end.getUTCDate() - 1);

    const year = end.getUTCFullYear();
    const month = String(end.getUTCMonth() + 1).padStart(2, "0");
    const day = String(end.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

function AddUserForm({ lastRollNo, onClose, onAddSuccess, setMessageBox, clients }) {
    const initialForm = {
        rollno: lastRollNo + 1,
        name: "",
        dob: "",
        gender: "Male",
        phone: "",
        email: "",
        membershipType: "", // Optional now
        startDate: "",
        endDate: "",
        address: "",
        hasTrainer: false,
        trainerName: "",
        // ✅ NEW: Payment Fields
        totalAmount: 0,
        amountPaid: 0,
        balanceDue: 0,
    };

    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);

    // Auto-calculate end date & balance due
    useEffect(() => {
        let updatedEndDate = formData.endDate;
        if (formData.startDate && formData.membershipType) {
            updatedEndDate = calculateFrontendEndDate(
                formData.startDate,
                formData.membershipType
            );
        } else {
            updatedEndDate = "";
        }

        const newBalance =
            Number(formData.totalAmount) - Number(formData.amountPaid);

        setFormData((prev) => ({
            ...prev,
            endDate: updatedEndDate,
            balanceDue: newBalance,
        }));
    }, [formData.startDate, formData.membershipType, formData.totalAmount, formData.amountPaid]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let updatedValue = value;

        if (type === "checkbox") {
            updatedValue = checked;
        } else if (name === "rollno") {
            updatedValue = value === "" ? "" : Number(value);
        } else if (name === "totalAmount" || name === "amountPaid") {
            // ✅ Handle numeric input for currency fields
            const numericValue = value === "" ? "" : Number(value);
            updatedValue = numericValue >= 0 ? numericValue : 0; // Prevent negative input
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    };

    // Format date to DD-MM-YYYY (display only)
    const formatIsoToDMY = (isoDateString) => {
        if (!isoDateString || typeof isoDateString !== "string" || isoDateString.length !== 10)
            return "";
        const parts = isoDateString.split("-");
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check duplicate Roll No
        const rollNoExists = clients.some((client) => client.rollno === formData.rollno);
        if (rollNoExists) {
            setMessageBox({
                isVisible: true,
                message: "❌ Error: This Roll No is already in use. Please enter a different one.",
                type: "error",
            });
            return;
        }

        // ✅ Only Name & DOB are required
        if (!formData.name || !formData.dob) {
            setMessageBox({
                isVisible: true,
                message: "❌ Name and Date of Birth are required.",
                type: "error",
            });
            return;
        }

        // Prepare data for submission
        const dataToSend = {
            ...formData,
            trainerName: formData.hasTrainer ? formData.trainerName : null,
            membershipEnd: formData.endDate || null, // optional field
            // ✅ Include payment fields
            totalAmount: Number(formData.totalAmount) || 0,
            amountPaid: Number(formData.amountPaid) || 0,
            // Calculate balance due *again* just before sending to ensure accuracy
            balanceDue: Number(formData.totalAmount) - Number(formData.amountPaid) || 0, 
        };

        // Remove frontend-only state fields before sending
        delete dataToSend.endDate; 
        delete dataToSend.balanceDue; // balanceDue is not directly a form field but a calculated one, and will be calculated on the backend anyway.

        try {
            setLoading(true);
            setMessageBox({ isVisible: false, message: "" });

            const response = await fetch("http://localhost:5000/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({
                    isVisible: true,
                    message: "✅ User created successfully.",
                    type: "success",
                });
                onAddSuccess({ ...formData, ...data });
                setFormData(initialForm);
            } else {
                setMessageBox({
                    isVisible: true,
                    message: "❌ " + data.error,
                    type: "error",
                });
            }
        } catch (error) {
            setMessageBox({
                isVisible: true,
                message: "❌ Error: " + error.message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card dark:bg-light-card p-6 rounded-xl shadow-2xl z-50 w-11/12 max-w-lg text-dark-text dark:text-light-text">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-dark-accent dark:hover:text-light-accent text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-dark-accent dark:text-light-accent">
                    Add New User
                </h3>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Roll No */}
                    <input
                        type="number"
                        name="rollno"
                        placeholder="Roll No"
                        value={formData.rollno}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Name (Required) */}
                    <input
                        type="text"
                        name="name"
                        placeholder="Name *"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Date of Birth (Required) */}
                    <input
                        type="date"
                        name="dob"
                        placeholder="Date of Birth *"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Email */}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email (e.g., user@example.com)"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Gender */}
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* Phone */}
                    <input
                        type="text"
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Membership Type (Optional) */}
                    <select
                        name="membershipType"
                        value={formData.membershipType}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    >
                        <option value="">Select Membership Type (optional)</option>
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                    </select>

                    {/* Start Date (Optional) */}
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    />

                    {/* End Date Display */}
                    {formData.endDate ? (
                        <p className="text-sm text-dark-text dark:text-light-text">
                            <b>End Date (Auto):</b> {formatIsoToDMY(formData.endDate)}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500">
                            <b>End Date (Optional):</b> Auto-calculated if Membership Type and Start
                            Date are provided.
                        </p>
                    )}

                    {/* --- ✅ NEW: Payment Fields --- */}
                    <div className="flex space-x-2">
                        {/* Total Amount */}
                        <input
                            type="number"
                            name="totalAmount"
                            placeholder="Total Amount"
                            value={formData.totalAmount === 0 ? "" : formData.totalAmount}
                            onChange={handleChange}
                            min="0"
                            className="w-1/2 p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                        />
                        {/* Amount Paid */}
                        <input
                            type="number"
                            name="amountPaid"
                            placeholder="Amount Paid"
                            value={formData.amountPaid === 0 ? "" : formData.amountPaid}
                            onChange={handleChange}
                            min="0"
                            className="w-1/2 p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                        />
                    </div>

                    {/* Balance Due Display */}
                    <p className={`text-sm font-semibold ${formData.balanceDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        <b>Balance Due:</b> ₹{formData.balanceDue.toFixed(2)}
                    </p>

                    {/* --- END NEW: Payment Fields --- */}

                    {/* Trainer Option */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="hasTrainer" className="text-dark-text dark:text-light-text">
                            Assign a Trainer?
                        </label>
                        <input
                            type="checkbox"
                            id="hasTrainer"
                            name="hasTrainer"
                            checked={formData.hasTrainer}
                            onChange={handleChange}
                            className="form-checkbox h-5 w-5 text-orange-500 rounded-full cursor-pointer"
                        />
                    </div>

                    {/* Trainer Name (Conditional) */}
                    {formData.hasTrainer && (
                        <input
                            type="text"
                            name="trainerName"
                            placeholder="Trainer Name"
                            value={formData.trainerName}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                        />
                    )}

                    {/* Address */}
                    <input
                        type="text"
                        name="address"
                        placeholder="Address / City"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full bg-dark-accent dark:bg-light-accent text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default AddUserForm;