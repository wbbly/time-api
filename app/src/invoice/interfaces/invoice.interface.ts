import { User } from '../../user/interfaces/user.interface';
import { Client } from '../../client/interfaces/client.interface';
import { InvoiceProject } from '../../invoice/interfaces/invoice_project.interface';

export interface Invoice {
    id?: string;
    invoice_number?: Number;
    vendor_id?: string;
    client_id?: string;
    user_id?: string;
    currency?: string;
    logo?: string;
    total?: Number;
    sub_total?: Number;
    tax_total?: Number;
    comment?: string;
    invoice_date?: Date;
    due_date?: Date;
    payment_status?: boolean;
    user?: User;
    vendor?: User;
    client?: Client;
    invoice_projects?: InvoiceProject[];
}
