import { Observable, Subject } from 'rxjs';

export function readAsText(file: File | Blob): Observable<string> {
  const subject = new Subject<string>();
  const reader = new FileReader();

  reader.onload = () => {
    subject.next(reader.result as string);
    subject.complete();
  };

  reader.onerror = error => {
    subject.error(error);
  };

  reader.readAsText(file, 'UTF-8');

  return subject.asObservable();
}

export function saveRawAsFile(
  data: unknown,
  filename: string,
  type: string
): void {
  const blob = new Blob([data as BlobPart], { type: getMimeType(type) });
  saveAsFile(blob, filename);
}

export function saveAsFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  saveFromUrl(url, filename);
  window.URL.revokeObjectURL(url);
}

function saveFromUrl(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
}

function getMimeType(type: string) {
  switch (type) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'csv':
      return 'text/csv';
    default:
      return type;
  }
}
