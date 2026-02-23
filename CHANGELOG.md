# Changelog

All notable changes to sunny-stack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Release workflow gating all deployments behind GitHub Releases (#75)
- CHANGELOG.md for tracking release notes
- Release helper scripts (release:patch, release:minor, release:major)

### Changed

- Bot deployment now triggered only via release publish (not push to main)
- CI pipeline now reusable via workflow_call
