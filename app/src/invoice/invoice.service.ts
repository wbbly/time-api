import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import PdfPrinter from 'pdfmake';
import { Invoice } from './interfaces/invoice.interface';
import moment, { Moment } from 'moment';
import { CurrencyService } from '../core/currency/currency.service';
import {RoleCollaborationService} from "../role-collaboration/role-collaboration.service";

@Injectable()
export class InvoiceService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly userService: UserService,
        private readonly currencyService: CurrencyService,
        private readonly roleCollaborationService: RoleCollaborationService,
    ) {}

    async createPdfDocument(invoice: Invoice) {
        const user: any = await this.userService.getUserById(invoice.user_id);
        const defaultLanguage = 'en';
        const language = user.language ? user.language : defaultLanguage;
        const languageVariables = {
            en: {
                from: 'From',
                to: 'To',
                invoiceNumber: 'Invoice No: ',
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
            image: `${invoice.logo}`,
            height: 65,
            width: 75,
        };

        const docDefinition = {
            content: [
                {
                    style: 'fromTo',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.from.toUpperCase()}`,
                        },
                        {
                            text: `${docDefinitionLanguage.to.toUpperCase()}`,
                        },
                    ],
                    margin: [0, 10, 100, 8],
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.company_name ? invoice.invoice_vendor.company_name : ' '}`,
                        },
                        {
                            text: `${invoice.to.company_name ? invoice.to.company_name : ' '}`,
                        },
                    ],
                    margin: [0, 6, 100, 6],
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.username ? invoice.invoice_vendor.username : ' '}`,
                        },
                        {
                            text: `${invoice.to.name ? invoice.to.name : ' '}`,
                        },
                    ],
                    margin: [0, 6, 100, 6],
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.email ? invoice.invoice_vendor.email : ' '}`,
                        },
                        {
                            text: `${invoice.to.email ? invoice.to.email : ' '}`,
                        },
                    ],
                    margin: [0, 6, 100, 0],
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${invoice.invoice_vendor.phone ? invoice.invoice_vendor.phone : ' '}`,
                        },
                        {
                            text: `${invoice.to.phone ? invoice.to.phone : ' '}`,
                        },
                    ],
                    margin: [0, 6, 100, 0],
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${[
                                invoice.invoice_vendor.country,
                                invoice.invoice_vendor.state,
                                invoice.invoice_vendor.city,
                                invoice.invoice_vendor.zip,
                            ]
                                .filter(n => n)
                                .join(', ')} `,
                        },
                        {
                            text: `${[
                                invoice.to.country,
                                invoice.to.state,
                                invoice.to.city,
                                invoice.to.zip,
                            ]
                                .filter(n => n)
                                .join(', ')}`,
                        },
                    ],
                    margin: [0, 6, 100, 6],
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.invoiceNumber} ${invoice.invoice_number}`,
                        },
                        {
                            text: `${docDefinitionLanguage.reference} ${invoice.reference || ` - `}`,
                        },
                    ],
                    margin: [0, 25, 100, 0],
                },
                {
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.date} ${moment(invoice.invoice_date).format(
                                'MMM Do, YYYY'
                            )}`,
                        },
                        {
                            text: `${docDefinitionLanguage.dueDate} ${moment(invoice.due_date).format('MMM Do, YYYY')}`,
                        },
                    ],
                    margin: [0, 10, 100, 10],
                },
                {
                    style: 'tableMain',
                    fillColor: '#e9e9e9',
                    layout: 'noBorders',
                    table: {
                        widths: [6, 174, 75, 75, 75, 80],
                        body: [
                            [
                                ``,
                                `${docDefinitionLanguage.description}`,
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
                    margin: [280, 30, 10, 10],
                    fillColor: '#e9e9e9',
                    bold: true,
                    layout: 'noBorders',
                    alignment: 'center',
                    table: {
                        widths: [245],
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
                            text: `${invoice.discount} % (${
                                this.currencyService.getFormattedValue(
                                    invoice.sub_total * invoice.discount / 100,
                                    invoice.currency,
                                )
                            })`,
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
                    style: 'dateHeaders',
                    columns: [
                        {
                            text: `${docDefinitionLanguage.comments}:`,
                        },
                    ],
                    margin: [0, 30, 0, 0],
                    label: 'comment',
                },
                {
                    style: 'text',
                    columns: [
                        {
                            text: `${invoice.comment}`,
                        },
                    ],
                    margin: [0, 8, 0, 0],
                    label: 'comment',
                },
                {
                    style: 'fromTo',
                    fontSize: 9,
                    columns: [
                        {
                            text: 'Generated by Wobbly.me',
                        },
                    ],
                    margin: [200, 80, 0, 0],
                },
            ],
            styles: {
                text: {
                    color: '#323232',
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
                    margin: [0, 5, 0, 0],
                },
                tableMain: {
                    bold: true,
                    margin: [0, 5, 5, 0],
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
                fontSize: 9,
            },
        };

        let orderNumber: number = 9;

        if (!invoice.comment) {
            const newContent = docDefinition.content.filter(item => item.label !== 'comment');
            docDefinition.content = newContent;
        }

        if (invoice.logo) {
            docDefinition.content.unshift(imageObj);
            orderNumber = 10;
        }

        for (let i = 0; i < invoice.projects.length; i++) {
            let tax = '';
            if (invoice.projects[i].tax > 0) {
                tax = `+${invoice.projects[i].tax} %`;
            } else {
                tax = '-';
            }

            const projectOnIteration = {
                style: 'tableProject',
                fillColor: '#ffffff',
                layout: 'noBorders',
                table: {
                    widths: [6, 174, 75, 75, 75, 80],
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
        reference,
    }): Promise<AxiosResponse> {
        const { total, sumSubTotal, sumTaxTotal, projects } = this.getInvoiceProjectTotals(invoiceProjects, discount);
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const user: any = await this.userService.getUserById(userId);

        let invoiceStatus: string = 'draft';
        let overdueStatus: boolean = false;
        const dueDateObj: Moment = moment(dueDate).utc();

        const currentDateObj: Moment = moment().utc();

        if (currentDateObj.isAfter(dueDateObj)) {
            invoiceStatus = 'overdue';
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
        };

        const query = `mutation 
        addVendorData($invoice_vendor: invoice_vendor_obj_rel_insert_input, $invoiceComment: String, $invoiceNumber: String, $invoiceReference: String) {
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
                    invoice_projects: { data: [${projects}]}
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
        params: { page?: string; limit?: string; search?: string }
    ): Promise<AxiosResponse | AxiosError> {
        let { page, limit, search } = params;
        const pageSize = limit ? Number(limit) : 10;
        const numberOfPage = page ? Number(page) : 1;

        const offset = numberOfPage === 1 ? 0 : pageSize * (numberOfPage - 1);

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const invoiceAdmins = [];
        if (isInvoicesManager || isOwner) {
            const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_OWNER,
            )) as AxiosResponse).data.user_team;

            const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_INVOICES_MANAGER,
            )) as AxiosResponse).data.user_team;

            invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));
        }

        const variables = {
            where: {
                user_id: {
                    _in: invoiceAdmins,
                },
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

    async getGrandTotal(userId: string, search?): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isInvoicesManager =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const invoiceAdmins = [];
        if (isInvoicesManager || isOwner) {
            const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_OWNER,
            )) as AxiosResponse).data.user_team;

            const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_INVOICES_MANAGER,
            )) as AxiosResponse).data.user_team;

            invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));
        }

        const variables = {
            where: {
                user_id: {
                    _in: invoiceAdmins,
                },
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

        const query = `query invoices ($where: invoice_bool_exp){
            invoices: invoice(
                where: $where
            ) {
              currency
              total
            }
        }`;

        return this.httpRequestsService
            .graphql(query, variables)
            .toPromise()
            .then(result => this.invoiceTotalMapper(result));
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
              reference
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
                            const currentTeamId = currentTeamData.data.user_team[0].team.id;

                            const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

                            const isOwner =
                                currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

                            const isInvoicesManager =
                                currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

                            const invoiceAdmins = [];
                            if (isInvoicesManager || isOwner) {
                                const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
                                    currentTeamId,
                                    ROLE_OWNER,
                                )) as AxiosResponse).data.user_team;

                                const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                                    currentTeamId,
                                    ROLE_INVOICES_MANAGER,
                                )) as AxiosResponse).data.user_team;

                                invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));
                            } else {
                                return reject({
                                    message: 'ERROR.INVOICE.GET_FAILED',
                                });
                            }

                            if (resp.user_id && !invoiceAdmins.includes(resp.user_id)) {
                                return reject({
                                    message: 'ERROR.INVOICE.GET_FAILED',
                                });
                            }
                            return resolve(resp);
                        } catch (error) {
                            return reject(error)
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
        let invoice: Invoice | any = null;
        try {
            invoice = await this.getInvoice(id, userId);
        } catch (error) {
            return Promise.reject(error);
        }

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

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const invoiceAdmins = [];
        const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
            currentTeamId,
            ROLE_OWNER,
        )) as AxiosResponse).data.user_team;

        const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
            currentTeamId,
            ROLE_INVOICES_MANAGER,
        )) as AxiosResponse).data.user_team;

        invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                user_id: {
                    _in: invoiceAdmins,
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

    async updateInvoiceOverdueStatus(
        invoiceId: string,
        status: boolean,
        paymentStatus: boolean
    ): Promise<AxiosResponse | AxiosError> {
        let invoiceStatus = '';

        if (paymentStatus) {
            invoiceStatus = 'paid';
        } else {
            invoiceStatus = 'overdue';
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

        const dueDateObj: Moment = moment(dueDate).utc();

        const currentDateObj: Moment = moment().utc();

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

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const invoiceAdmins = [];
        if (isInvoicesManager || isOwner) {
            const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_OWNER,
            )) as AxiosResponse).data.user_team;

            const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_INVOICES_MANAGER,
            )) as AxiosResponse).data.user_team;

            invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));
        }

        const variables = {
            invoiceComment: comment,
            invoiceReference: reference,
            invoiceNumber: invoiceNumber || previousInvoiceNumber,
            invoiceAdmins,
        };

        const query = `mutation updateInvoice(
        $invoiceComment: String, 
        $invoiceReference: String, 
        $invoiceNumber: String,
        $invoiceAdmins: [uuid!]){
            update_invoice(
                where: {
                    id: {
                        _eq: "${invoiceId}"
                    },
                    user_id: {
                        _in: $invoiceAdmins
                    }
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
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager =
            currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        const invoiceAdmins = [];
        if (isInvoicesManager || isOwner) {
            const [{user_id: ownerId}] = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_OWNER,
            )) as AxiosResponse).data.user_team;

            const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                currentTeamId,
                ROLE_INVOICES_MANAGER,
            )) as AxiosResponse).data.user_team;

            invoiceAdmins.push(ownerId, ...invoiceManagers.map(({user_id}) => user_id));
        }

        const variables = {
            where: {
                id: {
                    _eq: id,
                },
                user_id: {
                    _in: invoiceAdmins,
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

    async setInvoicesDueDate(id, due_date): Promise<Invoice | null> {
        const variables = {
            where: {
                id: {
                    _eq: id,
                },
            },
            _set: {
                due_date,
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
}
