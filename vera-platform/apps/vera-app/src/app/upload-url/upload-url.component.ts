import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload-url',
  templateUrl: './upload-url.component.html',
})
export class UploadUrlComponent {
  url: string = '';
  result: any;

  constructor(private http: HttpClient) {}

  analyze() {
    if (!this.url) return alert('Veuillez entrer une URL');

    this.http
      .post('/api/analyze', {
        type: 'url',
        content: this.url,
      })
      .subscribe({
        next: (res) => (this.result = res),
        error: (err) => console.error(err),
      });
  }
}
