# Menu Quality Assurance Gap Closure Plan

## 目标

把 Menu 从“若干测试能跑通”提升为主流软件工程意义上的质量保障闭环：业务验收可执行、契约可审计、变更影响可选择门禁、前端真实交互可复现、后端状态机可验证、Platform 依赖和外部 provider 健康分层报告。

本计划覆盖：`menu-frontend`、`menu-backend`、Platform runtime/commercial 依赖、SelfCheck/CI 治理。

## 当前实证基线（2026-06-07 本地检查）

已通过：

- `menu-frontend`：`npm run acceptance:governance` → PASS
- `menu-frontend`：`npm run frontend:gate` → PASS
- `menu-frontend`：`npm run typecheck` → PASS
- `menu-frontend`：`npm run check:i18n` → PASS
- `menu-frontend`：`npm run build` → PASS
- `menu-frontend`：`npm run lint` → 0 errors，3 warnings（Fast Refresh 组件/工具导出混用）
- `menu-frontend`：`npm run test:e2e:mock -- --reporter=list` → mocked/offline regression 12 passed
- `menu-frontend`：`npm run test:e2e` 现在是 real API 优先入口；没有 local/dev fixture token、write approval 与 cleanup acknowledgement 会 fail-closed 拒绝执行
- `menu-frontend`：`npm run test:visual -- --reporter=list` → 6 passed
- `menu-backend`：`node --check scripts/menu-contract-smoke.mjs` → PASS
- `menu-backend`：`node --check tests/smoke/menu-contract-smoke.mjs` → PASS
- `menu-backend`：`go test ./... -count=1` → PASS

当前已具备：

- P0/P1 critical journey 文档与 `contract-governance/critical-journeys.json`
- 前端 mocked Playwright business flow：Template Center → Studio → 四槽素材 → multi-image job → result actions
- 前端 automation/governance gate
- 后端 Studio/Auth/User/TemplateCenter/Referral/Channel/Share 模块测试
- HTTP-only Menu contract smoke 脚本

## 主要短板

### G1. Contract artifact 与后端源码存在漂移风险

实证发现：`docs/openapi/swagger.json` 中 `CreateGenerationJobInput` 已声明 `input_mode`、`generation_strategy`、`source_assets`，但当前 Go 源码 `internal/modules/studio/service_types.go` 的 `CreateGenerationJobInput` 只接收 `source_asset_ids`，未接收这些字段。

风险：前端 mock E2E 和 OpenAPI 看起来支持 role-aware multi-image，但真实后端可能忽略 `source_assets/input_mode/generation_strategy`，导致“测试绿、真实业务不闭环”。

门禁：

- OpenAPI 重新生成后必须无 drift。
- Consumer sweep 必须检查前端实际 payload 字段与 Go DTO 同步。
- 真实 API smoke 必须断言 runtime manifest 中存在 role-aware `source_assets[]`、`input_mode=multi_image`、`provider=comfyui_bridge`。

### G2. 前端 E2E 已拆成 mocked/offline 与 real API，不能再混报

当前 Playwright 保留 mocked/offline regression 来稳定验证 UI 编排和错误态；默认 `npm run test:e2e` 已改为 real API 入口，必须提供 local/dev fixture token、写入批准和 cleanup acknowledgement，否则 fail-closed。

风险：无法证明真实 `menu-backend`、Platform commercial/runtime、storage、provider route、billing ledger 联通。

门禁：

- 新增 local/dev safe live smoke：默认 dry-run；执行模式要求 dev/local URL、fixture token、write approval、cleanup acknowledgement。
- 分层状态报告：mock browser PASS ≠ real API PASS ≠ runtime/provider PASS。

### G3. 后端 multi-image / role-aware / fail-closed 状态机需要补足生产形状

当前源码层没有明显的 `SourceAssetInput`、`input_mode`、`generation_strategy` DTO 与 service 级五图拒绝逻辑；`docs/qa/CRITICAL_JOURNEYS.md` 还引用了不存在的 `generation_strategy_test.go`、`service_history_test.go` 文件名。

风险：关键 P0-4 业务能力停留在文档/前端 mock 层，后端真实链路没有足够可审查证据。

门禁：

- 后端 DTO：`source_assets[]` role、`input_mode`、`generation_strategy` 明确建模。
- service tests：1 图→`image_to_image`；2-4 role-aware 图→`multi_image`；5 图→typed 400 `STUDIO_SOURCE_ASSETS_LIMIT_EXCEEDED`。
- runtime manifest tests：角色、asset id、provider/input mode 全部落入 Platform request。
- unsupported provider negative case：`volcengine + multi_image` fail closed，不降级不截断。

### G4. CI 覆盖不均衡

`menu-backend` 有 GitHub CI（guardrails + `go test ./...`），但 `menu-frontend` 当前未发现 `.github/workflows`。

风险：前端质量门禁依赖本地运行，PR/push 不能自动阻断退化。

门禁：

- `menu-frontend` CI：`typecheck`、`check:i18n`、`build`、`acceptance:governance`、`frontend:gate`、`test:e2e`，必要时 nightly/label 触发 `test:visual`。
- `menu-backend` CI 升级：增加 OpenAPI drift、smoke script syntax、focused package tests、coverage report。

### G5. 质量维度仍缺 SLO/observability/security/accessibility 的执行化

已有 GenAI observability/security baseline 文档，但 Menu 侧还没有足够的 journey-level 可运行证据。

风险：上线后只能靠人工看日志，不能在生成失败率、provider route drift、quota ledger 异常、用户可见错误泄露等方面 fail-closed。

门禁：

- SLI：注册成功率、template use 成功率、asset upload 成功率、job create 成功率、terminal completion latency、failed/canceled ratio、quota reserve/release mismatch。
- Observability：request_id/trace_id 贯穿前端 API、Menu backend、Platform runtime、provider callback、quota ledger。
- Security：用户可见文案禁止 `runtime/provider/callback/package_activation/STUDIO_*` 泄露；token/secret/image source 不落日志。
- Accessibility/i18n：核心路由桌面+移动、ZH/EN/TH 长文案、键盘可达、表单 label/aria 基线。

## 主流质量保障框架映射

### 1. ATDD / BDD：业务验收先行

Menu P0/P1 journey 是验收真相源：

- P0-1 注册/登录/套餐激活/额度可见
- P0-2 Template Center → Use Template → Studio prefill
- P0-3 单图 image_to_image generation
- P0-4 四槽 multi_image generation
- P0-5 额度不足 fail closed
- P1-1 History/Library readback
- P1-2 mobile/i18n long-copy layout

每条 journey 必须有：业务规则、正常/负例、可执行 gate、证据路径、cleanup、状态语义。

### 2. Test Pyramid + Testing Trophy

- Unit/service：策略解析、quota/billing、状态机、错误映射、DTO normalizer。
- Contract：OpenAPI drift、consumer sweep、callback/provider manifest、DTO snapshots。
- Integration/API：HTTP smoke + fixture auth + cleanup。
- Browser E2E：真实 UI、payload capture、console/network、visual/mobile。
- Observability/SLO：runtime DB/log/trace/metrics 证据。

### 3. Consumer-driven Contract / OpenAPI Governance

后端生产者和前端消费者必须同时过：

- producer OpenAPI/schema conformance
- schema breaking-change diff
- frontend service-layer concrete path sweep
- generated/static type drift check
- real envelope smoke

### 4. Change-impact selector

任何变更先映射到 owning layer 和 journey：

- `menu-backend/internal/modules/studio/**` → P0-3/P0-4/P0-5/P1-1
- `menu-backend/internal/modules/templatecenter/**` → P0-2/P0-4
- `menu-backend/internal/modules/auth|user/**` → P0-1/P0-5
- `menu-frontend/src/pages/studio/**`、`src/services/studio.ts`、`src/store/studioStore.ts` → P0-3/P0-4/P0-5/P1-1/P1-2
- `menu-frontend/src/pages/dashboard/DashboardTemplateCenterPage.tsx`、`src/services/templateCenter.ts` → P0-2/P0-4
- Playwright/contract/smoke scripts → same gate they protect

### 5. Release rings + evidence contract

- Local static：typecheck/build/go test/OpenAPI drift
- Local mocked browser：Playwright P0 journey
- Local/dev real API：safe fixture smoke + cleanup
- Cloud/dev runtime：register → quota → upload → job → runtime manifest/result/history
- Prod read-only：health/template/offering/provider/drift/logs
- Prod write smoke：只在批准后执行，带 cleanup 和 ledger evidence

## 分阶段补齐路线

### Phase A：质量基线和契约真相修正（优先）

目标：消灭“文档/前端 mock/Swagger 绿，但 Go DTO 不接收字段”的假闭环。

交付：

- 后端 `CreateGenerationJobInput` 增加 role-aware `source_assets[]`、`input_mode`、`generation_strategy` DTO。
- service 层根据 source assets 解析 executable strategy，禁止 `ask_for_required_input` 进入 runtime。
- 4 图 allow / 5 图 reject / unsupported provider reject 测试。
- 重新生成 OpenAPI，并增加 drift gate。
- 修正文档中不存在的测试文件名引用。

验证：

- `go test ./internal/modules/studio ./internal/modules/templatecenter -count=1`
- `go test ./... -count=1`
- `./scripts/gen-swagger.sh` 后 git diff 只包含预期 contract 更新
- consumer sweep：前端 `CreateJobRequest` 与 Go DTO 字段一致

### Phase B：前端 CI 和 business-flow gate 自动化

目标：PR/Push 自动阻断前端业务流回归。

交付：

- `menu-frontend/.github/workflows/ci.yml`
- CI 运行 `typecheck`、`check:i18n`、`build`、`acceptance:governance`、`frontend:gate`、`test:e2e`
- visual/mobile 可放 nightly 或手动触发
- 修复当前 lint warnings，避免 warning debt 固化

验证：

- `npm run ci:quick`
- `npm run test:visual`
- `npm run lint` 0 warning 或明确豁免

### Phase C：Safe live smoke harness

目标：把 mock browser PASS 升级为 real API PARTIAL/PASS，且不误伤生产。

交付：

- `menu-backend/scripts/menu-live-business-smoke.mjs` 或 Python harness
- 默认 dry-run，只读 health/template/offering/schema
- execute 模式要求：`MENU_SMOKE_ENV=local|dev`、非 prod URL、fixture token、write approval、cleanup acknowledgement
- 证据 JSON：auth、quota、asset upload、job create、manifest、history、cleanup、redaction、final_status

验证：

- dry-run safe refusal tests：prod-like URL 必须拒绝
- local/dev fixture smoke：成功后 cleanup evidence 存在
- failed dependency 分类：routing PASS / provider-infra BLOCKED

### Phase D：SelfCheck selector + evidence contract

目标：让 Menu 质量门禁进入统一控制面。

交付：

- SelfCheck feature：`menu-critical-journey-gates`
- selector 覆盖 backend modules、router、frontend service/store/pages、test/smoke scripts
- evidence validator：`NOT_RUN/BLOCKED/FAIL/non-zero exit_code` 不允许伪装成 PASS
- 变更影响报告：changed files → affected journeys → required gates

验证：

- `scripts/requirement-gate.sh menu-critical-journey-gates static requirement.changed.v.menu-critical-journey-gates`
- selector smoke：真实 Menu core file 能选中对应 gate
- negative evidence：live smoke NOT_RUN 时 final_status 只能 PARTIAL_PASS/PASS_WITH_NOTES，不能 PASS

### Phase E：Observability / SLO / release readiness

目标：上线后可监控、可回滚、可定位。

交付：

- Menu journey SLI/SLO dashboard spec
- runtime/provider/quota ledger correlation checklist
- prod read-only smoke runbook
- release acceptance report template

验证：

- request_id/trace_id 样例从 frontend API → Menu backend → Platform runtime 能串起
- recent runtime job / quota ledger / provider failures 可查询并分类
- release report 分层输出 code gate、contract、live read-only、runtime、frontend journey、provider infra

## 第一批建议工程切片

1. **后端真实 multi-image contract 补齐**：这是当前最大假闭环风险。
2. **前端 CI 落地**：把已能跑的门禁变成自动阻断。
3. **OpenAPI drift + consumer sweep**：防止 Swagger/Go/TS 三方再次不一致。
4. **safe live smoke dry-run + unsafe target refusal**：先不做 quota-consuming runtime，先建立安全执行边界。
5. **SelfCheck static selector 接入**：先让 Menu core paths 能选中 P0 gates。

## 状态语义

最终报告必须分层，禁止一句“已通过”混淆：

- mocked frontend business E2E
- frontend build/type/i18n/lint/visual
- backend unit/service/handler tests
- OpenAPI/consumer contract
- local/dev real API smoke
- Platform commercial/quota ledger
- Platform runtime/provider route
- external provider infrastructure
- cloud/prod read-only or write smoke

只有这些层级都按 scope 验证完成，才能说 Menu business closure PASS。
