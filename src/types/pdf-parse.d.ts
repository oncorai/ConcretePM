declare module 'pdf-parse' {
  interface PDFOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer, options?: PDFOptions): Promise<PDFData>;

  export = pdf;
}