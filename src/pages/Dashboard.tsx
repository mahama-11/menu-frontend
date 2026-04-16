import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/hooks/useI18n';
import { authService } from '@/services/auth';
import type { Activity } from '@/services/auth';

import { useToastStore } from '@/store/toastStore';

type Section = 'home' | 'create' | 'history' | 'settings';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { lang, setLang } = useI18n();
  const { showToast } = useToastStore();
  const [activeSection, setActiveSection] = useState<Section>('home');

  // Fetch credits from backend
  const [credits, setCredits] = useState(20); // Default before load
  const [maxCredits, setMaxCredits] = useState(20);
  const [plan, setPlan] = useState('Basic');
  const [resetDate, setResetDate] = useState('');
  const creditPercent = Math.min(100, Math.max(0, (credits / maxCredits) * 100));

  // Profile data
  const [profileName, setProfileName] = useState(user?.name || user?.full_name || '');
  const [profileRestaurantName, setProfileRestaurantName] = useState(user?.restaurant_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [activityLog, setActivityLog] = useState<Activity[]>([]);

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      if (!profileName) setProfileName(user.name || user.full_name || '');
      if (!profileRestaurantName) setProfileRestaurantName(user.restaurant_name || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [creditsRes, profileRes, activitiesRes] = await Promise.all([
          authService.getCredits(),
          authService.getProfile(),
          authService.getActivities(20, 0)
        ]);

        if (creditsRes) {
          if (typeof creditsRes.balance === 'number') setCredits(creditsRes.balance);
          if (typeof creditsRes.max_credits === 'number') setMaxCredits(creditsRes.max_credits);
          if (creditsRes.plan_name) setPlan(creditsRes.plan_name);
          if (creditsRes.reset_date) setResetDate(creditsRes.reset_date);
        }

        if (profileRes && profileRes.data) {
          setProfileName(profileRes.data.name || '');
          setProfileRestaurantName(profileRes.data.restaurant_name || '');
          if (profileRes.data.language_preference) {
            setLang(profileRes.data.language_preference);
          }
        }

        if (activitiesRes && activitiesRes.data && activitiesRes.data.activities) {
          setActivityLog(activitiesRes.data.activities);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchDashboardData();
  }, [setLang]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const useFeature = (feat: string, cost: number) => {
    if (cost > 0 && credits < cost) {
      const msgs = { th: 'เครดิตไม่เพียงพอ กรุณาอัปเกรดแผน', zh: '积分不足，请升级套餐', en: 'Not enough credits. Please upgrade your plan.' };
      showToast(msgs[lang as keyof typeof msgs] || msgs.en, 'error');
      return;
    }

    const featNames = {
      enhance: { th: 'ปรับปรุงภาพ AI', zh: 'AI 图片优化', en: 'AI Image Enhancement' },
      copy: { th: 'AI เขียนคำโฆษณา', zh: 'AI 文案生成', en: 'AI Copywriting' },
      layout: { th: 'จัดเลย์เอาต์เมนู', zh: '菜单排版设计', en: 'Menu Layout Design' },
      social: { th: 'ส่งออกโซเชียลมีเดีย', zh: '社交媒体导出', en: 'Social Media Export' },
      poster: { th: 'โปสเตอร์รีวิว', zh: '评价海报', en: 'Review Poster' },
      festival: { th: 'แม่แบบเทศกาลไทย', zh: '泰国节日模板', en: 'Thai Festival Templates' },
    };

    const newCredits = Math.max(0, credits - cost);
    setCredits(newCredits);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const actionName = featNames[feat as keyof typeof featNames]?.[lang as 'th'|'zh'|'en'] || feat;

    // Build a fake Activity to push immediately for better UX
    const newLog: Activity[] = [{ 
      id: Math.random().toString(),
      action_type: feat,
      action_name: actionName, 
      credits_used: cost, 
      created_at: now.toISOString() 
    }, ...activityLog].slice(0, 10);
    
    setActivityLog(newLog);

    // Show toast using global toast instead of inline state
    showToast(`-${cost} credits. ${newCredits} remaining.`, 'success');
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await authService.updateProfile(profileName, profileRestaurantName, lang);
      showToast(tDash('dash.settings.save') + ' Success', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const tDash = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      th: {
        "dash.credits": "เครดิตคงเหลือ", "dash.creditReset": "รีเซ็ตทุกสิ้นเดือน", "dash.nav.home": "หน้าหลัก", "dash.nav.create": "สร้างเนื้อหา", "dash.nav.history": "ประวัติ", "dash.nav.settings": "ตั้งค่า",
        "dash.upgrade.title": "อัปเกรดเป็น Pro", "dash.upgrade.desc": "ปลดล็อคฟีเจอร์โซเชียลมีเดียและโปสเตอร์รีวิว", "dash.upgrade.btn": "อัปเกรด ฿249/เดือน", "dash.upgrade.btn2": "อัปเกรด",
        "dash.logout": "ออกจากระบบ", "dash.welcome.label": "ยินดีต้อนรับกลับมา", "dash.welcome.prefix": "สวัสดี,", "dash.creditsLeft": "เครดิตคงเหลือ",
        "dash.creditOverview": "สรุปเครดิตเดือนนี้", "dash.cr": "cr", "dash.resetDate": "รีเซ็ต 1 พ.ค. 2026",
        "dash.feat.copy": "AI คัดลอก", "dash.feat.enhance": "ปรับปรุงภาพ", "dash.feat.social": "โซเชียลมีเดีย", "dash.feat.collage": "คอลลาจ", "dash.free": "ฟรี", "dash.perUse": "cr/ครั้ง",
        "dash.quickActions": "เริ่มสร้างเลย",
        "dash.action.generate": "สร้างภาพ AI", "dash.action.generate.desc": "อัปโหลดและปรับปรุงภาพอาหาร",
        "dash.action.copy": "AI เขียนคำโฆษณา", "dash.action.copy.desc": "สร้างคำอธิบายเมนูอัตโนมัติ",
        "dash.action.layout": "จัดเลย์เอาต์เมนู", "dash.action.layout.desc": "สร้างเมนูรูปแบบสวยงาม",
        "dash.action.social": "ส่งออกโซเชียลมีเดีย", "dash.action.social.desc": "Facebook, Instagram, LINE OA",
        "dash.action.poster": "โปสเตอร์รีวิว", "dash.action.poster.desc": "สร้างโปสเตอร์จากรีวิวลูกค้า",
        "dash.action.festival": "แม่แบบเทศกาลไทย", "dash.action.festival.desc": "สงกรานต์ ตรุษจีน ลอยกระทง",
        "dash.recentActivity": "กิจกรรมล่าสุด", "dash.noActivity": "ยังไม่มีกิจกรรม เริ่มสร้างเนื้อหาเลย!",
        "dash.create.title": "สร้างเนื้อหา", "dash.create.desc": "เลือกฟีเจอร์จากหน้าหลักเพื่อเริ่มสร้าง", "dash.create.back": "กลับหน้าหลัก",
        "dash.history.title": "ประวัติการใช้งาน", "dash.settings.title": "ตั้งค่าบัญชี",
        "dash.settings.name": "ชื่อร้าน", "dash.settings.email": "อีเมล", "dash.settings.lang": "ภาษา", "dash.settings.save": "บันทึก",
        "dash.settings.plan": "แผนปัจจุบัน", "dash.settings.free": "ฟรีตลอดไป",
        "dash.toast.used": "ใช้เครดิต", "dash.toast.remain": "คงเหลือ:"
      },
      zh: {
        "dash.credits": "剩余积分", "dash.creditReset": "每月重置", "dash.nav.home": "主页", "dash.nav.create": "创建内容", "dash.nav.history": "历史", "dash.nav.settings": "设置",
        "dash.upgrade.title": "升级到 Pro", "dash.upgrade.desc": "解锁社交媒体导出和评价海报功能", "dash.upgrade.btn": "升级 ฿249/月", "dash.upgrade.btn2": "升级",
        "dash.logout": "退出登录", "dash.welcome.label": "欢迎回来", "dash.welcome.prefix": "你好,", "dash.creditsLeft": "积分剩余",
        "dash.creditOverview": "本月积分概览", "dash.cr": "积分", "dash.resetDate": "重置日期: 2026年5月1日",
        "dash.feat.copy": "AI 文案", "dash.feat.enhance": "图片优化", "dash.feat.social": "社交媒体", "dash.feat.collage": "多图拼接", "dash.free": "免费", "dash.perUse": "积分/次",
        "dash.quickActions": "快速开始",
        "dash.action.generate": "AI 生成图片", "dash.action.generate.desc": "上传并优化食物图片",
        "dash.action.copy": "AI 写广告语", "dash.action.copy.desc": "自动生成菜单描述",
        "dash.action.layout": "菜单排版设计", "dash.action.layout.desc": "创建精美菜单版式",
        "dash.action.social": "社交媒体导出", "dash.action.social.desc": "Facebook, Instagram, LINE OA",
        "dash.action.poster": "评价海报", "dash.action.poster.desc": "根据客户评价生成海报",
        "dash.action.festival": "泰国节日模板", "dash.action.festival.desc": "宋干节 春节 水灯节",
        "dash.recentActivity": "最近活动", "dash.noActivity": "还没有活动，开始创建内容吧！",
        "dash.create.title": "创建内容", "dash.create.desc": "从主页选择功能开始创建", "dash.create.back": "返回主页",
        "dash.history.title": "使用历史", "dash.settings.title": "账户设置",
        "dash.settings.name": "店铺名称", "dash.settings.email": "电子邮箱", "dash.settings.lang": "语言", "dash.settings.save": "保存",
        "dash.settings.plan": "当前套餐", "dash.settings.free": "永久免费",
        "dash.toast.used": "消耗积分", "dash.toast.remain": "剩余:"
      },
      en: {
        "dash.credits": "Credits remaining", "dash.creditReset": "Resets monthly", "dash.nav.home": "Home", "dash.nav.create": "Create", "dash.nav.history": "History", "dash.nav.settings": "Settings",
        "dash.upgrade.title": "Upgrade to Pro", "dash.upgrade.desc": "Unlock social media export and review posters", "dash.upgrade.btn": "Upgrade ฿249/mo", "dash.upgrade.btn2": "Upgrade",
        "dash.logout": "Log out", "dash.welcome.label": "Welcome back", "dash.welcome.prefix": "Hello,", "dash.creditsLeft": "credits remaining",
        "dash.creditOverview": "This month's credits", "dash.cr": "cr", "dash.resetDate": "Resets May 1, 2026",
        "dash.feat.copy": "AI Copy", "dash.feat.enhance": "Enhancement", "dash.feat.social": "Social Export", "dash.feat.collage": "Collage", "dash.free": "Free", "dash.perUse": "cr/use",
        "dash.quickActions": "Quick Actions",
        "dash.action.generate": "AI Image Generation", "dash.action.generate.desc": "Upload and enhance food photos",
        "dash.action.copy": "AI Copywriting", "dash.action.copy.desc": "Auto-generate menu descriptions",
        "dash.action.layout": "Menu Layout Design", "dash.action.layout.desc": "Create beautiful menu layouts",
        "dash.action.social": "Social Media Export", "dash.action.social.desc": "Facebook, Instagram, LINE OA",
        "dash.action.poster": "Review Poster", "dash.action.poster.desc": "Generate posters from customer reviews",
        "dash.action.festival": "Thai Festival Templates", "dash.action.festival.desc": "Songkran, CNY, Loy Krathong",
        "dash.recentActivity": "Recent Activity", "dash.noActivity": "No activity yet — start creating content!",
        "dash.create.title": "Create Content", "dash.create.desc": "Choose a feature from home to start creating", "dash.create.back": "Back to Home",
        "dash.history.title": "Usage History", "dash.settings.title": "Account Settings",
        "dash.settings.name": "Store name", "dash.settings.email": "Email", "dash.settings.lang": "Language", "dash.settings.save": "Save",
        "dash.settings.plan": "Current plan", "dash.settings.free": "Free forever",
        "dash.toast.used": "Credits used", "dash.toast.remain": "Remaining:"
      }
    };
    return dict[lang as string]?.[key] || dict.en[key] || key;
  };

  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex min-h-screen bg-[#060608] text-white font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-white/5 p-5 fixed h-full z-40">
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="font-bold text-sm">AI Menu Engine</span>
        </Link>

        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{tDash('dash.credits')}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-400/10 text-green-400">{plan}</span>
          </div>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-black gradient-text">{credits}</span>
            <span className="text-sm text-gray-500 mb-1">/ {maxCredits}</span>
          </div>
          <div className="bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-yellow-400 h-full transition-all duration-1000 ease-out" style={{ width: `${creditPercent}%` }}></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">{resetDate ? `Resets ${new Date(resetDate).toLocaleDateString()}` : tDash('dash.creditReset')}</p>
        </div>

        <nav className="space-y-1 flex-1">
          <button onClick={() => setActiveSection('home')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeSection === 'home' ? 'text-white bg-primary-500/15 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
            <span>{tDash('dash.nav.home')}</span>
          </button>
          <button onClick={() => setActiveSection('create')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeSection === 'create' ? 'text-white bg-primary-500/15 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span>{tDash('dash.nav.create')}</span>
          </button>
          <button onClick={() => setActiveSection('history')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeSection === 'history' ? 'text-white bg-primary-500/15 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            <span>{tDash('dash.nav.history')}</span>
          </button>
          <button onClick={() => setActiveSection('settings')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeSection === 'settings' ? 'text-white bg-primary-500/15 border border-primary-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>{tDash('dash.nav.settings')}</span>
          </button>
        </nav>

        <div className="glass rounded-xl p-4 mt-4 border border-primary-500/20">
          <p className="text-xs font-semibold text-primary-400 mb-1">{tDash('dash.upgrade.title')}</p>
          <p className="text-xs text-gray-500 mb-3">{tDash('dash.upgrade.desc')}</p>
          <Link to="/#pricing" className="btn-primary block text-center py-2 rounded-lg text-xs font-bold">{tDash('dash.upgrade.btn')}</Link>
        </div>

        <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>{tDash('dash.logout')}</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen relative overflow-x-hidden">
        <div className="glow-orb w-72 h-72 bg-primary-600/10 top-10 right-10 animate-pulse-glow"></div>

        {/* Top bar (mobile) */}
        <div className="md:hidden glass-strong sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span className="font-bold text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-sm font-bold gradient-text">{credits}</span>
              <span className="text-xs text-gray-500">cr</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg glass text-gray-400 hover:text-red-400 transition">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 max-w-5xl relative z-10">
          
          {activeSection === 'home' && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-1">{tDash('dash.welcome.label')}</p>
                <h1 className="text-2xl sm:text-3xl font-black">
                  <span>{tDash('dash.welcome.prefix')}</span>
                  <span className="gradient-text ml-2">{userName}</span> 👋
                </h1>
                <p className="text-sm text-gray-400 mt-1">{plan} Plan · <span className="text-primary-400 font-semibold">{credits}</span> {tDash('dash.creditsLeft')}</p>
              </div>

              <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{tDash('dash.creditOverview')}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black gradient-text">{credits}</span>
                      <span className="text-gray-500 mb-1">/ {maxCredits} <span>{tDash('dash.cr')}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{tDash('dash.resetDate')}</p>
                    <p className="text-xs text-primary-400 mt-1">{resetDate ? new Date(resetDate).toLocaleDateString() : plan + ' Plan'}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-full h-2 overflow-hidden mb-3">
                  <div className="bg-gradient-to-r from-primary-500 to-yellow-400 h-full transition-all duration-1000 ease-out" style={{ width: `${creditPercent}%` }}></div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-xs text-green-400 font-bold mb-1">{tDash('dash.feat.copy')}</p>
                    <p className="text-lg font-black">∞</p>
                    <p className="text-xs text-gray-500">{tDash('dash.free')}</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-xs text-primary-400 font-bold mb-1">{tDash('dash.feat.enhance')}</p>
                    <p className="text-lg font-black">10</p>
                    <p className="text-xs text-gray-500">{tDash('dash.perUse')}</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-400 font-bold mb-1">{tDash('dash.feat.social')}</p>
                    <p className="text-lg font-black">10</p>
                    <p className="text-xs text-gray-500">{tDash('dash.perUse')}</p>
                  </div>
                  <div className="glass rounded-xl p-3 text-center">
                    <p className="text-xs text-yellow-400 font-bold mb-1">{tDash('dash.feat.collage')}</p>
                    <p className="text-lg font-black">15</p>
                    <p className="text-xs text-gray-500">{tDash('dash.perUse')}</p>
                  </div>
                </div>
              </div>

              <h2 className="text-base font-bold mb-4">{tDash('dash.quickActions')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                
                <div className="glass hover:bg-white/[0.06] hover:border-primary-500/30 hover:-translate-y-1 transition-all rounded-xl p-5 cursor-pointer" onClick={() => useFeature('enhance', 10)}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center mb-3">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{tDash('dash.action.generate')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{tDash('dash.action.generate.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-400/10 text-primary-400">10 cr</span>
                </div>

                <div className="glass hover:bg-white/[0.06] hover:border-primary-500/30 hover:-translate-y-1 transition-all rounded-xl p-5 cursor-pointer" onClick={() => useFeature('copy', 0)}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mb-3">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#a855f7" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{tDash('dash.action.copy')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{tDash('dash.action.copy.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-400/10 text-green-400">{tDash('dash.free')}</span>
                </div>

                <div className="glass hover:bg-white/[0.06] hover:border-primary-500/30 hover:-translate-y-1 transition-all rounded-xl p-5 cursor-pointer" onClick={() => useFeature('layout', 10)}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-3">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{tDash('dash.action.layout')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{tDash('dash.action.layout.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-400/10 text-primary-400">10 cr</span>
                </div>

                {/* Pro-locked: Social export */}
                <div className="glass rounded-xl p-5 cursor-pointer relative overflow-hidden group" onClick={() => useFeature('social', 10)}>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10 opacity-100 group-hover:opacity-0 transition-opacity">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white">Pro</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.social')}</h3>
                  <p className="text-xs text-gray-500 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.social.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-400/10 text-primary-400 opacity-40 group-hover:opacity-100 transition-opacity">10 cr</span>
                </div>

                {/* Pro-locked: Review poster */}
                <div className="glass rounded-xl p-5 cursor-pointer relative overflow-hidden group" onClick={() => useFeature('poster', 10)}>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10 opacity-100 group-hover:opacity-0 transition-opacity">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-500 text-white">Pro</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#eab308" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.poster')}</h3>
                  <p className="text-xs text-gray-500 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.poster.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-400/10 text-primary-400 opacity-40 group-hover:opacity-100 transition-opacity">10 cr</span>
                </div>

                {/* Growth-locked: Festival template */}
                <div className="glass rounded-xl p-5 cursor-pointer relative overflow-hidden group" onClick={() => useFeature('festival', 10)}>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10 opacity-100 group-hover:opacity-0 transition-opacity">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">Growth</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-600/10 flex items-center justify-center mb-3 opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ec4899" strokeWidth="2"><path d="M12 2a5 5 0 105 5c0-2.76-2.24-5-5-5z"/><path d="M2 20c0-5.52 4.48-10 10-10s10 4.48 10 10"/></svg>
                  </div>
                  <h3 className="font-bold text-sm mb-1 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.festival')}</h3>
                  <p className="text-xs text-gray-500 mb-3 opacity-40 group-hover:opacity-100 transition-opacity">{tDash('dash.action.festival.desc')}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-400/10 text-primary-400 opacity-40 group-hover:opacity-100 transition-opacity">10 cr</span>
                </div>
              </div>

              <h2 className="text-base font-bold mb-4">{tDash('dash.recentActivity')}</h2>
              <div className="glass rounded-xl p-5 space-y-4">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{tDash('dash.noActivity')}</p>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-outline px-4 py-2 rounded-lg text-xs font-semibold">
                      {tDash('dash.quickActions')}
                    </button>
                  </div>
                ) : (
                  activityLog.map((log, i) => (
                    <div key={i} className="border-l-2 border-primary-500/30 pl-4 relative pb-4">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary-500"></div>
                      <p className="text-sm font-medium">{log.action_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · <span className="text-primary-400">-{log.credits_used} cr</span></p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === 'create' && (
            <div className="text-center py-20 animate-slide-up">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-black mb-3">{tDash('dash.create.title')}</h2>
              <p className="text-gray-400 mb-6">{tDash('dash.create.desc')}</p>
              <button onClick={() => setActiveSection('home')} className="btn-primary px-6 py-3 rounded-xl font-semibold">{tDash('dash.create.back')}</button>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="animate-slide-up">
              <h1 className="text-2xl font-black mb-6">{tDash('dash.history.title')}</h1>
              <div className="glass rounded-xl p-6">
                {activityLog.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4 opacity-50">📜</div>
                    <p className="text-sm text-gray-500 mb-4">{tDash('dash.noActivity')}</p>
                    <button onClick={() => setActiveSection('home')} className="btn-outline px-6 py-3 rounded-xl font-semibold">
                      {tDash('dash.create.back')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLog.map((log, i) => (
                      <div key={i} className="border-l-2 border-primary-500/30 pl-4 relative pb-4">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary-500"></div>
                        <p className="text-sm font-medium">{log.action_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · <span className="text-primary-400">-{log.credits_used} cr</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="animate-slide-up">
              <h1 className="text-2xl font-black mb-6">{tDash('dash.settings.title')}</h1>
              <form onSubmit={handleUpdateProfile} className="glass rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{tDash('dash.settings.name')}</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name</label>
                  <input type="text" value={profileRestaurantName} onChange={(e) => setProfileRestaurantName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{tDash('dash.settings.email')}</label>
                  <input type="email" defaultValue={user?.email || ''} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{tDash('dash.settings.lang')}</label>
                  <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary-500 transition">
                    <option value="th">ไทย (TH)</option>
                    <option value="zh">中文 (ZH)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={isUpdatingProfile} className="btn-primary px-6 py-3 rounded-xl font-semibold disabled:opacity-70">
                    {isUpdatingProfile ? '...' : tDash('dash.settings.save')}
                  </button>
                  <button type="button" onClick={handleLogout} className="btn-outline px-6 py-3 rounded-xl font-semibold">{tDash('dash.logout')}</button>
                </div>
                
                <div className="border-t border-white/10 pt-4 mt-6">
                  <p className="text-sm font-medium text-gray-300 mb-3">{tDash('dash.settings.plan')}</p>
                  <div className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{plan}</p>
                      <p className="text-xs text-gray-500">{tDash('dash.settings.free')}</p>
                    </div>
                    <Link to="/#pricing" className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold">{tDash('dash.upgrade.btn2')}</Link>
                  </div>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
