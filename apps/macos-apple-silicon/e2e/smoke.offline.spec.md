# Gate A offline smoke checklist (manual)

Host: macOS Apple Silicon · Provider: **none** (offline) · Workspace: fresh empty folder

Mark each item only when observed on a real build.

## Launch & workspace
- [ ] App launches without prior workspace binding
- [ ] Connect / create workspace succeeds; scaffold files appear
- [ ] Relative workspace path is rejected; prior binding preserved on failed switch

## Profile
- [ ] Profile form reachable without finishing onboarding via Add portal
- [ ] Resume text/paste or profile fields save locally and survive restart
- [ ] Work authorization can remain unknown

## Manual job → apply confirm → track
- [ ] Add manual job without AI
- [ ] Create application; status is drafted (not “submitted”)
- [ ] Confirm-submit requires explicit confirmation
- [ ] Pipeline shows correct status after confirm
- [ ] No false “submitted” label for unconfirmed moves

## Integrity & packaging honesty
- [ ] Studio paste does not dump a raw Python traceback
- [ ] Find jobs / AI CTAs disabled when provider not ready
- [ ] No ATS optimization / universal pass-rate claims
- [ ] Developed vs verified label matches this build

## Privacy / network
- [ ] Offline path completes with no paid provider calls
- [ ] Secrets not written into workspace JSON
