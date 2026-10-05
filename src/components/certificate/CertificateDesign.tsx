import React, { useEffect, useState } from 'react';
import { Certificate } from '../../types';
import { certificateService } from '../../services/certificateService';

interface CertificateDesignProps {
  certificate: Certificate;
  className?: string;
}

export const CertificateDesign: React.FC<CertificateDesignProps> = ({
  certificate,
  className = ''
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (certificate.verificationUrl) {
      certificateService.generateQrCodeDataUrl(certificate.verificationUrl).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [certificate.verificationUrl]);

  return (
    <div
      id="certificate-print-canvas"
      className={`relative w-full aspect-[16/9] bg-white text-[#0F1D32] select-none overflow-hidden rounded-2xl shadow-xl border border-gray-200/80 font-serif ${className}`}
      style={{ minHeight: '380px' }}
    >
      {/* ========================================================
          1. SUBTLE FAINT MATH & PROGRAMMING VECTOR WATERMARKS
          (Exactly as seen in the reference template)
      ======================================================== */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] text-[#0F1D32]"
        viewBox="0 0 1600 900"
        fill="currentColor"
      >
        {/* Function symbol f (top-left) */}
        <text x="430" y="130" fontSize="58" fontFamily="serif" fontStyle="italic">f</text>

        {/* Angle bracket < (top-right) */}
        <text x="1150" y="115" fontSize="48" fontFamily="monospace">&lt;</text>

        {/* Square root of n (mid-left) */}
        <text x="250" y="270" fontSize="54" fontFamily="serif">√n</text>

        {/* Summation Sigma (mid-left lower) */}
        <text x="190" y="460" fontSize="62" fontFamily="serif">∑</text>

        {/* Directed Acyclic Graph / Coordinate Graph (bottom-left) */}
        <g transform="translate(200, 500)" stroke="currentColor" strokeWidth="2.5" fill="none">
          <line x1="80" y1="120" x2="80" y2="20" markerEnd="url(#arrow)" />
          <line x1="80" y1="120" x2="190" y2="120" />
          <line x1="80" y1="120" x2="150" y2="60" />
          <line x1="80" y1="120" x2="30" y2="160" />
          <circle cx="80" cy="120" r="4" fill="currentColor" />
          <circle cx="150" cy="60" r="4" fill="currentColor" />
          <circle cx="190" cy="120" r="4" fill="currentColor" />
        </g>

        {/* Recursion Decision Tree with labeled nodes (mid-right) */}
        <g transform="translate(1200, 320)" stroke="currentColor" strokeWidth="2" fill="none" textAnchor="middle" fontSize="18" fontFamily="sans-serif">
          {/* Level 0 */}
          <circle cx="150" cy="50" r="24" />
          <text x="150" y="56" fill="currentColor" stroke="none">d0</text>

          {/* Level 1 branches */}
          <line x1="130" y1="70" x2="80" y2="130" />
          <line x1="170" y1="70" x2="220" y2="130" />

          {/* Level 1 nodes */}
          <circle cx="80" cy="140" r="20" />
          <text x="80" y="146" fill="currentColor" stroke="none">a1</text>
          <circle cx="220" cy="140" r="20" />
          <text x="220" y="146" fill="currentColor" stroke="none">b8</text>

          {/* Level 2 branches */}
          <line x1="68" y1="158" x2="35" y2="210" />
          <line x1="92" y1="158" x2="120" y2="210" />
          <line x1="208" y1="158" x2="180" y2="210" />
          <line x1="232" y1="158" x2="265" y2="210" />

          {/* Level 2 nodes */}
          <circle cx="35" cy="220" r="18" />
          <text x="35" y="225" fill="currentColor" stroke="none" fontSize="14">a2</text>
          <circle cx="120" cy="220" r="18" />
          <text x="120" y="225" fill="currentColor" stroke="none" fontSize="14">b4</text>
          <circle cx="180" cy="220" r="18" />
          <text x="180" y="225" fill="currentColor" stroke="none" fontSize="14">co</text>
          <circle cx="265" cy="220" r="18" />
          <text x="265" y="225" fill="currentColor" stroke="none" fontSize="14">dd</text>

          {/* Level 3 leaves */}
          <circle cx="15" cy="285" r="16" />
          <text x="15" y="290" fill="currentColor" stroke="none" fontSize="12">ii.</text>
          <line x1="25" y1="235" x2="15" y2="270" />
          <circle cx="60" cy="285" r="12" />
          <line x1="45" y1="235" x2="60" y2="273" />
          <circle cx="95" cy="285" r="12" />
          <line x1="110" y1="235" x2="95" y2="273" />
        </g>

        {/* Inequality >= (bottom-right) */}
        <text x="1220" y="630" fontSize="52" fontFamily="sans-serif">≥</text>

        {/* Complex notation +z (bottom-right) */}
        <text x="1350" y="615" fontSize="48" fontFamily="serif" fontStyle="italic">+z</text>
      </svg>

      {/* ========================================================
          2. NAVY + GOLD ORNAMENTAL GEOMETRIC BORDER FRAME
          (Faithfully matching the attached design reference)
      ======================================================== */}
      <div className="absolute inset-0 p-3 sm:p-5 md:p-7 pointer-events-none">
        {/* Outer Navy Border with Chamfered Slanted Corners */}
        <div className="relative w-full h-full border-4 sm:border-[5px] border-[#0F1D32]">
          {/* Inner Fine Gold Border Line */}
          <div className="absolute inset-2 sm:inset-3 border border-[#C5A869]/80">
            {/* Inner Corner Fine Diagonal Brackets */}
            <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-2 border-l-2 border-[#C5A869]" />
            <div className="absolute -top-[1px] -right-[1px] w-8 h-8 border-t-2 border-r-2 border-[#C5A869]" />
            <div className="absolute -bottom-[1px] -left-[1px] w-8 h-8 border-b-2 border-l-2 border-[#C5A869]" />
            <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-2 border-r-2 border-[#C5A869]" />
          </div>

          {/* Top-Left Geometric Gold Ornament */}
          <div className="absolute -top-1.5 -left-1.5 w-16 sm:w-28 h-16 sm:h-28 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#C5A869]">
              <polygon points="0,0 45,0 0,45" fill="#0F1D32" />
              <line x1="0" y1="45" x2="45" y2="0" stroke="currentColor" strokeWidth="3" />
              <line x1="12" y1="52" x2="52" y2="12" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="58" cy="12" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="58" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Top-Right Geometric Gold Ornament */}
          <div className="absolute -top-1.5 -right-1.5 w-16 sm:w-28 h-16 sm:h-28 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#C5A869]">
              <polygon points="100,0 55,0 100,45" fill="#0F1D32" />
              <line x1="100" y1="45" x2="55" y2="0" stroke="currentColor" strokeWidth="3" />
              <line x1="88" y1="52" x2="48" y2="12" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="42" cy="12" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="88" cy="58" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom-Left Geometric Gold Ornament */}
          <div className="absolute -bottom-1.5 -left-1.5 w-16 sm:w-28 h-16 sm:h-28 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#C5A869]">
              <polygon points="0,100 45,100 0,55" fill="#0F1D32" />
              <line x1="0" y1="55" x2="45" y2="100" stroke="currentColor" strokeWidth="3" />
              <line x1="12" y1="48" x2="52" y2="88" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="58" cy="88" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="42" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Bottom-Right Geometric Gold Ornament */}
          <div className="absolute -bottom-1.5 -right-1.5 w-16 sm:w-28 h-16 sm:h-28 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#C5A869]">
              <polygon points="100,100 55,100 100,55" fill="#0F1D32" />
              <line x1="100" y1="55" x2="55" y2="100" stroke="currentColor" strokeWidth="3" />
              <line x1="88" y1="48" x2="48" y2="88" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="42" cy="88" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="88" cy="42" r="3" fill="#0F1D32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. DYNAMIC CONTENT & TYPOGRAPHIC HIERARCHY
      ======================================================== */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-center text-center px-6 sm:px-12 md:px-20 py-6 sm:py-8 md:py-10">
        
        {/* Top: DP QUEST Monogram Logo */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5">
          {/* Stylized intertwined dp icon */}
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#0F1D32]" viewBox="0 0 36 36" fill="currentColor">
            <path d="M12 8c-3.3 0-6 2.7-6 6v10c0 3.3 2.7 6 6 6s6-2.7 6-6v-6c0-3.3-2.7-6-6-6zm0 18c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2z" />
            <path d="M24 6c-3.3 0-6 2.7-6 6v6c0 3.3 2.7 6 6 6s6-2.7 6-6V12c0-3.3-2.7-6-6-6zm2 12c0 1.1-.9 2-2 2s-2-.9-2-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6z" />
          </svg>
          <span className="text-[#0F1D32] font-sans font-extrabold text-sm sm:text-base md:text-lg tracking-[0.18em]">
            DP QUEST
          </span>
        </div>

        {/* Main Title */}
        <div className="space-y-1 sm:space-y-2 mt-1 sm:mt-2">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-[0.14em] uppercase text-[#0F1D32]">
            CERTIFICATE OF COMPLETION
          </h1>
          <p className="text-[9px] sm:text-xs md:text-sm font-sans font-semibold tracking-[0.3em] uppercase text-slate-500">
            AWARDED TO:
          </p>
        </div>

        {/* Recipient Real Name (Strictly dynamic, NO square brackets) */}
        <div className="my-1 sm:my-2">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#0F1D32] tracking-tight uppercase px-4">
            {certificate.userName.replace(/^\[|\]$/g, '')}
          </h2>
        </div>

        {/* Achievement Statement */}
        <div className="space-y-1 sm:space-y-1.5 max-w-xl mx-auto">
          <p className="text-xs sm:text-sm md:text-base font-normal text-slate-700 italic">
            Has successfully completed the
          </p>
          <p className="text-base sm:text-lg md:text-2xl font-bold text-[#0F1D32] tracking-wide">
            Dynamic Programming Quest
          </p>
        </div>

        {/* Underlined Milestone: 22 / 22 Problems & 220 XP */}
        <div className="space-y-1 sm:space-y-1.5 my-1">
          <div className="text-xs sm:text-base md:text-lg font-sans font-bold text-[#0F1D32] tracking-wide">
            22 / 22 Problems Completed
          </div>
          {/* Gold Underline Divider */}
          <div className="w-36 sm:w-56 h-[1.5px] bg-[#C5A869] mx-auto" />
          <div className="text-[11px] sm:text-sm md:text-base font-sans font-semibold text-[#0F1D32]">
            220 XP Earned
          </div>
        </div>

        {/* ========================================================
            4. BOTTOM ROW: Date | Real Dynamic QR | Certificate ID
        ======================================================== */}
        <div className="w-full flex items-end justify-between pt-2 sm:pt-4 border-t border-gray-100">
          
          {/* Bottom Left: Completion Date */}
          <div className="text-left space-y-0.5 sm:space-y-1">
            <span className="text-[9px] sm:text-xs text-slate-600 font-sans block">
              Completion Date:
            </span>
            <span className="text-xs sm:text-sm md:text-base font-sans font-bold text-[#0F1D32] block">
              {certificate.completedAt.replace(/^\[|\]$/g, '')}
            </span>
          </div>

          {/* Bottom Center: Real Dynamic QR Code with Gold Corner Brackets */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-1.5 bg-white">
              {/* Gold Corner Brackets */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#C5A869]" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#C5A869]" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#C5A869]" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#C5A869]" />

              {/* Real dynamic QR Code */}
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Verify Certificate QR Code"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain block"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-slate-100 flex items-center justify-center text-[10px] text-gray-400">
                  QR
                </div>
              )}
            </div>

            <span className="text-[7px] sm:text-[9px] md:text-[10px] font-sans font-bold tracking-[0.2em] text-[#0F1D32] uppercase mt-1">
              VERIFY CERTIFICATE
            </span>
          </div>

          {/* Bottom Right: Certificate ID */}
          <div className="text-right space-y-0.5 sm:space-y-1">
            <span className="text-[9px] sm:text-xs text-slate-600 font-sans block">
              Certificate ID:
            </span>
            <span className="text-xs sm:text-sm md:text-base font-mono font-bold text-[#0F1D32] block">
              {certificate.certificateId.replace(/^\[|\]$/g, '')}
            </span>
          </div>
        </div>

        {/* Subtle Issuer Footer */}
        <div className="text-[8px] sm:text-[10px] font-sans text-slate-400 tracking-wider">
          Issued by DP Quest · Dynamic Programming Learning Platform
        </div>
      </div>
    </div>
  );
};
