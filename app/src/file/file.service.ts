import { Injectable } from '@nestjs/common';
import { json2csv } from 'json-2-csv-ts';
import * as fs from 'fs-extra';

@Injectable()
export class FileService {
    private PUBLIC_DIR_PATH = 'public/';

    constructor() {}

    jsonToCsv(data: any[]): string {
        let csv = '';
        try {
            csv = json2csv(data);
        } catch (err) {
            console.error(err);
        }

        return csv;
    }

    saveFile(data: string, filePath: string): string {
        const file = `${this.PUBLIC_DIR_PATH}${filePath}`;

        try {
            fs.outputFileSync(file, `\ufeff${data}\n`, { encoding: 'utf8' }); // '\ufeff' means add BOM to the file (taken here https://stackoverflow.com/a/13859239/1335142)
        } catch (e) {
            console.log(e);
        }

        return file;
    }
}
