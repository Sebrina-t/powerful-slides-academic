# Reusable full-slide editing and anchored comments

Copy `assets/review-runtime/review.js` and `review.css` into the generated project. Load the CSS and JS locally, or inline both into the self-contained bundle. After the slide DOM exists, call:

```javascript
const review = AcademicReview.mount({
  deckId: 'stable-project-id', version: 'revision-id',
  root: document.querySelector('#deck'),
  slides: '.interactive-slide',
  // Optional serializable theme/parameter/export state:
  context: () => window.presentationEngine?.getState() || {}
});
```

The root may contain multiple slides. Every slide has a unique `data-slide-id`. Every text run has a stable, deck-wide unique `data-edit-id`. Use explicit spans around mixed text and emphasis. The runtime can wrap ordinary text nodes as a compatibility fallback, but generated IDs rely on stable DOM order; author stable IDs in the slide specification for revisions. Exclude scientific controls or generated expressions with `data-review-ignore`; provide an editing adapter for their meaningful labels instead of silently making them read-only. Do not keep a conflicting title-only editor active.

`review.setMode('annotate' | 'edit' | 'view')` switches mutually exclusive tools. `review.setPresentationMode('review' | 'presenter' | 'export')` hides all review UI outside review mode; call it from the presentation engine's mode setter. `review.snapshot()` returns edits, anchored comments, deck/version, and context. `review.exportHTML()` embeds the snapshot in a nonexecuting JSON script, cleans transient UI, and downloads a revised bundle. Use the same runtime ID and deck ID on reopen. Inline the runtime/CSS and other required modules before calling exportHTML when a standalone bundle is promised.

Storage is namespaced by deck ID. A reload starts in annotate mode, with editing off. When changing slide specs, retain IDs and migrate earlier comment/edit formats explicitly. Do not silently discard previous side notes. The runtime has no network calls. Display user text through DOM text/value APIs and escape JSON for safe HTML embedding.

## Acceptance tests

In the user's selected or otherwise authorized browser surface, test real input and visible results (CDP is optional):

1. Edit a title, a body paragraph, a list item, a table cell, and a caption. Repeat edits; preserve inline emphasis and formula structure. Reload and verify the values.
2. Click text, an image, and whitespace in annotation mode. Verify an adjacent visible editor, save/reopen the comment, and resolve/reopen it. Verify slide separation, multiple pins, cancel, and deletion.
3. Scroll and resize; pins follow their anchors and the editor remains inside the viewport. Test at least two viewport sizes and keyboard-only focus.
4. Enter presenter and export modes; no review controls or pins remain, no content is editable, and slides contain no leaked comments.
5. Export JSON and revised HTML; reopen HTML after clearing only this demo's storage and verify edits/comments. Inspect screenshots and browser errors.

Run `scripts/test_review_runtime.cjs <demo.html> [cdp-url] [report-directory]` for the bundled integration fixture. This is runtime regression coverage, not proof that arbitrary generated decks have good layout. Also run the deck validator and visually inspect every actual deck. Keep validation attempts and confirmed browser results distinct.
