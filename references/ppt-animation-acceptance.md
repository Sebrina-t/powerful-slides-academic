# Native PowerPoint animation acceptance

Read when exporting or repairing approved progressive reveals. Browser animation, PPT timing XML, static renders, and desktop slideshow playback are different acceptance layers.

## Preserve the approved explanation

Record each animated slide's initial visible objects, ordered reveal groups, click count, and complete endpoint. Keep cover and agenda static. Group related objects into one speaking step; do not turn each object into a separate click. Preserve the user's slide count and approved content.

## Author compatible native timing

Prefer an authoring API that supports native animations. If patching OOXML is necessary, use a known-good native animation emitted by the intended application as a structural reference, while retaining the deck's own shape IDs and content.

A demonstrated WPS failure occurred when timing entries existed but the application ignored their incomplete trigger hierarchy. A native Appear reference used `tmRoot` / `mainSeq`, an indefinite-start outer timing container, a zero-delay intermediate container, and effect containers with matching `grpId` / `bldP` entries. The first effect in a click group used `clickEffect`; companion objects used `withEffect`. Target shape IDs and unique timing IDs must resolve. This is a tested compatibility pattern, not a claim that all valid animations require one identical XML template.

After patching, check that non-animation content is unchanged and that the final delivered file matches the tested bytes. Do not infer animation success merely because the file opens or the XML parses.

## Actual slideshow acceptance

Open the candidate in the intended desktop application (PowerPoint or WPS), inspect animation recognition, and enter slideshow on every animated slide. Observe the initial state, advance one click at a time, and verify exactly the intended objects appear in each group. Check the complete endpoint and re-entry/reset behavior. Check cover and agenda have no content-build sequence.

Record the application and tested slide/group results privately. Testing in WPS does not prove Microsoft PowerPoint playback, or vice versa. Static render/package checks remain necessary for layout and editability but cannot replace the slideshow test.

If the application is unavailable, state that native playback is unverified. Do not mark animation complete, silently remove approved reveals, add slides beyond the requested count, or present structural checks as playback evidence. Ask the user to test or approve an explicit fallback.
