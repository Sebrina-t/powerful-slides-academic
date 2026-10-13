# Academic presentation modes

Read only the mode relevant to the request. These are argument requirements, not rigid slide templates.

## Proposal or opening report

The deck must establish that the problem matters, a defensible gap exists, the research question follows from that gap, and the proposed work can answer it.

Required reasoning:

- Define the object, boundary, and practical or theoretical consequence of the problem.
- Separate the literature's established findings from the unresolved gap. A broad topic is not a research gap.
- State research questions or hypotheses in falsifiable terms.
- Connect each method, dataset, metric, and experiment to a question. Explain why the chosen baseline and ablation plan can distinguish the claimed contribution.
- Show feasibility through available data, equipment, preliminary results, or a credible acquisition plan.
- Present a timeline with dependencies and measurable milestones. Do not label hoped-for findings as results.
- End with expected contributions, major risks, fallback paths, and criteria for success.

Pressure tests: Is the gap real and current? Could a simpler method answer the question? Is the sample obtainable? Can the evaluation refute the hypothesis? Does the schedule include integration and rework?

## Progress or group report

The deck must make the delta since the previous checkpoint legible and support the next decision.

Required reasoning:

- Restate only enough context to interpret the update.
- Show completed work against the prior plan, including deviations and their causes.
- Present results with controls, uncertainty, and reproducible conditions.
- Distinguish engineering progress from scientific evidence.
- Diagnose failures instead of hiding them. Link each failure to the next experiment or decision.
- End with the decisions needed, updated risks, and the next verifiable milestone.

Pressure tests: What changed? Which result is robust? What failed? What evidence would reverse the current interpretation? Is the next step chosen because it is informative or merely convenient?

## Thesis or project defense

The deck must make the original contribution, evidence, and limits easy for examiners to test.

Required reasoning:

- Frame the research question and contribution early, without overselling novelty.
- Explain only the background required to understand the contribution.
- Make the method auditable: assumptions, data flow, model or apparatus, training and test separation, parameters, and comparison protocol.
- Present the strongest evidence first, then ablations, robustness checks, failure cases, and boundary conditions.
- Compare against fair baselines under matched conditions.
- State limitations and applicability before the committee exposes them.
- Conclude with answers to the research questions, contributions supported by results, and specific future work.

Pressure tests: Is the claimed novelty actually new? Can another factor explain the gain? Are train, validation, and test data independent? Are metrics appropriate for class balance and use conditions? Does statistical significance imply practical significance? Can another researcher reproduce the result?

## Short conference or seminar talk

Prioritize one memorable research question and one evidence chain. Remove secondary literature, setup, and experiments that do not change the audience's conclusion. Keep methods sufficient to judge credibility, not sufficient to reproduce every implementation detail. Use backup slides for likely technical questions when allowed.

## Mixed modes

When the request combines modes, select one dominant contract. For example, a proposal with pilot data remains a proposal: label pilot findings as preliminary and keep the main conclusion about feasibility, not completed efficacy.
