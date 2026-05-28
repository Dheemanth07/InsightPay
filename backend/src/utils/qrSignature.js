import "../config/env.js";
import crypto from "crypto";

export function signQR(payload) {
    return crypto
        .createHmac("sha256", process.env.QR_SECRET) //combines the SHA-256 hash function with a secret key to produce a Hash-based Message Authentication Code (HMAC)
        .update(payload) //feeds the payload data into the HMAC instance
        .digest("hex"); //returns the resulting HMAC as a hexadecimal string
}

export function verifyQR(payload, signature) {
    const expected = signQR(payload);

    const expectedBuffer = Buffer.from(expected, 'hex'); //converts the expected signature from a hexadecimal string to a Buffer object
    const signatureBuffer = Buffer.from(signature, 'hex'); //converts the provided signature from a hexadecimal string to a Buffer object

    if (expectedBuffer.length !== signatureBuffer.length) //Check length of both buffers; if false qr is invalid
        return false;

    return crypto.timingSafeEqual(     //compares two Buffer objects (similar to ===) in a way that is resistant to timing attacks
        Buffer.from(signature),
        Buffer.from(expected),
    );
}
