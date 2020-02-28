import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import * as zip from 'jszip';
import {
    BehaviorSubject,
    forkJoin,
} from 'rxjs';

interface IFile {
  fileName: string;
  content: ArrayBuffer;
}

interface IResult {
  file: IFile;
  compressedSize: string;
  uncompressedSize: string;
  memory: string;
  time: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public files: IFile[] = [
    { fileName: '1 page', content: null },
    { fileName: '2 pages', content: null },
    { fileName: '11 pages', content: null },
    { fileName: '110 pages', content: null },
    { fileName: '223 pages', content: null },
    { fileName: '446 pages', content: null },
  ];
  public results$ = new BehaviorSubject<IResult[]>([]);

  constructor(
    private _http: HttpClient,
  ) {
    const getRequests = this.files.map(c => this._get(c.fileName));

    forkJoin(getRequests).subscribe((results) => {
      results.forEach((content, index) => {
        this.files[index].content = content;
      });
    });
  }

  public unzip(file: IFile) {
    // @ts-ignore
    const startMemory = performance.memoy ? performance.memory.usedJSHeapSize : NaN;
    const t0 = performance.now();

    zip.loadAsync(file.content)
      .then(res => {
        const zipFile = res.file(Object.entries(res.files)[0][0]);
        zipFile.async('string').then(c => {
          // @ts-ignore
          const currentMemory = performance.memory ? performance.memory.usedJSHeapSize : NaN;
          const t1 = performance.now();

          const result: IResult = {
            // @ts-ignore
            compressedSize: this._formatBytes(zipFile._data.compressedSize),
            // @ts-ignore
            uncompressedSize: this._formatBytes(zipFile._data.uncompressedSize),
            file,
            time: this._formatTime(t1 - t0),
            memory: this._formatBytes(currentMemory - startMemory),
          };
          const newResults = this.results$.value;
          newResults.push(result);
          this.results$.next(newResults);
        });
      });
  }

  private _formatBytes(bytes, decimals = 2) {
    if (bytes <= 0) { return '0 Bytes'; }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
  }

  private _formatTime(ms: number) {
    return new Date(ms).toISOString().slice(11, -1);
  }

  private _get(file: string) {
    return this._http.get(`assets/${file}.zip`, {
      responseType: 'arraybuffer'
    });
  }
}
