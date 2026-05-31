import type { FilePort } from '../../app/ports';

export class BrowserFilePort implements FilePort {
  async exportJson(data: unknown, filename: string): Promise<void> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    try {
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      anchor.rel = 'noopener';

      document.body.append(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }

  async importJson(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';

      const rejectNoFile = () => {
        input.remove();
        reject(new Error('No file selected'));
      };

      input.addEventListener(
        'change',
        async () => {
          try {
            const file = input.files?.[0];

            if (file === undefined) {
              reject(new Error('No file selected'));
              return;
            }

            resolve(JSON.parse(await file.text()));
          } catch (error) {
            reject(error);
          } finally {
            input.remove();
          }
        },
        { once: true },
      );

      input.addEventListener('cancel', rejectNoFile, { once: true });
      document.body.append(input);
      input.click();
    });
  }
}
