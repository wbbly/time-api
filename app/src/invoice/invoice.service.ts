import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import fs from 'fs';
import * as path from 'path';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import PdfPrinter from 'pdfmake';
import { Invoice } from './interfaces/invoice.interface';
import moment, { Moment } from 'moment';
import { CurrencyService } from '../core/currency/currency.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { FileService } from '../file/file.service';

@Injectable()
export class InvoiceService {
    private PUBLIC_DIR_PATH = 'public/';
    private INVOICE_STATUS = {
        DRAFT: 'draft',
        OVERDUE: 'overdue',
        AWAITING: 'awaiting',
        PAID: 'paid',
        REVIEWED: 'reviewed',
    };
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly userService: UserService,
        private readonly currencyService: CurrencyService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly fileService: FileService
    ) {}

    async createPdfDocument(invoice: Invoice) {
        const user: any = await this.userService.getUserById(invoice.user_id);
        const defaultLanguage = 'en';
        const language = user.language ? user.language : defaultLanguage;
        const languageVariables = {
            en: {
                from: 'From',
                to: 'To',
                invoiceNumber: 'Invoice: ',
                date: 'Issued:',
                dueDate: 'Due Date:',
                description: 'Description',
                hours: 'QTY',
                tax: 'Tax',
                rate: 'Rate',
                discount: 'Discount',
                subTotal: 'Subtotal',
                summary: 'Invoice Summary',
                summarySubtotal: 'Subtotal',
                summaryTax: 'Tax',
                summaryTotal: `Total (${invoice.currency})`,
                comments: 'Comments',
                reference: 'Reference:',
            },
            ru: {
                from: 'От',
                to: 'Кому',
                invoiceNumber: 'Номер счета: ',
                date: 'Дата счета:',
                dueDate: 'Дата платежа:',
                description: 'Описание',
                hours: 'Кол-во',
                tax: 'Налог',
                rate: 'Ставка',
                discount: 'Скидка',
                subTotal: 'Итог',
                summary: 'Общий Счет',
                summarySubtotal: 'Итог',
                summaryTax: 'Налог',
                summaryTotal: `Всего (${invoice.currency})`,
                comments: 'Комментарии',
                reference: 'Пометки:',
            },
            uk: {
                from: 'Від',
                to: 'Кому',
                invoiceNumber: 'Номер Рахунку: ',
                date: 'Дата рахунку:',
                dueDate: 'Дата платежу:',
                description: 'Опис',
                hours: 'К-сть',
                tax: 'Податок',
                rate: 'Ставка',
                discount: 'Знижка',
                subTotal: 'Підсумок',
                summary: 'Загальний рахунок',
                summarySubtotal: 'Підсумок',
                summaryTax: 'Податок',
                summaryTotal: `Всього (${invoice.currency})`,
                comments: 'Коментарі',
                reference: 'Вiдмiтки:',
            },
            it: {
                from: 'A partire dal',
                to: 'Per',
                invoiceNumber: 'Numero di fattura No: ',
                date: 'Data Fattura:',
                dueDate: 'Dovuto:',
                description: 'Descrizione',
                hours: 'QTY',
                tax: 'Imposta',
                rate: 'Vota',
                discount: 'Sconto',
                subTotal: 'Totale parziale',
                summary: 'Riepilogo Fattura',
                summarySubtotal: 'Totale parziale',
                summaryTax: 'Imposta',
                summaryTotal: `Totale (${invoice.currency})`,
                comments: 'Commenti',
                reference: 'Riferimento:',
            },
            de: {
                from: 'Von',
                to: 'Zu',
                invoiceNumber: 'Rechnung Nr: ',
                date: 'Rechnungsdatum:',
                dueDate: 'Fällig:',
                description: 'Beschreibung',
                hours: 'QTY',
                tax: 'MwSt',
                rate: 'Bewertung',
                discount: 'Rabatt',
                subTotal: 'Zwischensum',
                summary: 'Rechnungszusammenfassung',
                summarySubtotal: 'Zwischensum',
                summaryTax: 'MwSt',
                summaryTotal: `Gesamt(${invoice.currency})`,
                comments: 'Bemerkungen',
                reference: 'Referenz:',
            },
        };

        const docDefinitionLanguage = languageVariables[language] || languageVariables[defaultLanguage];

        const imageObj: any = {
            margin: [0, 0, 0, 0],
            image: `${invoice.logo}`,
            width: 100,
        };

        const emptyColumn: any = {
            text: '',
            width: 100,
        };

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [20, 35, 20, 35],
            content: [
                {
                    columnGap: 20,
                    columns: [
                        [
                            {
                                layout: 'noBorders',
                                table: {
                                    headerRows: 0,
                                    widths: ['35%', '65%'],
                                    body: [
                                        [
                                            {
                                                text: `${docDefinitionLanguage.invoiceNumber}`,
                                                style: 'dateHeaders',
                                                margin: [0, 0, 0, 4],
                                            },
                                            {
                                                text: `${docDefinitionLanguage.reference}`,
                                                style: 'dateHeaders',
                                                margin: [0, 0, 0, 4],
                                            },
                                        ],
                                        [
                                            {
                                                text: `#${invoice.invoice_number}`,
                                                margin: [0, 0, 0, 14],
                                            },
                                            {
                                                text: `${invoice.reference || ' - '}`,
                                                margin: [0, 0, 0, 14],
                                            },
                                        ],
                                        [
                                            {
                                                text: `${docDefinitionLanguage.date}`,
                                                style: 'dateHeaders',
                                                margin: [0, 0, 0, 4],
                                            },
                                            {
                                                text: `${docDefinitionLanguage.dueDate}`,
                                                style: 'dateHeaders',
                                                margin: [0, 0, 0, 4],
                                            },
                                        ],
                                        [
                                            { text: `${moment(invoice.invoice_date).format('MMM Do, YYYY')}` },
                                            { text: `${moment(invoice.due_date).format('MMM Do, YYYY')}` },
                                        ],
                                    ],
                                },
                            },
                        ],
                    ],
                },
                {
                    layout: {
                        hLineWidth(i, node) {
                            if (i === 0 || i === node.table.body.length) {
                                return 1;
                            } else {
                                return 0;
                            }
                        },
                        vLineWidth(i, node) {
                            if (i === 0 || 1 || (i === node.table.widths.length || node.table.widths.length - 1)) {
                                return 1;
                            } else {
                                return 0;
                            }
                        },
                        hLineColor(i, node) {
                            return '#E9E9E9';
                        },
                        vLineColor(i, node) {
                            return '#E9E9E9';
                        },
                    },
                    margin: [0, 25],
                    table: {
                        headerRows: 0,
                        widths: ['48.5%', '3%', '48.5%'],
                        body: [
                            [
                                {
                                    text: `${docDefinitionLanguage.from.toUpperCase()}`,
                                    margin: [10, 15, 10, 8],
                                    style: 'tableMain',
                                },
                                { text: '', border: [1, 0, 1, 1], margin: [0, 20, 0, 0] },
                                {
                                    text: `${docDefinitionLanguage.to.toUpperCase()}`,
                                    margin: [10, 15, 10, 8],
                                    style: 'tableMain',
                                },
                            ],
                            [
                                { text: `${invoice.invoice_vendor.company_name || '-'}`, style: 'tableFromTo' },
                                { text: '' },
                                { text: `${invoice.to.company_name || '-'}`, style: 'tableFromTo' },
                            ],
                            [
                                { text: `${invoice.invoice_vendor.username || '-'}`, style: 'tableFromTo' },
                                { text: '' },
                                { text: `${invoice.to.name || '-'}`, style: 'tableFromTo' },
                            ],
                            [
                                { text: `${invoice.invoice_vendor.email || '-'}`, style: 'tableFromTo' },
                                { text: '' },
                                { text: `${invoice.to.email || '-'}`, style: 'tableFromTo' },
                            ],
                            [
                                { text: `${invoice.invoice_vendor.phone || '-'}`, style: 'tableFromTo' },
                                { text: '' },
                                { text: `${invoice.to.phone || '-'}`, style: 'tableFromTo' },
                            ],
                            [
                                {
                                    text: `${[
                                        invoice.invoice_vendor.country,
                                        invoice.invoice_vendor.state,
                                        invoice.invoice_vendor.city,
                                        invoice.invoice_vendor.zip,
                                    ]
                                        .filter(n => n)
                                        .join(', ') || '-'}`,
                                    margin: [10, 0, 10, 15],
                                },
                                {
                                    text: '',
                                    border: [1, 1, 1, 0],
                                    margin: [0, 2, 0, 10],
                                },
                                {
                                    text: `${[invoice.to.country, invoice.to.state, invoice.to.city, invoice.to.zip]
                                        .filter(n => n)
                                        .join(', ') || '-'}`,
                                    margin: [10, 0, 10, 15],
                                },
                            ],
                        ],
                    },
                },
                {
                    style: 'tableMain',
                    fillColor: '#e9e9e9',
                    layout: 'noBorders',
                    table: {
                        widths: ['0.5%', '40%', '14.5%', '14.5%', '14.5%', '16%'],
                        margin: [0, 2, 0, 2],
                        body: [
                            [
                                {
                                    text: ``,
                                    margin: [0, 2, 0, 2],
                                },
                                {
                                    text: `${docDefinitionLanguage.description}`,
                                    margin: [0, 2, 0, 2],
                                },
                                {
                                    text: `${docDefinitionLanguage.hours}`,
                                    margin: [0, 2, 0, 2],
                                },
                                {
                                    text: `${docDefinitionLanguage.rate}`,
                                    margin: [0, 2, 0, 2],
                                },
                                {
                                    text: `${docDefinitionLanguage.tax}`,
                                    margin: [0, 2, 0, 2],
                                },
                                {
                                    text: `${docDefinitionLanguage.subTotal}`,
                                    margin: [0, 2, 0, 2],
                                },
                            ],
                        ],
                    },
                },
                {
                    margin: [270, 30, 0, 0],
                    layout: 'noBorders',
                    table: {
                        widths: ['100%'],
                        layout: 'noBorders',
                        body: [
                            [
                                {
                                    text: `${docDefinitionLanguage.summary}`,
                                    margin: [0, 2, 0, 2],
                                    fillColor: '#e9e9e9',
                                    bold: true,
                                    alignment: 'center',
                                },
                            ],
                            [
                                {
                                    layout: 'noBorders',
                                    table: {
                                        widths: ['50%', '50%'],
                                        body: [
                                            [
                                                {
                                                    text: `${docDefinitionLanguage.summarySubtotal}`,
                                                    style: 'tableMain',
                                                    margin: [10, 6, 0, 0],
                                                },
                                                {
                                                    text: `${this.currencyService.getFormattedValue(
                                                        invoice.sub_total,
                                                        invoice.currency
                                                    )}`,
                                                    style: 'text',
                                                    margin: [10, 6, 0, 0],
                                                },
                                            ],
                                            [
                                                {
                                                    text: `${docDefinitionLanguage.discount}`,
                                                    style: 'tableMain',
                                                    margin: [10, 6, 0, 0],
                                                },
                                                {
                                                    text: `${
                                                        invoice.discount
                                                    } % (${this.currencyService.getFormattedValue(
                                                        (invoice.sub_total * invoice.discount) / 100,
                                                        invoice.currency
                                                    )})`,
                                                    style: 'text',
                                                    margin: [10, 6, 0, 0],
                                                },
                                            ],
                                            [
                                                {
                                                    text: `${docDefinitionLanguage.summaryTax}`,
                                                    style: 'tableMain',
                                                    margin: [10, 6, 0, 0],
                                                },
                                                {
                                                    text: `${this.currencyService.getFormattedValue(
                                                        invoice.tax_total,
                                                        invoice.currency
                                                    )}`,
                                                    style: 'text',
                                                    margin: [10, 6, 0, 0],
                                                },
                                            ],
                                            [
                                                {
                                                    text: `${docDefinitionLanguage.summaryTotal}`,
                                                    style: 'tableMain',
                                                    margin: [10, 6, 0, 0],
                                                },
                                                {
                                                    text: `${this.currencyService.getFormattedValue(
                                                        invoice.total,
                                                        invoice.currency
                                                    )} `,
                                                    style: 'text',
                                                    margin: [10, 6, 0, 0],
                                                },
                                            ],
                                        ],
                                    },
                                },
                            ],
                        ],
                    },
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.comments}:`,
                        },
                    ],
                    margin: [0, 30, 0, 0],
                },
                {
                    columns: [
                        {
                            text: `${invoice.comment}` || '-',
                            style: 'text',
                        },
                    ],
                    margin: [0, 4, 0, 0],
                },
            ],
            styles: {
                text: {
                    color: '#424242',
                    font: 'Roboto',
                    fontSize: 10,
                    light: true,
                },
                fromTo: {
                    alignment: 'left',
                    color: '#9c9898',
                },
                dateHeaders: {
                    bold: true,
                    color: '#323232',
                    fontSize: 10,
                },
                tableProject: {
                    margin: [0, 5, 0, 9],
                },
                tableFromTo: {
                    margin: [10, 0, 10, 5],
                },
                tableMain: {
                    bold: true,
                    margin: [0, 5, 0, 0],
                    fontSize: 10,
                    color: '#323232',
                },
                tableExample: {
                    bold: true,
                    fontSize: 10,
                    color: '#323232',
                },
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10,
                light: true,
                color: '#424242',
                margin: [0, 5, 0, 0],
            },
            footer(currentPage, pageCount) {
                return {
                    columns: [
                        {
                            fontSize: 10,
                            style: 'text',
                            width: 'auto',
                            text: 'Generated by',
                            margin: [230, 0, 0, 0],
                        },
                        {
                            image: `data:image/png;base64, ${fs
                                .readFileSync(path.resolve('wobbly_logo', 'logo.png'))
                                .toString('base64')}`,
                            width: 50,
                            margin: [5, 0, 150, 0],
                        },
                    ],
                };
            },
        };

        const orderNumber: number = 3;

        if (invoice.logo) {
            docDefinition.content[0].columns.unshift(imageObj);
        } else {
            docDefinition.content[0].columns.unshift(emptyColumn);
        }

        for (let i = 0; i < invoice.projects.length; i++) {
            let tax = '';
            if (invoice.projects[i].tax > 0) {
                tax = `+${invoice.projects[i].tax} %`;
            } else {
                tax = '-';
            }

            const projectOnIteration: any = {
                style: 'tableProject',
                fillColor: '#ffffff',
                layout: 'noBorders',
                table: {
                    widths: ['0.5%', '40%', '14.5%', '14.5%', '14.5%', '16%'],
                    margin: [0, 5, 0, 0],
                    body: [
                        [
                            ``,
                            `${invoice.projects[i].project_name}`,
                            `${invoice.projects[i].hours}`,
                            `${invoice.projects[i].rate}`,
                            `${tax}`,
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

        const fonts = {
            Roboto: {
                normal: 'fonts/Roboto-Regular.ttf',
                bold: 'fonts/Roboto-Medium.ttf',
                italics: 'fonts/Roboto-Italic.ttf',
                bolditalics: 'fonts/Roboto-MediumItalic.ttf',
                light: 'fonts/Roboto-Light.ttf',
            },
        };

        const printer = new PdfPrinter(fonts);
        const options = {};
        const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

        return pdfDoc;
    }

    private getInvoiceProjectTotals(invoiceProjects, discount = 0, invoiceId?: string) {
        const roundDecimalNumber = num => Math.round((num + Number.EPSILON) * 100) / 100;

        let total = 0;
        let sumSubTotal = 0;
        let sumTaxTotal = 0;
        const projects = invoiceProjects.map(el => {
            const subTotal = el.hours * el.rate;
            const tax = (subTotal * el.tax) / 100;
            total = roundDecimalNumber(total + subTotal);
            sumSubTotal = roundDecimalNumber(sumSubTotal + subTotal);
            sumTaxTotal = roundDecimalNumber(sumTaxTotal + tax);

            return {
                ...(invoiceId && { invoice_id: invoiceId }),
                project_name: el.projectName,
                hours: el.hours,
                tax: el.tax,
                rate: el.rate,
                sub_total: subTotal,
            };
        });

        const subTotalDiscount = discount ? (total / 100) * (100 - discount) : total;
        total = roundDecimalNumber(subTotalDiscount + sumTaxTotal);

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
        reference,
    }): Promise<AxiosResponse> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects, discount);
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const user: any = await this.userService.getUserById(userId);

        let invoiceStatus: string = this.INVOICE_STATUS.DRAFT;
        let overdueStatus: boolean = false;
        const dueDateObj: Moment = moment(dueDate).utc();

        const currentDateObj: Moment = moment().utc();

        if (currentDateObj.isAfter(dueDateObj)) {
            invoiceStatus = this.INVOICE_STATUS.OVERDUE;
            overdueStatus = true;
        }

        let invoiceNumberValue = null;
        if (!invoiceNumber) {
            try {
                invoiceNumberValue = await this.generateInvoiceNumber(currentTeamId);
            } catch (error) {
                console.log(error);
            }
        } else {
            invoiceNumberValue = invoiceNumber;
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
            invoiceNumber: invoiceNumberValue ? invoiceNumberValue : '',
            invoiceReference: reference ? reference : '',
            invoiceProjects: projects,
        };

        const query = `mutation 
        addVendorData(
            $invoice_vendor: invoice_vendor_obj_rel_insert_input, 
            $invoiceComment: String, 
            $invoiceNumber: String, 
            $invoiceReference: String,
            $invoiceProjects: [invoice_project_insert_input!]!
            ) {
            insert_invoice(
                objects: {
                    status: "${invoiceStatus}"
                    overdue : ${overdueStatus}
                    timezone_offset: "${timezoneOffset}"
                    invoice_number: $invoiceNumber
                    vendor_id: "${vendorId}"
                    user_id: "${userId}"
                    team_id: "${currentTeamId}"
                    client_id: "${clientId}"
                    currency: "${currency ? currency : `USD`}"
                    comment: $invoiceComment
                    logo: ${logo ? '"' + logo + '"' : null}
                    invoice_date: "${invoiceDate}"
                    due_date: "${dueDate}"
                    invoice_projects: { data: $invoiceProjects}
                    total: ${total}
                    discount: ${discount ? discount : 0}
                    sub_total: ${sumSubTotal}
                    tax_total: ${sumTaxTotal}
                    invoice_vendor: $invoice_vendor
                    reference: $invoiceReference
                    }
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

    private async generateInvoiceNumber(teamId) {
        const newInvoiceNumber = (invoiceCount: number): string => ('00' + (invoiceCount + 1)).slice(-3);

        const variables = {
            where: {
                team_id: {
                    _eq: teamId,
                },
            },
        };

        const query = `query team_invoice_count($where: invoice_bool_exp) {
                            invoice_aggregate:invoice_aggregate(where: $where) {
                                aggregate {
                                    count(columns: id, distinct: true)
                                }
                                nodes {
                                    invoice_number
                                }
                            }
                        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    const {
                        aggregate: { count: teamInvoiceCount },
                        nodes: teamInvoicePrevNumbers,
                    } = res.data.invoice_aggregate;

                    return resolve(newInvoiceNumber(teamInvoiceCount));
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getInvoiceList(
        userId: string,
        params: { page?: string; limit?: string; search?: string; status?: string }
    ): Promise<AxiosResponse | AxiosError> {
        let { page, limit, search, status } = params;
        const pageSize = limit ? Number(limit) : 10;
        const numberOfPage = page ? Number(page) : 1;

        const offset = numberOfPage === 1 ? 0 : pageSize * (numberOfPage - 1);

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            where: {
                team_id: {
                    _eq: currentTeamId,
                },
            },
            limit: pageSize,
            offset,
        };

        if (search) {
            variables.where['_or'] = [
                {
                    invoice_number: {
                        _ilike: `%${search}%`,
                    },
                },
                {
                    client: {
                        company_name: {
                            _ilike: `%${search}%`,
                        },
                    },
                },
            ];
        }

        if (status) {
            variables.where['status'] = {
                _eq: status.trim().toLowerCase(),
            };
        }

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
                state
                zip
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
              reference
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

    async getGrandTotal(
        userId: string,
        params: { search?: string; status?: string }
    ): Promise<AxiosResponse | AxiosError> {
        const { search, status } = params;
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            where: {
                team_id: {
                    _eq: currentTeamId,
                },
            },
        };

        if (search) {
            variables.where['_or'] = [
                {
                    invoice_number: {
                        _ilike: `%${search}%`,
                    },
                },
                {
                    client: {
                        company_name: {
                            _ilike: `%${search}%`,
                        },
                    },
                },
            ];
        }

        if (status) {
            variables.where['status'] = {
                _eq: status.trim().toLowerCase(),
            };
        }

        const query = `query invoices ($where: invoice_bool_exp){
            invoices: invoice(
                where: $where
            ) {
              currency
              total
              status
            }
        }`;

        return this.httpRequestsService
            .graphql(query, variables)
            .toPromise()
            .then(result => this.invoiceTotalMapper(result));
    }

    async getTotalByStatus(userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            where: {
                team_id: {
                    _eq: currentTeamId,
                },
            },
        };

        const query = `query invoices ($where: invoice_bool_exp){
            invoices: invoice(
                where: $where
            ) {
              currency
              total
              status
            }
        }`;

        return this.httpRequestsService
            .graphql(query, variables)
            .toPromise()
            .then(result => this.invoiceTotalByStatusMapper(result));
    }

    async invoiceTotalByStatusMapper(invoiceList) {
        const roundDecimalNumber = num => Math.round((num + Number.EPSILON) * 100) / 100;

        return invoiceList.data.invoices.reduce(
            (acc, invoice) => {
                const currencyCode = invoice.currency.toLowerCase();
                const invoiceStatus = invoice.status;

                if (invoiceStatus === this.INVOICE_STATUS.OVERDUE) {
                    if (acc[invoiceStatus][currencyCode] === undefined) {
                        acc[invoiceStatus][currencyCode] = 0;
                    }
                    acc[invoiceStatus][currencyCode] = roundDecimalNumber(
                        acc[invoiceStatus][currencyCode] + invoice.total
                    );
                } else if (invoiceStatus === this.INVOICE_STATUS.DRAFT) {
                    if (acc[invoiceStatus][currencyCode] === undefined) {
                        acc[invoiceStatus][currencyCode] = 0;
                    }
                    acc[invoiceStatus][currencyCode] = roundDecimalNumber(
                        acc[invoiceStatus][currencyCode] + invoice.total
                    );
                } else if (invoiceStatus !== this.INVOICE_STATUS.PAID) {
                    if (acc['total outstanding'][currencyCode] === undefined) {
                        acc['total outstanding'][currencyCode] = 0;
                    }
                    acc['total outstanding'][currencyCode] = roundDecimalNumber(
                        acc['total outstanding'][currencyCode] + invoice.total
                    );
                }

                return acc;
            },
            {
                [this.INVOICE_STATUS.OVERDUE]: {},
                [this.INVOICE_STATUS.DRAFT]: {},
                ['total outstanding']: {},
            }
        );
    }

    async invoiceTotalMapper(invoiceList) {
        return invoiceList.data.invoices.reduce((acc, invoice) => {
            const currencyCode = invoice.currency.toLowerCase();

            if (acc[currencyCode] === undefined) {
                acc[currencyCode] = 0;
            }

            acc[currencyCode] += invoice.total;

            return acc;
        }, {});
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
              team_id
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
                state
                zip
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
              reviewed
              reference
              pdf
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    const resp = res.data.invoice;
                    if (!resp) {
                        return reject({
                            message: 'ERROR.INVOICE.GET_FAILED',
                        });
                    }

                    if (userId) {
                        try {
                            const currentTeamData: any = await this.teamService.getCurrentTeam(userId);

                            const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

                            const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

                            const isInvoicesManager =
                                currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

                            if (!isOwner && !isInvoicesManager) {
                                return reject({
                                    message: 'ERROR.INVOICE.GET_FAILED',
                                });
                            }
                            return resolve(resp);
                        } catch (error) {
                            return reject(error);
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
        let invoiceStatus = this.INVOICE_STATUS.DRAFT;
        if (paymentStatus) {
            invoiceStatus = this.INVOICE_STATUS.PAID;
        } else {
            if (invoice.overdue) {
                invoiceStatus = this.INVOICE_STATUS.OVERDUE;
            } else {
                if (invoice.sending_status && !invoice.reviewed) {
                    invoiceStatus = this.INVOICE_STATUS.AWAITING;
                }
                if (invoice.reviewed) {
                    invoiceStatus = this.INVOICE_STATUS.REVIEWED;
                }
            }
        }

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                team_id: {
                    _eq: currentTeamId,
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
        if (invoiceStatus === this.INVOICE_STATUS.DRAFT) {
            invoiceStatus = this.INVOICE_STATUS.AWAITING;
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

    async updateInvoiceOverdueStatus(
        invoiceId: string,
        status: boolean,
        paymentStatus: boolean
    ): Promise<AxiosResponse | AxiosError> {
        let invoiceStatus = '';

        if (paymentStatus) {
            invoiceStatus = this.INVOICE_STATUS.PAID;
        } else {
            invoiceStatus = this.INVOICE_STATUS.OVERDUE;
        }

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
            const paymentStatus: boolean = el.payment_status;
            const dueDateObj: Moment = moment(el.due_date)
                .utc()
                .endOf('day');

            const currentDateObj: Moment = moment().utc();

            if (currentDateObj.isAfter(dueDateObj)) {
                await this.updateInvoiceOverdueStatus(invoiceId, true, paymentStatus);
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
        reference,
    }): Promise<AxiosResponse> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(
            invoiceProjects,
            discount,
            invoiceId
        );
        const invoice: Invoice = await this.getInvoice(invoiceId, userId);

        if (invoice.pdf) {
            try {
                fs.unlinkSync(path.resolve(`${invoice.pdf}`));
                await this.setInvoicePdfPath(invoice.id, null);
            } catch (error) {
                console.log(error);
            }
        }

        const dueDateObj: Moment = moment(dueDate).utc();

        const currentDateObj: Moment = moment().utc();

        let overdueStatus;
        currentDateObj.isAfter(dueDateObj) ? (overdueStatus = true) : (overdueStatus = false);
        let invoiceStatus = this.INVOICE_STATUS.DRAFT;
        if (invoice.payment_status) {
            invoiceStatus = this.INVOICE_STATUS.PAID;
        } else {
            if (overdueStatus) {
                invoiceStatus = this.INVOICE_STATUS.OVERDUE;
            } else {
                if (invoice.sending_status && !invoice.reviewed) {
                    invoiceStatus = this.INVOICE_STATUS.AWAITING;
                }
                if (invoice.reviewed) {
                    invoiceStatus = this.INVOICE_STATUS.REVIEWED;
                }
            }
        }

        const previousInvoiceNumber: string = invoice.invoice_number;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            invoiceComment: comment,
            invoiceReference: reference,
            invoiceNumber: invoiceNumber || previousInvoiceNumber,
        };

        const query = `mutation updateInvoice(
        $invoiceComment: String, 
        $invoiceReference: String, 
        $invoiceNumber: String){
            update_invoice(
                where: {
                    id: {
                        _eq: "${invoiceId}"
                    },
                    team_id: {
                        _eq: "${currentTeamId}",
                    },
                },
                _set: {
                    status: "${invoiceStatus}",
                    timezone_offset: ${timezoneOffset},
                    invoice_number: $invoiceNumber,
                    client_id: "${clientId}",
                    comment: $invoiceComment,
                    currency: "${currency ? currency : `usd`}",
                    due_date: "${dueDate}",
                    invoice_date: "${invoiceDate}",
                    logo: ${logo ? '"' + logo + '"' : null},
                    vendor_id: "${vendorId}",
                    total: ${total},
                    discount: ${discount},
                    sub_total: ${sumSubTotal},
                    tax_total: ${sumTaxTotal},
                    overdue : ${overdueStatus},
                    reference: $invoiceReference
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
                            const queryInsertInvoiceProject = `mutation insert_invoice_project(
                            $invoiceProjects: [invoice_project_insert_input!]!
                            ) {
                                insert_invoice_project(objects: $invoiceProjects) {
                                    returning {
                                        id
                                    }
                                }
                            }`;

                            const variables = {
                                invoiceProjects: projects,
                            };

                            this.httpRequestsService.graphql(queryInsertInvoiceProject, variables).subscribe(
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
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                team_id: {
                    _eq: currentTeamId,
                },
            },
        };

        const query = `mutation invoice($where: invoice_bool_exp!) {
            delete_invoice: delete_invoice(where: $where) {
              returning {
                id
                logo
                invoice_vendor_id
                pdf
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

                    if (resp[0].pdf) {
                        try {
                            fs.unlinkSync(path.resolve(`${resp[0].pdf}`));
                        } catch (error) {
                            console.log(error);
                        }
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

    async getInvoicesDueDate(): Promise<Invoice[] | null> {
        const query = `query invoices {
            invoices: invoice {
              id
              timezone_offset
              due_date
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query)
                .subscribe((res: AxiosResponse) => resolve(res.data.invoices), (error: AxiosError) => reject(error));
        });
    }

    async setInvoicesDueDate(id, dueDate): Promise<Invoice | null> {
        const variables = {
            where: {
                id: {
                    _eq: id,
                },
            },
            _set: {
                due_date: dueDate,
            },
        };
        const mutation = `
        mutation updateInvoice($where: invoice_bool_exp!, $_set: invoice_set_input) {
            update_invoice(_set: $_set, where: $where) {
              returning {
                id
              }
            }
          }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(mutation, variables).subscribe(
                (res: AxiosResponse) => resolve(res.data.update_invoice.returning[0]),
                (error: AxiosError) => {
                    console.log(error.response.data);
                    reject(error);
                }
            );
        });
    }

    async getFreeInvoiceNumber(userId) {
        let currentTeamId = null;
        try {
            currentTeamId = ((await this.teamService.getCurrentTeam(userId)) as AxiosResponse).data.user_team[0].team
                .id;
        } catch (error) {
            console.log(error);
        }

        let invoiceNumberValue = null;
        try {
            invoiceNumberValue = await this.generateInvoiceNumber(currentTeamId);
        } catch (error) {
            console.log(error);
        }

        return invoiceNumberValue;
    }

    async updateInvoiceReviewedStatus(invoiceId: string, reviewed: boolean): Promise<AxiosResponse | AxiosError> {
        const variables = {
            where: {
                id: {
                    _eq: invoiceId,
                },
            },
            set: {
                ...(reviewed && { status: this.INVOICE_STATUS.REVIEWED }),
                reviewed,
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

    async addInvoicePayment(
        userId: string,
        id: string,
        data: {
            sum: string;
            date: Date;
            comments?: string;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const roundDecimalNumber = num => Math.round((num + Number.EPSILON) * 100) / 100;

        const sum = Number(data.sum);
        const roundedSum = roundDecimalNumber(sum);

        let invoice: Invoice | null = null;
        try {
            invoice = await this.getInvoice(id, userId);
        } catch (error) {
            console.log(error);
        }
        if (!invoice) {
            return Promise.reject({
                message: 'Invoice does not exist.',
            });
        }

        if (invoice.status === this.INVOICE_STATUS.PAID) {
            return Promise.reject({
                message: 'This invoice is fully paid.',
            });
        }

        if (Math.sign(sum) !== 1) {
            return Promise.reject({
                message: 'Sum can be only positive integer.',
            });
        }

        const invoicePaymentList: any[] | null = ((await this.getInvoicePaymentList(id, userId)) as AxiosResponse).data
            .invoice_payment;

        let invoicePaymentOutstanding: number | null = null;
        if (!invoicePaymentList.length) {
            invoicePaymentOutstanding = invoice.total;
        } else {
            invoicePaymentOutstanding = invoicePaymentList[invoicePaymentList.length - 1]['outstanding'];
        }

        if (roundedSum > invoicePaymentOutstanding) {
            return Promise.reject({
                message: 'Sum should be less than or equal to outstanding.',
            });
        }

        const query = ` mutation insertInvoicePayment($invoicePayment: invoice_payment_insert_input!) {
                            insert_invoice_payment_one(object: $invoicePayment) {
                                id
                                sum
                                currency
                                date
                                comment
                                invoice_id
                            }
                        }`;

        const variables = {
            invoicePayment: {
                currency: invoice.currency,
                sum: roundedSum,
                invoice_id: invoice.id,
                comment: data.comments || null,
                date: data.date,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    const invoicePaymentListUpdated: any[] | null = ((await this.getInvoicePaymentList(
                        id,
                        userId
                    )) as AxiosResponse).data.invoice_payment;

                    const invoicePaymentOutstandingUpdated =
                        invoicePaymentListUpdated[invoicePaymentListUpdated.length - 1]['outstanding'];
                    if (invoicePaymentOutstandingUpdated === 0) {
                        await this.updatePaymentStatusInvoice(userId, id, true);
                    }
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getInvoicePaymentList(invoiceId: string, userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (!isInvoicesManager && !isOwner) {
            return Promise.reject({ message: 'User not invoice admin.' });
        }

        const query = `query getInvoicePaymentList($where: invoice_payment_bool_exp) {
                            invoice_payment(where: $where, order_by: {date: asc}) {
                                id
                                sum
                                currency
                                date
                                comment
                                invoice_id
                            }
                        }`;

        const variables = {
            where: {
                invoice_id: {
                    _eq: invoiceId,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    const roundDecimalNumber = num => Math.round((num + Number.EPSILON) * 100) / 100;

                    let invoice: Invoice | null = null;
                    try {
                        invoice = await this.getInvoice(invoiceId, userId);
                    } catch (error) {
                        console.log(error);
                    }

                    let total: number = invoice.total;

                    for (const payment of res.data.invoice_payment) {
                        payment['outstanding'] =
                            roundDecimalNumber(total - payment['sum']) > 0
                                ? roundDecimalNumber(total - payment['sum'])
                                : 0;
                        total = roundDecimalNumber(total - payment['sum']);
                    }

                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getPdfDocument(invoice: Invoice): Promise<any> {
        const pdfPath = path.join(this.PUBLIC_DIR_PATH, 'invoice_pdf', `${invoice.id}.pdf`);

        if (!invoice.pdf) {
            try {
                const pdfDoc = await this.createPdfDocument(invoice);

                await this.setInvoicePdfPath(invoice.id, pdfPath);

                return await this.fileService.storePdfFile(pdfDoc, pdfPath);
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            try {
                return await this.fileService.readPdfFile(invoice.pdf);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    const pdfDoc = await this.createPdfDocument(invoice);
                    return await this.fileService.storePdfFile(pdfDoc, invoice.pdf);
                } else {
                    return Promise.reject(error);
                }
            }
        }
    }

    async setInvoicePdfPath(invoiceId: string, pdfPath: string) {
        const query = `mutation update_invoice_pdf($where: invoice_bool_exp!, $_set: invoice_set_input) {
            update_invoice(where: $where, _set: $_set) {
                returning {
                    id
                }
            }
        }`;

        const variables = {
            where: {
                id: {
                    _eq: invoiceId,
                },
            },
            _set: {
                pdf: pdfPath,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
