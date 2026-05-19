import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ClientDetailsProps {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  onUpdate: (field: string, value: string) => void;
}

export function ClientDetails({
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
  onUpdate,
}: ClientDetailsProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border-l-4 border-blue-600 shadow-sm">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Bill To</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName" className="text-slate-700">Client Name</Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => onUpdate('clientName', e.target.value)}
            placeholder="Enter client name"
            className="mt-1 border-blue-200 focus:border-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="clientEmail" className="text-slate-700">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => onUpdate('clientEmail', e.target.value)}
            placeholder="client@example.com"
            className="mt-1 border-blue-200 focus:border-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="clientPhone" className="text-slate-700">Phone</Label>
          <Input
            id="clientPhone"
            value={clientPhone}
            onChange={(e) => onUpdate('clientPhone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="mt-1 border-blue-200 focus:border-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="clientAddress" className="text-slate-700">Address</Label>
          <Textarea
            id="clientAddress"
            value={clientAddress}
            onChange={(e) => onUpdate('clientAddress', e.target.value)}
            placeholder="Client address"
            className="mt-1 border-blue-200 focus:border-blue-500"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}