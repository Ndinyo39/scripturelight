const express = require('express');
const router = express.Router();
const { Transaction } = require('../models');

const genToken = async () => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const authString = Buffer.from(`${key}:${secret}`).toString('base64');

    const res = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { 'Authorization': `Basic ${authString}` }
    });
    if (!res.ok) throw new Error('Failed to get M-Pesa token');
    const data = await res.json();
    return data.access_token;
};

// Initiate STK Push
router.post('/stkpush', async (req, res) => {
    try {
        let { phone, amount, userId } = req.body;
        
        // Basic formatting for Safaricom phone numbers e.g 2547XXXXXXXX
        if (phone.startsWith('0')) {
            phone = '254' + phone.slice(1);
        } else if (phone.startsWith('+')) {
            phone = phone.slice(1);
        }

        const passkey = process.env.MPESA_PASSKEY;
        const shortcode = process.env.MPESA_SHORTCODE;
        
        // If missing env vars, simulate success for demo
        if (!passkey || !shortcode || !process.env.MPESA_CONSUMER_KEY) {
            console.warn("M-Pesa credentials missing. Simulating STK push success.");
            // Create pending transaction
            const tx = await Transaction.create({
                userId: userId || null,
                amount,
                phone,
                provider: 'mpesa',
                status: 'pending',
                merchantRequestId: 'MOCK_MERCHANT_' + Date.now(),
                checkoutRequestId: 'MOCK_CHECKOUT_' + Date.now()
            });

            return res.json({ message: 'Mock STK push initiated successfully.', simulated: true, transactionId: tx.id });
        }

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const token = await genToken();
        
        // Ensure proper callback URL based on deployment
        const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://my-domain.com/api/mpesa/callback';

        const stkPayload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: parseInt(amount), // Daraja expects integers
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: callbackUrl,
            AccountReference: 'ScriptureLight',
            TransactionDesc: 'Donation to Web Bible'
        };

        const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stkPayload)
        });

        const stkData = await stkRes.json();
        if (stkData.ResponseCode !== '0') {
            return res.status(400).json({ message: 'M-Pesa validation failed', details: stkData });
        }

        // Store transaction
        await Transaction.create({
            userId: userId || null,
            amount,
            phone,
            provider: 'mpesa',
            status: 'pending',
            merchantRequestId: stkData.MerchantRequestID,
            checkoutRequestId: stkData.CheckoutRequestID
        });

        res.json({ message: 'Check your phone to complete payment.', data: stkData });
    } catch (err) {
        console.error("STK Push error:", err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/callback', async (req, res) => {
    try {
        const body = req.body;
        console.log("M-Pesa callback:", JSON.stringify(body, null, 2));

        if (!body.Body || !body.Body.stkCallback) return res.send('ok');

        const callback = body.Body.stkCallback;
        const checkoutRequestId = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode; // 0 is success

        const tx = await Transaction.findOne({ where: { checkoutRequestId } });
        if (!tx) {
            console.log('Transaction not found for checkoutRequestId:', checkoutRequestId);
            return res.send('ok');
        }

        if (resultCode !== 0) {
            tx.status = 'failed';
            await tx.save();
            return res.send('ok');
        }

        // Successful transaction
        // Parse metadata
        const metadata = callback.CallbackMetadata.Item;
        let receiptNumber = '';
        if (metadata && Array.isArray(metadata)) {
            metadata.forEach(item => {
                if (item.Name === 'MpesaReceiptNumber') receiptNumber = item.Value;
            });
        }

        tx.status = 'completed';
        tx.reference = receiptNumber;
        await tx.save();

        res.send('ok');
    } catch (err) {
        console.error("Callback processing error:", err);
        res.send('ok'); // Send 200 OK so Safaricom doesn't keep retrying unnecessarily on code errors
    }
});

module.exports = router;
