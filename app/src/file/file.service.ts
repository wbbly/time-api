import { Injectable } from '@nestjs/common';
import { json2csv } from 'json-2-csv-ts';
import * as fs from 'fs-extra';
import { Stream } from 'stream';

@Injectable()
export class FileService {
    private PUBLIC_DIR_PATH = 'public/';

    constructor() {}

    saveCsvFile(data: any[], filePath: string): string {
        const file = `${this.PUBLIC_DIR_PATH}${filePath}`;

        try {
            fs.outputFileSync(file, `\ufeff${this.jsonToCsv(data)}\n`, { encoding: 'utf8' }); // '\ufeff' means add BOM to the file (taken here https://stackoverflow.com/a/13859239/1335142)
        } catch (e) {
            console.log(e);
        }

        return file;
    }

    private jsonToCsv(data: any[]): string {
        let csv = '';
        try {
            csv = json2csv(data);
        } catch (err) {
            console.error(err);
        }

        return csv;
    }

    async storePdfFile(pdfDoc, filePath: string): Promise<Stream | Error> {
        const dir = `${filePath.split('/', 2).join('/')}`;

        fs.ensureDirSync(dir);

        const writePdfFile = fs.createWriteStream(filePath);
        pdfDoc.pipe(writePdfFile);
        pdfDoc.end();

        writePdfFile.on('error', error => console.error(error));

        return Promise.resolve(pdfDoc);
    }

    async readPdfFile(filePath: string): Promise<Stream | Error> {
        try {
            fs.readFileSync(filePath);
        } catch (error) {
            return Promise.reject(error);
        }

        const pdfFile = fs.createReadStream(filePath);
        pdfFile.on('error', error => console.error(error));

        return Promise.resolve(pdfFile);
    }
}
