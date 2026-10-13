# Academic deck QA

Use this checklist after authoring and after every material revision.

## Argument audit

- Can the audience state the research problem, gap, question, approach, evidence, and conclusion without guessing?
- Does every claimed contribution have direct evidence or an explicit planned validation?
- Are causal statements supported by the design, rather than by correlation alone?
- Are alternatives, failure cases, boundary conditions, and negative results represented where they affect the conclusion?
- Does the conclusion answer the stated questions without introducing new claims?

## Method and result audit

- Check dataset identity, sample counts, inclusion criteria, preprocessing, leakage risk, split strategy, controls, baselines, hyperparameter fairness, metrics, units, error bars, and statistical tests.
- Recompute displayed percentages, differences, ratios, and totals when inputs are available.
- Ensure axes, legends, labels, significant digits, and uncertainty are readable and truthful. Avoid truncated axes unless clearly justified.
- Mark preliminary, simulated, adapted, normalized, or expected results explicitly.
- Verify that screenshots of tools or code do not substitute for evidence of correctness.

## Citation audit

- Trace every nontrivial factual claim, borrowed visual, and literature comparison to a specific source location.
- Check that citations actually support the nearby claim and that author, year, title, DOI, figure, and page details are consistent.
- Preserve contradictory evidence and important caveats.

## Slide and delivery audit

- Before approval, verify that the HTML presentation supports annotations, direct text edits, local persistence, three tone presets, presenter mode, deterministic export states, and export without network access.
- Confirm that HTML foreground elements pass overflow, bounds, and unintended-overlap checks; inspect intentionally overlapping background layers separately.
- Treat **text content outside its text box** as a separate blocking defect. Check every text-bearing element for `scrollWidth > clientWidth`, `scrollHeight > clientHeight`, clipped descendant line boxes, CSS line-clamp loss, and text that becomes hidden after a theme, reveal step, parameter value, presenter-mode, or viewport change.
- Render every slide and inspect it visually at normal viewing size.
- Check clipping, overlap, broken glyphs, low contrast, distorted images, unreadable chart labels, inconsistent alignment, and accidental animations or transitions.
- Exercise every reveal step, slider endpoint, discrete parameter choice, before/after toggle, image-focus state, animated arrow/signal path, theme, and presenter-mode transition. Confirm that controls update all dependent values from one state object and never produce stale labels, empty charts, NaN, or layout shifts.
- Verify reduced-motion behavior and keyboard-only operation. No scientific meaning may depend exclusively on hover, continuous motion, or color.
- Compare each interactive slide's reviewed state with its deterministic export state. Confirm that the PPT remains understandable without JavaScript and that any HTML-only behavior is represented by a static state, native animation, or sequential slides.
- Confirm the requested total slide count, order, aspect ratio, template, language, and output format.
- Confirm that tables, charts, equations, and required diagrams remain editable when requested.
- Keep the title slide minimal and remove authoring comments, placeholders, unsupported superlatives, and private validation notes.
- Read speaker notes and citations for stale slide numbers or claims after rearrangement.
- After `confirmed`, compare the PPT against the approved HTML version for slide order, wording, figures, emphasis, selected theme, parameter states, reveal endpoints, and visual hierarchy. Document unavoidable differences instead of silently changing the design.

## Oral-defense audit

Create a private challenge list covering the weakest assumption, strongest competing explanation, least fair baseline, most fragile result, largest generalization leap, and most likely feasibility failure. Add backup slides only when they help answer a probable question and the requested format permits them.

## Speaker-script audit, when requested

- Confirm that every substantive slide has exactly one corresponding numbered script section and that cover, section divider, backup, and skipped slides are handled explicitly.
- Compare every number, unit, acronym, proper noun, formula, claim, caveat, and citation meaning between the final slide and script.
- Check that the script uses the requested Chinese, English, or bilingual arrangement and sounds natural when spoken rather than translated word for word.
- Verify that the script explains the visual and reasoning instead of reciting the slide text.
- Sum the per-slide timing and retain a rehearsal buffer. Treat calculated duration as an estimate until a real read-through confirms it.
- Recheck transitions after any slide insertion, deletion, or reorder.

Do not mark the PPT complete until the approved HTML, rendered deck, and evidence ledger agree. When a speaker script is requested, it must also agree with the final deck and ledger.
