import { Building2 } from 'lucide-react';
import { CompanyInfo } from '../types/invoice';

interface InvoiceHeaderProps {
  companyInfo: CompanyInfo;
}

export function InvoiceHeader({ companyInfo }: InvoiceHeaderProps) {
  return (
    <div className="relative mb-8">
      {/* Blue and Red Gradient Header Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-red-600 h-32 rounded-t-lg"></div>
      
      <div className="relative z-10 pt-6 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-3 rounded-lg shadow-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{companyInfo.name}</h1>
                <p className="text-sm text-blue-100 mt-1">Professional Healthcare Solutions</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-white bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
              <p>{companyInfo.address}</p>
              <p>Email: {companyInfo.email}</p>
              <p>Phone: {companyInfo.phone}</p>
            </div>
          </div>
          <div className="text-right bg-white rounded-lg px-6 py-4 shadow-lg">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent mb-2">INVOICE</h2>
          </div>
        </div>
      </div>
      <div className="border-b-4 border-gradient-to-r from-blue-600 to-red-600"></div>
    </div>
  );
}