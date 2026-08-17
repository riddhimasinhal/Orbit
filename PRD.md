# Product Requirements Document (PRD)
## Orbit — Creator-Brand Collaboration Platform

---

## 1. Overview

### 1.1 Product Summary

Orbit is a web-based marketplace that connects content creators (influencers, YouTubers, Instagrammers) with brands seeking influencer marketing partnerships. The platform provides dedicated experiences for both user types, enabling discovery, profile management, and collaboration requests in a single product.

### 1.2 Problem Statement

The influencer marketing space lacks a structured, dedicated platform where brands can discover verified creators and where creators can professionally present their audience metrics to attract brand deals. Currently, this happens through fragmented channels — DMs, spreadsheets, and intermediary agencies — leading to inefficiency on both sides.

### 1.3 Goals

- Reduce the friction of brand-creator discovery and outreach.
- Give creators a professional profile showcasing their audience metrics and niche expertise.
- Give brands a structured way to filter and reach creators aligned with their campaign goals.
- Provide a transparent, two-way connection request system to manage collaboration interest.

---

## 2. Target Users

### 2.1 Content Creators
- Social media influencers active on Instagram, YouTube, and/or LinkedIn.
- Have an established audience in a defined niche (Tech, Fashion, Fitness, Gaming, etc.).
- Looking to monetize their following through brand partnerships.

### 2.2 Brands
- Companies of any size (startups to enterprises) looking to run influencer campaigns.
- Have defined marketing goals, target audiences, and budget ranges.
- Need a reliable way to find and contact creators in specific niches and geographies.

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Creator** | A content creator who onboards with social stats, niche, and social account links |
| **Brand** | A company that onboards with campaign goals, budget range, preferred niches, and contact info |

Both roles are mutually exclusive — a user signs up as either a creator or a brand and cannot switch.

---

## 4. Core Features

### 4.1 Authentication
- User registration with name, email, password, and role selection.
- Email format validation and minimum password length enforcement (8 characters).
- Secure password storage using bcrypt hashing.
- Login returns a JWT token (7-day expiry) used for all subsequent authenticated requests.
- Role-based routing: creators and brands are redirected to their respective dashboards post-login.

### 4.2 Guided Onboarding
- Multi-step onboarding wizard for both creators and brands (4 steps each).
- Progress is saved to the database at every step so users can resume where they left off.
- Onboarding is mandatory before accessing the main platform; users are redirected to the wizard if not yet completed.
- Once all steps are submitted, the user's `onBoardingCompleted` flag is set to `true`.

**Creator onboarding steps:**
1. Basic info: full name, username, location
2. Content identity: niche selection (multi-select), bio
3. Social accounts: Instagram username, YouTube URL, LinkedIn URL, portfolio URL
4. Audience metrics: Instagram followers, YouTube subscribers, average views, audience country

**Brand onboarding steps:**
1. Company basics: company name, industry, company size, website, location
2. Marketing profile: description, target audience, marketing goals, preferred creator niches
3. Contact & social: Instagram page, LinkedIn page, contact email, contact person
4. Campaign preferences: budget range, preferred platform, campaign frequency, target country

### 4.3 Discovery & Browse
- Brands can browse all creators with text search (name, username, location) and niche filter.
- Creators can browse all brands with text search (company name, industry, location) and niche/industry filter.
- Results are displayed as filterable grid cards with key profile highlights.

### 4.4 Profile Pages
- Each user has a public profile page viewable by the other role.
- Creator profiles display: bio, niche tags, social platform links, and audience metric stats.
- Brand profiles display: company info, industry, description, marketing goals, and campaign preferences.
- Profile pages include an inline "Connect" button with live connection status (no request / pending / accepted / declined).

### 4.5 Connection Request System
- Either party (creator or brand) can send a collaboration request with an optional message.
- Duplicate requests (in either direction) are blocked.
- The receiving party can accept or decline the request.
- Both parties have a "Requests" page with "Received" and "Sent" tabs showing request status.
- The sidebar displays a live badge count of pending incoming requests, refreshed every 30 seconds.

### 4.6 Dashboard
- Personalized dashboard summarizing key profile stats.
- Creator dashboard: Instagram followers, YouTube subscribers, average views, niche, bio, and social links.
- Brand dashboard: industry, company size, preferred niche, target country, company description, and contact info.

### 4.7 Profile Management
- Users can view their own full profile post-onboarding.
- Account settings page available for managing account-level preferences.

### 4.8 Role-Based Access Control
- Authenticated routes are protected client-side; unauthenticated users are redirected to login.
- Cross-role access is blocked: a brand user visiting creator routes is redirected to their own dashboard (and vice versa).

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | Passwords hashed with bcrypt (salt rounds: 10). JWT signed with a secret stored in environment variables. |
| **Performance** | Page loads and API responses should feel immediate for typical usage. |
| **Scalability** | Architecture should support growing the user base without major re-engineering. |
| **Usability** | Clean, dark-themed UI with consistent component design (shadcn/ui, Tailwind CSS). |
| **Responsiveness** | UI should be functional on both desktop and tablet screen sizes. |
| **Availability** | Backend deployed on a cloud server (AWS EC2); frontend served as a static Vite build. |

---

## 6. Out of Scope (v1)

- In-app messaging / chat between matched creators and brands.
- Payment processing or contract management.
- OAuth-based social media account verification (follower counts are self-reported).
- Mobile native apps (iOS/Android).
- Analytics dashboards beyond profile stat displays.
- Email notifications for connection requests.

---

## 7. Success Metrics

- Users complete onboarding in a single session.
- Brands and creators can discover relevant profiles within a few filter interactions.
- Connection request acceptance rates indicate quality of matches.
- Low dropout rate at each step of the onboarding wizard.
