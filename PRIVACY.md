# Privacy Policy (DRAFT)

> ⚠️ **DRAFT NOTICE:** This privacy policy is a draft template and has NOT been reviewed by legal counsel. It should be reviewed by a qualified attorney before publication, especially if you:
>
> - Collect personal data from EU residents (GDPR applies)
> - Collect personal data from California residents (CCPA applies)
> - Process payments or financial data
> - Serve users under 16 years old
>
> Recommended legal review cost: $500-$1,500 (one-time)
>
> **Status:** Draft v1.0 | **Effective Date:** TBD (after legal approval)

---

## Introduction

**Effective Date:** TBD - Pending Legal Review
**Last Updated:** 2025-11-06
**Contact:** luka@sunny-stack.com

Sunny Stack ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [https://sunny-stack.com](https://sunny-stack.com) and use our services.

Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.

We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.

## Information We Collect

We collect information that you provide directly to us, automatically through your use of our services, and from third-party sources.

### Personal Information

We collect the following personal information when you voluntarily provide it:

- **Name**: Collected via contact forms and quote request forms
- **Email Address**: Collected via contact forms, quote request forms, and Google OAuth authentication
- **Phone Number**: Optional, collected via quote request forms
- **Company/Business Name**: Optional, collected via quote request forms
- **Project Details**: Information about your project needs submitted via quote forms
- **Google Account Information**: When you authenticate using Google OAuth (email, name, profile picture)

### Usage Data

We automatically collect information about your interactions with our services:

- **Page Views**: Which pages you visit and how long you stay
- **Browser Information**: Browser type, version, language preferences
- **Device Information**: Device type, operating system, screen resolution
- **IP Address**: For security, analytics, and geolocation purposes
- **Referral Source**: How you found our website
- **Session Data**: Date and time of visits, session duration

### Analytics Data

We use the following analytics services:

- **Vercel Analytics**: Collects page views, performance metrics, and user interactions (no cookies, privacy-focused)
- **Rollbar Error Monitoring**: Collects error logs, stack traces, and performance data for debugging

### Cookies and Tracking Technologies

We use the following cookies:

- **Session Cookies (NextAuth)**: Required for authentication, HTTP-only, SameSite=Lax
- **Analytics Cookies (Vercel)**: Anonymous usage analytics, no personally identifiable information
- **Preference Cookies**: Store user preferences (e.g., theme, language)

You can control cookie settings in your browser. Note that disabling cookies may affect site functionality.

## How We Use Information

We use the information we collect for the following purposes:

### 1. Authentication and Account Management

- Authenticate users via Google OAuth using NextAuth.js
- Maintain secure sessions for authenticated users
- Provide access to admin dashboard (admin-only features)

### 2. Quote Processing and Communication

- Process quote requests submitted via contact and quote forms
- Respond to inquiries about projects and services
- Send project proposals and follow-up communications
- Manage client relationships

### 3. Service Improvement

- Analyze website usage patterns via Vercel Analytics
- Identify and fix errors using Rollbar error monitoring
- Improve website performance and user experience
- Test new features and optimizations

### 4. Security and Fraud Prevention

- Detect and prevent fraudulent activity
- Monitor for security incidents and unauthorized access
- Enforce our Terms of Service
- Protect the rights, property, and safety of our users

### 5. Legal Compliance

- Comply with legal obligations (GDPR, CCPA, etc.)
- Respond to data subject requests (access, deletion, portability)
- Cooperate with law enforcement when required by law
- Defend against legal claims

## Information Sharing

We do not sell, trade, or rent your personal information to third parties. We share information only in the following circumstances:

### Third-Party Services

We use third-party services that may access your information to provide functionality. See [THIRD-PARTY-SERVICES.md](THIRD-PARTY-SERVICES.md) for complete details:

| Service          | Purpose             | Data Shared                        | Privacy Policy                                                                                            |
| ---------------- | ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Google OAuth** | Authentication      | Email, name, profile picture       | [Google Privacy Policy](https://policies.google.com/privacy)                                              |
| **Resend**       | Email delivery      | Email addresses, message content   | [Resend Privacy Policy](https://resend.com/privacy)                                                       |
| **Discord**      | Quote notifications | Quote details (no email addresses) | [Discord Privacy Policy](https://discord.com/privacy)                                                     |
| **Vercel**       | Hosting, analytics  | Usage data, IP addresses           | [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)                                          |
| **PostgreSQL**   | Database            | All stored data                    | Self-hosted (Raspberry Pi)                                                                                |
| **GitHub**       | Code hosting, CI/CD | Repository data, commit logs       | [GitHub Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement) |
| **Docker**       | Containerization    | Application logs                   | Self-hosted                                                                                               |
| **Rollbar**      | Error monitoring    | Error logs, stack traces           | [Rollbar Privacy Policy](https://rollbar.com/privacy/)                                                    |

### Legal Requirements

We may disclose your information if required to do so by law or in response to:

- Subpoenas or court orders
- Law enforcement requests
- National security requirements
- Regulatory investigations
- Legal proceedings where you are a party

### Business Transfers

If Sunny Stack is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our website before your information is transferred and becomes subject to a different privacy policy.

## Data Retention

We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:

### Active Data

- **Authenticated Users**: Data retained for the duration of your account
- **Quote Submissions**: Retained for 2 years for business purposes
- **Contact Form Submissions**: Retained for 1 year
- **Analytics Data**: Retained for 13 months (Vercel default)
- **Error Logs**: Retained for 90 days (Rollbar)

### Backups

- **Cloud Backups**: 30-day retention (encrypted, Backblaze B2)
- **Local Backups**: 7-day retention (Raspberry Pi)
- See [DATABASE-BACKUP-RESTORE.md](docs/deployment/DATABASE-BACKUP-RESTORE.md) for details

### Deleted Data

When you request data deletion:

- **Immediate**: Removed from active database
- **Within 30 days**: Purged from cloud backups
- **Within 7 days**: Purged from local backups
- **Within 90 days**: Removed from error logs and analytics

## User Rights (GDPR/CCPA)

You have the following rights regarding your personal data:

### Right to Access

You have the right to request a copy of the personal information we hold about you.

**How to Exercise:** Email luka@sunny-stack.com with subject "Data Access Request"

**Response Time:** 30 days

**Format:** JSON or PDF export

### Right to Deletion

You have the right to request deletion of your personal information.

**How to Exercise:** Email luka@sunny-stack.com or luka@sunny-stack.com with subject "Data Deletion Request"

**Response Time:** 7 days for account deletion, 90 days for complete purge

**Exceptions:** We may retain information required by law or for legitimate business purposes

### Right to Portability

You have the right to receive your personal data in a structured, machine-readable format.

**How to Exercise:** Email luka@sunny-stack.com with subject "Data Export Request"

**Response Time:** 30 days

**Format:** JSON export of your data

### Right to Opt-Out

You have the right to opt out of:

- **Analytics Cookies**: Disable in browser settings
- **Marketing Emails**: Click unsubscribe link in emails
- **Google OAuth**: Log out and don't use authentication features

**California Residents (CCPA):** Email luka@sunny-stack.com to opt out of the "sale" of personal information (note: we do not sell personal information)

### Right to Correct

You have the right to request correction of inaccurate personal information.

**How to Exercise:** Email luka@sunny-stack.com with subject "Data Correction Request"

**Response Time:** 7 days

### Right to Object

You have the right to object to processing of your personal data for certain purposes (direct marketing, profiling, automated decision-making).

**How to Exercise:** Email luka@sunny-stack.com with subject "Processing Objection"

**Response Time:** 30 days

### How to Exercise Your Rights

**Email:** luka@sunny-stack.com (general privacy questions)
**GDPR Requests:** luka@sunny-stack.com (EU residents)
**CCPA Requests:** luka@sunny-stack.com (California residents)

**Required Information:**

- Your full name
- Your email address (to verify identity)
- Description of your request
- Proof of identity (for deletion and access requests)

**Verification Process:** We will verify your identity before processing requests to prevent unauthorized access.

## Security

We implement appropriate technical and organizational security measures to protect your information:

### Encryption

- **HTTPS/TLS 1.3**: All website traffic encrypted in transit
- **Database Encryption**: PostgreSQL data encrypted at rest
- **Backup Encryption**: Cloud backups encrypted with AES-256
- **Password Hashing**: bcrypt with cost factor 12 (if applicable)

### Access Controls

- **Authentication Required**: Admin routes require Google OAuth authentication
- **Role-Based Access**: Admin-only features restricted to verified admin emails
- **Session Security**: HTTP-only cookies, SameSite=Lax, 7-day expiry
- **API Key Rotation**: Quarterly rotation per [SECRETS-ROTATION.md](docs/deployment/SECRETS-ROTATION.md)

### Incident Response

In the event of a data breach, we will:

1. **Immediate Response**: Contain breach within 4 hours (see [INCIDENT-RESPONSE.md](docs/deployment/INCIDENT-RESPONSE.md))
2. **User Notification**: Notify affected users within 24 hours
3. **Regulatory Notification**: Notify authorities within 72 hours (GDPR requirement)
4. **Investigation**: Conduct root cause analysis and implement preventive measures

### Monitoring

- **Error Monitoring**: Rollbar alerts for application errors
- **Security Logs**: Failed authentication attempts logged and reviewed
- **Performance Monitoring**: Vercel Analytics for anomaly detection
- **Manual Audits**: Quarterly security reviews

## International Transfers

### Data Storage Locations

Your data is stored in the following locations:

- **Primary Database**: Self-hosted on Raspberry Pi (United States)
- **Cloud Backups**: Backblaze B2 (United States)
- **Website Hosting**: Vercel (United States, global CDN)
- **Error Logs**: Rollbar (United States)

### EU-US Transfers

If you are located in the European Economic Area (EEA), your personal data may be transferred to the United States.

**Legal Basis:** We rely on:

- **Standard Contractual Clauses (SCCs)**: For transfers to third-party processors
- **Adequacy Decisions**: Where available (e.g., EU-US Data Privacy Framework)
- **Necessity for Contract Performance**: For quote processing and service delivery

**Adequate Protections:** We ensure that third-party processors implement appropriate safeguards per GDPR Article 46.

### International Rights

If you are located outside the United States, you have the same rights as outlined in the "User Rights" section above, including the right to lodge a complaint with your local data protection authority.

## Children's Privacy

### COPPA Compliance (United States)

Sunny Stack does not knowingly collect personal information from children under 13 years of age.

If we become aware that we have collected personal information from a child under 13 without parental consent:

- We will delete the information as quickly as possible
- We will not use the information for any purpose
- We will not disclose the information to third parties

**Parents/Guardians:** If you believe your child has provided personal information to us, please email luka@sunny-stack.com with subject "Child Privacy Request" and we will promptly delete the information.

### GDPR Requirements (European Union)

For users in the EU, the age of consent for processing personal data is 16 (or lower as determined by individual member states, but not below 13).

If you are under the applicable age of consent, you must have permission from a parent or guardian to use our services.

## Changes to This Policy

### Update Notification

We may update this Privacy Policy from time to time to reflect:

- Changes in our data practices
- New legal requirements
- Service improvements
- User feedback

**Notification Methods:**

- **Email**: Registered users will receive email notification
- **Website Notice**: Prominent banner on website for 30 days before changes take effect
- **Last Updated Date**: Updated at the top of this policy

### Historical Versions

Previous versions of this Privacy Policy are archived in our Git repository at:
[https://github.com/lukadfagundes/sunny-stack/commits/main/PRIVACY.md](https://github.com/lukadfagundes/sunny-stack)

### Material Changes

For material changes that significantly affect how we collect, use, or share your information:

- We will provide at least 30 days notice before changes take effect
- You will have the opportunity to review the new policy
- Continued use of our services after the effective date constitutes acceptance

## Contact Information

### General Privacy Questions

**Email:** luka@sunny-stack.com
**Response Time:** 3-5 business days
**Website:** [https://sunny-stack.com/contact](https://sunny-stack.com/contact)

### Data Subject Requests (GDPR)

**Email:** luka@sunny-stack.com
**Response Time:** 30 days (extendable by 2 months for complex requests)
**Supervisory Authority:** You have the right to lodge a complaint with your local data protection authority

### California Residents (CCPA)

**Email:** luka@sunny-stack.com
**Response Time:** 45 days (extendable by 45 days)
**Toll-Free Number:** Not applicable (solo developer)

### Mailing Address

**Note:** Mailing address will be added after legal review to comply with GDPR Article 13 requirements for data controller identification.

### Data Protection Officer

**Status:** Not required for solo developer portfolio site. May be designated in the future if required by law.

---

## Legal Review Checklist (For Future Attorney Review)

Before publishing this privacy policy, have legal counsel review:

- [ ] **GDPR Compliance:** All Article 13/14 disclosure requirements met?
  - Article 13: Information to be provided where personal data are collected from the data subject
  - Article 14: Information to be provided where personal data have not been obtained from the data subject
  - Controller identification (name, address, contact details)
  - Data Protection Officer contact (if applicable)
  - Legal basis for processing (consent, contract, legitimate interests, legal obligation)
  - Legitimate interests pursued (if applicable)
  - Recipients or categories of recipients
  - International transfers and safeguards
  - Storage periods
  - Data subject rights (access, rectification, erasure, restriction, portability, objection)
  - Right to withdraw consent
  - Right to lodge complaint with supervisory authority
  - Automated decision-making and profiling (if applicable)

- [ ] **CCPA Compliance:** All disclosure requirements met?
  - Categories of personal information collected
  - Sources of personal information
  - Business or commercial purposes for collecting information
  - Categories of third parties with whom we share information
  - Right to opt-out of sale (with "Do Not Sell My Personal Information" link)
  - Right to deletion
  - Right to know
  - Right to non-discrimination
  - Toll-free number and email for requests (email only for <$25M revenue)

- [ ] **Data Controller/Processor:** Roles correctly defined?
  - Are we the data controller or processor?
  - Are third-party services controllers or processors?
  - Data Processing Agreements (DPAs) in place with processors?

- [ ] **International Transfers:** SCCs or adequacy decisions in place?
  - Standard Contractual Clauses signed with processors outside EEA?
  - EU-US Data Privacy Framework participation verified?
  - Transfer Impact Assessments (TIAs) conducted?

- [ ] **Cookie Consent:** Requires GDPR cookie banner?
  - Explicit consent required for non-essential cookies?
  - Cookie policy linked from privacy policy?
  - Option to accept/reject cookies before setting them?

- [ ] **Age Requirements:** COPPA (13+) vs GDPR (16+) reconciled?
  - Age verification mechanism in place?
  - Parental consent process documented?
  - Age-appropriate privacy notices?

- [ ] **Data Subject Rights:** Request process clearly defined?
  - Identity verification process documented?
  - Response timeframes realistic and compliant?
  - Automated request handling or manual process?
  - Free of charge for first request?

- [ ] **Contact Information:** Legal entity address provided?
  - Data controller registered address?
  - DPO contact (if applicable)?
  - EU representative (if applicable, non-EU controller serving EU)?

- [ ] **Liability Disclaimers:** Appropriate for jurisdiction?
  - Limitation of liability clause?
  - No guarantees about absolute security?
  - Third-party service disclaimers?

- [ ] **Severability Clause:** Invalid provisions don't void entire policy?
  - If one section is unenforceable, does the rest remain valid?

- [ ] **Governing Law:** Jurisdiction and applicable law specified?
  - Which country's laws govern disputes?
  - Which courts have jurisdiction?

---

## Recommended Legal Resources

### GDPR Specialists

- **IAPP (International Association of Privacy Professionals)**: Find certified privacy professionals at [iapp.org](https://iapp.org)
- **European Data Protection Board (EDPB)**: Guidelines and opinions at [edpb.europa.eu](https://edpb.europa.eu)
- **Local DPA**: Contact your national Data Protection Authority for guidance

### CCPA Specialists

- **California Office of the Attorney General**: CCPA resources at [oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- **IAPP**: CCPA certified professionals at [iapp.org](https://iapp.org)

### Estimated Legal Review Cost

- **Initial Review:** $500-$1,500 (one-time)
- **Annual Updates:** $300-$500 (as laws change)
- **Incident Response Legal Counsel:** $2,000-$5,000+ (if data breach occurs)

### When to Seek Legal Review

**Immediately Required If:**

- Serving users in the EU (GDPR applies)
- Serving users in California (CCPA applies)
- Collecting sensitive data (health, financial, biometric)
- Collecting data from children under 16
- Processing >50,000 records per year
- High-risk processing (profiling, automated decisions)

**Recommended Before:**

- Launching to public users
- Significant business growth
- Adding new data collection practices
- Receiving first data subject request

---

**Policy Version:** Draft 1.0 (Pending Legal Review)
**Last Updated:** 2025-11-06
**Author:** Luka D Fagundes
**Review Status:** NOT REVIEWED BY LEGAL COUNSEL
**Effective Date:** TBD (after legal approval)
