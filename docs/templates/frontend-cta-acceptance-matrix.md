# Menu Frontend CTA Acceptance Matrix

| Surface | CTA | Must do | Must not expose |
| --- | --- | --- | --- |
| Dashboard | Start creating | Navigate to Studio with authenticated context | package/provider/runtime fields |
| Dashboard | Template Center | Navigate to `/dashboard/templates` | internal entitlement names |
| Template Center | Use Template | Preserve template_id, target platform, input slots | raw `prefilled_job` JSON |
| Studio single image | Generate | Submit one source asset as image_to_image | provider/runtime/callback internals |
| Studio multi image | Generate | Submit four role-aware source_assets as multi_image | silent volcengine fallback |
| Studio insufficient quota | Generate | Block/guide user with friendly copy | `STUDIO_BILLING_*` raw code |
| History/Library | Review result | Show source/result/selected variant | runtime_job_id/provider_job_id/callback payload |
