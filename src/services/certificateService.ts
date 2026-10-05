import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Certificate } from '../types';

export interface VerifyCertificateResult {
  isValid: boolean;
  certificateId?: string;
  userName?: string;
  completedAt?: string;
  totalProblems?: number;
  totalXp?: number;
  verificationUrl?: string;
  error?: string;
}

class CertificateService {
  /**
   * Request server-side certificate generation (strict 25/25 and 250 XP required)
   */
  async generateCertificate(
    userId: string,
    userName: string,
    authToken?: string
  ): Promise<{ success: boolean; certificate?: Certificate; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, userName })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          return {
            success: false,
            error: 'Server returned invalid JSON.'
          };
        }
      } else {
        return {
          success: false,
          error: 'Certificate service temporarily unavailable.'
        };
      }

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to generate certificate.'
        };
      }

      const cert = data.certificate;
      return {
        success: true,
        certificate: {
          id: cert.id || cert.certificateId,
          userId: cert.userId,
          certificateId: cert.certificateId,
          userName: cert.userName,
          completedAt: new Date(cert.completedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          totalProblems: cert.totalProblems || 25,
          totalXp: cert.totalXp || 250,
          verificationUrl: cert.verificationUrl
        }
      };
    } catch (err: any) {
      console.error('Error generating certificate:', err);
      return {
        success: false,
        error: err?.message || 'Network error generating certificate.'
      };
    }
  }

  /**
   * Public certificate verification endpoint (No auth required)
   */
  async verifyCertificatePublicly(certificateId: string): Promise<VerifyCertificateResult> {
    try {
      const response = await fetch(`/api/verify-certificate/${encodeURIComponent(certificateId)}`);
      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          return {
            isValid: false,
            error: 'Server returned invalid JSON response.'
          };
        }
      } else {
        return {
          isValid: false,
          error: 'Verification service temporarily unavailable.'
        };
      }

      if (!response.ok || !data.isValid) {
        return {
          isValid: false,
          error: data.error || 'CERTIFICATE NOT FOUND. The certificate could not be verified.'
        };
      }

      return {
        isValid: true,
        certificateId: data.certificateId,
        userName: data.userName,
        completedAt: new Date(data.completedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        totalProblems: data.totalProblems || 25,
        totalXp: data.totalXp || 250,
        verificationUrl: data.verificationUrl
      };
    } catch (err: any) {
      console.error('Public verification error:', err);
      return {
        isValid: false,
        error: 'Network error. The certificate could not be verified.'
      };
    }
  }

  /**
   * Generates a real dynamic QR code data URL pointing to the verification page
   */
  async generateQrCodeDataUrl(verificationUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0B192C',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (err) {
      console.error('QR code generation failed:', err);
      return '';
    }
  }

  /**
   * Records certificate download and persists student details in the backend
   */
  async recordCertificateDownload(
    certificate: Certificate,
    authToken?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/record-certificate-download', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          certificateId: certificate.certificateId,
          userId: certificate.userId,
          userName: certificate.userName,
          completedAt: certificate.completedAt,
          totalProblems: certificate.totalProblems || 25,
          totalXp: certificate.totalXp || 250,
          verificationUrl: certificate.verificationUrl,
          downloadedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message };
      }
      return { success: false };
    } catch (e) {
      console.warn('Backend download recording notice:', e);
      return { success: false };
    }
  }

  /**
   * Generates and downloads a real, crisp PDF in landscape orientation matching the template design
   */
  async downloadCertificatePdf(
    certificate: Certificate,
    qrDataUrl: string,
    authToken?: string
  ): Promise<boolean> {
    try {
      // Landscape A4: 297mm x 210mm
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = 297;
      const height = 210;

      // 1. Background White
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');

      // 2. Outer Navy Frame (6mm inset)
      const outerInset = 6;
      doc.setDrawColor(15, 29, 50); // Navy #0F1D32
      doc.setLineWidth(2.5);
      doc.rect(outerInset, outerInset, width - outerInset * 2, height - outerInset * 2, 'S');

      // 3. Inner Gold Border (12mm inset)
      const innerInset = 12;
      doc.setDrawColor(197, 168, 105); // Gold #C5A869
      doc.setLineWidth(0.8);
      doc.rect(innerInset, innerInset, width - innerInset * 2, height - innerInset * 2, 'S');

      // 4. Corner Geometric Technical Accents (Gold)
      const cornerSize = 18;
      doc.setDrawColor(197, 168, 105);
      doc.setLineWidth(0.5);

      // Top-Left corner
      doc.line(innerInset, innerInset + cornerSize, innerInset + cornerSize, innerInset);
      // Top-Right corner
      doc.line(width - innerInset - cornerSize, innerInset, width - innerInset, innerInset + cornerSize);
      // Bottom-Left corner
      doc.line(innerInset, height - innerInset - cornerSize, innerInset + cornerSize, height - innerInset);
      // Bottom-Right corner
      doc.line(width - innerInset - cornerSize, height - innerInset, width - innerInset, height - innerInset - cornerSize);

      // Corner Nodes (Filled circles)
      doc.setFillColor(15, 29, 50);
      doc.circle(innerInset + 2, innerInset + 2, 1, 'F');
      doc.circle(width - innerInset - 2, innerInset + 2, 1, 'F');
      doc.circle(innerInset + 2, height - innerInset - 2, 1, 'F');
      doc.circle(width - innerInset - 2, height - innerInset - 2, 1, 'F');

      // 5. Header Branding: DP QUEST
      doc.setTextColor(15, 29, 50); // Navy
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('dp  DP QUEST', width / 2, 32, { align: 'center' });

      // 6. Title: CERTIFICATE OF COMPLETION
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.text('CERTIFICATE OF COMPLETION', width / 2, 47, { align: 'center' });

      // 7. Subheading: AWARDED TO:
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate
      doc.text('AWARDED TO:', width / 2, 60, { align: 'center' });

      // 8. Recipient Name: DYNAMIC (NO BRACKETS!)
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(15, 29, 50);
      doc.text(certificate.userName.toUpperCase(), width / 2, 75, { align: 'center' });

      // 9. Achievement Description
      doc.setFont('times', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text('Has successfully completed the', width / 2, 88, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 29, 50);
      doc.text('Dynamic Programming Quest', width / 2, 98, { align: 'center' });

      // 10. Milestone Underline Box: 25 / 25 Problems Completed & 250 XP
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 29, 50);
      doc.text('25 / 25 Problems Completed', width / 2, 112, { align: 'center' });

      // Gold divider line under milestone
      doc.setDrawColor(197, 168, 105);
      doc.setLineWidth(0.6);
      doc.line(width / 2 - 35, 116, width / 2 + 35, 116);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('250 XP Earned', width / 2, 124, { align: 'center' });

      // 11. Bottom Left: Completion Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text('Completion Date:', 30, 165);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 29, 50);
      doc.text(certificate.completedAt, 30, 173);

      // 12. Bottom Right: Certificate ID
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text('Certificate ID:', width - 30, 165, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 29, 50);
      doc.text(certificate.certificateId, width - 30, 173, { align: 'right' });

      // 13. Bottom Center: Real Dynamic QR Code with Gold Corner Brackets
      if (qrDataUrl) {
        const qrSize = 24;
        const qrX = width / 2 - qrSize / 2;
        const qrY = 152;

        // Draw QR Image
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Gold Corner Brackets around QR
        doc.setDrawColor(197, 168, 105);
        doc.setLineWidth(0.6);
        const bracketLen = 3;
        // Top-Left bracket
        doc.line(qrX - 2, qrY - 2, qrX - 2 + bracketLen, qrY - 2);
        doc.line(qrX - 2, qrY - 2, qrX - 2, qrY - 2 + bracketLen);
        // Top-Right bracket
        doc.line(qrX + qrSize + 2, qrY - 2, qrX + qrSize + 2 - bracketLen, qrY - 2);
        doc.line(qrX + qrSize + 2, qrY - 2, qrX + qrSize + 2, qrY - 2 + bracketLen);
        // Bottom-Left bracket
        doc.line(qrX - 2, qrY + qrSize + 2, qrX - 2 + bracketLen, qrY + qrSize + 2);
        doc.line(qrX - 2, qrY + qrSize + 2, qrX - 2, qrY + qrSize + 2 - bracketLen);
        // Bottom-Right bracket
        doc.line(qrX + qrSize + 2, qrY + qrSize + 2, qrX + qrSize + 2 - bracketLen, qrY + qrSize + 2);
        doc.line(qrX + qrSize + 2, qrY + qrSize + 2, qrX + qrSize + 2, qrY + qrSize + 2 - bracketLen);

        // Verify Certificate Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 29, 50);
        doc.text('VERIFY CERTIFICATE', width / 2, qrY + qrSize + 7, { align: 'center' });
      }

      // 14. Issuer Subtle Footnote
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('Issued by DP Quest · Dynamic Programming Learning Platform', width / 2, 196, { align: 'center' });

      // Persist student download details and certificate ID in backend
      const recordResult = await this.recordCertificateDownload(certificate, authToken);
      if (!recordResult.success) {
        console.error('Backend download recording failed:', recordResult);
        throw new Error('Certificate download details could not be saved to backend.');
      }

      // Save PDF
      doc.save(`DP-Quest-Certificate-${certificate.certificateId}.pdf`);
      return true;
    } catch (err) {
      console.error('PDF download error:', err);
      return false;
    }
  }
}

export const certificateService = new CertificateService();
