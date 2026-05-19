import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { TermsCondition } from '../types/invoice';

interface TermsConditionsProps {
  selectedTerms: string;
  termsConditions: TermsCondition[];
  onUpdatePaymentTerms: (value: string) => void;
  onToggleCondition: (id: string) => void;
}

const TERMS_OPTIONS = [
  {
    value: 'net30',
    label: 'Net 30',
    description: 'Payment due within 30 days of invoice date.',
  },
  {
    value: 'net60',
    label: 'Net 60',
    description: 'Payment due within 60 days of invoice date.',
  },
  {
    value: 'due_on_receipt',
    label: 'Due on Receipt',
    description: 'Payment due immediately upon receipt of invoice.',
  },
  {
    value: 'net15',
    label: 'Net 15',
    description: 'Payment due within 15 days of invoice date.',
  },
];

export function TermsConditions({ 
  selectedTerms, 
  termsConditions,
  onUpdatePaymentTerms,
  onToggleCondition 
}: TermsConditionsProps) {
  const selectedOption = TERMS_OPTIONS.find((opt) => opt.value === selectedTerms);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Terms & Conditions</h3>
      
      {/* Payment Terms */}
      <div className="mb-6">
        <Label htmlFor="terms" className="text-slate-700">Payment Terms</Label>
        <Select value={selectedTerms} onValueChange={onUpdatePaymentTerms}>
          <SelectTrigger id="terms" className="mt-1 border-blue-200 focus:border-blue-500">
            <SelectValue placeholder="Select payment terms" />
          </SelectTrigger>
          <SelectContent>
            {TERMS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedOption && (
          <p className="text-sm text-slate-600 mt-2">{selectedOption.description}</p>
        )}
      </div>

      {/* Terms & Conditions Checklist */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <Label className="mb-3 block text-blue-900 font-semibold">Agreed Terms & Conditions</Label>
        <div className="space-y-3">
          {termsConditions.map((condition) => (
            <div key={condition.id} className="flex items-start gap-3">
              <Checkbox
                id={`condition-${condition.id}`}
                checked={condition.checked}
                onCheckedChange={() => onToggleCondition(condition.id)}
                className="mt-1 border-blue-400 data-[state=checked]:bg-blue-600"
              />
              <label
                htmlFor={`condition-${condition.id}`}
                className="text-sm text-slate-700 cursor-pointer leading-relaxed flex-1"
              >
                {condition.text}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}