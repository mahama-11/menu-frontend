/**
 * Style & Processing Types
 * 
 * AI 风格加工核心类型定义
 * 支持: 单图加工 -> 批量加工 -> 多轮微调 -> 风格市场
 */

// ==================== 风格定义 ====================

/**
 * 风格分类 - 用于组织和筛选
 */
export type StyleCategory = 
  | 'cuisine'      // 菜系风格 (中餐/西餐/日式/韩式/泰式)
  | 'scene'        // 场景风格 (户外/室内/工作室)
  | 'mood'         // 氛围风格 (温馨/高端/活泼)
  | 'platform'     // 平台适配 (Instagram/Facebook/菜单)
  | 'custom';      // 用户自定义

/**
 * 风格可见性
 */
export type StyleVisibility = 'private' | 'public' | 'organization';

/**
 * 风格定义 - 核心数据模型
 */
export interface Style {
  style_id: string;
  name: string;
  name_en?: string;
  name_th?: string;
  
  // 分类与标签
  category: StyleCategory;
  tags: string[];
  
  // AI Prompt 配置
  prompt: {
    positive: string;      // 正向提示词
    negative?: string;     // 负向提示词
    seed?: number;         // 随机种子 (固定种子可复现)
    cfg_scale?: number;    // 提示词权重 (1-30)
    steps?: number;        // 推理步数
    sampler?: string;      // 采样器
  };
  
  // 预览与示例
  preview_url?: string;
  sample_images: string[]; // 示例效果图
  
  // 元数据
  description?: string;
  visibility: StyleVisibility;
  creator_id: string;
  creator_name?: string;
  
  // 使用统计
  usage_count: number;
  rating?: number;         // 评分 1-5
  rating_count?: number;
  
  // 版本控制 (支持风格迭代)
  version: number;
  parent_style_id?: string; // 派生自哪个风格
  
  // 时间戳
  created_at: string;
  updated_at: string;
}

/**
 * 风格模板 - 系统预设
 */
export interface StylePreset extends Style {
  is_system: true;
  order: number;           // 排序权重
  is_featured: boolean;    // 是否推荐
}

// ==================== 加工任务 ====================

/**
 * 加工任务状态
 */
export type ProcessingStatus = 
  | 'pending'      // 等待中
  | 'queued'       // 已入队
  | 'preprocessing' // 预处理中 (压缩/格式转换)
  | 'processing'   // AI 加工中
  | 'postprocessing' // 后处理中 (水印/导出)
  | 'completed'    // 完成
  | 'failed'       // 失败
  | 'cancelled';   // 已取消

/**
 * 加工类型
 */
export type ProcessingType = 
  | 'single'       // 单图加工
  | 'batch'        // 批量加工
  | 'variation'    // 生成变体 (同风格多版本)
  | 'refinement';  // 局部微调

/**
 * 加工任务
 */
export interface ProcessingJob {
  job_id: string;
  type: ProcessingType;
  status: ProcessingStatus;
  
  // 输入
  input_assets: string[];      // 输入图片 asset_id 列表
  style_id: string;            // 使用的风格
  
  // 自定义参数 (覆盖风格的默认参数)
  custom_params?: {
    prompt_override?: string;  // 完全覆盖提示词
    prompt_append?: string;    // 追加提示词
    strength?: number;         // 重绘幅度 (0-1)
    seed?: number;
    cfg_scale?: number;
  };
  
  // 输出
  output_assets?: string[];    // 输出图片 asset_id 列表
  output_urls?: string[];      // 临时下载链接
  
  // 进度与预估
  progress: number;            // 0-100
  estimated_seconds?: number;  // 预估剩余时间
  queue_position?: number;     // 队列位置
  
  // 成本
  credits_cost: number;
  credits_charged: boolean;
  
  // 错误信息
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  
  // 关联任务 (用于多轮微调)
  parent_job_id?: string;
  child_job_ids?: string[];
  
  // 元数据
  created_at: string;
  started_at?: string;
  completed_at?: string;
  created_by: string;
}

/**
 * 批量加工配置
 */
export interface BatchProcessingConfig {
  // 输入配置
  input_assets: string[];
  
  // 风格配置
  style_id: string;
  
  // 输出配置
  output_options: {
    format: 'jpg' | 'png' | 'webp';
    quality: number;           // 压缩质量 1-100
    max_dimension?: number;    // 最大边长
    watermark?: boolean;       // 是否加水印
  };
  
  // 批量特定选项
  batch_options: {
    maintain_consistency: boolean;  // 保持风格一致性 (使用相同 seed)
    generate_variations: boolean;   // 每张图生成多个变体
    variation_count?: number;       // 变体数量
  };
  
  // 通知配置
  notification?: {
    on_complete: boolean;
    on_failure: boolean;
    email?: string;
  };
}

// ==================== 局部微调 (Inpainting) ====================

/**
 * 局部微调区域
 */
export interface RefinementMask {
  mask_id: string;
  type: 'brush' | 'rectangle' | 'ellipse' | 'lasso';
  // 归一化坐标 (0-1)
  coordinates: number[];       // 根据类型不同: [x1,y1,x2,y2] 或点数组
  
  // 微调指令
  instruction: string;         // 自然语言指令: "把背景换成户外"
  
  // 保护区域 (保持不变的区域)
  is_protect?: boolean;
}

/**
 * 局部微调任务
 */
export interface RefinementJob extends ProcessingJob {
  type: 'refinement';
  base_job_id: string;         // 基于哪个加工结果
  base_output_index: number;   // 基于第几张输出图
  masks: RefinementMask[];     // 遮罩区域
  preserve_original: boolean;  // 是否保留原始内容
}

// ==================== 风格市场 ====================

/**
 * 风格收藏
 */
export interface StyleCollection {
  collection_id: string;
  name: string;
  description?: string;
  style_ids: string[];
  creator_id: string;
  visibility: StyleVisibility;
  created_at: string;
}

/**
 * 风格使用记录
 */
export interface StyleUsage {
  usage_id: string;
  style_id: string;
  job_id: string;
  user_id: string;
  rating?: number;             // 用户评分
  feedback?: string;           // 文字反馈
  created_at: string;
}

// ==================== 组件 Props ====================

export interface StyleSelectorProps {
  selectedStyleId?: string;
  onSelect: (style: Style) => void;
  category?: StyleCategory;
  showPreview?: boolean;
  allowCustom?: boolean;
}

export interface StyleCardProps {
  style: Style;
  isSelected?: boolean;
  isFeatured?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
  onFavorite?: () => void;
  showRating?: boolean;
}

export interface ProcessingPanelProps {
  job?: ProcessingJob;
  onCancel?: () => void;
  onRetry?: () => void;
  onRefinement?: (outputIndex: number) => void;
  showComparison?: boolean;    // 显示原图对比
}

export interface BatchProcessingPanelProps {
  config: BatchProcessingConfig;
  onConfigChange: (config: BatchProcessingConfig) => void;
  onStart: () => void;
  jobs: ProcessingJob[];
  overallProgress: number;
}

export interface RefinementEditorProps {
  imageUrl: string;
  masks: RefinementMask[];
  onMasksChange: (masks: RefinementMask[]) => void;
  onInstructionChange: (maskId: string, instruction: string) => void;
  onSubmit: () => void;
}

// ==================== API 请求/响应 ====================

export interface ListStylesRequest {
  category?: StyleCategory;
  visibility?: StyleVisibility;
  search?: string;
  tags?: string[];
  sort_by?: 'popular' | 'newest' | 'rating' | 'usage';
  page: number;
  page_size: number;
}

export interface ListStylesResponse {
  styles: Style[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateJobRequest {
  type: ProcessingType;
  input_assets: string[];
  style_id: string;
  custom_params?: ProcessingJob['custom_params'];
  parent_job_id?: string;
}

export interface CreateJobResponse {
  job: ProcessingJob;
  estimated_wait_seconds: number;
}
