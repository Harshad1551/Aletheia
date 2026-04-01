const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) in .env file');
}

const keyStore = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text 
 * @returns {{ iv: string, encryptedData: string }}
 */
function encrypt(text) {
    if (!text) return { iv: null, encryptedData: null };
    
    // Generate a random 16-byte initialization vector
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyStore, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

/**
 * Decrypts a string using AES-256-CBC
 * @param {string} encryptedData 
 * @param {string} ivHex 
 * @returns {string} The decrypted plaintext, or the original text if decryption fails (backwards compatibility)
 */
function decrypt(encryptedData, ivHex) {
    if (!encryptedData) return encryptedData;
    // If there is no IV, it's a legacy unencrypted string
    if (!ivHex) return encryptedData;

    try {
        const ivBuffer = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyStore, ivBuffer);
        
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        // If decryption fails (e.g., wrong key or corrupted data), 
        // return the original string just in case it was somehow unencrypted or to prevent crashing.
        console.error('Decryption failed for:', encryptedData);
        return encryptedData;
    }
}

module.exports = {
    encrypt,
    decrypt
};
