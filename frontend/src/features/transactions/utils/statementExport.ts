import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportTransaction = {
    id: number;
    createdAt: string;
    reference?: string | null;
    amount: number | string;
    type: string;
    status: string;
    category?: { name: string } | null;
    fromUser?: { id?: number; name?: string; email?: string } | null;
    toUser?: { id?: number; name?: string; email?: string } | null;
};

export type ExportUser = {
    name?: string;
    email?: string;
    upiId?: string;
};

/**
 * Generates and triggers download of a CSV Statement
 */
export const exportToCSV = (transactions: ExportTransaction[], filename = "InsightPay_Statement.csv") => {
    if (!transactions || transactions.length === 0) return;

    const headers = ["ID", "Date", "Reference", "Type", "Amount (INR)", "Status", "Category", "Sender/Recipient"];

    const rows = transactions.map((t) => {
        const dateStr = new Date(t.createdAt).toLocaleString("en-IN");
        const party = t.type === "DEPOSIT" ? "Self (Deposit)" : t.toUser?.name || t.fromUser?.name || "System";
        const categoryName = t.category?.name || "Uncategorized";

        return [
            t.id,
            `"${dateStr}"`,
            `"${t.reference || "N/A"}"`,
            t.type,
            t.amount,
            t.status,
            `"${categoryName}"`,
            `"${party}"`,
        ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Generates and triggers download of a branded PDF Bank Statement
 */
export const exportToPDF = (
    transactions: ExportTransaction[],
    user?: ExportUser,
    filename = "InsightPay_Bank_Statement.pdf"
) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header Banner ──────────────────────────────────────────────────────────
    doc.setFillColor(13, 107, 95); // InsightPay Primary Emerald (#0d6b5f)
    doc.rect(0, 0, pageWidth, 75, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("InsightPay", 40, 45);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official Account Statement", pageWidth - 40, 45, { align: "right" });

    // ── User Information & Summary Section ─────────────────────────────────────
    doc.setTextColor(15, 20, 25);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Account Details", 40, 98);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(77, 92, 101);
    doc.text(`Account Holder: ${user?.name || "InsightPay User"}`, 40, 114);
    doc.text(`Email: ${user?.email || "N/A"}`, 40, 127);
    doc.text(`UPI ID: ${user?.upiId || "N/A"}`, 40, 140);

    const generatedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const rightMargin = pageWidth - 40;

    doc.text(`Generated On: ${generatedDate}`, rightMargin, 114, { align: "right" });
    doc.text(`Total Transactions: ${transactions.length}`, rightMargin, 127, { align: "right" });

    // ── Financial Totals Calculation ───────────────────────────────────────────
    let totalIncoming = 0;
    let totalOutgoing = 0;

    transactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const isIncoming =
            t.type === "DEPOSIT" ||
            (t.type === "TRANSFER" &&
                t.toUser?.email &&
                user?.email &&
                t.toUser.email.toLowerCase() === user.email.toLowerCase());

        if (isIncoming) {
            totalIncoming += amt;
        } else {
            totalOutgoing += amt;
        }
    });

    const formatCurrency = (amount: number) => {
        return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 107, 95);
    doc.text(`Total Incoming: +${formatCurrency(totalIncoming)}`, rightMargin, 140, { align: "right" });

    doc.setTextColor(220, 38, 38);
    doc.text(`Total Outgoing: -${formatCurrency(totalOutgoing)}`, rightMargin, 153, { align: "right" });

    // ── Divider Line ───────────────────────────────────────────────────────────
    doc.setDrawColor(230, 234, 238);
    doc.setLineWidth(1);
    doc.line(40, 166, pageWidth - 40, 166);

    // ── Transaction Table ──────────────────────────────────────────────────────
    const tableData = transactions.map((t) => {
        const isIncoming =
            t.type === "DEPOSIT" ||
            (t.type === "TRANSFER" &&
                t.toUser?.email &&
                user?.email &&
                t.toUser.email.toLowerCase() === user.email.toLowerCase());

        const sign = isIncoming ? "+" : "-";
        const amtVal = Math.abs(Number(t.amount) || 0);

        return [
            new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            t.reference ? t.reference.slice(-8) : `#${t.id}`,
            t.type,
            t.category?.name || "General",
            t.type === "DEPOSIT" ? "Self" : t.toUser?.name || t.fromUser?.name || "Merchant",
            t.status,
            `${sign} ${formatCurrency(amtVal)}`,
        ];
    });

    autoTable(doc, {
        startY: 178,
        margin: { left: 40, right: 40 },
        head: [["Date", "Ref ID", "Type", "Category", "Party", "Status", "Amount"]],
        body: tableData,
        headStyles: {
            fillColor: [13, 107, 95],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: [23, 32, 38],
        },
        alternateRowStyles: {
            fillColor: [244, 247, 248],
        },
        columnStyles: {
            6: { fontStyle: "bold", halign: "right" },
        },
    });

    // ── Footer Notice ──────────────────────────────────────────────────────────
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 170);
        doc.text(
            `Page ${i} of ${pageCount} • InsightPay Computer Generated Statement • Confidential`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 20,
            { align: "center" }
        );
    }

    doc.save(filename);
};
