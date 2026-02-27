/**
 * Solv Brand Style Guide — Image Generation
 *
 * This style context is automatically appended to every prompt so that all
 * generated images are visually consistent with Solv's identity.
 *
 * Update this file whenever the brand evolves.
 */

export const BRAND_STYLE = `
Visual style: Graphic and illustrative design — not photography. Clean, composed, editorial.

Color palette:
- Dominant: Bold purple-to-magenta gradient backgrounds. Rich deep purple (#7B2FBE) transitions
  through violet to hot magenta/pink (#E91E8C). This gradient is the signature — it should feel
  warm and energetic, not neon or garish.
- Secondary: Pure white (#FFFFFF) for cards, content containers, and UI elements. White floats
  over the gradient to create contrast and breathing room.
- No cold blues, institutional grays, or clinical white backgrounds.

Typography treatment (when text or UI appears):
- Large, bold, confident headline type. Heavy-weight clean sans-serif — think modern, not techy.
- Strong hierarchy: big bold statement on top, lighter-weight supporting copy below.
- Text should feel confident and warm, not sterile.

Layout philosophy:
- Card-based UI elements floating over gradient backgrounds is the signature pattern.
- Product screenshots or UI elements are shown as polished "live" mockups — inside device frames
  or styled UI cards with subtle shadows. Never flat screenshots.
- Composition is editorial and deliberate. Generous whitespace. Nothing crammed.

Overall mood:
- Energetic but not chaotic. Warm and approachable, not clinical or cold.
- Modern healthcare tech that signals "we're different from legacy players" without being
  gimmicky or startup-cliché.
- The purple-magenta palette is what sets Solv apart from the cold blues and grays that
  dominate health tech. Lean into it.

Never use: generic SaaS aesthetics, stock photo styles, cold medical blues, corporate grays,
clipart-style illustrations, or overly literal healthcare imagery (stethoscopes, red crosses, etc.).
`.trim();

/**
 * Content-type style additions layered on top of the base brand style.
 * Each adds composition and format guidance specific to the use case.
 */
export const CONTENT_TYPE_STYLES: Record<string, string> = {
  blog: `
Format: 16:9 horizontal editorial header image.
Composition: Bold gradient background with a strong focal element — an abstract graphic,
a styled UI card, or a typographic treatment. Think magazine cover energy. Leave visual
breathing room on the left or right for headline text overlay if needed.
Avoid: cluttered layouts, too many elements competing for attention.
  `.trim(),

  social: `
Format: Square (1:1) or 16:9 social card. Bold and thumb-stopping.
Composition: One dominant visual element centered over the gradient. Strong typographic
hierarchy if text is included. Should read instantly at small sizes — no fine detail.
Think: LinkedIn post card or Twitter/X header. High contrast, high confidence.
  `.trim(),

  hero: `
Format: Wide 16:9 or ultrawide hero banner for a landing page.
Composition: Product UI elements or interface cards floating over the gradient background,
styled as polished live mockups in device frames. Editorial, spacious layout with room for
a headline on one side. Feels like a premium SaaS homepage — alive, not static.
  `.trim(),

  email: `
Format: 16:9 or 3:1 wide email header banner.
Composition: Clean and contained — one strong gradient background with a centered or
left-aligned graphic element. Simple enough to render well across email clients.
No fine text or intricate detail. Feels like the top of a well-designed newsletter.
  `.trim(),
};
