import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface NotesSectionProps {
  notes: string;
  onUpdate: (value: string) => void;
}

export function NotesSection({ notes, onUpdate }: NotesSectionProps) {
  return (
    <div className="mb-6">
      <Label htmlFor="notes" className="text-red-900 font-semibold">Additional Notes</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Add any additional notes or special instructions here..."
        className="mt-1 border-red-200 focus:border-red-500 bg-gradient-to-br from-red-50 to-white"
        rows={4}
      />
    </div>
  );
}