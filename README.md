# powerful-slides-academic

An HTML-to-PowerPoint skill for academic presentations in Codex.

Turn research papers, proposals, theses, experiment results, and notes into an evidence-grounded presentation. Review the content in an interactive, annotatable HTML deck first, then approve it for production as an editable PowerPoint.

## Features

- **Evidence-grounded content:** distinguish source facts, derived results, inferences, and proposals; check assumptions and unsupported claims.
- **HTML review first:** review slide content, make annotations, and export review feedback before producing the final PPT.
- **Three academic themes:** restrained visual presets with local persistence and a presenter mode.
- **Purposeful interaction:** use equation steps, parameter controls, and scientific visualizations where they help explain the research. Ordinary slides show complete content by default.
- **Editable PowerPoint:** rebuild the approved deck with native slide objects and explicit export states for HTML interactions.
- **Optional speaker script:** create a Chinese or English script synchronized with the final slide order after PPT delivery.

## Install

Clone this repository into your Codex skills directory. If you use a custom `CODEX_HOME`, use its `skills` directory instead.

**Windows PowerShell**

```powershell
git clone https://github.com/Sebrina-t/powerful-slides-academic.git "$env:USERPROFILE\.codex\skills\powerful-slides-academic"
```

**macOS / Linux**

```bash
git clone https://github.com/Sebrina-t/powerful-slides-academic.git ~/.codex/skills/powerful-slides-academic
```

If that directory already exists, update the existing installation instead of cloning over it. Start a new Codex chat if the skill is not yet listed.

## Use

Invoke the skill explicitly; automatic invocation is disabled.

```text
Use $powerful-slides-academic with my uploaded research proposal
to create a 15-slide academic presentation in English.
Prepare the interactive HTML review deck first.
```

```text
使用 $powerful-slides-academic，根据我上传的研究材料，
制作一份中文开题答辩演示，共 15 页，先生成可批注的 HTML 审阅稿。
```

Provide research material and a language requirement. You can also specify the audience, presentation type, duration, slide count, required outline, or visual template.

## Workflow

1. Inspect the inputs, run the safety preflight, and establish the evidence and argument.
2. Plan the slide structure and generate the HTML review deck.
3. Revise the deck from your comments.
4. Send **`confirmed` as a standalone message** to approve PowerPoint production.
5. Receive the editable PPT and an estimated speaking duration. Request a synchronized speaker script if needed.

The skill does not create the final PPT before the standalone approval message. HTML controls are exported as approved static states, native PowerPoint behavior, or sequential slides; browser interactions do not automatically carry over to PPTX.

## Requirements and utilities

This repository contains skill instructions, reference guides, and validation utilities. It is used by Codex and is not a standalone slide-generation application.

- Final PPT authoring uses the **Presentations** skill available in the Codex environment.
- A separate Word speaker script uses the **Documents** skill.
- `scripts/preflight_scan.py` requires Python 3 and uses the standard library. It performs read-only triage for suspicious instructions and active content; findings require review.
- `scripts/validate_interactive_deck.cjs` requires Node.js, Playwright, a generated deck that follows the documented DOM contract, and an existing CDP browser session. Its default endpoint is `http://127.0.0.1:9222`.

## Repository layout

```text
SKILL.md          Main workflow and content rules
agents/           Codex skill metadata
references/       Evidence, design, HTML review, PPT QA, and script guides
scripts/          Input preflight and interactive-deck validation utilities
```

See [SKILL.md](SKILL.md) for the full workflow and [the interactive presentation guide](references/interactive-presentation-engine.md) for the HTML engine requirements.
