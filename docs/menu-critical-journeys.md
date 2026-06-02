# Menu Critical Journeys

This is the human-readable companion to `contract-governance/critical-journeys.json`.

| ID | Journey | Gate level | Primary evidence |
| --- | --- | --- | --- |
| P0-1 | 注册 / 登录 / 套餐激活 / 额度可见 | Blocking | backend auth tests + API smoke + Dashboard browser smoke |
| P0-2 | Template Center → Use Template → Studio 预填 | Blocking | template API contract + Studio handoff browser smoke |
| P0-3 | 单图 image_to_image 生图 | Blocking | asset/job API contract + runtime manifest + polling UI |
| P0-4 | 四槽 multi_image 生图 | Blocking | role-aware source_assets + comfyui_bridge-only route + >4 fail-closed |
| P0-5 | 额度不足 / 扣费 / 结算状态 | Blocking | reserve/consume/release tests + sanitized UI error |
| P1-1 | History / Library 回看 | Release note | source/result/selected asset read model |
| P1-2 | 移动端 / i18n / 长文案布局 | Release note | zh/en/th desktop+mobile visual smoke |

## External dependency note

Menu may be `PASS` while real generation is `BLOCKED by ComfyUI 8188` when the product request, runtime manifest, and provider route are correct but downstream ComfyUI core is unreachable. Do not downgrade product wiring to FAIL unless Menu loses request semantics, persistence, or fail-closed behavior. Use PASS_WITH_NOTES when Menu journeys are executable but visual/i18n/provider-readiness notes remain non-blocking.
