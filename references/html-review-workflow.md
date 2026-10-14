# HTML review workflow

Use this reference before creating or revising the review-stage HTML presentation. For animation, interaction, theme, presenter-mode, and export-state details, also read [interactive presentation engine](interactive-presentation-engine.md).

## Shared source of truth

Maintain a stable slide specification and evidence ledger before rendering. Each slide needs a durable ID, title, purpose, section, claim status, source links, ordered content elements, visual intent, reveal sequence, interaction definition when applicable, and deterministic export state. Generate both the interactive HTML and later PPT from this specification so revisions cannot diverge.

The HTML is simultaneously a review artifact and a runnable presentation. It is not the final PowerPoint. After approval, reproduce its approved export state with native editable slide objects instead of inserting full-slide screenshots.

## Required project form

Generate a modular authoring project:

```text
project/
|-- index.html
|-- slides/
|   |-- slide01.html
|   `-- slide02.html
|-- assets/
|   |-- images/
|   |-- svg/
|   `-- vendor/          # only when a pinned local library is justified
|-- js/
|   |-- animation.js
|   |-- interaction.js
|   `-- chart.js
`-- css/
    `-- style.css
```

`slides/` contains maintainable source components. The root `index.html` must also open directly from `file://` without a server or network access. Since browsers commonly block `fetch()` of local fragments, bundle slide markup into `index.html` during generation or use a file-safe equivalent. Keep the source modules and bundle version-locked.

## Review behavior

Preserve all of the following:

- 16:9 slide canvases with keyboard and visible previous/next navigation;
- a slide overview or thumbnail index;
- stable `data-slide-id` and `data-element-id` attributes; add `data-reveal-step` only for justified progressive explanations and `data-interaction-id` only for actual interactions;
- slide-level and element-level comments;
- explicit direct-text editing for every meaningful text run, including body copy, lists, table cells, figure captions, citations, and diagram labels with a semantic editing adapter;
- local persistence for comments, edits, selected theme, parameter choices, and approved export states;
- export controls for `review-comments.json`, the current slide specification, and the revised local HTML bundle;
- a concise instruction panel explaining review, editing, theme selection, interaction, presenter mode, save, and return.

Do not transmit review content. Escape user-provided text and never preserve uploaded scripts, event handlers, iframes, or executable markup.

Open in review mode with all substantive content visible and direct editing disabled. Preserve comments, text edits, themes, and parameter choices across upgrades; do not let a saved rehearsal step or editing flag produce an apparently empty page on reopening. Presenter mode follows the optional reveal plan, with static pages complete on entry.

## Three tone presets

Offer exactly three named, restrained academic tone presets unless the user requests another number. The initially displayed version is one of the three, not a fourth option. Themes must change semantic CSS variables rather than restyling individual elements. Each preset must preserve hierarchy, chart meaning, contrast, and formal academic character; avoid large pink fields, neon palettes, or internet-product styling.

Persist the chosen theme locally and include its ID in exported review comments. When the user sends standalone `confirmed`, lock that theme and the current export states into the approved version.

## Comment format

Use [the reusable review runtime](review-runtime.md). Default review mode is annotation mode: a click on any slide location, including whitespace and images, creates an anchor and opens a floating editor adjacent to it. Existing numbered pins reopen the corresponding comment. Clamp the editor to the viewport, reposition it on scroll/resize, and keep it outside the scaled slide DOM. Include save, cancel, resolve/reopen, and delete controls. Edit mode and annotation mode are mutually exclusive; navigation, typing, and scientific controls must not accidentally create comments.

Store normalized slide coordinates and a stable element ID where available, so anchors survive scaling and scrolling. Clicking background whitespace must still work. Comments on different slides remain separate. Entering presenter/export mode hides review UI and disables editing and comment creation; the approved content remains complete.

Do not flatten mixed inline markup to `textContent`. Give individual prose runs stable editable spans; preserve emphasis, equations, icons, table structure, and event handlers. Unsupported SVG/Canvas/MathJax labels need a source-data editing adapter or an explicit accessible text inspector. Persist changes on input, not only once on blur. Re-exported HTML must reopen with edits and comments even in a browser without the original local storage.

Each exported comment contains the deck version, theme ID, slide ID, element ID when applicable, interaction/export state when applicable, comment text, proposed replacement when supplied, status, and local timestamp. Keep comments separate from visible presentation content so they cannot leak into PPT output.

## Layout and interaction validation

Validate at the intended 16:9 viewport and at least one smaller viewing size. Inspect every slide at its initial state, each reveal step, each parameter extreme, and its deterministic export state. Run DOM checks for:

- **text content outside its text box:** for every text-bearing element compare `scrollWidth` with `clientWidth` and `scrollHeight` with `clientHeight`; also check descendant line boxes against the declared text container;
- slide or component overflow outside intended bounds;
- unintended intersections among foreground content elements;
- clipped images, formulas, tables, citations, legends, callouts, and controls;
- low contrast, broken fonts, missing assets, excessive density, and labels covered by animation layers;
- layout shifts during reveal, theme change, parameter change, presenter-mode entry, and export-mode freeze;
- controls that cannot be reached by keyboard, require hover, or fail under reduced motion;
- chart or Canvas updates that produce NaN, empty output, misleading axes, or stale labels;
- divergence between the reviewed interactive state and the frozen export state.

Allow intersections only for explicitly tagged background typography, texture, highlight, or decorative layers. Never allow an animation overlay, glow, ripple, arrow, or moving signal marker to reduce foreground legibility.

Use the browser surface the user requests or an available authorized browser, including the Codex in-app browser. This skill does not require Edge or a specific CDP port. Honor any explicit session preference; do not silently replace a user session or launch another profile. The bundled CDP test scripts default to `http://127.0.0.1:9222`, but this is a helper default, not a workflow requirement. If a tool blocks local-file access, report the limitation and obtain the approved state through a permitted route or user export; do not bypass the restriction. Keep untested UI behavior distinct from source inspection.

## Approval gate

After delivering or revising the HTML project, stop and wait. Only a user message whose entire trimmed content equals `confirmed`, case-insensitively, authorizes final PPT production. Messages such as “not confirmed”, “is this confirmed?”, or a longer sentence containing the token do not pass the gate.

Freeze a version identifier, theme ID, reveal plan, and export state at approval. If the user requests a material change after approval, return to HTML review unless they explicitly waive that step.
