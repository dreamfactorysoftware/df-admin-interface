import { Observable, Subject } from 'rxjs';

export function readAsText(file: File): Observable<string> {
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

export function saveAsFile(data: any, filename: string, type: string): void {
  const blob = new Blob([data], { type: getMimeType(type) });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getMimeType(type: string) {
  switch (type) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    default:
      return 'text/csv';
  }
}
