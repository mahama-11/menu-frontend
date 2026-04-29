import { useEffect, useRef } from 'react';
import { generationJobService } from '@/services/studio';
import { useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import { useToastStore } from '@/store/toastStore';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'canceled']);
const MAX_CONSECUTIVE_ERRORS = 3;
const BASE_POLL_INTERVAL_MS = 3000;
const HIDDEN_POLL_INTERVAL_MS = 8000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

export function useStudioJobPolling() {
  const { activeJobId, jobs, pollingJobs, upsertJob, stopPolling, setActiveJob } = useGenerationJobStore();
  const { selectVariant } = useVariantSelectionStore();
  const { showToast } = useToastStore();
  const errorCountRef = useRef(0);
  const pollStartedAtRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!activeJobId) {
      errorCountRef.current = 0;
      return;
    }
    if (!pollingJobs.has(activeJobId)) {
      return;
    }
    if (!pollStartedAtRef.current[activeJobId]) {
      pollStartedAtRef.current[activeJobId] = Date.now();
    }

    const currentJob = jobs.find((job) => job.job_id === activeJobId);
    if (!currentJob) {
      stopPolling(activeJobId);
      delete pollStartedAtRef.current[activeJobId];
      return;
    }
    if (TERMINAL_STATUSES.has(currentJob.status)) {
      stopPolling(activeJobId);
      errorCountRef.current = 0;
      delete pollStartedAtRef.current[activeJobId];
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      const startedAt = pollStartedAtRef.current[activeJobId] || Date.now();
      if (Date.now() - startedAt >= MAX_POLL_DURATION_MS) {
        upsertJob({
          ...currentJob,
          stage_message: '任务状态同步已暂停，请稍后手动刷新查看结果',
        });
        stopPolling(activeJobId);
        delete pollStartedAtRef.current[activeJobId];
        showToast('任务状态同步已暂停，请稍后查看结果', 'error');
        return;
      }

      try {
        const updatedJob = await generationJobService.getJob(activeJobId);
        if (cancelled) return;
        errorCountRef.current = 0;
        upsertJob(updatedJob);
        if (TERMINAL_STATUSES.has(updatedJob.status)) {
          stopPolling(activeJobId);
          delete pollStartedAtRef.current[activeJobId];
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
          delete pollStartedAtRef.current[activeJobId];
          showToast('任务状态同步失败，请刷新后重试', 'error');
          return;
        }
      }
      timer = window.setTimeout(tick, document.hidden ? HIDDEN_POLL_INTERVAL_MS : BASE_POLL_INTERVAL_MS);
    };

    timer = window.setTimeout(tick, document.hidden ? HIDDEN_POLL_INTERVAL_MS : BASE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [activeJobId, jobs, pollingJobs, selectVariant, setActiveJob, showToast, stopPolling, upsertJob]);
}
