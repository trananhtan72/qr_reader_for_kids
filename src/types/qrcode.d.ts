// Minimal types for the part of `qrcode` we use (avoids an extra @types dependency).
declare module 'qrcode' {
  export interface QRCodeData {
    modules: { size: number; get(row: number, col: number): number | boolean };
  }
  export function create(
    text: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' },
  ): QRCodeData;
}
