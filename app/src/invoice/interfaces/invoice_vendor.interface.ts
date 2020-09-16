import { Invoice } from '../../invoice/interfaces/invoice.interface';

export interface InvoiceVendor {
    id?: string;
    username?: string;
    email?: string;
    language?: string;
    phone?: string;
    state?: string;
    country?: string;
    city?: string;
    zip?: string;
    invoice?: Invoice;
    company_name?: string;
}
