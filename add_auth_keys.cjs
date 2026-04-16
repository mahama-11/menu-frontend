const fs = require('fs');
const path = require('path');

const keysToAdd = {
  en: {
    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Enter your credentials to access your account",
    "auth.email.label": "Email",
    "auth.email.placeholder": "you@example.com",
    "auth.password.label": "Password",
    "auth.password.placeholder": "••••••••",
    "auth.password.forgot": "Forgot password?",
    "auth.login.btn": "Sign In",
    "auth.login.loading": "Signing In...",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.signup": "Sign up",
    "auth.error.contactSupport": "Please contact support to reset your password.",
    "auth.register.title": "Create an account",
    "auth.register.subtitle": "Start your free trial today",
    "auth.name.label": "Full Name",
    "auth.name.placeholder": "John Doe",
    "auth.restaurant.label": "Restaurant Name",
    "auth.restaurant.placeholder": "The Golden Spoon",
    "auth.register.btn": "Create Account",
    "auth.register.loading": "Creating Account...",
    "auth.register.hasAccount": "Already have an account?",
    "auth.register.signin": "Sign in"
  },
  zh: {
    "auth.login.title": "欢迎回来",
    "auth.login.subtitle": "输入您的凭据以访问您的帐户",
    "auth.email.label": "邮箱",
    "auth.email.placeholder": "you@example.com",
    "auth.password.label": "密码",
    "auth.password.placeholder": "••••••••",
    "auth.password.forgot": "忘记密码？",
    "auth.login.btn": "登录",
    "auth.login.loading": "登录中...",
    "auth.login.noAccount": "还没有帐户？",
    "auth.login.signup": "注册",
    "auth.error.contactSupport": "请联系支持人员重置您的密码。",
    "auth.register.title": "创建帐户",
    "auth.register.subtitle": "立即开始您的免费试用",
    "auth.name.label": "全名",
    "auth.name.placeholder": "张三",
    "auth.restaurant.label": "餐厅名称",
    "auth.restaurant.placeholder": "金汤匙餐厅",
    "auth.register.btn": "创建帐户",
    "auth.register.loading": "创建中...",
    "auth.register.hasAccount": "已经有帐户？",
    "auth.register.signin": "登录"
  },
  th: {
    "auth.login.title": "ยินดีต้อนรับกลับมา",
    "auth.login.subtitle": "ป้อนข้อมูลรับรองของคุณเพื่อเข้าสู่ระบบ",
    "auth.email.label": "อีเมล",
    "auth.email.placeholder": "you@example.com",
    "auth.password.label": "รหัสผ่าน",
    "auth.password.placeholder": "••••••••",
    "auth.password.forgot": "ลืมรหัสผ่าน?",
    "auth.login.btn": "เข้าสู่ระบบ",
    "auth.login.loading": "กำลังเข้าสู่ระบบ...",
    "auth.login.noAccount": "ยังไม่มีบัญชี?",
    "auth.login.signup": "สมัครสมาชิก",
    "auth.error.contactSupport": "กรุณาติดต่อฝ่ายสนับสนุนเพื่อรีเซ็ตรหัสผ่าน",
    "auth.register.title": "สร้างบัญชี",
    "auth.register.subtitle": "เริ่มทดลองใช้ฟรีวันนี้",
    "auth.name.label": "ชื่อ-นามสกุล",
    "auth.name.placeholder": "สมชาย ใจดี",
    "auth.restaurant.label": "ชื่อร้านอาหาร",
    "auth.restaurant.placeholder": "ร้านอาหารช้อนทอง",
    "auth.register.btn": "สร้างบัญชี",
    "auth.register.loading": "กำลังสร้างบัญชี...",
    "auth.register.hasAccount": "มีบัญชีอยู่แล้ว?",
    "auth.register.signin": "เข้าสู่ระบบ"
  }
};

['en', 'zh', 'th'].forEach(lang => {
  const filePath = path.join(__dirname, `src/locales/${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updatedData = { ...data, ...keysToAdd[lang] };
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
  console.log(`Updated ${lang}.json`);
});
