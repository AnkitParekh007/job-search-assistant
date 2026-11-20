# Asset register

Everything a viewer sees or hears in the films, and where it comes from.

| Asset | Source | License | Notes |
|---|---|---|---|
| Illustrated scenes (kitchen, night window, tea table, pottery wheel, train window, monitor, auto-reports) | Drawn in code for this campaign, `src/Illustrations.tsx` | Project (MIT) | Original. No stock, no generated footage, no third-party art. Replaces the old LIVE-ACTION SLOT placeholders |
| App screen recreations | Drawn in code, `src/shared.tsx`, labels copied from `packages/ui` | Project (MIT) | Sample data only, labelled "In the app · sample data" |
| Presenter avatars | Drawn in code with three.js, `src/Avatar.tsx` | Project (MIT) | Original stylised characters |
| Voiceover | Kokoro-82M v1.0 via `kokoro-onnx`, voices `am_michael`, `af_heart`, `am_fenrir` | Apache-2.0 (model and voices), MIT (`kokoro-onnx`) | Generated locally. Synthetic voices; no real person's voice |
| Score | Synthesised from scratch, `tools/score.py` | Project (MIT) | No samples, no third-party audio |
| Fonts | Bricolage Grotesque, Figtree, Instrument Serif, JetBrains Mono via `@remotion/google-fonts` | SIL Open Font License 1.1 | Embedding in video is allowed |
| Ascend mark | Product brand mark, from the market site | Project | |
| Remotion | `remotion`, `@remotion/*` 4.0.545 | Remotion License | Free for individuals and companies of up to 3 people; larger companies need a company license. Confirm before paid use |
| three.js, @react-three/fiber | npm | MIT | |

Fictional names used on screen: Daniel Okafor, Priya Raman, Tomás Herrera, Larkspur Labs, Meridian Health,
Northwind Logistics, Fernhill Studio, Harbor & Pine, Coastline Retail, `careers.example.com`. Company names carry
a "(sample)" or "· sample" marker on app screens. Clear them with a trademark search before paid media.
