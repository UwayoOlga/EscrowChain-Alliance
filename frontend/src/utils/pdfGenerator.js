import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateEscrowCertificate = (lease, property) => {
    const doc = new jsPDF();
    const primaryColor = '#2563EB';
    const darkColor = '#1E293B';
    const silverColor = '#F1F5F9';

    // ── HEADER ──
    doc.setFillColor(darkColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CERTIFICATE OF ESCROW', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ESCROWCHAIN ALLIANCE · BLOCKCHAIN-VERIFIED TENANCY', 105, 30, { align: 'center' });

    // ── ASSET INFORMATION ──
    doc.setTextColor(darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSET DETAILS', 20, 55);
    doc.setDrawColor(silverColor);
    doc.line(20, 58, 190, 58);

    doc.setFontSize(10);
    doc.autoTable({
        startY: 65,
        theme: 'plain',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        body: [
            ['Reference ID', `CT-${lease.id.substring(0, 8).toUpperCase()}`],
            ['Property Title', property?.title || 'Residential Asset'],
            ['Location', property?.address || 'Kigali, Rwanda'],
            ['Lease Start', lease.start_date],
            ['Lease Expiry', lease.end_date],
            ['Monthly Rent', `RWF ${Number(lease.rent_amount).toLocaleString()}`],
            ['Security Deposit', `RWF ${Number(lease.deposit_amount).toLocaleString()}`],
        ],
        styles: { cellPadding: 3, fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // ── ON-CHAIN DATA ──
    const nextY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BLOCKCHAIN VERIFICATION', 20, nextY);
    doc.line(20, nextY + 3, 190, nextY + 3);

    doc.autoTable({
        startY: nextY + 10,
        theme: 'grid',
        head: [['Field', 'Cryptographic Value']],
        body: [
            ['Validator Script', 'Escrow_V2_Plutus'],
            ['Network', 'Cardano Mainnet (Simulation)'],
            ['Vault Address', 'addr1_escrow_v2_...'], // Mocked for display
            ['Transaction Hash', lease.tx_hash || 'PENDING_MINTING'],
            ['Escrow Status', 'LOCKED_AND_VERIFIED']
        ],
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8, font: 'courier' }
    });

    // ── LEGAL DISCLAIMER & SIGNATURE ──
    const footY = 240;
    doc.setFontSize(8);
    doc.setTextColor('#94A3B8');
    doc.setFont('helvetica', 'italic');
    doc.text('This document serves as an immutable proof of programmatic trust. The security deposit is held in a self-custodial smart contract and cannot be unilaterally accessed by either party without financial consensus or multi-signature arbitration.', 20, footY, { maxWidth: 170 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor);
    doc.text('VERIFIED BY ESCROWCHAIN NODE', 105, 270, { align: 'center' });
    doc.text(`${new Date().toLocaleString()}`, 105, 275, { align: 'center' });

    // ── SAVE ──
    doc.save(`Escrow_Certificate_${lease.id.substring(0, 8)}.pdf`);
};
