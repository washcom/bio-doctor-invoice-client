import { Input } from './ui/input';
import { Label } from './ui/label';

interface SignatureSectionProps {
  signatureName: string;
  signatureTitle: string;
  onUpdate: (field: string, value: string) => void;
}

export function SignatureSection({
  signatureName,
  signatureTitle,
  onUpdate,
}: SignatureSectionProps) {
  return (
    <div className="border-t-4 border-gradient-to-r from-blue-600 to-red-600 pt-8 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="signatureName" className="text-slate-700">Authorized Signature Name</Label>
          <Input
            id="signatureName"
            value={signatureName}
            onChange={(e) => onUpdate('signatureName', e.target.value)}
            placeholder="Enter name"
            className="mt-1 border-blue-200 focus:border-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="signatureTitle" className="text-slate-700">Title/Position</Label>
          <Input
            id="signatureTitle"
            value={signatureTitle}
            onChange={(e) => onUpdate('signatureTitle', e.target.value)}
            placeholder="e.g., Finance Manager"
            className="mt-1 border-blue-200 focus:border-blue-500"
          />
        </div>
      </div>
      {signatureName && (
        <div className="mt-6 pt-4 border-t-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
          <div className="text-blue-900 font-signature text-2xl mb-1">{signatureName}</div>
          <div className="text-sm text-slate-600 font-semibold">{signatureTitle}</div>
          <div className="text-sm text-slate-500 mt-1">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}