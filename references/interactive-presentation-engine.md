# Interactive presentation engine

Read this reference whenever the HTML output includes animation, parameter controls, dynamic figures, scientific demos, presenter mode, or PowerPoint export from an interactive review.

## 1. Component and state contract

Treat every page as an independent `.interactive-slide` component. Each slide declares:

- stable slide and element IDs;
- optional ordered reveal steps and their speaking purpose; static pages have no reveal steps;
- optional interactions and allowed parameter values or ranges;
- an initial state, a reviewed state, and one deterministic export state;
- a no-motion representation that conveys the same meaning;
- source/evidence references for every factual value shown in any state.

Keep state serializable as JSON. A theme change must not reset comments, reveal progress, parameter values, or export choices. Moving to another slide may reset transient animation progress only when the slide specification says so.

## 2. Animation grammar

Start with a complete static slide. Add a dynamic effect only when its explanatory benefit is clear. Do not enforce an animation quota or give every page, title, paragraph, node, or arrow an entrance effect merely because the engine supports it.

- Show agendas, summaries, standard evidence pages, and overview workflows as complete compositions by default. A five-step research workflow normally appears together so the audience can see its relationships.
- Use progressive reveal for a derivation that needs explanation, an image that benefits from focused annotation, or a comparison where changing states clarifies a difference. Parameter interaction is appropriate only when supported states show a meaningful dependency.
- If a process genuinely needs temporal explanation, group related nodes and arrows into a few meaningful speaking steps. Do not equate the number of nodes with the number of clicks.
- Keep optional page transitions subtle. A static page needs no reveal-step controls or empty animation progress counter. On a page with no reveal steps, next/previous advances pages directly.
- Record a short explanatory purpose in the slide specification for each planned dynamic effect. If the effect adds only decoration or slows comprehension, omit it.

Supported entrance patterns are `fade`, short-axis `slide`, restrained `zoom`, and `stagger`. Use durations around 180–600 ms and easing that settles without bounce. Sequence elements according to the spoken argument, not DOM order alone.

Element-level control may target titles, images, formulas, chart series, data modules, flow nodes, arrows, annotations, and citations. A click, keyboard action, or presenter control advances exactly one meaningful reveal step. Provide previous-step and reset actions for rehearsal.

Use continuous motion only when it represents a continuous phenomenon:

- **light flow:** a subtle masked gradient following an optical or causal path;
- **signal ripple:** a low-amplitude wave or pulse tied to a sensor, waveform, or propagation process;
- **arrow animation:** stroke-dash progression or a small marker moving along an SVG path;
- **parameter change:** a short, interruptible interpolation between valid states.

Stop or greatly reduce looping motion after it has communicated the point. Never animate citations or dense body text decoratively. Disable nonessential effects under `prefers-reduced-motion`.

## 3. Interaction modules

Use controls only when they add explanatory value. Supported modules include:

- range sliders and discrete selectors for parameters such as NFFT, window length, threshold, regularization, or model depth;
- before/after and baseline/proposed toggles;
- reveal controls for equations and derivations;
- image focus controls for highlight regions, local magnification, animated leader lines, and parameter callouts;
- dynamic chart, SVG, or Canvas updates;
- play/pause/reset for a bounded scientific process.

Every parameter control requires a visible label, current value, unit when applicable, valid range or choices, keyboard access, and a reset action. Debounce expensive updates. Never imply continuous precision when only discrete source values exist.

For example, an NFFT selector may expose 32, 64, 128, and 256 only if the source data or an explicitly labeled simulation supports those states. Changing it may update an STFT panel, error curve, and performance metric from the same state object. Do not fabricate intermediary results.

## 4. Scientific visualization

Prefer SVG for diagrams, arrows, formulas, callouts, and line-based animation; Canvas for dense signals, heatmaps, or rapidly redrawn fields; and semantic HTML for text and controls. Chart.js or D3 may be used when they materially reduce risk or improve interaction, but store a pinned local copy under `assets/vendor/` and record the version. No CDN dependency is allowed.

Dynamic visualizations must preserve honest axes, scales, units, baselines, uncertainty, sample identity, and labels. On each update:

1. validate the input state;
2. update the graphic and all dependent labels from one source of truth;
3. announce the change accessibly when material;
4. avoid layout shifts;
5. expose a deterministic static representation for export.

## 5. Progressive scientific explanation

Equations should reveal by semantic groups rather than individual characters. For a formula such as `w = R⁻¹a / (aᴴR⁻¹a)`, a valid sequence might introduce `R⁻¹`, then the steering vector `a`, then the normalization denominator, and finally the complete expression. The full formula must exist in the no-motion and export states.

For images, allow a restrained focus sequence: full image, highlighted region, optional magnified inset, animated leader line, and concise explanation box. Never crop away context needed to interpret evidence. Preserve the unmodified source image separately when overlays are added.

For processes, show the complete labeled workflow by default. Use causal or temporal reveals only when understanding the sequence requires them, following the decision rules above. A moving signal marker may reinforce a scientifically relevant direction but cannot replace labels or arrowheads.

## 6. Presenter mode

Presenter mode hides editing, annotations, theme controls, thumbnails, and authoring chrome. Show only:

- the current 16:9 slide;
- page number and optional section label;
- minimal previous/next and reveal-step controls;
- optional play/pause/reset only when the slide contains continuous motion.

Support keyboard navigation and fullscreen entry. Presenter mode must never expose private review comments, validation notes, source file paths, or unreleased backup material.

## 7. Theme system

Provide three academically restrained presets derived from semantic tokens such as:

- `--surface`, `--surface-raised`, `--ink`, `--muted`, `--structure`, `--accent`, `--line`, `--positive`, `--warning`;
- chart-series tokens and texture opacity;
- focus-ring and reduced-motion tokens.

A suitable default set is:

1. **Paper Navy** — warm paper, deep navy structure, restrained oxide accent;
2. **Mineral Blue** — cool grey paper, slate-blue structure, muted cyan accent;
3. **Carbon Umber** — ivory paper, charcoal structure, controlled umber accent.

Adapt names and exact values to the research topic, but keep all three formal, low-saturation, and meaning-preserving. The selected theme must apply consistently to slides, charts, controls, presenter mode, review mode, and export mode.

## 8. Interactive HTML mode and export PPT mode

### Mode A: Interactive HTML

Retain live reveal steps, hover/focus feedback, parameter controls, dynamic SVG/Canvas/charts, review tools, and presenter mode. It must run locally and without the network.

### Mode B: Export PPT

The final PPT cannot depend on browser JavaScript. Before export:

- freeze every interaction at the approved export state;
- stop continuous motion and materialize its meaningful path or endpoint;
- convert progressive explanations to native PPT animations when reliable, otherwise to sequential duplicate slides;
- reproduce charts, formulas, arrows, and diagrams as editable PowerPoint objects whenever practical;
- use SVG or high-resolution images only where native reconstruction would reduce fidelity, and never flatten an entire slide merely for convenience;
- record the theme, parameters, reveal endpoint, and any static substitutions in the build record.

If a live demo is essential, keep it as an accompanying HTML artifact and make the PPT independently understandable without it. Do not claim that a hyperlink or embedded screenshot preserves the interaction.

## 9. Module responsibilities

- `js/animation.js`: reveal timeline, step navigation, entrance effects, reduced-motion behavior, and export freeze.
- `js/interaction.js`: theme selection, sliders/selectors, before/after toggles, image focus, presenter mode, keyboard control, persistence, and state serialization.
- `js/chart.js`: chart/SVG/Canvas rendering and updates from validated state; no review or navigation logic.
- `css/style.css`: layout, three theme token sets, paper texture, focus states, animation classes, presenter/review modes, print/export rules.

Keep slide-specific data and behavior close to its slide component. Shared modules must not contain hard-coded research claims.
