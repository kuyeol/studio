
'use server';
/**
 * @fileOverview Defines a Genkit flow to generate HTML content for an invoice using manual templating.
 *
 * - generateInvoiceHtml - A function that generates invoice HTML.
 * - GenerateInvoiceHtmlInput - The input type for the generateInvoiceHtml function.
 * - GenerateInvoiceHtmlOutput - The return type for the generateInvoiceHtml function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the structure for an invoice item
const InvoiceItemSchema = z.object({
    description: z.string().describe('Description of the item or service.'),
    specification: z.string().optional().describe('Specification or unit (e.g., 대, M, 개).'),
    quantity: z.number().describe('Quantity of the item.'),
    unitPrice: z.number().describe('Price per unit in KRW.'),
    notes: z.string().optional().describe('Optional notes for the item row.')
});

// Define the input schema for the invoice generation flow
// REMOVED export keyword
const GenerateInvoiceHtmlInputSchema = z.object({
  supplier: z.object({
    name: z.string().describe('Supplier company name.'),
    representative: z.string().describe('Supplier representative name.'),
    businessNumber: z.string().optional().describe('Supplier business registration number.'),
    address: z.string().describe('Supplier address.'),
    contact: z.string().describe('Supplier contact number.'),
  }).describe('Information about the supplier/provider.'),
  customer: z.object({
    recipientName: z.string().describe('Name of the customer receiving the invoice.'),
    address: z.string().describe('Customer address.'),
    contact: z.string().describe('Customer contact number.'),
    installationSite: z.string().optional().describe('Address where the service/installation occurs, if different from the main address.'),
  }).describe('Information about the customer.'),
  items: z.array(InvoiceItemSchema).describe('List of items or services included in the invoice.'),
  notes: z.array(z.string()).optional().describe('List of general notes or terms (특이사항).'),
  issueDate: z.string().optional().describe('Date the invoice is issued (YYYY-MM-DD format). If not provided, use the current date.'),
});
export type GenerateInvoiceHtmlInput = z.infer<typeof GenerateInvoiceHtmlInputSchema>; // Type export is allowed

// Define the output schema for the flow
// REMOVED export keyword
const GenerateInvoiceHtmlOutputSchema = z.object({
  htmlContent: z.string().describe('The generated HTML content of the invoice.'),
});
export type GenerateInvoiceHtmlOutput = z.infer<typeof GenerateInvoiceHtmlOutputSchema>; // Type export is allowed


// --- Helper Functions ---

// Helper function to format numbers with commas
function formatNumberHelper(num: number | undefined | null): string {
    const parsedNum = Number(num);
    return isNaN(parsedNum) ? '0' : parsedNum.toLocaleString('ko-KR');
}

// Helper function to convert number to Korean currency format
function numberToKoreanHelper(number: number | undefined | null): string {
    number = Number(number);
    if (isNaN(number) || number === 0) return "영";

    const units = ["", "만", "억", "조"];
    const smallUnits = ["", "십", "백", "천"];
    const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    let result = "";
    let unitIndex = 0;

    while (number > 0) {
        let part = number % 10000;
        number = Math.floor(number / 10000);
        if (part > 0) {
            let partStr = "";
            for (let i = 0; i < 4; i++) {
                let digit = part % 10;
                part = Math.floor(part / 10);
                if (digit > 0) {
                    partStr = digits[digit] + smallUnits[i] + partStr;
                }
            }
            // Handle cases like "일십" -> "십"
            partStr = partStr.replace(/^일([십백천])/g, '$1');
            result = partStr + units[unitIndex] + result;
        }
        unitIndex++;
    }
    return result.trim();
}


// Define the flow using manual HTML generation
const generateInvoiceHtmlFlow = ai.defineFlow(
  {
    name: 'generateInvoiceHtmlFlow',
    inputSchema: GenerateInvoiceHtmlInputSchema, // Use the internal schema
    outputSchema: GenerateInvoiceHtmlOutputSchema, // Use the internal schema
  },
  async (input): Promise<GenerateInvoiceHtmlOutput> => {
    // Calculate totals before generating HTML
    let subtotal = 0;
    input.items.forEach(item => {
        subtotal += (item.quantity || 0) * (item.unitPrice || 0);
    });
    const supplyPrice = subtotal;
    const vat = Math.round(supplyPrice * 0.1);
    const totalAmount = supplyPrice + vat;

    // Format date
    const issueDate = input.issueDate ? new Date(input.issueDate) : new Date();
    const yyyy = issueDate.getFullYear();
    const mm = String(issueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(issueDate.getDate()).padStart(2, '0');
    const formattedDateHeader = `${yyyy}-${mm}-${dd}`;
    const formattedDateFooter = `${yyyy}년 ${mm}월 ${dd}일`;


    // Generate HTML for items
    const itemsHtml = input.items.map((item, index) => `
        <tr class="item-row">
            <td>${index + 1}</td>
            <td>${item.description || '&nbsp;'}</td>
            <td>${item.specification || '&nbsp;'}</td>
            <td class="quantity">${item.quantity || 0}</td>
            <td class="unit-price">${formatNumberHelper(item.unitPrice)}</td>
            <td class="amount">${formatNumberHelper((item.quantity || 0) * (item.unitPrice || 0))}</td>
            <td>${item.notes || '&nbsp;'}</td>
        </tr>
    `).join('');

    // Generate HTML for notes
    const notesHtml = (input.notes && input.notes.length > 0 ? input.notes : [
        '본 견적 금액은 기본 설치 환경 기준이며, 현장 상황(배관 길이 초과, 위험 작업, 특수 타공, 전기 공사 등)에 따라 추가 비용이 발생할 수 있습니다.',
        '설치 하자에 대한 보증 기간은 설치일로부터 1년입니다. (제품 자체의 보증은 제조사 규정에 따름)'
    ]).map(note => `<li>${note}</li>`).join('');


    // Construct the final HTML using template literals
    const finalHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>설 치 견 적 서</title>
    <style>
        /* Styles copied from the prompt's example HTML - Ensure these are complete and correct */
        body { font-family: 'Malgun Gothic', sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; line-height: 1.6; font-size: 16px; }
        .quote-container { max-width: 800px; /* Adjusted width for better standard printing */ margin: 0 auto; background-color: #fff; padding: 25px; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
        h1 { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 28px; font-weight: 700; }
        h2 { font-size: 20px; margin-top: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; font-weight: 600; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 30px; flex-wrap: wrap; } /* Adjusted gap */
        .supplier-info, .customer-info { width: 100%; margin-top: 0; } /* Default to full width */
         @media (min-width: 768px) { /* Apply 50% width on medium screens and up */
            .supplier-info, .customer-info { width: calc(50% - 15px); } /* Adjust width for gap */
        }
        .info-section table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .info-section th, .info-section td { border: none; border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; vertical-align: middle; line-height: 1.2; height: 24px; word-break: keep-all; }
        .info-section tr:first-child th, .info-section tr:first-child td { border-top: 1px solid #ddd; }
        .info-section tr:last-child th, .info-section tr:last-child td { border-bottom: 1px solid #ddd; }
        .info-section th { background-color: transparent; width: 80px; font-weight: 500; color: #666; padding-left: 0; font-size: 13px; white-space: nowrap; }
        .info-section td { color: #444; font-size: 14px; }
        .items-section { margin-bottom: 25px; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; border: none; table-layout: fixed; }
        .items-table thead tr { border-top: 1px solid #999; border-bottom: 1px solid #999; }
        .items-table th { background-color: #fafafa; font-weight: 500; color: #2b2b2b; padding: 10px 6px; font-size: 14px; border: none; text-align: center; vertical-align: middle; line-height: 1.4; }
        .items-table td { padding: 6px 6px; border: none; border-bottom: 1px solid #ddd; text-align: center; line-height: 1.2; height: auto; font-size: 13px; word-break: break-all; }
        .items-table tbody tr:last-child td { border-bottom: 1px solid #9b9b9b; }
        .items-table tfoot { border-top: 1px solid #ddd; text-align: right; }
        .items-table tfoot td { border: none; padding: 0px; margin: 0px; font-size: 14px; }
        .items-table tfoot tr td { padding: 8px 10px; }
        .summary-label { text-align: right; padding: 8px 10px !important; font-size: 14px; font-weight: 500; line-height: 1.2; }
        .summary-value { text-align: right; font-weight: 500; letter-spacing: 1px !important; text-align: right !important; font-size: 14px; }
        .total-label, .total-value { background-color: transparent !important; font-weight: 700 !important; font-size: 16px !important; border-top: 1px solid #000000 !important; line-height: 1.8em !important; padding-right: 10px !important; }
        .total-value { text-align: right !important; font-weight: 700 !important; letter-spacing: 1px !important; text-align: right !important; }
        .total-kr { background-color: transparent !important; font-weight: 600; border: none !important; border-top: 1px solid #000000 !important; padding: 8px 10px !important; min-width: 50px; font-size: 14px; text-align: left; }
        .items-table tfoot tr:last-child td { border-top: 1px solid #000000; }
        .notes-section { margin-bottom: 10px; }
        .notes-section h2 { margin-bottom: 8px; }
        .notes-section ol { padding-left: 20px; margin-top: 8px; }
        .notes-section li { list-style-type: decimal; padding: 2px 5px; font-size: 12px; line-height: 1.4; }
        .footer-section { margin-top: 30px; text-align: center; font-size: 12px; }
        .footer-section .date { font-size: 12px; margin-bottom: 5px; }
        .footer-section .signature { font-size: 14px; margin-top: 25px; font-weight: 700; }
        .quote-date { text-align: right; margin-bottom: 15px; font-size: 16px; font-weight: 700; color: #666; padding-right: 15px; }
        .quote-date span { font-weight: 700; color: #333; margin-left: 8px; }
        /* Column Widths */
        .items-table th:nth-child(1), .items-table td:nth-child(1) { width: 5%; text-align: center;} /* 번호 */
        .items-table th:nth-child(2), .items-table td:nth-child(2) { width: 30%; text-align: left; padding-left: 10px;} /* 품 목 */
        .items-table th:nth-child(3), .items-table td:nth-child(3) { width: 10%; text-align: center;} /* 규 격 */
        .items-table th:nth-child(4), .items-table td:nth-child(4) { width: 8%; text-align: center;}  /* 수 량 */
        .items-table th:nth-child(5), .items-table td:nth-child(5) { width: 15%; text-align: right; padding-right: 10px;} /* 단가 */
        .items-table th:nth-child(6), .items-table td:nth-child(6) { width: 17%; text-align: right; padding-right: 10px;} /* 금액 */
        .items-table th:nth-child(7), .items-table td:nth-child(7) { width: 15%; text-align: left; padding-left: 10px;} /* 비 고 */
         @media print {
             body { margin: 0; background-color: #fff; font-size: 10pt; }
             .quote-container { width: 100%; max-width: none; box-shadow: none; border: none; padding: 0; margin: 0; }
             h1 { font-size: 18pt; }
             h2 { font-size: 12pt; }
             .info-section { gap: 20px; }
             .info-section th, .info-section td { padding: 4px 6px; font-size: 9pt; }
             .items-table th { padding: 8px 6px; font-size: 10pt; }
             .items-table td { padding: 4px 6px; font-size: 9pt; line-height: 1.1; }
             .summary-label, .summary-value, .total-kr { font-size: 10pt; padding: 6px 8px !important; }
             .total-label, .total-value { font-size: 12pt !important; }
             .notes-section li { font-size: 9pt; }
             .action-buttons, .add-row-button, .delete-row-button, .editable-cell:hover { display: none; background-color: transparent; }
         }
    </style>
</head>
<body>
    <div class="quote-container">
        <h1>설 치 견 적 서</h1>
        <div class="quote-date">작성일자 : <span id="quote-date">${formattedDateHeader}</span></div>
        <div class="info-section">
            <div class="supplier-info">
                <h2>공급자</h2>
                <table>
                    <tr><th>상호</th><td id="supplier-name">${input.supplier.name}</td><th>성명</th><td>${input.supplier.representative}</td></tr>
                    <tr><th>사업자번호</th><td colspan="3">${input.supplier.businessNumber || '&nbsp;'}</td></tr>
                    <tr><th>주소</th><td colspan="3">${input.supplier.address}</td></tr>
                    <tr><th>연락처</th><td colspan="3">${input.supplier.contact}</td></tr>
                </table>
            </div>
            <div class="customer-info">
                <h2>수신자</h2>
                <table>
                    <tr><th>받으시는분</th><td>${input.customer.recipientName}</td></tr>
                    <tr><th>주소</th><td>${input.customer.address}</td></tr>
                    <tr><th>연락처</th><td>${input.customer.contact}</td></tr>
                    <tr><th>설치 장소</th><td>${input.customer.installationSite || '&nbsp;'}</td></tr>
                </table>
            </div>
        </div>
        <div class="items-section">
            <h2>견적 내역</h2>
            <table class="items-table">
                <thead>
                    <tr><th>번호</th><th>품 목</th><th>규 격</th><th>수 량</th><th>단가(원)</th><th>금액(원)</th><th>비 고</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                     <tr><td colspan="5" class="summary-label">소계</td><td id="subtotal" class="summary-value">${formatNumberHelper(subtotal)}</td><td></td></tr>
                    <tr><td colspan="5" class="summary-label">공급가액</td><td id="supply-price" class="summary-value">${formatNumberHelper(supplyPrice)}</td><td></td></tr>
                    <tr><td colspan="5" class="summary-label">부가세 (VAT)</td><td id="vat" class="summary-value">${formatNumberHelper(vat)}</td><td>공급가액의 10%</td></tr>
                    <tr><td colspan="5" class="summary-label total-label">합계 금액</td><td id="total-amount-kr" class="total-kr">일금 ${numberToKoreanHelper(totalAmount)}원 정</td><td id="total-amount" class="summary-value total-value">${formatNumberHelper(totalAmount)}</td></tr>
                </tfoot>
            </table>
        </div>
        <div class="notes-section">
            <h2>특이사항</h2>
            <ol>
               ${notesHtml}
            </ol>
        </div>
        <div class="footer-section">
            <p>위와 같이 견적합니다.</p>
            <p class="date" id="footer-date">${formattedDateFooter}</p>
            <p class="signature">견적 제출자 : <span id="submitter-name">${input.supplier.name}</span> (인)</p>
        </div>
    </div>
     <!-- Removed script tags and action buttons for generated HTML -->
</body>
</html>
    `;

    // Return the manually generated HTML
    return {
        htmlContent: finalHtml
    };
  }
);


/**
 * Generates the complete HTML for an invoice based on the provided data,
 * using a predefined template structure and calculations.
 * @param input - The invoice data.
 * @returns A promise that resolves to the generated HTML content.
 */
export async function generateInvoiceHtml(input: GenerateInvoiceHtmlInput): Promise<GenerateInvoiceHtmlOutput> {
  // Input validation could be added here before calling the flow
  return generateInvoiceHtmlFlow(input);
}

