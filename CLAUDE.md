# cc-training — Project Context

## What This Site Is

A marketing landing page for Solv, targeted at multi-site urgent care operators. It exists to communicate what Solv does, why it matters to operators, and drive demo requests. It is not a product page or a general awareness play — it is a conversion-focused page for a specific buyer.

## Goals

- **Primary:** Get multi-site urgent care operators to book a demo
- **Secondary:** Make the right buyer feel immediately understood — they should read the first two sentences and think "this is for me"
- **Not a goal:** Explain every feature. Lead with pain and outcomes, not product capabilities.

## Tech Stack

This site is intentionally simple — plain HTML, CSS, and JavaScript only. No frameworks, no build step, no dependencies.

- Single file: `index.html` (all CSS is inline in `<style>` tags)
- Deployed on Vercel via GitHub (`oliviaquinton/cc-training`)
- To deploy changes: commit and push to `main`, then run `vercel --prod`

## Copy Rules

**Always read `persona.md` before writing or editing any copy on this site.**

The target buyer is a VP of Operations or Regional Director running 5–25 urgent care locations. All copy decisions — headlines, section framing, CTAs, proof points — should be filtered through their specific pain points, language, and skepticism. Key things to keep in mind:

- Use their language: "no-shows," "visit volume," "site managers," "flying blind," "front desk," "end-of-day reports"
- Lead with pain, not features. Name their problem before offering the solution.
- Address skepticism directly — especially "will my staff actually use it?" and fear of long rollouts
- The CTA should feel low-commitment and time-respectful. They are busy and get pitched constantly.
- Tone: confident, direct, outcome-driven. Never salesy. Never vague.

## Site Structure

| Section | Purpose |
|---|---|
| Hero | Name the pain, establish relevance immediately |
| What it solves | Map Solv capabilities to specific operator problems (framed as operator quotes) |
| Why operators trust it | Address skepticism, objections, and implementation fears |
| CTA | Low-friction demo request, operator-specific framing |
