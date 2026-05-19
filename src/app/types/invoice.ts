export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TermsCondition {
  id: string;
  text: string;
  checked: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: InvoiceItem[];
  terms: string;
  termsConditions: TermsCondition[];
  notes: string;
  signatureName: string;
  signatureTitle: string;
}

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}