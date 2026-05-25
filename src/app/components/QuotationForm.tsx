import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { QuotationData } from './QuotationPreview';

const DEFAULT_TERMS = [
  'The above cost does not cater for the following:\na. 16% VAT,\nb. Plumbing & drainage works.',
  'You will be required to:\n- Do a biodigester hole 5M by 5M and approximately 1M deep from the invert level.\n- Excavate soakpit to the sea level.',
  'It takes a maximum of 8 working days to fully install the on-site sewer system from the day the installation works commences.',
  'The installation works commences once an L.P.O is raised and is accompanied by a deposit of 75% of the Net Cost.',
  '25% of the Net Cost is payable once the system is completed, connected and ready for use.',
  'A written Completion and a 10 year Guarantee certificate (against manufacturing faults) is issued during handover.',
  'Thanking you in advance for taking time to review our quotation and looking forward to working with you on this project.',
];

interface QuotationFormProps {
  onSubmit: (data: QuotationData) => void;
  initialData?: QuotationData;
}

export function QuotationForm({ onSubmit, initialData }: QuotationFormProps) {
  const [selectedTerms, setSelectedTerms] = useState<string[]>(initialData?.termsAndConditions || []);
  const [customTerm, setCustomTerm] = useState('');

  const { register, control, handleSubmit, watch } = useForm<QuotationData>({
    defaultValues: initialData || {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      quotationNumber: `QT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      bankName: 'NCBA Bank',
      accountName: 'Biodoctor Solutions Limited',
      accountNumber: '4392270023',
      items: [{ description: '', qty: 1, rate: 0 }],
      termsAndConditions: [],
      includeVAT: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchIncludeVAT = watch('includeVAT');

  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
  };

  const calculateVAT = () => {
    return watchIncludeVAT ? calculateSubtotal() * 0.16 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const handleTermToggle = (term: string) => {
    setSelectedTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    );
  };

  const handleAddCustomTerm = () => {
    if (customTerm.trim()) {
      setSelectedTerms((prev) => [...prev, customTerm.trim()]);
      setCustomTerm('');
    }
  };

  const handleRemoveCustomTerm = (term: string) => {
    setSelectedTerms((prev) => prev.filter((t) => t !== term));
  };

  const handleFormSubmit = (data: QuotationData) => {
    onSubmit({ ...data, termsAndConditions: selectedTerms });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 rounded-lg border border-[#cfe6ff] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
      {/* Client Information */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Client Information</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-900">Client Name</label>
            <input
              {...register('clientName')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Enter client name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Phone</label>
            <input
              {...register('clientPhone')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="+234 XXX XXX XXXX"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Email</label>
            <input
              {...register('clientEmail')}
              type="email"
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="client@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Address</label>
            <input
              {...register('clientAddress')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Client address"
            />
          </div>
        </div>
      </div>

      {/* Quotation Details */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Quotation Details</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-900">Quotation Number</label>
            <input
              {...register('quotationNumber')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="QT-001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Date</label>
            <input
              {...register('date')}
              type="date"
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-base font-semibold text-slate-900">Items</h2>
          <button
            type="button"
            onClick={() => append({ description: '', qty: 1, rate: 0 })}
            className="flex items-center justify-center gap-2 rounded-sm bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid items-start gap-2 md:grid-cols-[1fr_80px_110px_120px_auto]">
              <div className="flex-1">
                <input
                  {...register(`items.${index}.description` as const)}
                  className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  placeholder="Item description"
                />
              </div>
              <div>
                <input
                  {...register(`items.${index}.qty` as const, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  placeholder="Qty"
                />
              </div>
              <div>
                <input
                  {...register(`items.${index}.rate` as const, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                  placeholder="Rate (KES)"
                />
              </div>
              <div className="min-w-0 overflow-hidden text-ellipsis rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-right text-xs text-slate-900">
                KES {((watchItems[index]?.qty || 0) * (watchItems[index]?.rate || 0)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-sm border border-[#cfe6ff] bg-white p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-[#cfe6ff] pt-4">
          {/* VAT Checkbox */}
          <div className="flex justify-start sm:justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('includeVAT')}
                className="w-4 h-4 text-blue-700 rounded"
              />
              <span className="text-xs text-slate-600">Include 16% VAT</span>
            </label>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-xs font-bold text-slate-900">Subtotal:</span>
            <span className="text-right text-xs text-slate-900">
              KES {calculateSubtotal().toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* VAT Amount */}
          {watchIncludeVAT && (
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-xs font-bold text-slate-900">VAT (16%):</span>
              <span className="text-right text-xs text-slate-900">
                KES {calculateVAT().toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between gap-4 border-t border-[#cfe6ff] pt-2 sm:justify-end">
            <span className="text-sm font-bold text-slate-900">Total:</span>
            <span className="text-right text-sm font-bold text-slate-900">
              KES {calculateTotal().toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border-t border-[#cfe6ff] pt-4">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Terms and Conditions</h2>

        {/* Default Terms with Checkboxes */}
        <div className="mb-4 space-y-2">
          {DEFAULT_TERMS.map((term, index) => (
            <label key={index} className="flex cursor-pointer items-start gap-3 rounded-sm p-2 text-xs text-slate-900 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedTerms.includes(term)}
                onChange={() => handleTermToggle(term)}
                className="mt-1 h-3 w-3 rounded text-blue-700"
              />
              <span className="flex-1 whitespace-pre-line">{term}</span>
            </label>
          ))}
        </div>

        {/* Custom Terms */}
        <div className="border-t border-[#cfe6ff] pt-4">
          <h3 className="mb-2 text-xs text-slate-900">Add Custom Terms</h3>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={customTerm}
              onChange={(e) => setCustomTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTerm();
                }
              }}
              className="min-w-0 flex-1 rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Enter custom term and press Add"
            />
            <button
              type="button"
              onClick={handleAddCustomTerm}
              className="rounded-sm bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
            >
              Add
            </button>
          </div>

          {/* Custom Terms List */}
          {selectedTerms.filter((term) => !DEFAULT_TERMS.includes(term)).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs text-slate-900">Custom Terms:</h4>
              {selectedTerms
                .filter((term) => !DEFAULT_TERMS.includes(term))
                .map((term, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-sm bg-[#f8fbff] p-2"
                  >
                    <span className="flex-1 text-xs text-slate-900">{term}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTerm(term)}
                      className="rounded-sm p-1 text-red-600 hover:bg-red-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div className="border-t border-[#cfe6ff] pt-4">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Bank Account Details</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-900">Bank Name</label>
            <input
              {...register('bankName')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Bank name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Account Name</label>
            <input
              {...register('accountName')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Account name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-900">Account Number</label>
            <input
              {...register('accountNumber')}
              className="w-full rounded-sm border border-[#cfe6ff] bg-white px-3 py-2 text-xs text-slate-900 outline-none"
              placeholder="Account number"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="submit"
          className="min-w-40 flex-1 rounded-lg bg-[#c90808] px-6 py-3 font-bold text-white hover:bg-red-800 sm:flex-none"
        >
          Generate Quotation
        </button>
      </div>
    </form>
  );
}
