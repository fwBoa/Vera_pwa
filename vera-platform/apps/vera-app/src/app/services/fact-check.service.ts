import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface FactCheckRequest {
    userId: string;
    query: string;
}

@Injectable({
    providedIn: 'root'
})
export class FactCheckService {
    private readonly API_URL = '/api/analyze';

    /**
     * Send fact-check query and return streaming response as Observable
     */
    checkFact(request: FactCheckRequest): Observable<string> {
        return new Observable(observer => {
            const token = localStorage.getItem('token');

            fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(request)
            })
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();

                    if (!reader) {
                        throw new Error('No response body');
                    }

                    // Read the stream
                    const readChunk = async (): Promise<void> => {
                        const { done, value } = await reader.read();

                        if (done) {
                            observer.complete();
                            return;
                        }

                        // Decode and emit the chunk
                        const chunk = decoder.decode(value, { stream: true });
                        observer.next(chunk);

                        // Continue reading
                        await readChunk();
                    };

                    await readChunk();
                })
                .catch(error => {
                    observer.error(error);
                });
        });
    }
}
