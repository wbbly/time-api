import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class InvoiceService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    private getInvoiceProjectTotals(invoiceProjects, invoiceId?: string) {
        let total = 0;
        let sumSubTotal = 0;
        let sumTaxTotal = 0;
        const projects = invoiceProjects.map(el => {
            let subTotal = el.hours * el.rate;
            let tax = (subTotal * el.tax) / 100;
            total = total + subTotal + tax;
            sumSubTotal = sumSubTotal + subTotal;
            sumTaxTotal = sumTaxTotal + tax;

            let invoiceExpr = ``;

            if (invoiceId) invoiceExpr = `invoice_id: "${invoiceId}",`;

            return `
                {
                    ${invoiceExpr}
                    project_name: "${el.projectName}",
                    hours: ${el.hours},
                    rate: ${el.rate},
                    tax: ${el.tax},
                    sub_total: ${subTotal}
                }
            `;
        });

        return { total, sumSubTotal, sumTaxTotal, projects };
    }

    async createInvoice({
        userId,
        vendorId,
        clientId,
        currency,
        comment,
        invoiceDate,
        dueDate,
        invoiceProjects,
        logo,
    }) {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects);

        const query = `mutation {
            insert_invoice(
                objects: {
                    vendor_id: "${vendorId}"
                    user_id: "${userId}"
                    client_id: "${clientId}"
                    currency: "${currency ? currency : `USD`}"
                    comment: ${comment ? '"' + comment + '"' : null}
                    logo: ${logo ? '"' + logo + '"' : null}
                    invoice_date: "${invoiceDate}"
                    due_date: "${dueDate}"
                    invoice_projects: { data: [${projects}]}
                    total: ${total}
                    sub_total: ${sumSubTotal}
                    tax_total: ${sumTaxTotal}
                }
            ) {
                returning {
                    id
                }
            }
          }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getInvoiceList(userId: string, params: { page?: string; limit?: string }) {
        let { page, limit } = params;
        let amountQuery = '';

        if (page && limit) {
            const offset = +page === 1 ? 0 : +limit * (+page - 1);
            amountQuery = `limit: ${limit}, offset: ${offset}`;
        }

        const query = `{
            invoices: invoice(
              where: {
                user_id: {
                  _eq: "${userId}"
                }
              },
              ${amountQuery}
              order_by: {invoice_number: desc}
            ) {
              id
              invoice_number
              invoice_date
              due_date
              currency
              logo
              from: vendor {
                id
                username
                email
                country
                city
                state
                zip
              }
              to: client {
                id
                name
                email
                country
                city
                state
                zip
              }
              projects: invoice_projects {
                id
                project_name
                hours
                rate
                tax
                sub_total
              }
              sub_total
              tax_total
              total
              comment
              payment_status
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getInvoice(userId: string, id: string) {
        const query = `{
            invoice: invoice_by_pk(id: "${id}") {
              id
              invoice_number
              invoice_date
              due_date
              currency
              user_id
              logo
              from: vendor {
                id
                username
                email
                country
                city
                state
                zip
              }
              to: client {
                id
                name
                email
                country
                city
                state
                zip
              }
              projects: invoice_projects {
                id
                project_name
                hours
                rate
                tax
                sub_total
              }
              sub_total
              tax_total
              total
              comment
              payment_status
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.invoice;

                    if (!resp || (resp.user_id && resp.user_id !== userId)) {
                        return reject({
                            message: 'ERROR.INVOICE.GET_FAILED',
                        });
                    }

                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updatePaymentStatusInvoice(userId: string, id: string, paymentStatus: boolean) {
        const query = `mutation {
            update_invoice(
                where: {
                    id: {
                        _eq: "${id}"
                    }, 
                    user_id: {
                        _eq: "${userId}"
                    }
                }, 
                _set: {
                    payment_status: ${paymentStatus}
                }
            ) {
              returning {
                id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.update_invoice.returning;

                    if (!resp.length) {
                        return reject({
                            message: 'ERROR.INVOICE.UPDATE_PAYMENT_FAILED',
                        });
                    }
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updateInvoice({
        invoiceId,
        userId,
        vendorId,
        clientId,
        currency,
        comment,
        invoiceDate,
        dueDate,
        invoiceProjects,
        logo,
    }) {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects, invoiceId);

        const query = `mutation {
            update_invoice(
                where: {
                    id: {
                        _eq: "${invoiceId}"
                    }, 
                    user_id: {
                        _eq: "${userId}"
                    }
                }, 
                _set: {
                    client_id: "${clientId}",
                    comment: "${comment}",
                    currency: "${currency ? currency : `USD`}",
                    due_date: "${dueDate}",
                    invoice_date: "${invoiceDate}",
                    logo: ${logo ? '"' + logo + '"' : null},
                    vendor_id: "${vendorId}",
                    total: ${total},
                    sub_total: ${sumSubTotal},
                    tax_total: ${sumTaxTotal}
                }
            ) {
              returning {
                id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.update_invoice.returning;

                    if (!resp.length) {
                        return reject({
                            message: 'ERROR.INVOICE.UPDATE_INVOICE_FAILED',
                        });
                    }

                    const queryDeleteInvoiceProject = `mutation {
                        delete_invoice_project(
                            where: {
                                invoice_id: {
                                    _eq: "${invoiceId}"
                                }
                            }
                        ) {
                          returning {
                            id
                          }
                        }
                    }`;

                    this.httpRequestsService.request(queryDeleteInvoiceProject).subscribe(
                        (res: AxiosResponse) => {
                            const queryInsertInvoiceProject = `mutation {
                                insert_invoice_project(objects: [${projects}]) {
                                    returning {
                                        id
                                    }
                                }
                            }`;
                            this.httpRequestsService
                                .request(queryInsertInvoiceProject)
                                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
                        },
                        (error: AxiosError) => reject(error)
                    );
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async deleteInvoice(userId: string, id: string) {
        const query = `mutation {
            delete_invoice(
                where: {
                    id: {
                        _eq: "${id}"
                    }, 
                    user_id: {
                        _eq: "${userId}"
                    }
                }
            ) {
              returning {
                id
                logo
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.delete_invoice.returning;

                    if (!resp.length) {
                        return reject({
                            message: 'ERROR.INVOICE.DELETE_FAILED',
                        });
                    }
                    return resolve(resp.shift());
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
