import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export JSON data to CSV
   */
  exportToCsv(data: Record<string, any>[], filename: string) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    // Data rows
    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        else if (typeof val === 'object') val = JSON.stringify(val);
        else val = String(val);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
    this.downloadFile(csvContent, `${filename}.csv`);
  }

  /**
   * Export to Excel format (Spreadsheet XML)
   */
  exportToExcel(data: Record<string, any>[], filename: string, sheetName = 'Sheet1') {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row ss:StyleID="Header">
`;

    // Headers
    headers.forEach(h => {
      xml += `    <Cell><Data ss:Type="String">${this.escapeXml(h)}</Data></Cell>\n`;
    });
    xml += '   </Row>\n';

    // Rows
    data.forEach(row => {
      xml += '   <Row ss:StyleID="Data">\n';
      headers.forEach(h => {
        let val = row[h];
        if (val === null || val === undefined) val = '';
        else if (typeof val === 'object') val = JSON.stringify(val);
        else val = String(val);

        const isNum = !isNaN(Number(val)) && val !== '' && !val.startsWith('0');
        const type = isNum ? 'Number' : 'String';
        xml += `    <Cell><Data ss:Type="${type}">${this.escapeXml(val)}</Data></Cell>\n`;
      });
      xml += '   </Row>\n';
    });

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, `${filename}.xls`);
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
