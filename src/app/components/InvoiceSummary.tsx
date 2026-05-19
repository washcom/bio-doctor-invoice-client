interface InvoiceSummaryProps {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

export function InvoiceSummary({
  subtotal,
  vatRate,
  vatAmount,
  total,
}: InvoiceSummaryProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="w-full md:w-80">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md border-2 border-blue-200 space-y-3">
          <div className="flex justify-between text-slate-700">
            <span>Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>VAT ({vatRate}%):</span>
            <span className="font-semibold">${vatAmount.toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-gradient-to-r from-blue-600 to-red-600 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-900">Total:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}