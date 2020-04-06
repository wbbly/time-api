import { User } from '../../user/interfaces/user.interface';
import { Client } from '../../client/interfaces/client.interface';
import { InvoiceProject } from '../../invoice/interfaces/invoice_project.interface';

export interface Invoice {
    id?: string;
    invoice_number?: number;
    vendor_id?: string;
    client_id?: string;
    user_id?: string;
    currency?: string;
    logo?: string;
    total?: number;
    sub_total?: number;
    tax_total?: number;
    comment?: string;
    invoice_date?: Date;
    due_date?: Date;
    payment_status?: boolean;
    user?: User;
    vendor?: User;
    client?: Client;
    invoice_projects?: InvoiceProject[];
}
