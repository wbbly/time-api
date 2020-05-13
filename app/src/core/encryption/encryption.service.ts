import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = process.env.ENCRYPTION_CRYPTO_ALGORITHM;

    constructor() {}

    encrypt(text: string): string {
        const cipheriv = crypto.createCipheriv(
            this.algorithm,
            Buffer.from(process.env.ENCRYPTION_CRYPTO_KEY, 'hex'),
            Buffer.from(process.env.ENCRYPTION_CRYPTO_IV, 'hex')
        );
        let crypted = cipheriv.update(text, 'utf8', 'hex');
        crypted += cipheriv.final('hex');

        return crypted;
    }

    decrypt(text: string): string {
        const decipheriv = crypto.createDecipheriv(
            this.algorithm,
            Buffer.from(process.env.ENCRYPTION_CRYPTO_KEY, 'hex'),
            Buffer.from(process.env.ENCRYPTION_CRYPTO_IV, 'hex')
        );
        let dec = decipheriv.update(text, 'hex', 'utf8');
        dec += decipheriv.final('utf8');

        return dec;
    }
}
