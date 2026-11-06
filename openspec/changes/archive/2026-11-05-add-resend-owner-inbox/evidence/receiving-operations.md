# Receiving operations verification

Date: 2026-11-05 (America/New_York). Raw snapshots use UTC timestamps on
2026-11-06. This follow-up performed read-only provider, DNS, and deployed HTTP
checks. It did not send email, provision inboxes, change DNS, deploy application
code, or rewrite environment files.

## Verified configuration

- Firebase production alias selects `my-automated-resume`.
- Official Resend SDK reads succeeded for the owner inbox, domain, full inbox
  listing, agent settings, and configured webhook. This proves effective access
  to those reads; it is not a claim about every permission on the API key.
- Domain `thehandsomestnerd.com` is verified in `us-east-1`; sending and receiving
  are enabled. The account's exact receiving requirement is apex MX priority
  `0`, target `receive.forge.rmta.net`.
- The owner inbox is bound to `terrell.singleton@thehandsomestnerd.com`, uses
  direct receiving, retains the approved display identity, and has no autonomous
  actions enabled. Its last-received timestamp was `2026-11-05T21:39:00.813Z`.
  This is provider receipt metadata, not proof of delivery to any other address.
- The configured signed webhook is enabled for the existing nine inbox events.
- The production environment file was read in place and remained byte-for-byte
  unchanged. Snapshots contain no credentials, message bodies, or attachments.

Source: [provider snapshot](receiving-provider-snapshot.json).

## DNS propagation and restoration baseline

All four authoritative nameservers (`ns-cloud-a1.googledomains.com` through
`ns-cloud-a4.googledomains.com`) returned authoritative `NOERROR` answers with the
same six apex MX records and TTL **14400 seconds (four hours)**. Public resolvers
`1.1.1.1` and `8.8.8.8` returned the same MX set. These observations verify the
current configuration at those servers, not every resolver worldwide.

| Priority | Target | Authoritative TTL |
| --- | --- | --- |
| 0 | `receive.forge.rmta.net.` | 14400 |
| 1 | `aspmx.l.google.com.` | 14400 |
| 5 | `alt1.aspmx.l.google.com.` | 14400 |
| 5 | `alt2.aspmx.l.google.com.` | 14400 |
| 10 | `alt3.aspmx.l.google.com.` | 14400 |
| 10 | `alt4.aspmx.l.google.com.` | 14400 |

Resend is already the preferred MX. The Google records do not select recipients
that lack a Resend inbox. Resend's
[custom receiving domain documentation](https://resend.com/docs/dashboard/receiving/custom-domains)
explains the routing effect of adding a lower-priority-value receiving MX beside
existing records. No new DNS switch is needed to make Resend preferred.

The account-required receiving MX, sending feedback MX, sending SPF TXT, and
DKIM TXT all matched public DNS at `ns-cloud-a1.googledomains.com`.

Sources: [DNS snapshot](receiving-dns-snapshot.json),
[provider DNS comparison](receiving-dns-requirements-check.json).

The table is a fresh **current-state restoration baseline**. It must not be
represented as a historical snapshot of TTLs before Resend was enabled.

## Recipient inventory and owner decisions

The owner identified two required receiving addresses:

| Address | Recorded disposition |
| --- | --- |
| `terrell.singleton@thehandsomestnerd.com` | Existing native Resend inbox, available in the portfolio; owner reports live functional acceptance. |
| `hello@thehandsomestnerd.com` | Owner selected receiving-only access through Resend's Emails > Receiving dashboard. No new native inbox, sending identity, or portfolio integration is required. |

The owner also confirmed that the former Google Workspace mailbox is gone and
that they do not want to pay for that service. **Google is not a valid receiving
fallback. Do not remove Resend's receiving MX to restore Google-only routing.**

Resend's [receiving documentation](https://resend.com/docs/dashboard/receiving/introduction)
states that a verified custom receiving domain receives mail for any address at
the domain. A subsequent read-only received-email listing found **16 retained
receipts addressed to `hello@`**, most recently `2026-11-04T14:03:26.867Z`. All 22
currently retained account records fit in one page, with no further page. No
message body or attachment was fetched, and no new test email was sent. This
verifies existing receipt and management availability; it does not claim recovery
of mail from the canceled Google service. See the
[recipient metadata check](hello-receiving-check.json). Domain-level
Receiving and native Inboxes are different features. The portfolio currently
authorizes only the configured Terrell inbox and cannot display another inbox or
domain-level received messages without an application change.

## Deployed health

Fresh unauthenticated checks returned:

| Request | Result |
| --- | --- |
| `/` | HTTP 200 |
| `/dashboard/inbox` | HTTP 307 to `/login`; `private, no-store` |
| `/api/inbox/summary` | HTTP 401; `private, no-store` |

Source: [deployed health snapshot](receiving-deployed-health.json).
Earlier owner/guest and signed-callback acceptance remains in
[production activation](production-activation.md). The current owner's functional
acceptance is recorded separately there. These fresh checks do not claim a new
authenticated browser test or external round trip.

## Recovery procedure and limits

1. Before any future DNS mutation, compare all authoritative MX answers with the
   snapshot above and capture a new baseline if the owner changed DNS. Preserve
   the verified sending feedback, SPF, DKIM, and unrelated domain records.
2. If a future DNS edit breaks receiving, an authorized DNS administrator can
   restore the captured complete current-state MX set with TTL 14400, including
   the priority-0 Resend record. Then query all four authoritative servers and
   the two public resolvers again and compare priority/target pairs. Cached
   answers can persist for the prior TTL; verification must inspect actual
   answers rather than assume a fixed wait proves recovery.
3. Verify receiving with an explicitly authorized controlled external message to
   each required address and confirm it in the selected management destination.
   Preserve existing correspondence and reuse send attempt identities when a
   delivery result is uncertain.
4. Restoring this baseline can recover accidental DNS edits; it cannot recover
   a Resend service failure. Keep the existing verified Resend route during
   diagnosis, check provider status and account configuration, and report contact
   delivery failures accurately. An alternate provider would require a separately
   selected and provisioned receiving destination before any receiving-MX change.

DNS-management access and execution of a restore have not been verified. No
receiving failure was induced. There is no functioning prior Google destination
to rehearse the originally planned Google rollback against.

The owner approved replacing the obsolete Google rollback with this short
Resend-only recovery note and reiterated that Google will not be reactivated.
Verification covers the recorded working configuration and the consistency of
the documented restoration target with the authoritative/public DNS and provider
snapshots. It does not claim an executed restore, simulated provider outage,
or an alternate receiving service. No such rehearsal or alternate provider is
required by the approved recovery scope.

## Remaining task gates

- **9.1 complete:** Project, effective provider read permissions, verified DNS
  requirements, recipient inventory and owner-selected dispositions, current TTLs,
  and a restoration baseline are recorded. The retired Google destination is
  explicitly identified as unusable rather than represented as rollback data
  for a functioning service.
- **9.4 complete:** The existing direct Resend receiving cutover is verified
  against the exact account receiving requirement at all four authoritative
  nameservers and both public resolvers. Recipient readiness is established by
  the configured Terrell inbox and owner-reported successful live flow tests,
  plus actual retained `hello@` receipts and the owner's selected dashboard
  destination. This accepts the already-working cutover; no new DNS mutation or
  new agent-run controlled mail sequence is claimed. The owner has confirmed
  retirement of Google Workspace and continued receiving through Resend.
- **9.6 complete under the approved revision:** Provider/DNS/deployed health and
  the short recovery note are recorded. The captured Resend-primary restoration
  target matches the verified working configuration; provider outages follow
  Resend incident recovery. The original Google rollback was replaced with the
  owner's approval. The evidence explicitly distinguishes configuration
  verification from an executed restore or provider-outage rehearsal.

Tasks 9.1, 9.4, and the revised 9.6 are complete. The approved recovery scope and
its verification limits are recorded above.
