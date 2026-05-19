import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { InvoiceItem } from '../types/invoice';

interface ItemsTableProps {
  items: InvoiceItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string | number) => void;
}

export function ItemsTable({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: ItemsTableProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900">Items</h3>
        <Button onClick={onAddItem} size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <div className="border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-white">Description</th>
                <th className="text-right p-3 text-sm font-semibold text-white w-24">Qty</th>
                <th className="text-right p-3 text-sm font-semibold text-white w-32">Unit Price</th>
                <th className="text-right p-3 text-sm font-semibold text-white w-32">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                  <td className="p-3">
                    <Input
                      value={item.description}
                      onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="text-right border-blue-200 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="text-right border-blue-200 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3 text-right font-semibold text-blue-900">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No items added yet. Click "Add Item" to get started.
          </div>
        )}
      </div>
    </div>
  );
}