import { Injectable } from '@nestjs/common';

import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class JiraAuthService {
    private readonly PREFIX = 'ENC-wbl-';

    constructor(private readonly encryptionService: EncryptionService) {}

    encrypt(token: string | null): string | null {
        let tokenEncrypted = null;
        if (token) {
            tokenEncrypted = token;
            if (!token.startsWith(this.PREFIX)) {
                // not encrypted
                tokenEncrypted = `${this.PREFIX}${this.encryptionService.encrypt(token)}`;
            }
        }

        return tokenEncrypted;
    }

    decrypt(token: string | null): string | null {
        let tokenDecrypted = null;
        if (token) {
            tokenDecrypted = token;
            if (token.startsWith(this.PREFIX)) {
                // encrypted
                tokenDecrypted = this.encryptionService.decrypt(token.replace(this.PREFIX, ''));
            }
        }

        return tokenDecrypted;
    }
}
