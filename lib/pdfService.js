import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/pdf');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate PDF for Fee Payment
 * @param {Object} paymentData - Payment details
 * @returns {Promise<string>} - Path to generated PDF
 */
export const generatePaymentPDF = async (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const fileName = `payment-${paymentData.referenceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // ===== PROFESSIONAL HEADER =====
      // Top decorative bar
      doc.rect(40, 40, 515, 3).fill('#2E7D32');
      
      // Main title
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1B5E20').text('FEE PAYMENT RECEIPT', {
        align: 'center',
      });

      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#555555').text('School Fee Management System', {
        align: 'center',
      });
      
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#888888').text('Official Payment Receipt - Valid Document', {
        align: 'center',
      });

      // Decorative divider line
      doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // Receipt Details Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('RECEIPT DETAILS');
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(0.3);

      // Create a light background for receipt details
      const detailsBoxY = doc.y;
      doc.rect(40, detailsBoxY, 515, 80).fillColor('#F1F8F1').fill();
      
      const detailsX = 50;
      const detailsY = detailsBoxY + 8;
      const rightColX = detailsX + 260;

      // Get statement for later use
      const statement = paymentData.studentFeeStatement;

      // Left column with proper spacing
      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.text(`Receipt #:`, detailsX, detailsY);
      doc.fontSize(10).font('Helvetica').text(`Date:`, detailsX, detailsY + 15);
      doc.fontSize(10).font('Helvetica').text(`Status:`, detailsX, detailsY + 30);
      
      // Left column values
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${paymentData.referenceNumber}`, detailsX + 65, detailsY);
      doc.text(`${new Date(paymentData.paymentDate).toLocaleDateString()}`, detailsX + 65, detailsY + 15);
      
      // Status badge with color
      const statusColor = paymentData.status === 'completed' ? '#27ae60' : '#e74c3c';
      const statusLabel = paymentData.status.toUpperCase();
      doc.fillColor(statusColor).text(` ${statusLabel}`, detailsX + 65, detailsY + 30);
      
      // Right column labels and values
      doc.fillColor('black').font('Helvetica').fontSize(10);
      doc.text(`Payment Method:`, rightColX, detailsY);
      doc.text(`Amount Paid:`, rightColX, detailsY + 15);

      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${paymentData.paymentMethod}`, rightColX + 85, detailsY);
      
      doc.fillColor('#27ae60').font('Helvetica-Bold').fontSize(11);
      doc.text(`KES ${paymentData.amount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`, rightColX + 85, detailsY + 15);

      // Outstanding balance in larger, bold text with prominent color - below Amount Paid
      doc.fillColor('#27ae60').font('Helvetica-Bold').fontSize(12);
      doc.text(`Balance:`, rightColX, detailsY + 30);
      doc.text(`KES ${statement.balanceAmount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`, rightColX + 85, detailsY + 30);
      
      doc.fillColor('black');

      doc.moveDown(3.5);

     

      // Student Information Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('STUDENT INFORMATION', { align: 'left' });
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(0.3);

      const studentBoxY = doc.y;
      doc.rect(40, studentBoxY, 515, 70).fillColor('#F1F8F1').fill();
      
      const studentX = 50;
      const studentY = studentBoxY + 8;

      // Labels
      doc.fillColor('black').font('Helvetica').fontSize(10);
      doc.text(`Full Name:`, studentX, studentY);
      doc.text(`Admission #:`, studentX, studentY + 15);
      doc.text(`Class:`, studentX, studentY + 30);
      
      // Values
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${paymentData.student.fullName}`, studentX + 85, studentY);
      doc.text(`${paymentData.student.admissionNumber}`, studentX + 85, studentY + 15);
      doc.text(`${paymentData.student.class.className}`, studentX + 85, studentY + 30);

      doc.moveDown(2.5);

      // Fee Statement Information Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('ACADEMIC TERM & FEE DETAILS');
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(0.3);

      const termBoxY = doc.y;
      doc.rect(40, termBoxY, 515, 75).fillColor('#F1F8F1').fill();
      
      const termX = 50;
      const termY = termBoxY + 8;
      
      // Labels
      doc.fillColor('black').font('Helvetica').fontSize(10);
      doc.text(`Academic Year:`, termX, termY);
      doc.text(`Term:`, termX, termY + 15);
      doc.text(`Due Date:`, termX, termY + 30);
      
      // Values
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${statement.academicYear}`, termX + 85, termY);
      doc.text(`${statement.term}`, termX + 85, termY + 15);
      doc.text(`${new Date(statement.dueDate).toLocaleDateString()}`, termX + 85, termY + 30);

      doc.moveDown(2.5);

      // Fee Breakdown Table
    //   doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('PAYMENT ALLOCATION');
    //   doc.fillColor('black');
    //   doc.moveDown(0.3);

    //   const tableTop = doc.y;
    //   const col1 = 50;
    //   const col2 = 300;
    //   const col3 = 450;

    //   // Table header background
    //   doc.rect(40, tableTop, 515, 22).fillColor('#2E7D32').fill();
      
    //   // Table header with proper spacing
    //   doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
    //   doc.text('Description', col1, tableTop + 6);
    //   doc.text('Amount (KES)', col3, tableTop + 6, { align: 'right' });

    //   doc.fillColor('black').moveDown(0.6);

    //   // Table content background
    //   const contentY = doc.y;
    //   doc.rect(40, contentY, 515, 22).fillColor('#F9F9F9').fill();
    //   doc.fillColor('black').fontSize(10).font('Helvetica');
    //   doc.text('Payment Received', col1, contentY + 6);
    //   doc.text(
    //     paymentData.amount.toLocaleString('en-KE', {
    //       minimumFractionDigits: 2,
    //       maximumFractionDigits: 2,
    //     }),
    //     col3,
    //     contentY + 6,
    //     { align: 'right' }
    //   );

    //   doc.moveDown(0.8);

      // Statement Summary
    //   doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke('#CCCCCC');
    //   doc.moveDown(0.7);

    //   // Create a prominent summary box
    //   const summaryBoxY = doc.y;
    //   doc.rect(40, summaryBoxY, 515, 65).stroke('#2E7D32').lineWidth(2);
    //   doc.rect(42, summaryBoxY + 2, 511, 61).fillColor('#F1F8F1').fill();

    //   // Summary box content with proper spacing
    //   doc.fillColor('black').fontSize(10).font('Helvetica');
    //   doc.text(`Total Payable:`, 50, summaryBoxY + 10);
    //   doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(11).text(`KES ${statement.totalPayable.toLocaleString('en-KE', {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   })}`, 350, summaryBoxY + 10, { align: 'right' });

    //   doc.fillColor('black').font('Helvetica').fontSize(10);
    //   doc.moveDown(0.4);
    //   doc.text(`Amount Paid:`, 50, doc.y, { continued: false });
    //   doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(11).text(`KES ${statement.amountPaid.toLocaleString('en-KE', {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   })}`, 350, doc.y, { align: 'right' });

    //   // Outstanding balance in larger, bold text with prominent color
    //   doc.moveDown(0.5);
    //   doc.fillColor('#27ae60').font('Helvetica-Bold').fontSize(12);
    //   doc.text(`Balance:`, 50, doc.y, { continued: false });
    //   doc.text(`KES ${statement.balanceAmount.toLocaleString('en-KE', {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   })}`, 350, doc.y, { align: 'right' });
      
    //   doc.fillColor('black');

    //   doc.moveDown(2.5);

      // Created by information
    //   if (paymentData.createdBy) {
    //     doc.fontSize(9).font('Helvetica').text(
    //       `Processed by: ${paymentData.createdBy.fullName} (${paymentData.createdBy.email})`
    //     );
    //   }

    //   doc.moveDown(1.5);

      // ===== SIGNATURE AND STAMP AREA =====
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.8);

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('AUTHORIZATION & VERIFICATION');
      doc.fillColor('black');
      doc.fontSize(9).font('Helvetica').text('(For School Use Only)');
      doc.moveDown(1);

      // Create three columns for signature, stamp, and authorized by
      const signY = doc.y;
      const colWidth = 170;
      const col1X = 50;
      const col2X = 210;
      const col3X = 370;

      // Cashier Signature - Left column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('', col1X);
      doc.fontSize(8).font('Helvetica').fillColor('black').moveDown(0.3);
      doc.moveTo(col1X, doc.y).lineTo(col1X + colWidth, doc.y).stroke('#2E7D32').lineWidth(1.5);
      doc.moveDown(0.3);
      doc.fontSize(7).fillColor('#666666').text('Signature', col1X + 20);
      doc.moveDown(0.5);
      doc.text('Date: _______________', col1X);

      // Authorized by - Middle column
    //   doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('Authorized by:', col2X, signY);
    //   doc.fontSize(8).font('Helvetica').fillColor('black').moveDown(0.3);
    //   doc.moveTo(col2X, doc.y).lineTo(col2X + colWidth, doc.y).stroke('#2E7D32').lineWidth(1.5);
    //   doc.moveDown(0.3);
    //   doc.fontSize(7).fillColor('#666666').text('Signature', col2X + 20);
    //   doc.moveDown(0.5);
    //   doc.text('Date: _______________', col2X);

      // School Stamp/Seal Area - Right column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('School Stamp/Seal', col3X, signY);
      doc.fillColor('black');
      doc.rect(col3X, signY + 25, 140, 40).stroke('#2E7D32').lineWidth(1.5);
      doc.rect(col3X + 2, signY + 27, 136, 36).fillColor('#F5F5F5').fill();
      doc.fontSize(8).fillColor('#999999').font('Helvetica').text('Stamp Here', col3X + 10, signY + 43, { width: 120, align: 'center' });
      doc.fillColor('black');

      // Created by information
      if (paymentData.createdBy) {
        doc.moveDown(2.5);
        doc.fontSize(9).font('Helvetica').text(
          `Processed by: ${paymentData.createdBy.fullName} (${paymentData.createdBy.email})`
        );
      }

      doc.moveDown(1.5);

      // Notes section
      if (paymentData.notes) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1B5E20').text('NOTES:');
        doc.fillColor('black').fontSize(9).font('Helvetica').text(paymentData.notes);
      }

      doc.moveDown(1.5);

      // ===== PROFESSIONAL FOOTER =====
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#2E7D32').lineWidth(2);
      doc.moveDown(0.8);
      
      doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
        'This is a system-generated receipt. Please keep it for your records.',
        {
          align: 'center',
        }
      );

      doc.moveDown(0.2);
      doc.fontSize(8).fillColor('#666666').text(
        `Generated: ${new Date().toLocaleString()}`,
        {
          align: 'center',
        }
      );

      doc.moveDown(0.4);
      doc.fontSize(7).fillColor('#999999').text(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        {
          align: 'center',
        }
      );

      doc.moveDown(0.2);
      doc.fontSize(7).fillColor('#1B5E20').font('Helvetica-Bold').text(
        'School Fee Management System | v1.0',
        {
          align: 'center',
        }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF for Fee Statement
 * @param {Object} statementData - Statement details
 * @returns {Promise<string>} - Path to generated PDF
 */
export const generateStatementPDF = async (statementData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const fileName = `statement-${statementData.studentId}-${statementData.academicYear}-${statementData.term}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // ===== PROFESSIONAL HEADER =====
      // Top decorative bar
      doc.rect(40, 40, 515, 3).fill('#2E7D32');
      
      // Main title
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1B5E20').text('FEE STATEMENT', {
        align: 'center',
      });

      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#555555').text('School Fee Management System', {
        align: 'center',
      });
      
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#888888').text('Official Fee Statement - Valid Document', {
        align: 'center',
      });

      // Decorative divider line
      doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // Student Information Section with background box
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('STUDENT INFORMATION');
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(0.3);

      const studentBoxY = doc.y;
      doc.rect(40, studentBoxY, 515, 70).fillColor('#F1F8F1').fill();
      
      const studentX = 50;
      const studentY = studentBoxY + 8;

      // Labels
      doc.fillColor('black').font('Helvetica').fontSize(10);
      doc.text(`Full Name:`, studentX, studentY);
      doc.text(`Admission #:`, studentX, studentY + 15);
      doc.text(`Class:`, studentX, studentY + 30);
      doc.text(`Status:`, studentX, studentY + 45);
      
      // Values
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${statementData.student.fullName}`, studentX + 85, studentY);
      doc.text(`${statementData.student.admissionNumber}`, studentX + 85, studentY + 15);
      doc.text(`${statementData.studentClassName}`, studentX + 85, studentY + 30);
      doc.text(`${statementData.student.status}`, studentX + 85, studentY + 45);

      doc.moveDown(2.5);

      // Academic Term Information
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('ACADEMIC TERM & PERIOD');
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(0.3);

      const termBoxY = doc.y;
      doc.rect(40, termBoxY, 515, 75).fillColor('#F1F8F1').fill();
      
      const termX = 50;
      const termY = termBoxY + 8;

      // Labels
      doc.fillColor('black').font('Helvetica').fontSize(10);
      doc.text(`Academic Year:`, termX, termY);
      doc.text(`Term:`, termX, termY + 15);
      doc.text(`Period:`, termX, termY + 30);
      doc.text(`Due Date:`, termX, termY + 45);
      
      // Values
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10);
      doc.text(`${statementData.academicYear}`, termX + 85, termY);
      doc.text(`${statementData.term}`, termX + 85, termY + 15);
      doc.text(
        `${new Date(statementData.termStartDate).toLocaleDateString()} - ${new Date(
          statementData.termEndDate
        ).toLocaleDateString()}`,
        termX + 85,
        termY + 30
      );
      doc.text(`${new Date(statementData.dueDate).toLocaleDateString()}`, termX + 85, termY + 45);

      doc.moveDown(2.5);

      // Fee Breakdown Table with professional styling
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('FEE BREAKDOWN');
      doc.fillColor('black');
      doc.moveDown(0.4);

      const tableTop = doc.y;
      const col1 = 50;
      const col3 = 450;

      // Table header background
      doc.rect(40, tableTop, 515, 22).fillColor('#2E7D32').fill();
      
      // Table header with proper spacing
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.text('Description', col1, tableTop + 6);
      doc.text('Amount (KES)', col3, tableTop + 6, { align: 'right' });

      doc.fillColor('black').moveDown(0.6);

      const contentY = doc.y;

      // Previous Balance Row
      doc.rect(40, contentY, 515, 22).fillColor('#F9F9F9').fill();
      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.text('Previous Balance', col1, contentY + 6);
      doc.text(
        statementData.previousBalance.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        col3,
        contentY + 6,
        { align: 'right' }
      );

      doc.moveDown(0.8);

      // Current Term Fee Row
      const row2Y = doc.y;
      doc.rect(40, row2Y, 515, 22).fillColor('#FFFFFF').fill();
      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.text('Current Term Fee', col1, row2Y + 6);
      doc.text(
        statementData.currentTermFee.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        col3,
        row2Y + 6,
        { align: 'right' }
      );

      doc.moveDown(0.8);

      // Total Payable Row - Highlighted
      const totalRowY = doc.y;
      doc.rect(40, totalRowY, 515, 22).fillColor('#2E7D32').fill();
      doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
      doc.text('Total Payable', col1, totalRowY + 6);
      doc.text(
        statementData.totalPayable.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        col3,
        totalRowY + 6,
        { align: 'right' }
      );

      doc.moveDown(0.8);

      // Amount Paid Row
      const paidRowY = doc.y;
      doc.rect(40, paidRowY, 515, 22).fillColor('#F9F9F9').fill();
      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.text('Amount Paid', col1, paidRowY + 6);
      doc.text(
        statementData.amountPaid.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        col3,
        paidRowY + 6,
        { align: 'right' }
      );

      doc.moveDown(0.8);

      // Payment History for This Term - Enhanced Table Format
      if (statementData.feePayments && statementData.feePayments.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('PAYMENT HISTORY - THIS TERM');
        doc.fillColor('black');
        doc.moveDown(0.3);

        const historyTableTop = doc.y;
        const histCol1 = 50;
        const histCol2 = 200;
        const histCol3 = 350;
        const histCol4 = 450;

        // History table header
        doc.rect(40, historyTableTop, 515, 20).fillColor('#2E7D32').fill();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
        doc.text('Date', histCol1, historyTableTop + 5);
        doc.text('Reference', histCol2, historyTableTop + 5);
        doc.text('Amount (KES)', histCol3, historyTableTop + 5);
        doc.text('Status', histCol4, historyTableTop + 5);

        doc.fillColor('black').moveDown(0.5);

        // History table rows
        let rowY = doc.y;
        statementData.feePayments.forEach((payment, index) => {
          const isAlternate = index % 2 === 0;
          const rowColor = isAlternate ? '#F9F9F9' : '#FFFFFF';
          
          doc.rect(40, rowY, 515, 18).fillColor(rowColor).fill();
          doc.fillColor('black').fontSize(9).font('Helvetica');
          
          doc.text(
            new Date(payment.paymentDate).toLocaleDateString(),
            histCol1,
            rowY + 5
          );
          doc.text(
            payment.referenceNumber,
            histCol2,
            rowY + 5
          );
          doc.text(
            payment.amount.toLocaleString('en-KE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            histCol3,
            rowY + 5
          );
          
          const statusBgColor = payment.status === 'completed' ? '#d4edda' : '#fff3cd';
          const statusTextColor = payment.status === 'completed' ? '#155724' : '#856404';
          doc.rect(histCol4 - 5, rowY + 2, 50, 14).fillColor(statusBgColor).fill();
          doc.fillColor(statusTextColor).fontSize(8).font('Helvetica-Bold');
          doc.text(payment.status.toUpperCase(), histCol4 - 3, rowY + 5);
          
          rowY += 18;
        });

        doc.moveDown(0.5);
      }

      // Outstanding Balance Summary
      doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.7);

      // Create a prominent summary box for outstanding balance
      const outstandingBoxY = doc.y;
      doc.rect(40, outstandingBoxY, 515, 55).stroke('#2E7D32').lineWidth(2);
      doc.rect(42, outstandingBoxY + 2, 511, 51).fillColor('#F1F8F1').fill();

      doc.fillColor('#27ae60').fontSize(12).font('Helvetica-Bold');
      doc.text('OUTSTANDING BALANCE', 50, outstandingBoxY + 10);
      
      doc.fontSize(14).fillColor('#27ae60').font('Helvetica-Bold');
      doc.text(
        `KES ${statementData.balanceAmount.toLocaleString('en-KE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        50,
        outstandingBoxY + 28,
        { align: 'center', width: 495 }
      );

      doc.moveDown(2);

      // Status Section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('STATUS');
      doc.fillColor('black');
      doc.fontSize(10).font('Helvetica');

      const statusColor = statementData.status === 'completed' ? '#27ae60' : '#e74c3c';
      doc.fontSize(12).fillColor(statusColor).font('Helvetica-Bold').text(
        statementData.status.toUpperCase()
      );

      doc.fillColor('black').moveDown(1);

      // Payment History Section
      if (statementData.feePayments && statementData.feePayments.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('PAYMENT HISTORY');
        doc.fillColor('black');
        doc.fontSize(9).font('Helvetica');
        doc.moveDown(0.3);

        statementData.feePayments.forEach((payment, index) => {
          doc.text(
            `${index + 1}. Ref: ${payment.referenceNumber} - KES ${payment.amount.toLocaleString(
              'en-KE',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )} (${new Date(payment.paymentDate).toLocaleDateString()}) - ${payment.status}`
          );
          doc.moveDown(0.2);
        });

        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      // ===== SIGNATURE AND STAMP AREA =====
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.8);

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1B5E20').text('AUTHORIZATION & VERIFICATION');
      doc.fillColor('black');
      doc.fontSize(9).font('Helvetica').text('(For School Use Only)');
      doc.moveDown(1);

      // Create three columns for signature, stamp, and authorized by
      const signY = doc.y;
      const colWidth = 170;
      const col1X = 50;
      const col2X = 210;
      const col3X = 370;

      // Cashier Signature - Left column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('Cashier Signature', col1X);
      doc.fontSize(8).font('Helvetica').fillColor('black').moveDown(0.3);
      doc.moveTo(col1X, doc.y).lineTo(col1X + colWidth, doc.y).stroke('#2E7D32').lineWidth(1.5);
      doc.moveDown(0.3);
      doc.fontSize(7).fillColor('#666666').text('Signature', col1X + 20);
      doc.moveDown(0.3);
      doc.text('Date: _______________', col1X);

      // School Stamp/Seal Area - Middle column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('School Stamp/Seal', col2X, signY);
      doc.fillColor('black');
      doc.rect(col2X, signY + 25, 140, 40).stroke('#2E7D32').lineWidth(1.5);
      doc.rect(col2X + 2, signY + 27, 136, 36).fillColor('#F5F5F5').fill();
      doc.fontSize(8).fillColor('#999999').font('Helvetica').text('Stamp Here', col2X + 10, signY + 43, { width: 120, align: 'center' });
      doc.fillColor('black');

      // Authorized by - Right column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#2E7D32').text('Authorized by:', col3X, signY);
      doc.fontSize(8).font('Helvetica').fillColor('black').moveDown(0.3);
      doc.moveTo(col3X, doc.y).lineTo(col3X + colWidth, doc.y).stroke('#2E7D32').lineWidth(1.5);
      doc.moveDown(0.3);
      doc.fontSize(7).fillColor('#666666').text('Signature', col3X + 20);
      doc.moveDown(0.3);
      doc.text('Date: _______________', col3X);

      doc.moveDown(3);

      // ===== PROFESSIONAL FOOTER =====
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#2E7D32').lineWidth(2);
      doc.moveDown(0.8);
      
      doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
        'This is a system-generated statement. Please contact the school office for any discrepancies.',
        {
          align: 'center',
        }
      );

      doc.fontSize(8).fillColor('#666666').text(
        `Generated: ${new Date().toLocaleString()}`,
        {
          align: 'center',
        }
      );

      doc.moveDown(0.3);
      doc.fontSize(7).fillColor('#999999').text(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        {
          align: 'center',
        }
      );

      doc.fontSize(7).fillColor('#1B5E20').font('Helvetica-Bold').text(
        'School Fee Management System | v1.0',
        {
          align: 'center',
        }
      );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Delete PDF file
 * @param {string} filePath - Path to PDF file
 */
export const deletePDF = async (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
