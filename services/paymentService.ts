import { AppSettings } from "../types";

// This service is designed to be the bridge between the UI and Square Payment APIs.
// Currently it simulates a secure transaction flow.

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export const PaymentService = {
    /**
     * validCardCheck
     * Quick Luhn algorithm check or regex to validate card format on client side
     * before sending to API to reduce latency/errors.
     */
    validateCardFormat: (number: string): boolean => {
        const cleaned = number.replace(/\s+/g, '');
        return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
    },

    /**
     * processPayment
     * In a real implementation, this would:
     * 1. Call Square Web Payments SDK to tokenize card.
     * 2. Send token to backend to call Payments API.
     */
    processPayment: async (
        amount: number, 
        currency: string, 
        cardData: any, 
        settings: AppSettings
    ): Promise<PaymentResult> => {
        console.log(`Connecting to Square Gateway... Amount: ${currency} ${amount}`);
        
        // SIMULATE SECURE API CALL LATENCY
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Check if Square is actually configured
        const isLive = !!(settings.squareApplicationId && settings.squareAccessToken);
        
        if (isLive) {
            console.log("Using Square Application ID:", settings.squareApplicationId);
            // INTEGRATION POINT: 
            // 1. window.Square.payments(appId, locationId)
            // 2. card.tokenize() -> token
            // 3. Backend charge(token, amount)
        } else {
            console.log("Mode: Square Sandbox Simulation");
        }

        // Simulating a card decline for demonstration if name is "Decline"
        if (cardData.name.toLowerCase().includes('decline')) {
             return {
                 success: false,
                 error: "Payment Declined by Issuer. Please check card details."
             };
        }

        return {
            success: true,
            transactionId: `sq_txn_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };
    }
};