import { Invoice } from '../../invoice/interfaces/invoice.interface';

export interface InvoiceProject {
    id?: string;
    project_name?: string;
    hours?: Number;
    rate?: Number;
    tax?: Number;
    invoice_id?: string;
    invoice?: Invoice;
    sub_total?: Number;
}
