import type { FinanceExpenseDetailRow } from './transactionDisplay';

export type FinanceExpenseExcelFile = {
    filename: string;
    mimeType: string;
    content: string;
};

const excelMimeType = 'application/vnd.ms-excel;charset=utf-8';

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stringCell(value: string): string {
    return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function numberCell(value: number): string {
    return `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${value}</Data></Cell>`;
}

function getCreatedAtLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function getWorksheetName(year: string, month: string): string {
    return `${year}-${month}支出`.slice(0, 31);
}

export function buildExpenseExcelFile(
    rows: FinanceExpenseDetailRow[],
    year: string,
    month: string,
): FinanceExpenseExcelFile {
    const title = `${year}年${month}月支出明细`;
    const worksheetName = getWorksheetName(year, month);
    const headers = ['日期', '商户/对象', '分类', '账户', '备注', '金额', '记录时间'];
    const bodyRows = rows.map((row) => (
        `<Row>${[
            stringCell(row.occurredDate),
            stringCell(row.title),
            stringCell(row.categoryLabel),
            stringCell(row.accountName),
            stringCell(row.note ?? ''),
            numberCell(row.amount),
            stringCell(getCreatedAtLabel(row.createdAt)),
        ].join('')}</Row>`
    ));

    const content = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;¥&quot;#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(worksheetName)}">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="150"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="180"/>
   <Column ss:Width="90"/>
   <Column ss:Width="150"/>
   <Row>
    <Cell ss:StyleID="Title" ss:MergeAcross="6"><Data ss:Type="String">${escapeXml(title)}</Data></Cell>
   </Row>
   <Row>${headers.map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join('')}</Row>
   ${bodyRows.join('\n   ')}
  </Table>
 </Worksheet>
</Workbook>`;

    return {
        filename: `全部支出-${year}-${month}.xls`,
        mimeType: excelMimeType,
        content,
    };
}

export function downloadExpenseExcelFile(file: FinanceExpenseExcelFile): void {
    if (typeof document === 'undefined') return;

    const blob = new Blob([file.content], { type: file.mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
