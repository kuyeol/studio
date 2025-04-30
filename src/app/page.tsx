
'use client'; // Required for client-side interaction (hooks, event handlers)

import * as React from 'react';
import CodePad from "@/components/codepad"; // Import the main CodePad component
import { Button } from '@/components/ui/button';
import { generateInvoiceHtml, GenerateInvoiceHtmlInput } from '@/ai/flows/generate-invoice-html-flow'; // Import the flow
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Example function to trigger invoice generation
  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    try {
      // Example Input Data (Replace with actual dynamic data as needed)
      const invoiceInput: GenerateInvoiceHtmlInput = {
        supplier: {
          name: "행복 에어컨",
          representative: "정봉남",
          businessNumber: "123-45-67890",
          address: "대전 대덕구 늘봄1길 27 102호",
          contact: "010-9690-2622",
        },
        customer: {
          recipientName: "김고객",
          address: "세종시 도움8로 81",
          contact: "010-1234-5678",
          installationSite: "세종시 도움8로 81 동일",
        },
        items: [
          { description: "스탠드 에어컨 설치비", specification: "대", quantity: 1, unitPrice: 150000, notes: "기본 설치" },
          { description: "벽걸이 에어컨 설치비", specification: "대", quantity: 1, unitPrice: 120000 },
          { description: "냉매 배관", specification: "M", quantity: 5, unitPrice: 18000 },
          { description: "타공", specification: "개", quantity: 2, unitPrice: 20000, notes: "추가 타공" },
          { description: "앵글 설치", specification: "개", quantity: 1, unitPrice: 80000 },
        ],
        // Optional: Provide specific notes or let the default ones be used
        // notes: ["Custom note 1", "Custom note 2"],
        // Optional: Provide specific issue date or let the current date be used
        // issueDate: "2024-05-15",
      };

      const result = await generateInvoiceHtml(invoiceInput);

      // Create a Blob from the HTML content
      const blob = new Blob([result.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      const supplierName = invoiceInput.supplier.name.replace(/\s+/g, '_'); // Sanitize name for filename
      const customerName = invoiceInput.customer.recipientName.replace(/\s+/g, '_'); // Sanitize name for filename
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.download = `견적서_${supplierName}_${customerName}_${dateStr}.html`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Generated",
        description: "HTML invoice has been generated and downloaded.",
      });

    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: `Could not generate invoice: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // Add a container for layout if needed, e.g., flex-col
    <div className="flex flex-col h-screen">
       {/* Example Button to trigger generation */}
       {/* Position this button appropriately within your layout */}
      <div className="p-2 border-b">
         <Button onClick={handleGenerateInvoice} disabled={isGenerating}>
           {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {isGenerating ? 'Generating Invoice...' : 'Generate & Download Invoice HTML'}
         </Button>
      </div>

      {/* Rest of the CodePad component takes remaining space */}
      <div className="flex-grow overflow-hidden">
         <CodePad />
      </div>
    </div>
  );
}
