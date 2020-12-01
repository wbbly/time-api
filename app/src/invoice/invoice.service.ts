import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import PdfPrinter from 'pdfmake';
import { Invoice } from './interfaces/invoice.interface';
import moment, { Moment } from 'moment';
import { CurrencyService } from '../core/currency/currency.service';

@Injectable()
export class InvoiceService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly userService: UserService,
        private readonly currencyService: CurrencyService
    ) {}

    async createPdfDocument(invoice: Invoice) {
        const user: any = await this.userService.getUserById(invoice.user_id);
        const defaultLanguage = 'en';
        let language = user.language ? user.language : defaultLanguage;
        const languageVariables = {
            en: {
                from: 'From',
                to: 'To',
                invoiceNumber: 'Invoice No: ',
                date: 'Invoice Date:',
                dueDate: 'Due:',
                project: 'Project',
                hours: 'QTY',
                tax: 'Tax',
                rate: 'Rate',
                discount: 'Discount',
                subTotal: 'Subtotal',
                summary: 'Invoice Summary',
                summarySubtotal: 'Subtotal',
                summaryTax: 'Tax',
                summaryTotal: `Total (${invoice.currency})`,
            },
            ru: {
                from: 'От',
                to: 'Кому',
                invoiceNumber: 'Номер счета: ',
                date: 'Дата счета:',
                dueDate: 'Дата платежа:',
                project: 'Проект',
                hours: 'Кол-во',
                tax: 'Налог',
                rate: 'Ставка',
                discount: 'Скидка',
                subTotal: 'Итог',
                summary: 'Общий Счет',
                summarySubtotal: 'Итог',
                summaryTax: 'Налог',
                summaryTotal: `Всего (${invoice.currency})`,
            },
            uk: {
                from: 'Від',
                to: 'Кому',
                invoiceNumber: 'Номер Рахунку: ',
                date: 'Дата рахунку:',
                dueDate: 'Дата платежу:',
                project: 'Проект',
                hours: 'К-сть',
                tax: 'Податок',
                rate: 'Ставка',
                discount: 'Знижка',
                subTotal: 'Підсумок',
                summary: 'Загальний рахунок',
                summarySubtotal: 'Підсумок',
                summaryTax: 'Податок',
                summaryTotal: `Всього (${invoice.currency})`,
            },
            it: {
                from: 'A partire dal',
                to: 'Per',
                invoiceNumber: 'Numero di fattura No: ',
                date: 'Data Fattura:',
                dueDate: 'Dovuto:',
                project: 'Progetto',
                hours: 'QTY',
                tax: 'Imposta',
                rate: 'Vota',
                discount: 'Sconto',
                subTotal: 'Totale parziale',
                summary: 'Riepilogo Fattura',
                summarySubtotal: 'Totale parziale',
                summaryTax: 'Imposta',
                summaryTotal: `Totale (${invoice.currency})`,
            },
            de: {
                from: 'Von',
                to: 'Zu',
                invoiceNumber: 'Rechnung Nr: ',
                date: 'Rechnungsdatum:',
                dueDate: 'Fällig:',
                project: 'Projekt',
                hours: 'QTY',
                tax: 'MwSt',
                rate: 'Bewertung',
                discount: 'Rabatt',
                subTotal: 'Zwischensum',
                summary: 'Rechnungszusammenfassung',
                summarySubtotal: 'Zwischensum',
                summaryTax: 'MwSt',
                summaryTotal: `Gesamt(${invoice.currency})`,
            },
        };

        let docDefinitionLanguage = languageVariables[language] || languageVariables[defaultLanguage];

        const imageObj: any = {
            image: `${invoice.logo}`,
            width: 150,
            height: 150,
        };

        const docDefinition = {
            content: [
                {
                    style: 'fromTo',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.from}`,
                        },
                        {
                            text: `${docDefinitionLanguage.to}`,
                        },
                    ],
                    margin: [0, 50, 0, 15],
                },

                {
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.username ? invoice.invoice_vendor.username : ' '}`,
                        },
                        {
                            text: `${invoice.to.name ? invoice.to.name : ' '}`,
                        },
                    ],
                    margin: [0, 10, 0, 10],
                },
                {
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.city ? invoice.invoice_vendor.city : ' '}`,
                        },
                        {
                            text: `${invoice.to.city ? invoice.to.city : ' '}`,
                        },
                    ],
                    margin: [0, 10, 0, 10],
                },

                {
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.email ? invoice.invoice_vendor.email : ' '}`,
                        },
                        {
                            text: `${invoice.to.email ? invoice.to.email : ' '}`,
                        },
                    ],
                    margin: [0, 10, 0, 0],
                },
                {
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.phone ? invoice.invoice_vendor.phone : ' '}`,
                        },
                        {
                            text: `${invoice.to.phone ? invoice.to.phone : ' '}`,
                        },
                    ],
                    margin: [0, 10, 0, 0],
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.invoiceNumber} ${invoice.invoice_number}`,
                        },
                        {
                            text: `${docDefinitionLanguage.dueDate} ${moment(invoice.due_date).format('MMM Do, YYYY')}`,
                        },
                    ],
                    margin: [0, 40, 0, 0],
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.date} ${moment(invoice.invoice_date).format(
                                'MMM Do, YYYY'
                            )}`,
                        },
                    ],
                    margin: [0, 15, 0, 15],
                },
                {
                    style: 'tableMain',
                    fillColor: '#dddddd',
                    layout: 'noBorders',
                    table: {
                        widths: [180, 80, 80, 80, 80],
                        body: [
                            [
                                `${docDefinitionLanguage.project}`,
                                `${docDefinitionLanguage.hours}`,
                                `${docDefinitionLanguage.rate}`,
                                `${docDefinitionLanguage.tax}`,
                                `${docDefinitionLanguage.subTotal}`,
                            ],
                        ],
                    },
                },
                {
                    style: 'tableExample',
                    margin: [280, 30, 0, 10],
                    fillColor: '#dddddd',
                    bold: true,
                    layout: 'noBorders',
                    alignment: 'center',
                    table: {
                        widths: [250],
                        body: [[`${docDefinitionLanguage.summary}`]],
                    },
                },
                {
                    columns: [
                        {
                            text: `${docDefinitionLanguage.summarySubtotal}`,
                        },
                        {
                            text: `${this.currencyService.getFormattedValue(invoice.sub_total, invoice.currency)}`,
                        },
                    ],
                    margin: [300, 10, 0, 0],
                },
                {
                    columns: [
                        {
                            text: `${docDefinitionLanguage.discount}`,
                        },
                        {
                            text: `${invoice.discount} %`,
                        },
                    ],
                    margin: [300, 10, 0, 0],
                },
                {
                    columns: [
                        {
                            text: `${docDefinitionLanguage.summaryTax}`,
                        },
                        {
                            text: `${this.currencyService.getFormattedValue(invoice.tax_total, invoice.currency)}`,
                        },
                    ],
                    margin: [300, 10, 0, 0],
                },
                {
                    columns: [
                        {
                            text: `${docDefinitionLanguage.summaryTotal}`,
                        },
                        {
                            text: `${this.currencyService.getFormattedValue(invoice.total, invoice.currency)} `,
                        },
                    ],
                    margin: [300, 10, 0, 0],
                },
                {
                    style: 'fromTo',
                    fontSize: 10,
                    columns: [
                        {
                            text: 'Generated by Wobbly.me',
                        },
                    ],
                    margin: [210, 80, 0, 0],
                },
            ],
            styles: {
                fromTo: {
                    alignment: 'left',
                    fontSize: 16,
                    color: '#9c9898',
                },
                dateHeaders: {
                    bold: true,
                },
                tableProject: {
                    margin: [0, 5, 0, 0],
                },
                tableMain: {
                    bold: true,
                    margin: [0, 5, 0, 0],
                },
            },
            defaultStyle: {
                font: 'Roboto',
            },
        };

        let orderNumber: number = 8;

        if (invoice.logo) {
            docDefinition.content.unshift(imageObj);
            orderNumber = 9;
        }

        for (let i = 0; i < invoice.projects.length; i++) {
            let projectOnIteration = {
                style: 'tableProject',
                fillColor: '#ffffff',
                layout: 'noBorders',
                table: {
                    widths: [180, 80, 80, 80, 80],
                    body: [
                        [
                            `${invoice.projects[i].project_name}`,
                            `${invoice.projects[i].hours}`,
                            `${invoice.projects[i].rate}`,
                            `+${invoice.projects[i].tax} %`,
                            `${this.currencyService.getFormattedValue(
                                invoice.projects[i].sub_total,
                                invoice.currency
                            )}`,
                        ],
                    ],
                },
            };
            docDefinition.content.splice(orderNumber + i, 0, projectOnIteration);
        }

        var fonts = {
            Roboto: {
                normal: 'fonts/Roboto-Regular.ttf',
                bold: 'fonts/Roboto-Medium.ttf',
                italics: 'fonts/Roboto-Italic.ttf',
                bolditalics: 'fonts/Roboto-MediumItalic.ttf',
            },
        };

        const printer = new PdfPrinter(fonts);
        const options = {};
        const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

        return pdfDoc;
    }

    private getInvoiceProjectTotals(invoiceProjects, discount = 0, invoiceId?: string) {
        let total = 0;
        let sumSubTotal = 0;
        let sumTaxTotal = 0;
        const projects = invoiceProjects.map(el => {
            let subTotal = el.hours * el.rate;
            let tax = (subTotal * el.tax) / 100;
            total = total + subTotal;
            sumSubTotal = sumSubTotal + subTotal;
            sumTaxTotal = sumTaxTotal + tax;
            let invoiceExpr = ``;

            if (invoiceId) {
                invoiceExpr = `invoice_id: "${invoiceId}",`;
            }

            return `
                {
                    ${invoiceExpr}
                    project_name: "${el.projectName}",
                    hours: ${el.hours},
                    tax: ${el.tax},
                    rate: ${el.rate},
                    sub_total: ${subTotal}
                }
            `;
        });
        let subTotalDiscount = discount ? (total / 100) * (100 - discount) : total;
        total = subTotalDiscount + sumTaxTotal;

        return { total, sumSubTotal, sumTaxTotal, projects };
    }

    async getInvoicesDateData(userId?: string): Promise<Invoice[]> {
        let query;

        const variables: any = {
            where: {
                invoice_vendor_id: {
                    _eq: userId,
                },
            },
        };

        if (userId) {
            query = `query invoices($where: invoice_bool_exp){
            invoices: invoice_aggregate(where: $where) {
              nodes {
                due_date
                overdue
                timezone_offset
                id
                payment_status
                sending_status
                status
              }
            }
          }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService.graphql(query, variables).subscribe(
                    (res: AxiosResponse) => {
                        const resp = res.data.invoice_aggregate.nodes;
                        return resolve(resp);
                    },
                    (error: AxiosError) => reject(error)
                );
            });
        } else {
            query = `{
            invoice_aggregate {
              nodes {
                due_date
                overdue
                timezone_offset
                id
                payment_status
                sending_status
                status
              }
            }
          }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    (res: AxiosResponse) => {
                        const resp = res.data.invoice_aggregate.nodes;
                        return resolve(resp);
                    },
                    (error: AxiosError) => reject(error)
                );
            });
        }
    }

    async updateLastInvoiceNumberOfUser(userId: string, value: string): Promise<AxiosResponse | AxiosError> {
        const variables = {
            where: {
                id: {
                    _eq: userId,
                },
            },
            set: {
                last_invoice_number: value,
            },
        };

        const query = `mutation user($where: user_bool_exp!, $set: user_set_input) {
             user: update_user(where: $where,
             _set: $set
             ) {
              returning {
                last_invoice_number
              }
            }
          }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
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
        invoiceVendor,
        invoiceNumber,
        timezoneOffset,
        discount,
    }): Promise<AxiosResponse | AxiosError> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects, discount);
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        let user: any = await this.userService.getUserById(userId);

        let invoiceStatus: string = 'draft';
        let overdueStatus: boolean = false;
        const dueDateObj: Moment = moment(dueDate)
            .add(1, 'day')
            .startOf('day');

        const currentDateObj: Moment = moment().subtract(timezoneOffset, 'milliseconds');
        if (currentDateObj.isAfter(dueDateObj)) {
            invoiceStatus = 'overdue';
            overdueStatus = true;
        }
        let lastInvoiceNumber = user.lastInvoiceNumber;

        let value: number | string = Number(lastInvoiceNumber) + 1 + '';
        await this.updateLastInvoiceNumberOfUser(userId, value);
        if (value.length === 1) {
            value = '00' + value;
        } else if (value.length === 2) {
            value = '0' + value;
        } else {
            value = value + '';
        }

        const variables = {
            invoice_vendor: {
                data: {
                    username: invoiceVendor.username ? invoiceVendor.username : user.username,
                    email: invoiceVendor.email ? invoiceVendor.email : user.email,
                    language: invoiceVendor.language ? invoiceVendor.language : user.language,
                    phone: invoiceVendor.phone ? invoiceVendor.phone : user.phone,
                    state: invoiceVendor.state ? invoiceVendor.state : user.state,
                    city: invoiceVendor.city ? invoiceVendor.city : user.city,
                    country: invoiceVendor.country ? invoiceVendor.country : user.country,
                    zip: invoiceVendor.zip ? invoiceVendor.zip : user.zip,
                    company_name: invoiceVendor.company_name,
                },
            },
            invoiceComment: comment ? comment : '',
        };

        const query = `mutation 
        addVendorData($invoice_vendor: invoice_vendor_obj_rel_insert_input, $invoiceComment: String) {
            insert_invoice(
                objects: {
                    status: "${invoiceStatus}"
                    overdue : ${overdueStatus}
                    timezone_offset: "${timezoneOffset}"
                    invoice_number: ${invoiceNumber ? '"' + invoiceNumber + '"' : '"' + value + '"'}
                    vendor_id: "${vendorId}"
                    user_id: "${userId}"
                    team_id: "${currentTeamId}"
                    client_id: "${clientId}"
                    currency: "${currency ? currency : `USD`}"
                    comment: $invoiceComment
                    logo: ${logo ? '"' + logo + '"' : null}
                    invoice_date: "${invoiceDate}"
                    due_date: "${dueDate}"
                    invoice_projects: { data: [${projects}]}
                    total: ${total}
                    discount: ${discount}
                    sub_total: ${sumSubTotal}
                    tax_total: ${sumTaxTotal}
                    invoice_vendor: $invoice_vendor}
                     ) {
              returning {
                id
              }
            }
          }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getInvoiceList(
        userId: string,
        params: { page?: string; limit?: string }
    ): Promise<AxiosResponse | AxiosError> {
        let { page, limit } = params;
        const pageSize = limit ? Number(limit) : 10;
        const numberOfPage = page ? Number(page) : 1;

        const offset = numberOfPage === 1 ? 0 : pageSize * (numberOfPage - 1);

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const variables: any = {
            where: {
                user_id: {
                    _eq: userId,
                },
                team_id: {
                    _eq: currentTeamId,
                },
            },
            limit: pageSize,
            offset: offset,
        };

        const query = `query invoices ($where: invoice_bool_exp, $limit: Int, $offset: Int){
            invoices: invoice(
                where: $where, limit: $limit, offset: $offset, order_by: {invoice_date: desc, id: desc},
            ) {
              id
              timezone_offset
              invoice_number
              invoice_date
              due_date
              currency
              logo
              invoice_vendor {
                id
                username
                email
                language
                phone
                state
                country
                city
                zip
                company_name
              }
              from: vendor {
                id
                username
                city
                company_name
                language
                email
                phone
                country
                state
                zip
              }
              to: client {
                id
                name
                email
                company_name
                language
                country  
                city
                phone
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
              discount
              tax_total
              total
              comment
              payment_status
              sending_status
              status
              overdue
            }
            invoicesAmount: invoice_aggregate( where: $where) {
                aggregate {
                    count
                }
            } 
            
        }`;

        return this.httpRequestsService
            .graphql(query, variables)
            .toPromise()
            .then(result => this.invoiceListMapper(result, numberOfPage, pageSize));
    }

    async invoiceListMapper(invoiceList, page, pageSize) {
        const invoiceAmount: string = invoiceList.data.invoicesAmount.aggregate.count;

        const result: any = {
            data: {
                invoices: invoiceList.data.invoices,
                pagination: {
                    page: page.toString(),
                    pageSize: pageSize.toString(),
                    pagesAmount: Math.ceil(Number(invoiceAmount) / pageSize).toString(),
                },
            },
        };

        return result;
    }

    async getInvoice(id: string, userId?: string): Promise<Invoice> {
        const variables = {
            id,
        };

        const query = `query invoice ($id: uuid!){
            invoice: invoice_by_pk(id: $id) {
              id
              timezone_offset
              invoice_number
              invoice_date
              due_date
              currency
              user_id
              logo
              invoice_vendor_id
              invoice_vendor {
                id
                username
                email
                language
                phone
                state
                country
                city
                zip
                company_name
              }
              from: vendor {
                id
                username
                city
                company_name
                language
                email
                phone
                country
                state
                zip
              }
              to: client {
                id
                name
                email
                company_name
                language
                country  
                city
                phone
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
              discount
              total
              comment
              overdue
              sending_status
              payment_status
              status
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.invoice;
                    if (userId) {
                        if (!resp || (resp.user_id && resp.user_id !== userId)) {
                            return reject({
                                message: 'ERROR.INVOICE.GET_FAILED',
                            });
                        }
                    }
                    return resolve(resp);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updatePaymentStatusInvoice(
        userId: string,
        id: string,
        paymentStatus: boolean
    ): Promise<AxiosResponse | AxiosError> {
        const invoice: Invoice = await this.getInvoice(id, userId);
        let invoiceStatus = 'draft';
        if (paymentStatus) {
            invoiceStatus = 'paid';
        } else {
            if (invoice.overdue) {
                invoiceStatus = 'overdue';
            } else {
                if (invoice.sending_status) {
                    invoiceStatus = 'awaiting';
                }
            }
        }

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                user_id: {
                    _eq: userId,
                },
            },
            set: {
                payment_status: paymentStatus,
                status: invoiceStatus,
            },
        };

        const query = `mutation invoice($where: invoice_bool_exp!, $set: invoice_set_input) {
            update_invoice: update_invoice(
                where: $where,
                _set: $set
            ) {
              returning {
                id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
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

    async updateSendingStatusInvoice(id: string, sendingStatus: boolean): Promise<AxiosResponse | AxiosError> {
        const invoice: Invoice = await this.getInvoice(id);
        let invoiceStatus: string = invoice.status;
        if (invoiceStatus === 'draft') {
            invoiceStatus = 'awaiting';
        }

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
            },
            set: {
                sending_status: sendingStatus,
                status: invoiceStatus,
            },
        };

        const query = `mutation invoice($where: invoice_bool_exp!, $set: invoice_set_input) {
            update_invoice: update_invoice(
                where: $where,
                _set: $set
            ) {
              returning {
                id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.update_invoice.returning;
                    if (!resp.length) {
                        return reject({
                            message: 'ERROR.INVOICE.UPDATE_SENDING_FAILED',
                        });
                    }
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updateInvoiceOverdueStatus(invoiceId: string, status: boolean): Promise<AxiosResponse | AxiosError> {
        const invoiceStatus = 'overdue';

        const variables = {
            where: {
                id: {
                    _eq: invoiceId,
                },
            },
            set: {
                overdue: status,
                status: invoiceStatus,
            },
        };

        const query = `mutation invoice($where: invoice_bool_exp!, $set: invoice_set_input) {
            update_invoice: update_invoice(
                where: $where, 
                _set: $set
                ) {
              returning {
                id
              }
            }
          }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async updateAllInvoicesOverdueStatus(): Promise<void> {
        const invoiceList: Invoice[] = await this.getInvoicesDateData();

        for (let el of invoiceList) {
            const invoiceId: string = el.id;
            const dueDateObj: Moment = moment(el.due_date)
                .add(1, 'day')
                .startOf('day');

            const currentDateObj: Moment = moment().subtract(el.timezone_offset, 'milliseconds');

            if (currentDateObj.isAfter(dueDateObj)) {
                await this.updateInvoiceOverdueStatus(invoiceId, true);
            }
        }
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
        invoiceVendor,
        logo,
        invoiceNumber,
        timezoneOffset,
        discount,
    }): Promise<AxiosResponse | AxiosError> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(
            invoiceProjects,
            discount,
            invoiceId
        );
        const invoice: Invoice = await this.getInvoice(invoiceId, userId);

        const dueDateObj: Moment = moment(dueDate).add(1, 'day');
        const currentDateObj: Moment = moment().subtract(timezoneOffset, 'milliseconds');
        let overdueStatus;
        currentDateObj.isAfter(dueDateObj) ? (overdueStatus = true) : (overdueStatus = false);
        let invoiceStatus = 'draft';
        if (invoice.payment_status) {
            invoiceStatus = 'paid';
        } else {
            if (overdueStatus) {
                invoiceStatus = 'overdue';
            } else {
                if (invoice.sending_status) {
                    invoiceStatus = 'awaiting';
                }
            }
        }

        const previousInvoiceNumber: string = invoice.invoice_number;

        const variables = {
            invoiceComment: comment,
        };

        const query = `mutation updateInvoice($invoiceComment: String){
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
                    status: "${invoiceStatus}",
                    timezone_offset: ${timezoneOffset},
                    invoice_number: ${invoiceNumber ? '"' + invoiceNumber + '"' : '"' + previousInvoiceNumber + '"'},
                    client_id: "${clientId}",
                    comment: $invoiceComment,
                    currency: "${currency ? currency : `USD`}",
                    due_date: "${dueDate}",
                    invoice_date: "${invoiceDate}",
                    logo: ${logo ? '"' + logo + '"' : null},
                    vendor_id: "${vendorId}",
                    total: ${total},
                    discount: ${discount},
                    sub_total: ${sumSubTotal},
                    tax_total: ${sumTaxTotal},
                    overdue : ${overdueStatus}
                }
            ) {
              returning {
                id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
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
                                insert_invoice_project(objects: [${projects}]
                                    

                                    ) {
                                    returning {
                                        id
                                    }
                                }
                            }`;
                            this.httpRequestsService.request(queryInsertInvoiceProject).subscribe(
                                (res: AxiosResponse) => {
                                    const variables = {
                                        where: {
                                            id: {
                                                _eq: invoice.invoice_vendor_id,
                                            },
                                        },
                                        _set: {
                                            username: invoiceVendor.username,
                                            email: invoiceVendor.email,
                                            language: invoiceVendor.language,
                                            phone: invoiceVendor.phone ? invoiceVendor.phone : null,
                                            country: invoiceVendor.country ? invoiceVendor.country : null,
                                            city: invoiceVendor.city ? invoiceVendor.city : null,
                                            state: invoiceVendor.state ? invoiceVendor.state : null,
                                            zip: invoiceVendor.zip ? invoiceVendor.zip : null,
                                            company_name: invoiceVendor.company_name,
                                        },
                                    };

                                    const queryInsertInvoiceVendor = `mutation addInvoiceVendor(
                                        $_set: invoice_vendor_set_input,
                                        $where: invoice_vendor_bool_exp!
                                         )
                                          {
                                        update_invoice_vendor(
                                            where: $where, 
                                            _set: $_set) 
                                            {
                                          returning {
                                            id
                                          }
                                        }
                                      }`;

                                    this.httpRequestsService
                                        .graphql(queryInsertInvoiceVendor, variables)
                                        .subscribe(
                                            (res: AxiosResponse) => resolve(res),
                                            (error: AxiosError) => reject(error)
                                        );
                                },
                                (error: AxiosError) => reject(error)
                            );
                        },
                        (error: AxiosError) => reject(error)
                    );
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async deleteInvoice(userId: string, id: string): Promise<void> {
        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                user_id: {
                    _eq: userId,
                },
            },
        };

        const query = `mutation invoice($where: invoice_bool_exp!) {
            delete_invoice: delete_invoice(where: $where) {
              returning {
                id
                logo
                invoice_vendor_id
              }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    const resp = res.data.delete_invoice.returning;

                    if (!resp.length) {
                        return reject({
                            message: 'ERROR.INVOICE.DELETE_FAILED',
                        });
                    }
                    const invoiceVendorID = resp[0].invoice_vendor_id;

                    const variables = {
                        where: {
                            id: {
                                _eq: invoiceVendorID,
                            },
                        },
                    };

                    const deleteInvoiceVendorQuery = `mutation invoice($where: invoice_vendor_bool_exp!) {
                          delete_invoice_vendor: delete_invoice_vendor(where: $where) {
                            affected_rows
                          }
                        }`;

                    this.httpRequestsService
                        .graphql(deleteInvoiceVendorQuery, variables)
                        .subscribe((res: AxiosResponse) => resolve(resp.shift()), (error: AxiosError) => reject(error));
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
