# 1. Design Principles

DineFlow’s interface must feel like a premium operations product: calm, precise, and fast to scan during busy service hours.

## Core Principles

### 1. Clarity over decoration
Every screen has one primary job. Remove visual noise that does not help a restaurant operator act faster.

### 2. Consistency over novelty
Reuse established patterns. New modules should look like natural extensions of the shell, not separate products.

### 3. Hierarchy over density
Use typography, spacing, and color weight to guide the eye. Prefer clear sections over packed dashboards.

### 4. Speed of comprehension
Operators should understand status, risk, and next action in seconds. Status colors and labels must be unambiguous.

### 5. Premium restraint
Favor clean surfaces, soft elevation, and controlled accent color. Avoid ornamental gradients, glow effects, and visual gimmicks.

### 6. Accessibility is default
Keyboard, contrast, focus, and reduced-motion support are baseline requirements — not polish items.

### 7. Progressive complexity
Simple defaults first. Advanced controls appear only when the workflow requires them.

## Decision Filters

Before adding any UI element, ask:

1. Does this help an operator complete a task faster?
2. Does an existing component already solve this?
3. Does it respect theme tokens (no hard-coded one-off colors)?
4. Does it remain usable on tablet and mobile?
5. Can it be reused by another restaurant module without redesign?

If any answer is “no,” redesign or reuse before shipping.

## Visual Tone

| Attribute | Direction |
|-----------|-----------|
| Style | Modern SaaS, enterprise-grade |
| Density | Comfortable — not cramped, not sparse |
| Color use | Primary for action; semantic colors for status |
| Motion | Subtle, purposeful, interruptible |
| Brand feel | Professional, trustworthy, calm under pressure |

## Anti-Patterns

- Multiple competing CTAs in the same viewport
- Card-in-card nesting without purpose
- Rainbow status chips without a legend or consistent mapping
- One-off spacing values outside the spacing scale
- Custom fonts/colors inside feature folders
- Decorative animations that delay interaction
