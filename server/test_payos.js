const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

async function test() {
    const orderCode = Number(Date.now().toString().slice(-6));
    const amount = 5000;
    const description = `${orderCode} VIP`.substring(0, 25);
    const data = {
        orderCode,
        amount,
        description,
        returnUrl: `http://localhost:5173/premium-success?packageId=123`,
        cancelUrl: `http://localhost:5173/premium-cancel?packageId=123`,
        webhookUrl: `http://localhost:5000/api/payment/webhook`,
    };

    const rawSignature = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
    const signature = crypto.createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY).update(rawSignature).digest("hex");

    try {
        const response = await axios.get(
            `https://api-merchant.payos.vn/v2/payment-requests/21011`,
            { headers: { "Content-Type": "application/json", "x-client-id": process.env.PAYOS_CLIENT_ID, "x-api-key": process.env.PAYOS_API_KEY } }
        );
        console.log("Success:", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}
test();
