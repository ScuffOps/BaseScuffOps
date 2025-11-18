import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import LicenseFormModal from './LicenseFormModal';

export default function LicenseLog({ licenses, onUpdate }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);

  const handleEdit = (license) => {
    setEditingLicense(license);
    setIsFormOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Item Name", "Owner", "Scope", "Proof Link", "Expiry Date"];
    const rows = licenses.map(l => [
      `"${l.item_name}"`,
      `"${l.owner}"`,
      `"${l.scope}"`,
      `"${l.proof_link || ''}"`,
      `"${l.expiry_date ? format(new Date(l.expiry_date), 'yyyy-MM-dd') : 'N/A'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "license_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800/60 !rounded-[var(--panel-radius)]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Licenses ({licenses.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={() => { setEditingLicense(null); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add License
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map(license => (
              <TableRow key={license.id}>
                <TableCell className="font-medium">{license.item_name}</TableCell>
                <TableCell>{license.owner}</TableCell>
                <TableCell>{license.scope}</TableCell>
                <TableCell>
                  {license.expiry_date ? format(new Date(license.expiry_date), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {license.proof_link && (
                    <Button asChild variant="link" size="sm">
                      <a href={license.proof_link} target="_blank" rel="noopener noreferrer">Proof</a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(license)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {isFormOpen && (
        <LicenseFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onUpdate={onUpdate}
          license={editingLicense}
        />
      )}
    </Card>
  );
}