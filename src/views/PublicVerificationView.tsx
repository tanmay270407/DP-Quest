import React, { useEffect, useState } from 'react';
import { certificateService, VerifyCertificateResult } from '../services/certificateService';
import { NeumorphicCard } from '../components/common/NeumorphicCard';
import { NeumorphicButton } from '../components/common/NeumorphicButton';
import { CheckCircle2, XCircle, ShieldCheck, ArrowLeft, Loader2, Award, ExternalLink } from 'lucide-react';

interface PublicVerificationViewProps {
  certificateId: string;
  onGoHome?: () => void;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  certificateId,
  onGoHome
}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyCertificateResult | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    certificateService.verifyCertificatePublicly(certificateId).then((res) => {
      if (mounted) {
        setResult(res);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen neu-bg flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <p className="text-xs font-semibold text-gray-500 font-mono tracking-wider">
          Verifying Certificate Record...
        </p>
      </div>
    );
  }

  // Invalid Certificate
  if (!result || !result.isValid) {
    return (
      <div className="min-h-screen neu-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-slate-300">
        <NeumorphicCard variant="raised" className="w-full max-w-lg p-8 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl neu-inset mx-auto flex items-center justify-center text-rose-600">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
              CERTIFICATE NOT FOUND
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              The certificate ID <strong className="font-mono text-gray-700">{certificateId}</strong> could not be verified.
            </p>
          </div>

          <div className="p-4 rounded-2xl neu-inset text-xs text-gray-600 font-medium">
            This certificate record does not exist or has been invalidated.
          </div>

          {onGoHome && (
            <div className="pt-2">
              <NeumorphicButton size="md" variant="secondary" onClick={onGoHome} icon={<ArrowLeft className="w-4 h-4" />}>
                Go to DP Quest
              </NeumorphicButton>
            </div>
          )}
        </NeumorphicCard>

        <div className="mt-8 text-center text-[11px] text-gray-400 font-mono">
          DP Quest · Official Public Verification Registry
        </div>
      </div>
    );
  }

  // Valid Certificate View
  return (
    <div className="min-h-screen neu-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-slate-300">
      <NeumorphicCard variant="raised" className="w-full max-w-xl p-8 sm:p-12 space-y-8 text-center">
        {/* Verification Verified Badge */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-3xl neu-inset mx-auto flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-inset text-emerald-800 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>CERTIFICATE VERIFIED</span>
          </div>
        </div>

        {/* DP QUEST Title */}
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-slate-500">
            DP QUEST
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif uppercase tracking-wider text-gray-900">
            Certificate of Completion
          </h2>
        </div>

        {/* Recipient Real Name */}
        <div className="py-2 border-y border-gray-300/40">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
            Awarded To
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-gray-900 tracking-tight uppercase">
            {result.userName}
          </div>
        </div>

        {/* Curriculum Details */}
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm text-gray-600">
            Has successfully completed all requirements of the
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-900 font-serif">
            Dynamic Programming Quest
          </p>
        </div>

        {/* Certificate Completion Statement */}
        <div className="p-4 rounded-2xl neu-inset text-left space-y-2 bg-slate-900/[0.02]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-sans text-center">
            Certificate Completion Statement
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans text-center italic">
            "This certificate is awarded in recognition of the successful completion of 25 Dynamic Programming problems from platforms including LeetCode, GeeksforGeeks (GFG), and CSES. Through this achievement, the student has demonstrated consistent effort and practical understanding of fundamental Dynamic Programming concepts, including recursion, memoization, tabulation, optimization, and problem-solving techniques across a diverse range of challenges."
          </p>
        </div>

        {/* Verified Metrics */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <div className="p-3.5 rounded-2xl neu-inset">
            <div className="text-lg font-bold font-mono text-gray-900">
              25 / 25
            </div>
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Problems Completed
            </div>
          </div>

          <div className="p-3.5 rounded-2xl neu-inset">
            <div className="text-lg font-bold font-mono text-gray-900">
              250 XP
            </div>
            <div className="text-[10px] uppercase font-semibold text-gray-400">
              Earned
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-2 border-t border-gray-300/40 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3 font-sans">
          <div>
            Completion Date:{' '}
            <strong className="text-gray-900 font-semibold">{result.completedAt}</strong>
          </div>
          <div>
            Certificate ID:{' '}
            <strong className="font-mono text-gray-900">{result.certificateId}</strong>
          </div>
        </div>

        {/* Issuer */}
        <div className="text-[10px] text-gray-400 font-sans">
          Issued by DP Quest · Dynamic Programming Learning Platform
        </div>

        {onGoHome && (
          <div className="pt-2">
            <NeumorphicButton size="sm" variant="secondary" onClick={onGoHome} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to DP Quest
            </NeumorphicButton>
          </div>
        )}
      </NeumorphicCard>

      <div className="mt-8 text-center text-[11px] text-gray-400 font-mono">
        Verified cryptographically against DP Quest production records.
      </div>
    </div>
  );
};
