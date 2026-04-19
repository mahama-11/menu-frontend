import { Link } from 'react-router-dom';
import { CalendarRange, ImagePlus, Library, Sparkles, Wand2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from './copy';

export default function DashboardCreatePage() {
  const { lang } = useI18n();
  const tDash = (key: string) => getDashboardText(lang, key);
  const workflows = [
    {
      step: '01',
      title: tDash('dash.create.workflow.studioTitle'),
      description: tDash('dash.create.workflow.studioDesc'),
      to: '/studio',
      icon: <Sparkles className="h-5 w-5" />,
      accentClass: 'dashboard-accent-studio',
    },
    {
      step: '02',
      title: tDash('dash.create.workflow.libraryTitle'),
      description: tDash('dash.create.workflow.libraryDesc'),
      to: '/dashboard/library',
      icon: <Library className="h-5 w-5" />,
      accentClass: 'dashboard-accent-library',
    },
    {
      step: '03',
      title: tDash('dash.create.workflow.historyTitle'),
      description: tDash('dash.create.workflow.historyDesc'),
      to: '/dashboard/history',
      icon: <CalendarRange className="h-5 w-5" />,
      accentClass: 'dashboard-accent-neutral',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="dashboard-surface-strong relative overflow-hidden rounded-[32px] p-6 lg:p-8">
        <div className="glow-orb -left-8 top-0 h-40 w-40 bg-primary-500/12 animate-pulse-glow" />
        <div className="glow-orb bottom-0 right-8 h-28 w-28 bg-emerald-500/10 animate-pulse-glow" style={{ animationDelay: '1.1s' }} />
        <p className="dashboard-kicker text-primary-300/80">{tDash('dash.nav.create')}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{tDash('dash.create.heroTitle')}</h1>
        <p className="dashboard-copy mt-3 max-w-3xl text-sm leading-7 sm:text-base">{tDash('dash.create.heroDesc')}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <Link
            key={workflow.step}
            to={workflow.to}
            className="dashboard-surface interactive-panel rounded-[28px] p-6"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${workflow.accentClass}`}>
              {workflow.icon}
            </div>
            <div className="mt-5 flex items-center gap-2">
              <span className="dashboard-kicker">{tDash('dash.create.stepLabel')}</span>
              <span className="text-sm font-bold text-white/70">{workflow.step}</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">{workflow.title}</h2>
            <p className="dashboard-copy mt-3 text-sm leading-7">{workflow.description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Wand2 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-black text-white">{tDash('dash.create.flowTitle')}</h3>
          <p className="dashboard-copy mt-2 text-sm">
            {tDash('dash.create.flowDesc')}
          </p>
        </div>

        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-library flex h-12 w-12 items-center justify-center rounded-2xl">
            <ImagePlus className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-black text-white">{tDash('dash.create.adaptiveTitle')}</h3>
          <p className="dashboard-copy mt-2 text-sm">
            {tDash('dash.create.adaptiveDesc')}
          </p>
        </div>
      </section>
    </div>
  );
}
