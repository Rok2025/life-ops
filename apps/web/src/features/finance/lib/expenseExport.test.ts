import { describe, expect, it } from 'vitest';
import { buildExpenseExcelFile } from './expenseExport';
import type { FinanceExpenseDetailRow } from './transactionDisplay';

const rows: FinanceExpenseDetailRow[] = [
    {
        id: 'expense-1',
        accountId: 'account-card',
        title: '午饭 & 茶',
        amount: 42.5,
        occurredDate: '2026-05-19',
        transactionType: 'expense',
        category: 'dining',
        categoryLabel: '餐饮',
        accountName: '招商储蓄卡',
        merchant: '午饭 & 茶',
        note: '和 <客户> 聊天',
        createdAt: '2026-05-19T04:00:00.000Z',
    },
];

describe('buildExpenseExcelFile', () => {
    it('builds an Excel-compatible workbook for expense rows', () => {
        const file = buildExpenseExcelFile(rows, '2026', '05');

        expect(file.filename).toBe('全部支出-2026-05.xls');
        expect(file.mimeType).toBe('application/vnd.ms-excel;charset=utf-8');
        expect(file.content).toContain('<?mso-application progid="Excel.Sheet"?>');
        expect(file.content).toContain('2026年05月支出明细');
        expect(file.content).toContain('<Data ss:Type="String">日期</Data>');
        expect(file.content).toContain('<Data ss:Type="String">午饭 &amp; 茶</Data>');
        expect(file.content).toContain('<Data ss:Type="String">和 &lt;客户&gt; 聊天</Data>');
        expect(file.content).toContain('<Data ss:Type="Number">42.5</Data>');
    });
});
