import React, { useState, useEffect } from 'react';
import { useQuest } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { CertificateDesign } from '../components/certificate/CertificateDesign';
import { certificateService } from '../services/certificateService';
import { 
  Lock, 
  Award, 
  Download, 
  Printer, 
  Share2, 
  ExternalLink,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const CertificateView: React.FC = () => {
  const { user, session } = useAuth();
  const { 
    isQuestComplete, 
    completedCount, 
    totalXp,
    certificate, 
    generateCertificate, 
    navigateTo 
  } = useQuest();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (certificate?.verificationUrl) {
      certificateService.generateQrCodeDataUrl(certificate.verificationUrl).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [certificate?.verificationUrl]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const cert = await generateCertificate();
      if (!cert) {
        setErrorMsg('Certificate could not be generated right now. Please try again.');
      }
    } catch (e: any) {
      console.error('Certificate generation error:', e);
      setErrorMsg('Certificate could not be generated right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setErrorMsg(null);

      let cert = certificate;
      if (!cert) {
        cert = await generateCertificate();
      }

      if (!cert) {
        setErrorMsg('Certificate could not be generated right now. Please try again.');
        return;
      }

      let qrUrl = qrDataUrl;
      if (!qrUrl && cert.verificationUrl) {
        qrUrl = await certificateService.generateQrCodeDataUrl(cert.verificationUrl);
        setQrDataUrl(qrUrl);
      }

      const success = await certificateService.downloadCertificatePdf(cert, qrUrl, session?.access_token);
      if (!success) {
        setErrorMsg('Failed to generate PDF. Please try again.');
      }
    } catch (e: any) {
      console.error('Download error:', e);
      setErrorMsg('Certificate could not be generated right now. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (certificate?.verificationUrl) {
      navigator.clipboard.writeText(certificate.verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ========================================================
  // STATE 1: BEFORE COMPLETION (LOCKED)
  // ========================================================
  if (!isQuestComplete || completedCount < 22) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-16">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Certificate
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Earn your accredited credential upon solving all 22 dynamic programming challenges.
          </p>
        </div>

        <NeumorphicCard variant="raised" className="p-10 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl neu-inset mx-auto flex items-center justify-center text-gray-400">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Certificate Locked
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              Complete all 22 problems to unlock your certificate.
            </p>
          </div>

          {/* Current actual progress display */}
          <div className="p-4 rounded-2xl neu-inset max-w-xs mx-auto text-center space-y-1">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Current Progress
            </div>
            <div className="text-2xl font-mono font-bold text-gray-800">
              {completedCount} <span className="text-sm font-sans text-gray-400">/ 22 Completed</span>
            </div>
            <div className="text-xs text-gray-500">
              {22 - completedCount} problem{22 - completedCount === 1 ? '' : 's'} remaining ({totalXp} / 220 XP)
            </div>
          </div>

          {/* Do NOT show download button before completion */}
          <div className="pt-2">
            <NeumorphicButton
              variant="primary"
              size="md"
              onClick={() => navigateTo('problems')}
            >
              Continue Solving Problems
            </NeumorphicButton>
          </div>
        </NeumorphicCard>
      </div>
    );
  }

  // ========================================================
  // STATE 2: 22/22 COMPLETED BUT NOT YET GENERATED
  // ========================================================
  if (!certificate) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-16">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Certificate
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Congratulations on finishing all 22 problems!
          </p>
        </div>

        <NeumorphicCard variant="raised" className="p-10 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl neu-inset mx-auto flex items-center justify-center text-emerald-600">
            <Award className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Certificate Unlocked ✓
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              22 / 22 Problems · 220 XP Earned
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Your Dynamic Programming mastery is complete and verified. Click below to generate your official certificate with a cryptographically verifiable ID and QR code.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <NeumorphicButton
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              icon={isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
            >
              {isGenerating ? 'Generating Certificate...' : 'Generate Certificate'}
            </NeumorphicButton>
          </div>
        </NeumorphicCard>
      </div>
    );
  }

  // ========================================================
  // STATE 3: CERTIFICATE UNLOCKED & PREVIEW AVAILABLE
  // ========================================================
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* Top action bar - hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Certificate of Completion
            </h1>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Unlocked
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified credential for {certificate.userName} · 22 / 22 Completed (220 XP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <NeumorphicButton
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied Link!' : 'Share'}
          </NeumorphicButton>

          <NeumorphicButton
            size="sm"
            variant="secondary"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print
          </NeumorphicButton>

          <NeumorphicButton
            size="sm"
            variant="primary"
            onClick={handleDownload}
            disabled={isDownloading}
            icon={isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          >
            {isDownloading ? 'Generating PDF...' : 'Download Certificate'}
          </NeumorphicButton>
        </div>
      </div>

      {/* Dynamic Certificate rendered with real template design */}
      <div className="w-full">
        <CertificateDesign certificate={certificate} />
      </div>

      {/* Verification details info card */}
      <NeumorphicCard variant="raised-sm" className="p-5 sm:p-6 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-gray-800 block">Public Verification Registry</span>
            <span className="text-gray-500 block font-mono text-[11px]">
              {certificate.verificationUrl}
            </span>
          </div>

          <a
            href={certificate.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-black underline shrink-0"
          >
            <span>Open Public Verification Page</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </NeumorphicCard>
    </div>
  );
};
