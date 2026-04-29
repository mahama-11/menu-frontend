import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Gift, Layers3, Wallet } from 'lucide-react';
import { useAuthStore, useWalletBalances } from '@/store/authStore';
import { useI18n } from '@/hooks/useI18n';

function formatMoney(cents: number): string {
  return `¥${((cents || 0) / 100).toLocaleString()}`;
}

export default function DashboardWalletPage() {
  const { lang } = useI18n();
  const walletSummaries = useAuthStore((state) => state.walletSummaries);
  const fetchWalletSummaries = useAuthStore((state) => state.fetchWalletSummaries);
  const { cash, quota, promoCredits, credits, quotaSummary } = useWalletBalances();

  useEffect(() => {
    void fetchWalletSummaries(true);
  }, [fetchWalletSummaries]);

  return (
    <div className="space-y-6">
      <section className="dashboard-surface rounded-[28px] p-6">
        <p className="dashboard-kicker">{lang === 'zh' ? '我的钱包' : lang === 'th' ? 'กระเป๋าของฉัน' : 'My Wallet'}</p>
        <h1 className="mt-2 text-3xl font-black text-white">
          {lang === 'zh' ? '查看支付余额、套餐额度与资源包' : lang === 'th' ? 'ดูยอดชำระ โควตาแพ็กเกจ และแพ็กทรัพยากร' : 'Review payment balance, subscription allowance, and packs'}
        </h1>
        <p className="mt-3 text-sm text-white/55">
          {lang === 'zh'
            ? '这里展示平台钱包中的真实支付余额，以及当前账号已生效的套餐额度和资源包余额。'
            : lang === 'th'
              ? 'หน้านี้แสดงยอดคงเหลือจริงในกระเป๋า รวมถึงโควตาแพ็กเกจและแพ็กทรัพยากรที่เปิดใช้งานแล้ว'
              : 'This page shows your real wallet payment balance together with active package allowance and resource packs.'}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-cyan flex h-12 w-12 items-center justify-center rounded-2xl">
            <Wallet className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '支付余额' : lang === 'th' ? 'ยอดชำระ' : 'Payment Balance'}</p>
          <p className="mt-2 text-3xl font-black text-white">{formatMoney(cash)}</p>
        </div>

        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-studio flex h-12 w-12 items-center justify-center rounded-2xl">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '剩余配额 / Quota' : lang === 'th' ? 'โควตาคงเหลือ / Quota' : 'Remaining Quota'}</p>
          <p className="mt-2 text-3xl font-black text-white">{quota}</p>
        </div>

        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Layers3 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '永久积分 / Credit' : lang === 'th' ? 'เครดิตถาวร / Credit' : 'Permanent Credit'}</p>
          <p className="mt-2 text-3xl font-black text-white">{credits}</p>
        </div>

        <div className="dashboard-surface rounded-[28px] p-6">
          <div className="dashboard-accent-library flex h-12 w-12 items-center justify-center rounded-2xl">
            <Gift className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '活动积分 / Promo Credit' : lang === 'th' ? 'เครดิตโปรโมชัน / Promo Credit' : 'Promo Credit'}</p>
          <p className="mt-2 text-3xl font-black text-white">{promoCredits}</p>
        </div>
      </section>

      <section className="dashboard-surface rounded-[28px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{lang === 'zh' ? '资产明细' : lang === 'th' ? 'รายละเอียดสินทรัพย์' : 'Asset Details'}</p>
            <h2 className="mt-2 text-xl font-black text-white">{lang === 'zh' ? '当前钱包资产' : lang === 'th' ? 'สินทรัพย์ในกระเป๋าปัจจุบัน' : 'Current wallet assets'}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {[{
            asset_code: quotaSummary?.billable_item_code || 'menu.render.call',
            total_balance: quotaSummary?.remaining || 0,
            permanent_balance: quotaSummary?.granted || 0,
            reward_balance: quotaSummary?.consumed || 0,
            allowance_balance: quotaSummary?.reserved || 0,
          }, ...(walletSummaries || []).filter((item) => item.asset_code !== 'MENU_MONTHLY_ALLOWANCE')].map((item) => (
            <div key={item.asset_code} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{item.asset_code}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {lang === 'zh'
                      ? (item.asset_code === (quotaSummary?.billable_item_code || 'menu.render.call')
                          ? `已发放 ${item.permanent_balance} / 已消费 ${item.reward_balance} / 已预留 ${item.allowance_balance}`
                          : `永久 ${item.permanent_balance} / 奖励 ${item.reward_balance} / 套餐 ${item.allowance_balance}`)
                      : lang === 'th'
                        ? (item.asset_code === (quotaSummary?.billable_item_code || 'menu.render.call')
                            ? `ได้รับ ${item.permanent_balance} / ใช้ไป ${item.reward_balance} / สำรอง ${item.allowance_balance}`
                            : `ถาวร ${item.permanent_balance} / รางวัล ${item.reward_balance} / แพ็กเกจ ${item.allowance_balance}`)
                        : (item.asset_code === (quotaSummary?.billable_item_code || 'menu.render.call')
                            ? `Granted ${item.permanent_balance} / Consumed ${item.reward_balance} / Reserved ${item.allowance_balance}`
                            : `Permanent ${item.permanent_balance} / Reward ${item.reward_balance} / Allowance ${item.allowance_balance}`)}
                  </p>
                </div>
                <div className="text-sm font-semibold text-emerald-300">
                  {item.asset_code === 'MENU_CASH' ? formatMoney(item.total_balance) : item.total_balance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-surface rounded-[28px] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="dashboard-kicker">{lang === 'zh' ? '流水记录' : lang === 'th' ? 'ประวัติรายการ' : 'History'}</p>
            <h2 className="mt-2 text-xl font-black text-white">
              {lang === 'zh' ? '钱包页只展示资产总览' : lang === 'th' ? 'หน้ากระเป๋าแสดงเฉพาะภาพรวมสินทรัพย์' : 'Wallet shows asset overview only'}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              {lang === 'zh'
                ? '充值、消费、Studio 扣减等流水统一放在历史中心查看，避免与钱包总览重复。'
                : lang === 'th'
                  ? 'ประวัติการเติมเงิน การใช้งาน และการหักจาก Studio จะดูรวมในศูนย์ประวัติ เพื่อไม่ให้ซ้ำกับภาพรวมกระเป๋า'
                  : 'Top-ups, consumption, and Studio deductions are grouped in History Center to avoid duplicating the wallet overview.'}
            </p>
          </div>
          <Link
            to="/dashboard/history"
            className="btn-outline inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold"
          >
            {lang === 'zh' ? '查看历史记录' : lang === 'th' ? 'ดูประวัติ' : 'Open history'}
          </Link>
        </div>
      </section>
    </div>
  );
}
