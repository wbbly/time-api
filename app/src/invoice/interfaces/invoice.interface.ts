import { User } from '../../user/interfaces/user.interface';
import { Client } from '../../client/interfaces/client.interface';
import { Team } from '../../team/interfaces/team.interface';
import { InvoiceProject } from '../../invoice/interfaces/invoice_project.interface';
import { InvoiceVendor } from '../../invoice/interfaces/invoice_vendor.interface';

export interface Invoice {
    id?: string;
    invoice_number?: string;
    invoice_vendor_id?: string;
    vendor_id?: string;
    client_id?: string;
    user_id?: string;
    team_id?: string;
    currency?: string;
    logo?: string;
    total?: number;
    sub_total?: number;
    tax_total?: number;
    discount?: number;
    comment?: string;
    invoice_date?: Date;
    due_date?: Date;
    payment_status?: boolean;
    user?: User;
    vendor?: User;
    client?: Client;
    team?: Team;
    invoice_projects?: InvoiceProject[];
    invoice_vendor?: InvoiceVendor;
    sending_status?: boolean;
    timezone_offset?: number;
    status?: string;
    overdue?: boolean;
    to?: Client;
    projects?: InvoiceProject[];
    reference?: string;
}
