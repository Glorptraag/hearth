<!-- Version: 1 | Date: 2026-04-26 | Changes: Initial pilot-family welcome packet — invite redemption, first-week expectations, support SLA, feedback channels. -->

# Welcome to the Hearth Alpha Pilot

> A short read for the families joining Hearth's invite-only alpha. About 10–20 households are in the pilot together. This page tells you what to expect and how to get help.

## 1. What Hearth is, in one sentence

Hearth is a homeschool learning management tool for Australian families: log learning after it happens, watch capability threads grow, and export the documentation Queensland (or your state's) Home Education Unit asks for — without lesson plans.

## 2. What "alpha pilot" means in practice

Hearth is **actively being built**. Translating the tracker into something honest:

- You'll find bugs. Some will be cosmetic, some will be a frustrating dead-end. **Tell us when you hit them** — channels in §6.
- We may push a fix or a new feature **mid-week, with no warning**. Existing data is preserved across deploys; we'll only restart the schema if absolutely necessary, and we'll always email first if that's coming.
- Reports the app generates (HEU-style PDFs, capability summaries) are designed to **support your compliance work, not replace your judgement**. Cross-check before submitting to a regulator until we've validated the export against a real Department template.
- The pilot is free. There are no in-app purchases, no upsells, and no ads — and there won't be during the pilot. If we ever introduce paid tiers later, current pilot members will get notice and an opportunity to choose.

## 3. Redeeming your invite code

Drew will email you a code that looks like `ABCD-EFGH-JKLM-NPQR`. To redeem:

1. Visit **<https://hearthlearning.au>** (or whatever URL Drew sent in the welcome email — preview deploys may use a `*.vercel.app` host during the first week).
2. Click **Get Started** (top-right of the landing page).
3. Sign up with email or Google through Clerk.
4. When prompted, paste your invite code in the **Have an invite code?** field on the welcome screen.
5. Walk through the three onboarding steps:
   - **Family** — name your household, add your children (name + date of birth + a colour they like).
   - **Pedagogy** — pick the philosophy that fits closest (Charlotte Mason, Classical, Montessori, Waldorf, Unschooling, or Eclectic). You can change this later from Settings; you can also Skip and Hearth will use balanced defaults.
   - **First entry** — Hearth will prompt you to log a single recent learning moment. This unlocks the dashboard.

If your invite code is rejected, copy-paste the email Drew sent and forward it to <hello@hearthlearning.au>.

## 4. Your first week — what to actually do

You don't have to use everything. The minimum-effective workflow:

- **Days 1–3.** Log one learning moment per day. Two minutes each. Don't worry about being thorough; the AI maps subjects and capability threads from a few honest sentences.
- **Day 4.** Open the **Our Story** tab and look at the capability threads that have started to glow for each child. This is the "wait, that's interesting" moment.
- **Day 5–6.** Try logging an entry from your phone in the moment, not retroactively at night. See how it feels.
- **Day 7.** Generate a Portfolio export from **Settings → Reports** and read it. Tell us what's missing or wrong.

If you have two parents/carers, only one needs to be the "owner" account. The owner can invite the other from **Settings → Family Members** as an editor. Both will share the same family workspace; analytics roll up at the household level.

## 5. The 5-minute rule

Every interaction in Hearth is designed to take under five minutes. If something takes longer than that — finding a button, saving an entry, exporting a report — it's a bug, not a learning curve. **Tell us.**

## 6. Support, response times, and feedback

Drew (the developer) is currently the only person on the other end of email.

| Need | How | Response time we aim for |
|---|---|---|
| App is broken / I can't get in | <hello@hearthlearning.au> with **[BLOCKED]** in the subject | Same business day (AEST) |
| Bug that doesn't block me | <hello@hearthlearning.au> | Within 3 business days |
| Feature idea or design feedback | <hello@hearthlearning.au> | Within 1 week |
| Privacy question, data export, account delete | <hello@hearthlearning.au> with **[PRIVACY]** in the subject | Within 7 days, per the Privacy Policy |
| Compliment about the dawnlight wordmark | Anytime, no SLA | When Drew sees it |

When you report a bug, including these makes it 10× faster to fix:

- What you were trying to do
- What happened instead
- Browser + device (e.g. "Safari on an iPhone 14")
- Time of day, roughly (matches the server logs)
- A screenshot if the bug is visual

## 7. Privacy, in plain language

- Your learning entries, photos, and family data live in our database (Australian region where the provider supports it).
- We never sell your data, we don't show you ads, and our analytics tool only sees a hashed version of your account ID — never your name or your child's name.
- AI runs **once** when you save an entry — it produces capability tags and a summary, then we store the result. The AI provider doesn't keep your content after the call.
- You can export everything, or delete everything, from **Settings → Account**. Both are one click and take effect immediately.
- Full detail at **<https://hearthlearning.au/privacy>**.

## 8. What we're learning from the pilot

We're tracking three questions:

1. **Does retrospective logging stick as a habit?** If a family logs ≥3 entries a week, we count that as a yes.
2. **Does the curriculum coverage feel honest?** Are families confident submitting an HEU report generated by Hearth?
3. **What pedagogy patterns emerge?** Do families sit cleanly inside one philosophy, or do most blend?

Anonymous, household-level usage data answers (1) and (2). Question (3) we'll only learn if you tell us.

## 9. Leaving the pilot

If at any point Hearth isn't working for your family, that's good information for us. **Settings → Account → Delete account** wipes everything within seconds. No questions, no exit interview required. (We'd love a one-line note about why, but it isn't a condition.)

---

## Operator's notes (not for the family — keep this section internal)

This packet is what Drew sends to each pilot family as part of the invite email. It pairs with:

- **Invite code** — generated via the admin page (`/admin/invitations`) and emailed manually for pilot scale. The code format is `XXXX-XXXX-XXXX-XXXX`; redemption uses the welcome screen's "Have an invite code?" input field.
- **First-deploy smoke test (#5)** — must be green before any code goes out.
- **Pre-flight check before sending an invite:**
  - [ ] `npm run build` green.
  - [ ] All open PRs reviewed; nothing breaking on `main`.
  - [ ] Sentry quota healthy (cheat sheet → dashboards).
  - [ ] AI cost dashboard shows last week's spend within budget.
  - [ ] At least one fresh test family has gone through `/api/account/export` and `/api/account/delete` per #21.
- **Customise the email greeting** with the family's preferred name and any pedagogy hint they shared in the waitlist form.

When a pilot family completes their first week, log it as a "Week 1 complete" event in the operator log so we can see who's at risk of dropping vs. who's settling in.
