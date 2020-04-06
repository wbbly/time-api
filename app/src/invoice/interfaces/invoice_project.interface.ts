import { Invoice } from '../../invoice/interfaces/invoice.interface';

export interface InvoiceProject {
    id?: string;
    project_name?: string;
    hours?: number;
    rate?: number;
    tax?: number;
    invoice_id?: string;
    invoice?: Invoice;
    sub_total?: number;
}
