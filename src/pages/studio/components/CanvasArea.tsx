import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetStore, useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import { getStudioAssetDisplayUrl } from '@/utils/studioAsset';
import WorkspaceShowcase from './WorkspaceShowcase';

export default function CanvasArea() {
  const { assets, selectedAssetId } = useAssetStore();
  const { activeJobId, jobs } = useGenerationJobStore();
  const { selectedVariantId, selectVariant } = useVariantSelectionStore();

  const selectedAsset = assets.find((asset) => asset.asset_id === selectedAssetId);
  const activeJob = jobs.find((job) => job.job_id === activeJobId);

  // Derived View Mode
  const viewMode = useMemo(() => {
    if (activeJob) {
      if (['queued', 'processing', 'running', 'dispatching'].includes(activeJob.status)) return 'generating';
      if (activeJob.status === 'completed' && activeJob.variants?.length > 0) return 'result';
      if (activeJob.status === 'failed' || activeJob.status === 'canceled') return 'error';
    }
    if (selectedAssetId) return 'ready';
    return 'empty';
  }, [activeJob, selectedAssetId]);

  const currentVariant = useMemo(() => {
    if (!activeJob?.variants?.length) return null;
    return (
      activeJob.variants.find((variant) => variant.variant_id === selectedVariantId) ||
      activeJob.variants.find((variant) => variant.is_selected) ||
      activeJob.variants[0]
    );
  }, [activeJob, selectedVariantId]);

  // Auto-select variant
  useEffect(() => {
    if (currentVariant?.variant_id && currentVariant.variant_id !== selectedVariantId) {
      selectVariant(currentVariant.variant_id);
    }
  }, [currentVariant?.variant_id, selectVariant, selectedVariantId]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {/* State 1: Empty (Showcase / Inspiration Gallery) */}
        {viewMode === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Ambient Background Grid for depth */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-[#060608] pointer-events-none" />
            
            <div className="relative z-10 w-full h-full pointer-events-auto pb-16">
              <WorkspaceShowcase />
            </div>
          </motion.div>
        )}

        {/* State 2: Ready (Base Image Full Screen with blur backdrop) */}
        {viewMode === 'ready' && selectedAsset && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={getStudioAssetDisplayUrl(selectedAsset)} 
                className="w-full h-full object-cover opacity-30 blur-[60px] scale-110"
                alt="Background Blur"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            
            <motion.div 
              initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
              className="relative z-10 w-full max-w-4xl h-full max-h-[70vh] p-4 flex items-center justify-center"
            >
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <img 
                  src={getStudioAssetDisplayUrl(selectedAsset)} 
                  className="w-full h-full object-contain bg-black/20"
                  alt="Base Asset"
                />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* State 3: Generating (Scanning Effect over Base Image) */}
        {viewMode === 'generating' && selectedAsset && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={getStudioAssetDisplayUrl(selectedAsset)} 
                className="w-full h-full object-cover opacity-20 blur-[60px] scale-110 grayscale"
                alt="Background Blur"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
            
            <div className="relative z-10 w-full max-w-4xl h-full max-h-[70vh] p-4 flex items-center justify-center">
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                <img 
                  src={getStudioAssetDisplayUrl(selectedAsset)} 
                  className="w-full h-full object-contain bg-black/40 grayscale opacity-40"
                  alt="Processing"
                />
                {/* Scanning line animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                  <motion.div 
                    initial={{ top: '-10%' }}
                    animate={{ top: '110%' }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[10%] bg-gradient-to-b from-transparent via-purple-500/20 to-purple-400/80 border-b border-purple-300 shadow-[0_4px_20px_rgba(139,92,246,0.5)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* State 4: Result (Generated Image Full Screen) */}
        {viewMode === 'result' && currentVariant?.asset && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={getStudioAssetDisplayUrl(currentVariant.asset)} 
                className="w-full h-full object-cover opacity-40 blur-[40px] scale-110"
                alt="Background Blur"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            
            <motion.div 
              key={currentVariant.variant_id} // Trigger animation on variant change
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 w-full max-w-5xl h-full max-h-[75vh] p-4 flex items-center justify-center"
            >
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
                <img 
                  src={getStudioAssetDisplayUrl(currentVariant.asset)} 
                  className="w-full h-full object-contain bg-black/20"
                  alt="Result"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
