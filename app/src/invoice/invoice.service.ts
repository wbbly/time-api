import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import PdfPrinter from 'pdfmake';
import { Invoice } from './interfaces/invoice.interface';
import moment, { Moment } from 'moment';

@Injectable()
export class InvoiceService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly userService: UserService
    ) {}

    async createPdfDocument(invoice: Invoice) {
        const user: any = await this.userService.getUserById(invoice.user_id);
        let language;
        user.language ? (language = user.language) : (language = 'en');
        const languageVaribles = {
            english: {
                from: 'From',
                to: 'To',
                invoiceNumber: 'InvoiceNumber No',
                date: 'Invoice Date:',
                dueDate: 'Due:',
                project: 'Project',
                hours: 'HRS/QNT',
                rate: 'Rate',
                tax: 'Tax',
                subTotal: 'Subtotal',
                summary: 'Invoice Summary',
                summarySubtotal: 'Subtotal',
                summaryTax: 'Tax',
                summaryTotal: 'Total (USD)',
            },
            russian: {
                from: 'От',
                to: 'Кому',
                invoiceNumber: 'Номер счета #',
                date: 'Дата счета:',
                dueDate: 'Дата платежа:',
                project: 'Проект',
                hours: 'Ч/Кол-во',
                rate: 'Ставка',
                tax: 'Налог',
                subTotal: 'Итог',
                summary: 'Общий Счет',
                summarySubtotal: 'Итог',
                summaryTax: 'Налог',
                summaryTotal: 'Всего (USD)',
            },
            ukrainian: {
                from: 'Від',
                to: 'Кому',
                invoiceNumber: 'Номер Рахунку: #',
                date: 'Дата рахунку:',
                dueDate: 'Дата платежу:',
                project: 'Проект',
                hours: 'Год/К-сть',
                rate: 'Ставка',
                tax: 'Податок',
                subTotal: 'Підсумок',
                summary: 'Загальний рахунок',
                summarySubtotal: 'Підсумок',
                summaryTax: 'Податок',
                summaryTotal: 'Всього (USD)',
            },
            italian: {
                from: 'A partire dal',
                to: 'Per',
                invoiceNumber: 'Numero di fattura No',
                date: 'Data Fattura:',
                dueDate: 'Dovuto:',
                project: 'Progetto',
                hours: 'HRS/QTY',
                rate: 'Vota',
                tax: 'Imposta',
                subTotal: 'Totale parziale',
                summary: 'Riepilogo Fattura',
                summarySubtotal: 'Totale parziale',
                summaryTax: 'Imposta',
                summaryTotal: 'Totale (USD)',
            },
            german: {
                from: 'Von',
                to: 'Zu',
                invoiceNumber: 'Rechnung Nr:',
                date: 'Rechnungsdatum:',
                dueDate: 'Fällig:',
                project: 'Projekt',
                hours: 'HRS/QTY',
                rate: 'Bewertung',
                tax: 'MwSt',
                subTotal: 'Zwischensum',
                summary: 'Rechnungszusammenfassung',
                summarySubtotal: 'Zwischensum',
                summaryTax: 'MwSt',
                summaryTotal: 'Gesamt(USD)',
            },
        };

        let docDefinitionLanguage;
        if (language === 'en') {
            docDefinitionLanguage = languageVaribles.english;
        } else if (language === 'ru') {
            docDefinitionLanguage = languageVaribles.russian;
        } else if (language === 'uk') {
            docDefinitionLanguage = languageVaribles.ukrainian;
        } else if (language === 'it') {
            docDefinitionLanguage = languageVaribles.italian;
        } else if (language === 'de') {
            docDefinitionLanguage = languageVaribles.german;
        }

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
                            text: `${docDefinitionLanguage.dueDate} ${invoice.due_date}`,
                        },
                    ],
                    margin: [0, 40, 0, 0],
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.date} ${moment(invoice.invoice_date).format('DD-MM-YYYY')}`,
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
                            text: `USD ${invoice.sub_total}`,
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
                            text: `${invoice.tax_total}`,
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
                            text: `USD ${invoice.total}`,
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
                            `${invoice.projects[i].tax}`,
                            `${invoice.projects[i].rate}`,
                            `${invoice.projects[i].sub_total}`,
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

    async getInvoicesDateData(userId?: string): Promise<Invoice[]> {
        let query;

        if (userId) {
            query = `{
            invoice_aggregate(
                where: {
                    invoice_vendor_id: {
                        _eq: "${userId}"}
                    }
                    ) {
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
        }

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

    async updateLastInvoiceNumberOfUser(userId: string, value: string): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            update_user(where: {id: {_eq: "${userId}"}},
             _set: {last_invoice_number: "${value}"}
             ) {
              returning {
                last_invoice_number
              }
            }
          }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
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
    }): Promise<AxiosResponse | AxiosError> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects);
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
        if (value.length === 1) value = '00' + value;
        else if (value.length === 2) value = '0' + value;
        else value = value + '';

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
        };

        const query = `mutation 
        addVendorData($invoice_vendor: invoice_vendor_obj_rel_insert_input) {
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
                    comment: ${comment ? '"' + comment + '"' : null}
                    logo: ${logo ? '"' + logo + '"' : null}
                    invoice_date: "${invoiceDate}"
                    due_date: "${dueDate}"
                    invoice_projects: { data: [${projects}]}
                    total: ${total}
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
        let amountQuery = '';
        if (page && limit) {
            const offset = +page === 1 ? 0 : +limit * (+page - 1);
            amountQuery = `limit: ${limit}, offset: ${offset}`;
        }

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const query = `{
            invoices: invoice(
              where: {
                user_id: {
                  _eq: "${userId}"
                },
                team_id: {
                    _eq: "${currentTeamId}"
                }
              },
              ${amountQuery}
              order_by: {invoice_date: desc, id: desc}
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
              tax_total
              total
              comment
              payment_status
              sending_status
              status
              overdue
            }
            
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getInvoice(id: string, userId?: string): Promise<Invoice> {
        const query = `{
            invoice: invoice_by_pk(id: "${id}") {
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
              total
              comment
              overdue
              sending_status
              payment_status
              status
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
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
                    status: "${invoiceStatus}"
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

    async updateSendingStatusInvoice(id: string, sendingStatus: boolean): Promise<AxiosResponse | AxiosError> {
        const invoice: Invoice = await this.getInvoice(id);
        let invoiceStatus: string = invoice.status;
        if (invoiceStatus === 'draft') invoiceStatus = 'awaiting';

        const query = `mutation {
            update_invoice(
                where: {
                    id: {
                        _eq: "${id}"
                    },
    
                },
                _set: {
                    sending_status: ${sendingStatus}
                    status : "${invoiceStatus}"
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
        const query = `mutation MyMutation {
            update_invoice(
                where: {
                id: {
                    _eq: "${invoiceId}"
                }
            }, 
                _set: {
                    overdue: ${status},
                    status: "overdue"
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
    }): Promise<AxiosResponse | AxiosError> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects, invoiceId);
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
                    status: "${invoiceStatus}",
                    timezone_offset: ${timezoneOffset},
                    invoice_number: ${invoiceNumber ? '"' + invoiceNumber + '"' : '"' + previousInvoiceNumber + '"'},
                    client_id: "${clientId}",
                    comment: "${comment}",
                    currency: "${currency ? currency : `USD`}",
                    due_date: "${dueDate}",
                    invoice_date: "${invoiceDate}",
                    logo: ${logo ? '"' + logo + '"' : null},
                    vendor_id: "${vendorId}",
                    total: ${total},
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
                invoice_vendor_id
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
                    const invoiceVendorID = resp[0].invoice_vendor_id;
                    const deleteInvoiceVendorQuery = `mutation MyMutation {
                          delete_invoice_vendor(
                              where: {
                                  id: {
                                      _eq: "${invoiceVendorID}"
                                  }
                              })
                               {
                            affected_rows
                          }
                        }`;

                    this.httpRequestsService
                        .request(deleteInvoiceVendorQuery)
                        .subscribe((res: AxiosResponse) => resolve(resp.shift()), (error: AxiosError) => reject(error));
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
