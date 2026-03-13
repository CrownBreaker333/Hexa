// PREMIUM TIER FEATURE MATRIX
// Complete breakdown of features by tier

/*
╔════════════════════════════════════════════════════════════════════════════════╗
║                    HEXA PREMIUM TIER FEATURE MATRIX                            ║
╚════════════════════════════════════════════════════════════════════════════════╝

┌─ FREE TIER ────────────────────────────────────────────────────────────────────┐
│ Price: $0                                                                      │
│ Daily Limit: 10 commands/user                                                 │
│                                                                                │
│ Features:                                                                      │
│ [+] Basic chat with AI                                                         │
│ [+] Personality selection (5 available: friendly, professional, funny, serious)│
│ [+] Response caching (instant replies for repeat questions)                    │
│ [+] User ratings (thumbs up/down)                                              │
│ [+] Help & ping commands                                                       │
│ [+] User statistics (/stats)                                                   │
│ [-] Conversation memory (multi-turn)                                           │
│ [-] Content moderation                                                         │
│ [-] Image generation                                                           │
│ [-] Analytics dashboard                                                        │
│ [-] Scheduled commands                                                         │
│ [-] Advanced settings                                                          │
│ [-] Multiple AI fallbacks                                                      │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ PREMIUM TIER ─────────────────────────────────────────────────────────────────┐
│ Price: $4.99/month                                                             │
│ Daily Limit: 100 commands/user                                                │
│                                                                                │
│ Includes Everything in FREE +                                                  │
│ [+] Conversation memory (keep context across 50 messages)                      │
│ [+] Content moderation (filter harmful content)                                │
│ [+] Multiple AI fallbacks (Groq -> Gemini -> OpenAI)                          │
│ [+] Priority support (email)                                                   │
│ [+] Advanced guild settings                                                    │
│ [-] Image generation                                                           │
│ [-] Analytics dashboard                                                        │
│ [-] Scheduled commands                                                         │
│ [-] Streaming responses                                                        │
│ [-] Custom personalities                                                       │
└────────────────────────────────────────────────────────────────────────────────┘

┌─ PRO TIER ─────────────────────────────────────────────────────────────────────┐
│ Price: $9.99/month                                                             │
│ Daily Limit: UNLIMITED                                                        │
│                                                                                │
│ Includes Everything in PREMIUM +                                               │
│ [+] Image generation (DALL-E 3 integration)                                    │
│ [+] Analytics dashboard (full access)                                          │
│ [+] Scheduled commands (reminders & daily briefings)                           │
│ [+] Streaming responses (progressive output)                                   │
│ [+] Custom personalities (create your own)                                     │
│ [+] Priority support (24/7)                                                    │
│ [+] Advanced moderation tools                                                  │
│ [+] Guild-wide settings optimization                                           │
└────────────────────────────────────────────────────────────────────────────────┘


╔════════════════════════════════════════════════════════════════════════════════╗
║                        COMMAND FEATURE GATING                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

/chat
  - [+] Basic chat: FREE
  - [+] Personality selection: FREE
  - [+] Conversation memory: PREMIUM+
  - [+] Image generation: PRO
  - [+] Response ratings: FREE
  - [+] AI fallbacks: PREMIUM+

/settings
  - [+] View settings: FREE
  - [+] Personality default: FREE
  - [+] Daily limit adjust: PREMIUM+
  - [+] Moderation toggle: PREMIUM+

/analytics
  - [+] Full analytics: PRO

/schedule
  - [+] Create schedules: PRO

/stats
  - [+] Personal stats: FREE

/premium
  - [+] View tiers: FREE
  - [+] View status: FREE
  - [+] Upgrade: FREE (payment required)


╔════════════════════════════════════════════════════════════════════════════════╗
║                      IMPLEMENTATION NOTES                                      ║
╚════════════════════════════════════════════════════════════════════════════════╝

1. Premium data stored in: /data/premium.json
   - Tracks user & guild subscriptions
   - Automatic expiration after 30 days (default)

2. Daily limits are per-user and respect the highest tier:
   - User has PREMIUM: 100/day
   - Guild has PRO: User gets unlimited
   - User takes priority over guild tier

3. Feature gates use hasFeature(userId, guildId, 'feature_name')
   - Always checks both user and guild tiers
   - Returns user tier first, guild tier as fallback

4. Payment integration (TODO):
   - Currently simulates upgrade with `/premium upgrade`
   - Integrate with Stripe/PayPal for real payments
   - Add cancellation/renewal logic

5. Trial periods (TODO):
   - Add 7-day free PREMIUM trial
   - Track trial status separately

6. Analytics for monetization:
   - Track feature usage by tier
   - Monitor conversion funnel
   - Identify premium upsell opportunities
*/

module.exports = {
    description: 'Hexa Premium Tier System - Complete feature matrix and implementation guide'
};
