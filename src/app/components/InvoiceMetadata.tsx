import { Input } from './ui/input';
import { Label } from './ui/label';

interface InvoiceMetadataProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  onUpdate: (field: string, value: string) => void;
}

export function InvoiceMetadata({
  invoiceNumber,
  invoiceDate,
  dueDate,
  onUpdate,
}: InvoiceMetadataProps) {
  return (
    <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-lg border-l-4 border-red-600 shadow-sm">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="invoiceNumber" className="text-slate-700">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => onUpdate('invoiceNumber', e.target.value)}
            placeholder="INV-001"
            className="mt-1 border-red-200 focus:border-red-500"
          />
        </div>
        <div>
          <Label htmlFor="invoiceDate" className="text-slate-700">Invoice Date</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={invoiceDate}
            onChange={(e) => onUpdate('invoiceDate', e.target.value)}
            className="mt-1 border-red-200 focus:border-red-500"
          />
        </div>
        <div>
          <Label htmlFor="dueDate" className="text-slate-700">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => onUpdate('dueDate', e.target.value)}
            className="mt-1 border-red-200 focus:border-red-500"
          />
        </div>
      </div>
    </div>
  );
}