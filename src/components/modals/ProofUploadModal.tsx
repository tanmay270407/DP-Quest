import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useQuest } from '../../context/QuestContext';
import { NeumorphicButton } from '../common/NeumorphicButton';
import { verificationService } from '../../services/verificationService';
import { VerificationState } from '../../types';

export const ProofUploadModal: React.FC = () => {
  const { 
    isProofModalOpen, 
    modalProblemId, 
    closeProofModal, 
    problems, 
    userProgress,
    submitProof,
    selectProblem
  } = useQuest();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    status: VerificationState;
    notes: string;
  } | null>(null);

  if (!isProofModalOpen || !modalProblemId) return null;

  const problem = problems.find((p) => p.id === modalProblemId);
  if (!problem) return null;

  const progress = userProgress[problem.id];
  const isAlreadyCompleted = progress?.status === 'COMPLETED';

  // Find next problem if completed
  const currentIndex = problems.findIndex((p) => p.id === problem.id);
  const nextProblem = currentIndex !== -1 && currentIndex + 1 < problems.length ? problems[currentIndex + 1] : null;

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    setVerificationResult(null);

    // 1. Image format validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('File must be PNG, JPG, JPEG, or WEBP.');
      return false;
    }

    // 2. File size validation (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setValidationError('Image must be smaller than 5 MB.');
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // Auto-scale on canvas if image is extraordinarily large (e.g. 4K retina displays)
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1920;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedUrl = canvas.toDataURL(file.type || 'image/png', 0.92);
            setPreviewUrl(optimizedUrl);
            setSelectedFile(file);
            return;
          }
        }
        setPreviewUrl(rawDataUrl);
        setSelectedFile(file);
      };
      img.onerror = () => {
        setPreviewUrl(rawDataUrl);
        setSelectedFile(file);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    } else {
      setValidationError('Please upload an image.');
    }
  };

  const handleUseSample = () => {
    setValidationError(null);
    setVerificationResult(null);
    const sample = verificationService.generateSampleProofSvg(
      problem.title,
      problem.platform,
      problem.problemNumber
    );

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        setPreviewUrl(pngUrl);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${problem.id}_proof.png`, { type: 'image/png' });
            setSelectedFile(file);
          }
        }, 'image/png');
      } else {
        setPreviewUrl(sample);
      }
    };
    img.onerror = () => {
      setPreviewUrl(sample);
    };
    img.src = sample;
  };

  const handleSubmit = async () => {
    if (!previewUrl) {
      setValidationError('Please upload an image.');
      return;
    }

    setIsVerifying(true);
    setValidationError(null);
    setVerificationResult(null);

    try {
      const res = await submitProof(
        problem.id,
        selectedFile || previewUrl,
        previewUrl
      );

      setVerificationResult({
        status: res.status || (res.success ? 'VERIFIED' : 'FAILED'),
        notes: res.notes
      });
    } catch (e: any) {
      setValidationError(e?.message || "Verification couldn't be completed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    if (isVerifying) return;
    closeProofModal();
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setVerificationResult(null);
  };

  const handleNextProblem = () => {
    if (nextProblem) {
      handleClose();
      selectProblem(nextProblem.id);
    } else {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg neu-raised rounded-3xl p-6 sm:p-8 space-y-6 relative border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              Upload Submission Proof
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Show the problem and successful submission result clearly.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isVerifying}
            className="w-8 h-8 rounded-xl neu-raised-sm flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Problem Context */}
        <div className="px-4 py-2.5 rounded-xl neu-inset text-xs flex items-center justify-between text-gray-600">
          <span className="font-medium text-gray-800">
            #{problem.number.toString().padStart(2, '0')} {problem.title}
          </span>
          <span className="font-mono text-gray-500">
            {problem.platform} {problem.problemNumber ? `· #${problem.problemNumber}` : ''}
          </span>
        </div>

        {/* Already Completed Check */}
        {isAlreadyCompleted && !verificationResult ? (
          <div className="p-6 rounded-2xl neu-inset text-center space-y-2">
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ✓ Problem Completed
            </div>
            <div className="text-xs text-gray-500">
              +10 XP Already Earned. No further submissions required.
            </div>
            <div className="pt-2">
              <NeumorphicButton size="sm" variant="secondary" onClick={handleClose}>
                Close
              </NeumorphicButton>
            </div>
          </div>
        ) : isVerifying ? (
          /* Verification in progress state */
          <div className="p-8 rounded-2xl neu-inset text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-800 mx-auto" />
            <div className="text-sm font-bold text-gray-900">
              Verifying Proof...
            </div>
            <div className="text-xs text-gray-500">
              AI is checking your submission
            </div>
          </div>
        ) : verificationResult?.status === 'VERIFIED' ? (
          /* VERIFIED Result State */
          <div className="p-7 rounded-2xl neu-inset text-center space-y-4 bg-emerald-500/5">
            <div className="w-12 h-12 rounded-2xl neu-raised-sm mx-auto flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-emerald-800">
                ✓ Verified
              </div>
              <div className="text-xs font-bold font-mono text-emerald-600">
                +10 XP
              </div>
              <div className="text-xs text-gray-600">
                Problem Completed
              </div>
            </div>

            {verificationResult.notes && (
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                {verificationResult.notes}
              </p>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <NeumorphicButton
                size="sm"
                variant="secondary"
                onClick={handleClose}
              >
                Close
              </NeumorphicButton>

              {nextProblem && (
                <NeumorphicButton
                  size="sm"
                  variant="primary"
                  onClick={handleNextProblem}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next Problem
                </NeumorphicButton>
              )}
            </div>
          </div>
        ) : verificationResult?.status === 'FAILED' ? (
          /* FAILED Result State */
          <div className="p-6 rounded-2xl neu-inset text-center space-y-3 bg-rose-500/5">
            <div className="text-sm font-bold text-rose-800">
              Proof Not Verified
            </div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {verificationResult.notes || 'The screenshot does not clearly show an Accepted verdict for the expected problem.'}
            </p>
            <div className="pt-2">
              <NeumorphicButton
                size="sm"
                variant="primary"
                onClick={() => {
                  setVerificationResult(null);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
              >
                Upload New Proof
              </NeumorphicButton>
            </div>
          </div>
        ) : verificationResult?.status === 'REVIEW_REQUIRED' ? (
          /* REVIEW REQUIRED Result State */
          <div className="p-6 rounded-2xl neu-inset text-center space-y-3 bg-amber-500/5">
            <div className="text-sm font-bold text-amber-800">
              Proof Needs Review
            </div>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {verificationResult.notes || 'The evidence was ambiguous or cropped. Please upload a clearer screenshot showing the problem title and Accepted banner.'}
            </p>
            <div className="pt-2">
              <NeumorphicButton
                size="sm"
                variant="primary"
                onClick={() => {
                  setVerificationResult(null);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
              >
                Upload New Proof
              </NeumorphicButton>
            </div>
          </div>
        ) : (
          /* Default Upload / Preview View */
          <div className="space-y-4">
            {validationError && (
              <div className="p-3.5 rounded-xl neu-inset text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {!previewUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 border-dashed transition-all p-7 flex flex-col items-center justify-center text-center ${
                  dragOver
                    ? 'border-gray-500 bg-white/40 neu-inset'
                    : 'border-gray-300/80 hover:border-gray-400 neu-inset-sm'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-12 h-12 rounded-2xl neu-raised-sm flex items-center justify-center text-gray-500 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-xs font-semibold text-gray-700">
                  Drag & drop your accepted submission screenshot
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  PNG, JPG, JPEG, or WEBP (Max 5 MB)
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <NeumorphicButton
                    size="sm"
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Screenshot
                  </NeumorphicButton>

                  <NeumorphicButton
                    size="sm"
                    variant="secondary"
                    onClick={handleUseSample}
                    title="Quick demo sample screenshot"
                  >
                    Use Sample Proof
                  </NeumorphicButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl neu-inset p-2 overflow-hidden max-h-56 flex items-center justify-center bg-gray-900/5">
                  <img
                    src={previewUrl}
                    alt="Submission Preview"
                    className="max-h-52 w-auto object-contain rounded-xl shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>Screenshot selected</span>
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setValidationError(null);
                    }}
                    className="text-gray-600 hover:text-gray-900 font-semibold underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Replace Image
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <NeumorphicButton
                size="md"
                variant="secondary"
                onClick={handleClose}
                disabled={isVerifying}
              >
                Cancel
              </NeumorphicButton>

              {previewUrl && (
                <NeumorphicButton
                  size="md"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isVerifying}
                >
                  Submit for Verification
                </NeumorphicButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
