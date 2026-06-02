# Menu Acceptance TDD Governance

## Goal

Menu release quality is judged by executable critical journeys, not by `typecheck/build passed` alone. This governance file converts the Menu business promise into acceptance examples, frontend/runtime gates, backend/API smoke, and SelfCheck evidence.

## Status vocabulary

- `PASS`: product route, frontend interaction, backend/API state, and Platform/runtime dependency all passed.
- `PASS_WITH_NOTES`: the product path passed; non-blocking visual, i18n, or external dependency notes remain.
- `PARTIAL_PASS`: static/unit/API checks passed, but browser/runtime evidence is missing.
- `BLOCKED`: product path is wired but an external dependency prevents terminal verification, e.g. ComfyUI 8188 unreachable.
- `FAIL`: Menu frontend/backend contract or product behavior is broken.

## P0 critical journeys

### P0-1 Registration / login / package activation / visible allowance

```gherkin
Given a new restaurant user registers
When registration succeeds and the user enters Dashboard
Then Platform package activation is called
And the user receives initial menu.render.call allowance
And Dashboard shows remaining generation allowance
And package/provider/runtime/internal fields are not visible
```

Required gates:

- Backend service/handler tests: register/login call Platform package activation and return access context.
- API smoke: register or login, then read wallet/quota summary.
- Browser smoke: Dashboard credits card and package card are visible after authenticated state.

### P0-2 Template Center → Use Template → Studio prefill

```gherkin
Given a user opens Template Center
When the user selects a menu marketing template
Then required asset slots are shown
And Use Template opens Studio
And Studio preserves template_id, target platform, input slots, and prefilled job context
```

Required gates:

- Template list/filter/pro lock/detail/use contract.
- `prefilled_job` carries creative source and resolved strategy.
- Frontend route/context handoff does not lose `template_id`, `target_platform`, or `input_slots`.

### P0-3 Single-image generation

```gherkin
Given the user uploads one dish photo
When the user clicks Generate
Then Menu creates an image_to_image task
And Platform runtime job input_mode is image_to_image
And the frontend shows queued/running/completed or failed from real job state
```

Required gates:

- Asset registration returns Menu-owned signed URLs.
- Job create includes `source_asset_ids` and role-aware `source_assets`.
- Progress polling stops on terminal states.
- History can show the result or failure.

### P0-4 Four-slot multi-image generation

```gherkin
Given the user selects a template requiring multiple materials
And provides dish_photo + brand_logo + menu_reference + style_reference
When the user clicks Generate
Then Menu submits role-aware source_assets
And input_mode is multi_image
And Platform only routes to comfyui_bridge
And volcengine cannot silently consume multi-image jobs
And more than four materials fails closed
```

Required gates:

- Four-slot UI exists and preserves role semantics.
- Menu strategy resolver normalizes readiness sentinels to executable modes.
- Runtime manifest contains role-aware source assets.
- Provider routing filters by input mode and fails closed for unsupported providers.

### P0-5 Insufficient allowance / billing state

```gherkin
Given the user has insufficient allowance
When the user clicks Generate
Then no real generation task is created
And the frontend shows friendly user-facing guidance
And internal errors such as STUDIO_BILLING_ALLOWANCE_INSUFFICIENT are not shown
```

Required gates:

- reserve / consume / release paths are tested.
- button lock/error toast is visible.
- backend error wrapping preserves stable `error_code` for clients while UI copy remains customer-facing.

## P1 journeys

### P1-1 History / Library result review

```gherkin
Given the user has generation jobs
When the user opens History or Library
Then source assets, generated variants, selected variants, and understandable failure reasons are visible
And raw provider/runtime/callback data is hidden
```

### P1-2 Mobile / i18n / long-copy layout

```gherkin
Given the user switches TH / EN / ZH
When opening Studio / Template Center / Dashboard
Then primary CTAs, cards, four slots, and bottom action bars do not overflow, overlap, or truncate critical actions
```

## Release acceptance output

Every Menu release/checkpoint should report:

```text
Menu Critical Journey PASS:
- 注册/登录/额度：PASS|PASS_WITH_NOTES|BLOCKED|FAIL
- Template Center 使用模板：PASS|PASS_WITH_NOTES|BLOCKED|FAIL
- Studio 单图生成：PASS|BLOCKED by provider|FAIL
- Studio 多图四槽：PASS|BLOCKED by ComfyUI 8188|FAIL
- Quota 不足防呆：PASS|FAIL
- History/Library 回看：PASS_WITH_NOTES|FAIL
- i18n/mobile：PASS_WITH_NOTES|FAIL
```

Always distinguish product wiring, frontend clickability, backend persistence, Platform/runtime completion, and external provider readiness.
