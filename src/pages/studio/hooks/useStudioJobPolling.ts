import { useEffect, useRef } from 'react';
import { generationJobService } from '@/services/studio';
import { useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import { useToastStore } from '@/store/toastStore';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'canceled']);
const MAX_CONSECUTIVE_ERRORS = 3;

export function useStudioJobPolling() {
  const { activeJobId, jobs, upsertJob, stopPolling, setActiveJob } = useGenerationJobStore();
  const { selectVariant } = useVariantSelectionStore();
  const { showToast } = useToastStore();
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!activeJobId) {
      errorCountRef.current = 0;
      return;
    }

    const currentJob = jobs.find((job) => job.job_id === activeJobId);
    if (!currentJob) {
      stopPolling(activeJobId);
      return;
    }
    if (TERMINAL_STATUSES.has(currentJob.status)) {
      stopPolling(activeJobId);
      errorCountRef.current = 0;
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const updatedJob = await generationJobService.getJob(activeJobId);
        if (cancelled) return;
        errorCountRef.current = 0;
        upsertJob(updatedJob);
        if (TERMINAL_STATUSES.has(updatedJob.status)) {
          stopPolling(activeJobId);
          return;
        }
      } catch {
        if (cancelled) return;
        errorCountRef.current += 1;
        if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          upsertJob({
            ...currentJob,
            status: 'failed',
            stage: 'failed',
            error_message: '状态同步失败，请刷新后重试',
            stage_message: '状态同步失败，请刷新后重试',
          });
          stopPolling(activeJobId);
          selectVariant(null);
          setActiveJob(null);
          showToast('任务状态同步失败，请刷新后重试', 'error');
          return;
        }
      }
      timer = window.setTimeout(tick, 3000);
    };

    timer = window.setTimeout(tick, 3000);
    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [activeJobId, jobs, selectVariant, setActiveJob, showToast, stopPolling, upsertJob]);
}
