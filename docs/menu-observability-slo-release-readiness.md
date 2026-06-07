# Menu Observability, SLO, and Release Readiness

This document is the executable release-readiness companion for the Menu P0/P1 critical journeys. It separates product wiring, backend persistence, Platform runtime/commercial dependencies, external provider health, and release evidence so that a mocked browser PASS is never overclaimed as a real production closure.

## Scope and status vocabulary

Use the same status vocabulary as `contract-governance/critical-journeys.json` and `menu-backend/docs/qa/CRITICAL_JOURNEYS.md`:

- `PASS`: the scoped layer was exercised and produced reviewable evidence.
- `PASS_WITH_NOTES`: the scoped layer passed with bounded non-blocking notes.
- `PARTIAL_PASS`: static/mock/contract evidence exists, but real API/runtime/browser evidence is missing.
- `BLOCKED`: Menu product wiring is correct, but an external dependency such as Platform runtime, quota ledger, or ComfyUI is unavailable.
- `FAIL`: Menu API/UI/persistence/fail-closed behavior is broken.

## Journey SLI/SLO dashboard spec

| Journey | SLI | Target SLO | Required dimensions | Primary evidence |
| --- | --- | --- | --- | --- |
| P0-1 Auth / package activation / allowance | `menu_auth_login_success_rate`, `menu_package_activation_success_rate`, `menu_quota_summary_success_rate` | 99.5% over 24h in dev/cloud smoke lane | `request_id`, `trace_id`, `organization_id`, `package_code`, `product_code=menu` | auth/session API, wallet/quota summary, Platform package activation logs |
| P0-2 Template Center → Studio handoff | `menu_template_use_success_rate` | 99% over 24h | `template_id`, `template_version_id`, `target_platform`, `input_slot_count` | template use response, frontend payload capture, OpenAPI contract sweep |
| P0-3 Single image generation | `menu_studio_single_job_create_success_rate`, `menu_studio_single_runtime_dispatch_success_rate` | 98% create, 95% dispatch in dev lane | `job_id`, `runtime_job_id`, `input_mode=image_to_image`, `provider_code` | Studio job record, Platform runtime manifest, charge reservation |
| P0-4 Four-slot multi-image generation | `menu_studio_multi_job_create_success_rate`, `menu_studio_multi_manifest_role_preservation_rate` | 98% create, 100% role preservation | `job_id`, `input_mode=multi_image`, `source_asset_role`, `provider_code=comfyui_bridge` | runtime manifest, consumer sweep, generation strategy tests |
| P0-5 Allowance / settlement fail-closed | `menu_quota_reserve_failure_rate`, `menu_charge_release_mismatch_count` | 0 false runtime dispatch when allowance is insufficient; quota reserve/release mismatch count stays 0 | `charge_session_id`, `reservation_id`, `settlement_id`, `billable_item_code` | charge summary, Platform quota ledger, negative UI/browser evidence |
| P1-1 History / Library | `menu_history_readback_success_rate`, `menu_library_readback_success_rate` | 99% over 24h | `job_id`, `asset_id`, `selected_variant_id` | history/library API, selected variant/readback UI |
| P1-2 Mobile/i18n/accessibility | `menu_frontend_critical_route_render_success_rate`, `menu_visual_overflow_failure_count` | 0 critical overflow regressions per release | `locale`, `viewport`, `route` | Playwright visual desktop/mobile and i18n checks |

## Correlation checklist

Every real API/runtime smoke or release report must attach a redacted sample that can be followed across layers:

1. **Frontend API**: request includes auth/org context; captured response has `request_id` and does not expose `runtime_job_id`, raw provider internals, callback internals, or `STUDIO_*` codes in user-facing copy.
2. **Menu backend**: structured access log/span includes `request_id`, `trace_id`, route, status, `organization_id`, `user_id`, `job_id` when applicable.
3. **Platform commercial/quota**: reservation/finalize/release record includes `charge_session_id`, `billable_item_code=menu.render.call`, `resource_type`, and final status.
4. **Platform runtime**: runtime job record includes `runtime_job_id`, `product_code=menu`, `provider_code`, `route_snapshot`, and `input_manifest`.
5. **Provider callback/result**: callback or provider error is classified as provider-infra `BLOCKED` only when Menu preserved request semantics, persistence, and fail-closed billing behavior.
6. **Cleanup**: write smoke has explicit cancel/release/readback evidence and no orphaned successful charge from synthetic QA data.

## Prod read-only smoke runbook

Prod read-only smoke must not create assets/jobs or consume quota. It may check:

```bash
MENU_BASE_URL=https://<approved-menu-host> node menu-backend/scripts/menu-contract-smoke.mjs
```

Allowed read-only checks:

- `/healthz`, `/api/v1/menu/health`
- Template Center meta/catalog/detail
- Commercial offerings
- Authenticated session/wallet/quota only when an approved read-only fixture token is available

Forbidden without explicit approval:

- `POST /api/v1/menu/studio/assets`
- `POST /api/v1/menu/studio/jobs`
- internal runtime/callback mutation routes
- provider-triggering generation or settlement writes

## Local/dev safe live smoke

Use the SelfCheck harness for local/dev writes only:

```bash
python3 /root/work/agentic-selfcheck/scripts/v_menu_safe_contract_smoke.py \
  --dry-run \
  --env local \
  --base-url http://127.0.0.1:8196 \
  --platform-base-url http://127.0.0.1:8195
```

Execute mode requires all of the following:

```bash
V_MENU_SMOKE_ALLOW_WRITES=1 \
V_MENU_SMOKE_CLEANUP_ACK=1 \
V_MENU_SMOKE_FIXTURE_TOKEN='[REDACTED]' \
python3 /root/work/agentic-selfcheck/scripts/v_menu_safe_contract_smoke.py \
  --execute \
  --env local \
  --base-url http://127.0.0.1:8196 \
  --platform-base-url http://127.0.0.1:8195
```

Expected report path:

- `/root/work/v/reports/evidence-contract/menu-studio-core-chain/v-menu-safe-contract-smoke.json`
- `/root/work/v/reports/evidence-contract/menu-studio-core-chain/latest.json`

## Release acceptance report template

```md
# Menu Release Acceptance Report

## Scope
- Commit / PR:
- Environment:
- Owner:
- Release ring: local static | mocked browser | local/dev real API | cloud/dev runtime | prod read-only | prod write-approved

## Layered status
| Layer | Status | Evidence path / command | Notes |
| --- | --- | --- | --- |
| Backend unit/service/handler |  |  |  |
| OpenAPI + consumer sweep |  |  |  |
| Frontend type/build/i18n/lint |  |  |  |
| Mocked frontend business E2E |  |  |  |
| Visual/mobile/i18n |  |  |  |
| Safe live smoke |  |  |  |
| Platform commercial/quota ledger |  |  |  |
| Platform runtime/provider route |  |  |  |
| External provider infrastructure |  |  |  |
| Prod read-only/write scope |  |  |  |

## Correlation sample
- `request_id`:
- `trace_id`:
- `job_id`:
- `runtime_job_id`:
- `charge_session_id`:
- Redaction reviewed: yes/no

## Negative cases
- insufficient allowance fail-closed:
- unsupported multi-image provider fail-closed:
- five source assets rejected:
- callback/provider failure classification:

## Decision
- Final status:
- Rollback path:
- Remaining blind spots:
```

## Executable readiness gate

Run from `menu-backend`:

```bash
node scripts/menu-release-readiness-check.mjs
```

The gate checks that this runbook, critical journey vocabulary, OpenAPI request correlation, safe smoke evidence, and evidence contract paths are present before a release report can claim closure.
