const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function encryptConfig(config) {
    const secret = process.env.CONFIG_SECRET;
    if (!secret) {
        console.log('[CRYPTO] No CONFIG_SECRET found, returning plain config');
        return JSON.stringify(config);
    }

    try {
        const configStr = JSON.stringify(config);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
        
        const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(configStr, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        
        const result = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
        console.log('[CRYPTO] Config encrypted successfully');
        return result;
    } catch (error) {
        console.error('[CRYPTO] Encryption failed:', error.message);
        return JSON.stringify(config);
    }
}

function tryParseConfigToken(token) {
    console.log('[CRYPTO] Parsing token:', token ? `${token.substring(0, 20)}...` : 'null');
    const secret = process.env.CONFIG_SECRET;
    console.log('[CRYPTO] CONFIG_SECRET present:', !!secret);
    
    if (!secret) {
        console.log('[CRYPTO] No secret, trying base64 decode then JSON parse');
        try {
            // First try base64 decode
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            console.log('[CRYPTO] Base64 decoded:', decoded.substring(0, 50) + '...');
            const config = JSON.parse(decoded);
            console.log('[CRYPTO] JSON parsed successfully:', Object.keys(config));
            return config;
        } catch (error) {
            console.log('[CRYPTO] Base64+JSON parse failed:', error.message);
            // Fallback to plain JSON
            try {
                const config = JSON.parse(token);
                console.log('[CRYPTO] Plain JSON parsed successfully:', Object.keys(config));
                return config;
            } catch (error2) {
                console.log('[CRYPTO] Plain JSON parse also failed:', error2.message);
                return null;
            }
        }
    }

    try {
        const data = Buffer.from(token, 'base64');
        
        if (data.length < ENCRYPTED_POSITION) {
            throw new Error('Invalid token length');
        }
        
        const salt = data.subarray(0, SALT_LENGTH);
        const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = data.subarray(ENCRYPTED_POSITION);
        
        const key = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
        
        const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        const config = JSON.parse(decrypted.toString('utf8'));
        console.log('[CRYPTO] Config decrypted successfully');
        return config;
    } catch (error) {
        console.error('[CRYPTO] Decryption failed:', error.message);
        try {
            return JSON.parse(token);
        } catch {
            return null;
        }
    }
}

module.exports = {
    encryptConfig,
    tryParseConfigToken
};
