<div align="center">

# QubaBot

**A local-first chat app for running a team of AI agents.**

[**qubabot.local**](https://qubabot.local) &nbsp;·&nbsp; [Download](https://qubabot.local/download) &nbsp;·&nbsp; [Open source QubaBot alternative](https://qubabot.local/blog/grok-bot-vs-qubabot)

<sub>QubaBot is an open-source local-first chat app for running a team of AI agents — your own team of bots with individual models, computers, and connected apps. Inspired by the Grok Bot model, bringing-your-own-agent, on the models you already have.</sub>

Every bot in the sidebar is a real agent — Claude or Codex running locally under the hood — with its own
personality, its own model, its own cloud computer, and its own connected apps.
Talk to them like contacts. Watch them work. Approve what matters.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-macOS%20%C2%B7%20Windows%20%C2%B7%20Ubuntu-2B2E3A?logo=electron&logoColor=9FEAF9)
![Agents](https://img.shields.io/badge/agents-Claude%20%C2%B7%20Codex-d97757)
[![Release](https://img.shields.io/github/v/release/gerbangaksara2026/qubabot?label=release&color=1084fe&cacheSeconds=300)](https://github.com/gerbangaksara2026/qubabot/releases/latest)
![PRs](https://img.shields.io/badge/PRs-welcome-38d591)

<br>
<a href="https://github.com/gerbangaksara2026/qubabot/releases/latest/download/QubaBot.dmg">
  <img src="https://img.shields.io/github/v/release/gerbangaksara2026/qubabot?style=for-the-badge&label=%E2%AC%87%EF%B8%8F%20%20Download%20for%20Mac%20%28Apple%20silicon%29&labelColor=070707&color=1084fe&cacheSeconds=300" alt="Download the latest QubaBot for Mac with Apple silicon (.dmg)" height="40">
</a>
&nbsp;
<a href="https://github.com/gerbangaksara2026/qubabot/releases/latest/download/QubaBot-intel.dmg">
  <img src="https://img.shields.io/github/v/release/gerbangaksara2026/qubabot?style=for-the-badge&label=%E2%AC%87%EF%B8%8F%20%20Download%20for%20Mac%20%28Intel%29&labelColor=070707&color=2a9d8f&cacheSeconds=300" alt="Download the latest QubaBot for Intel Macs (.dmg)" height="40">
</a>
&nbsp;
<a href="https://github.com/gerbangaksara2026/qubabot/releases/latest/download/QubaBot-setup.exe">
  <img src="https://img.shields.io/github/v/release/gerbangaksara2026/qubabot?style=for-the-badge&label=%E2%AC%87%EF%B8%8F%20%20Download%20for%20Windows&labelColor=070707&color=4cc2ff&cacheSeconds=300" alt="Download the latest QubaBot for Windows (.exe)" height="40">
</a>
&nbsp;
<a href="https://github.com/gerbangaksara2026/qubabot/releases/latest/download/QubaBot-amd64.deb">
  <img src="https://img.shields.io/github/v/release/gerbangaksara2026/qubabot?style=for-the-badge&label=%E2%AC%87%EF%B8%8F%20%20Download%20for%20Ubuntu&labelColor=070707&color=e95420&cacheSeconds=300" alt="Download the latest QubaBot for Ubuntu (.deb)" height="40">
</a>

<sub>[latest release](https://github.com/gerbangaksara2026/qubabot/releases/latest) &nbsp;·&nbsp; macOS: Apple silicon & Intel · signed & notarized .dmg &nbsp;·&nbsp; Windows: x64 installer &nbsp;·&nbsp; Ubuntu 24.04 x64: .deb or AppImage beta &nbsp;·&nbsp; [all releases](https://github.com/gerbangaksara2026/qubabot/releases)</sub>

<br>


<a href="https://github.com/sponsors/gerbangaksara2026">
  <img src="https://img.shields.io/badge/%E2%9D%A4%EF%B8%8F%20%20Support%20QubaBot-GitHub%20Sponsors-38d591?style=for-the-badge&labelColor=070707" alt="Support QubaBot via GitHub Sponsors" height="40">
</a>

<br>
<br>

<sub>Powered by <a href="https://boat.dev">boat.dev</a></sub>
<br>
<a href="https://boat.dev">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/sponsors/boat-logo-white.svg">
    <img src="docs/assets/sponsors/boat-logo.svg" alt="Boat (boat.dev)" height="34">
  </picture>
</a>

<br>
<br>

<img src="docs/screenshots/hero.png" alt="QubaBot — a Telegram-style chat app where every chat is a real AI agent" width="900">

</div>

---

> ⚠️ **No affiliation with any cryptocurrency.** QubaBot has no token. Any coin using the QubaBot, Maus, or SupaMaus name is not created, endorsed, or affiliated with this project or its maintainer. I have received no tokens, payment, or allocation from anyone, and I will not be endorsing any token.

## Why

One assistant in one box is the wrong shape for agents. QubaBot is an independent, open-source project inspired by **Grok Bot** —
it keeps the idea (AI as a *messaging app*: a roster of bots you chat with, each with its own personality,
memory of its thread, model, computer, and apps) and rebuilds it open, local-first, and on the agents you
already have:

- **Bring your own agents.** Bots run on the `claude`, `codex`, and `grok` CLIs installed on your own machine
  — your existing logins and subscriptions, no new accounts, no proxy in the middle. Point any engine at a
  custom CLI binary (a versioned build or wrapper) in **Settings → Engines**.
- **Local first.** One small harness server on `127.0.0.1` owns every agent process. Transcripts, keys, and
  events live in `~/.openmausbot`, not a cloud.
- **Agents with hands.** Each bot can use a cloud Linux desktop, an isolated Local VM, or—where the platform
  safety boundary is currently certified—your own computer, plus 500+ apps through Composio. Host control is
  available on macOS and Ubuntu Xorg after explicit opt-in. Ubuntu Wayland host control remains disabled while
  issue #345 is resolved.

## The open-source alternative to Grok Bot, Muse, dots and Cue

Four closed personal-agent products shipped in seven weeks of 2026, and each one keeps the model, the
computer and your data on its maker's side of the line. QubaBot is the open-source version of that
shape: a team of agents in a chat app, each with its own model, its own computer and its own connected
apps, running on your machine under Apache 2.0. If you searched for an *open Muse*, *open dots*, an
*open-source Grok Bot*, an *open Instinct* or an *open Cue*, this is the repository.

| Looking for | What it is | How QubaBot differs | Read more |
| --- | --- | --- | --- |
| **Open source Grok Bot** | xAI's roster of bots on one shared cloud computer, Grok only, from a SuperGrok or Cursor plan | Same roster shape; any model per bot; your own machine; approval cards | [Grok Bot vs QubaBot](https://www.qubabot.local/blog/grok-bot-vs-qubabot) |
| **Open Muse** | Meta's single personal agent in a Meta cloud VM, US and Canada only | A team instead of one agent; runs anywhere; data in `~/.openmausbot` | [Meta Muse alternative](https://www.qubabot.local/blog/open-source-alternative-to-meta-muse) |
| **Open dots** | OpenAI's always-on agent inside ChatGPT, GPT only, Pro and Business Premium plans | Several agents; your Claude, ChatGPT or Grok login; no plan required | [OpenAI dots alternative](https://www.qubabot.local/blog/openai-dots-alternative) |