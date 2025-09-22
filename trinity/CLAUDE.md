# Trinity CLAUDE.md - Trinity Method Enforcement Rules

## Trinity Method Core Principles

### Investigation-First Requirements
Every task, feature, or bug fix MUST begin with a Trinity Method investigation:

1. **Problem Analysis**: Understand the root cause, not just symptoms
2. **Context Gathering**: Collect all relevant information before action
3. **Pattern Recognition**: Identify if this issue has occurred before
4. **Solution Design**: Plan the implementation approach thoroughly
5. **Validation Strategy**: Define how success will be measured

### Investigation Protocol
```markdown
### Trinity Investigation Template
**Problem Statement**: [Clear description of what needs to be addressed]
**Context**: [Technology stack, affected components, environment]
**Root Cause Analysis**: [Deep dive into why this issue exists]
**Similar Patterns**: [Reference to ISSUES.md patterns or past solutions]
**Solution Design**: [Detailed implementation plan]
**Success Criteria**: [How to validate the solution works]
**Risk Assessment**: [Potential side effects or complications]
```

## Session Workflow Protocols

### Session Initialization
```markdown
### Session Startup Checklist
1. Load project context from ../CLAUDE.md
2. Review outstanding tasks in knowledge-base/To-do.md
3. Check system health indicators
4. Verify dependency status and security
5. Load investigation templates and patterns
6. Initialize performance monitoring baseline
```

### Session Execution
```markdown
### During Session Requirements
1. Maintain investigation-first approach for all tasks
2. Document findings in real-time
3. Update ARCHITECTURE.md with significant changes
4. Record new patterns in ISSUES.md
5. Maintain zero tolerance for console errors
6. Validate performance against baselines
```

### Session Completion
```markdown
### Session Closure Checklist
1. Document all changes in knowledge-base/ARCHITECTURE.md
2. Update knowledge-base/To-do.md with completed/new items
3. Record new issues and patterns in knowledge-base/ISSUES.md
4. Plan next session requirements and priorities
5. Validate all quality gates passed
6. Archive session artifacts if significant
```

## Crisis Management Protocols

### Console Error Crisis Protocol
```markdown
### When Console Errors Detected
IMMEDIATE ACTIONS:
1. STOP all current development work
2. Capture error context (stack trace, user actions, environment)
3. Audit entire application for related errors
4. Identify root cause using Trinity Method investigation
5. Implement fix with comprehensive testing
6. Verify zero errors in all environments
7. Document pattern in ISSUES.md to prevent recurrence
```

### Performance Crisis Protocol
```markdown
### When Performance Degradation Detected
IMMEDIATE ACTIONS:
1. STOP feature development
2. Run performance audit (Lighthouse, Core Web Vitals)
3. Identify performance bottlenecks using Trinity investigation
4. Compare against baseline metrics in ../CLAUDE.md
5. Implement targeted optimizations
6. Validate performance recovery
7. Update performance monitoring thresholds
```

### Data Integrity Crisis Protocol
```markdown
### When Data Inconsistencies Detected
IMMEDIATE ACTIONS:
1. HALT all data modification operations
2. Audit all data sources and validation points
3. Identify database inconsistencies and corruption points
4. Trace data flow to find integrity breach points
5. Restore data integrity using backup and validation
6. Implement additional validation layers
7. Verify data accuracy across all affected systems
8. Document data integrity patterns in ISSUES.md
```

### Security Crisis Protocol
```markdown
### When Security Vulnerabilities Detected
IMMEDIATE ACTIONS:
1. STOP deployment pipeline
2. Assess vulnerability scope and impact
3. Implement immediate security patches
4. Audit related security measures
5. Run comprehensive security scan
6. Validate all security gates pass
7. Document security patterns and preventive measures
```

## Quality Standards and Checklists

### Pre-Commit Quality Gates
```markdown
### Pre-Commit Checklist
- [ ] Trinity Method investigation completed and documented
- [ ] All TypeScript type checks passing
- [ ] ESLint rules compliance verified
- [ ] Performance metrics within acceptable ranges
- [ ] Zero console errors in development and production builds
- [ ] User experience audit completed
- [ ] Security review completed
- [ ] Documentation updated (ARCHITECTURE.md, ISSUES.md)
- [ ] Tests passing (when test suite exists)
- [ ] Debugging logs implemented and verified
```

### Code Quality Requirements
```javascript
// Required debugging pattern for all functions
console.log(`[ENTRY] ${functionName}`, {
    params: arguments,
    timestamp: Date.now(),
    module: '[MODULE_NAME]',
    stack: 'Next.js/React/TypeScript',
    sessionId: process.env.NODE_ENV === 'development' ? Date.now() : undefined
});

// Required error handling pattern
try {
    // Implementation
    console.log(`[SUCCESS] ${functionName}`, { result, timestamp: Date.now() });
} catch (error) {
    console.error(`[ERROR] ${functionName}`, {
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        module: '[MODULE_NAME]'
    });
    throw error; // Re-throw after logging
}
```

### Performance Quality Gates
- Response Time: <100ms for user interactions
- Bundle Size: Each route chunk <200KB gzipped
- Lighthouse Performance Score: >90
- Core Web Vitals: All metrics in "Good" range
- Memory Usage: <500MB runtime footprint

## Success Metrics Tracking

### Project Health Metrics
```javascript
const trinityMetrics = {
    investigationSuccessRate: 0, // Target: 100%
    issuesPreventedByPatterns: 0, // Track pattern reuse effectiveness
    knowledgeReuseRate: 0, // Cross-session knowledge utilization
    qualityGatePassRate: 0, // Target: 100%
    crisisProtocolActivations: 0, // Lower is better
    performanceRegressionCount: 0, // Target: 0
    consoleErrorIncidents: 0, // Target: 0
    securityVulnerabilityCount: 0 // Target: 0
};
```

### Continuous Improvement
- Weekly metrics review and trend analysis
- Monthly pattern effectiveness assessment
- Quarterly Trinity Method refinement
- Annual knowledge base optimization

## Cross-Session Knowledge Management

### Knowledge Artifacts Structure
```yaml
Session Artifacts:
  Location: trinity/sessions/[YYYY-MM-DD]/
  Required Files:
    - investigation-summary.md    # Key findings and decisions
    - patterns-discovered.md      # New patterns for ISSUES.md
    - issues-resolved.md         # Resolution strategies used
    - performance-impact.md      # Performance implications
    - architecture-changes.md    # Structural modifications
```

### Knowledge Retention Strategy
1. **Immediate Capture**: Document insights as they occur
2. **Pattern Extraction**: Identify reusable knowledge patterns
3. **Cross-Reference**: Link to existing knowledge base entries
4. **Validation**: Verify knowledge accuracy and completeness
5. **Integration**: Merge into permanent knowledge base

## Trinity Method Commands

### Investigation Commands
```bash
# Start Trinity Investigation
"Begin Trinity Method investigation for [specific feature/bug/task]"

# Complete Investigation
"Finalize investigation with comprehensive implementation plan"

# Pattern Recognition
"Analyze current issue against existing ISSUES.md patterns"

# Knowledge Integration
"Update knowledge base with investigation findings"
```

### Crisis Management Commands
```bash
# Emergency Response
"Execute Console Error Crisis Protocol immediately"
"Execute Performance Crisis Protocol with baseline comparison"
"Execute Data Integrity Crisis Protocol with full audit"
"Execute Security Crisis Protocol with vulnerability assessment"

# System Health
"Perform comprehensive Trinity Method health check"
"Validate all quality gates and performance baselines"
```

## Integration with Parent Context

### Reference to Global Context
This file extends the behavioral requirements defined in `../CLAUDE.md`:
- Inherits global performance baselines and quality standards
- Applies Trinity Method enforcement to all development activities
- Ensures investigation-first approach for all technical decisions
- Maintains hierarchical context consistency

### Technology Context Integration
Works in conjunction with `../src/CLAUDE.md` for:
- Technology-specific Trinity Method adaptations
- Framework-aware investigation templates
- Stack-specific crisis protocols
- Integrated debugging and monitoring strategies

---

**Trinity Method Version**: 3.0
**Last Updated**: 2025-09-22
**Context Hierarchy**: Level 2 (Trinity Enforcement)
**Parent Context**: ../CLAUDE.md
**Child Context**: ../src/CLAUDE.md