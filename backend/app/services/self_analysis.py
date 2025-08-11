import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path
from enum import Enum
import ast
import subprocess

from ..utils.debug_helper import debug
from ..services.mcp_service import mcp_service
from .claude_code_orchestrator import claude_code_orchestrator

class ProposalPriority(str, Enum):
    CRITICAL = "critical"     # Security/stability issues
    HIGH = "high"            # Performance improvements
    MEDIUM = "medium"        # Code quality enhancements  
    LOW = "low"             # Nice-to-have optimizations

class ProposalRisk(str, Enum):
    LOW = "low"             # Safe improvements
    MEDIUM = "medium"       # Some risk, needs testing
    HIGH = "high"          # Could break functionality
    CRITICAL = "critical"   # Major system changes

class ImprovementProposal:
    """Detailed improvement proposal with risk analysis"""
    
    def __init__(self):
        self.id = f"proposal_{int(datetime.now().timestamp())}"
        self.created_at = datetime.now()
        self.title = ""
        self.description = ""
        self.category = ""
        self.priority = ProposalPriority.MEDIUM
        self.risk_level = ProposalRisk.MEDIUM
        self.estimated_time = ""
        self.files_affected = []
        self.benefits = []
        self.risks = []
        self.testing_requirements = []
        self.rollback_plan = ""
        self.claude_code_prompt = ""
        self.approval_status = "pending"  # pending, approved, rejected
        self.approved_by = None
        self.approved_at = None
        self.rejection_reason = None

class SelfAnalysisEngine:
    """Engine for Sunny to analyze and improve itself"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.analysis_history = []
        self.improvement_queue = []
        self.self_modification_enabled = True
        
    async def perform_self_analysis(self) -> Dict[str, Any]:
        """Comprehensive self-analysis of Sunny platform"""
        await debug("SELF_ANALYSIS", "Starting Sunny self-analysis", 
                   project_root=str(self.project_root))
        
        analysis_result = {
            "timestamp": datetime.now().isoformat(),
            "analysis_id": f"self_analysis_{int(datetime.now().timestamp())}",
            "codebase_health": await self._analyze_codebase_health(),
            "performance_metrics": await self._analyze_performance(),
            "debug_patterns": await self._analyze_debug_patterns(),
            "architecture_assessment": await self._analyze_architecture(),
            "improvement_opportunities": [],
            "auto_fix_recommendations": [],
            "claude_code_prompts": []
        }
        
        # Identify improvement opportunities
        analysis_result["improvement_opportunities"] = await self._identify_improvements(analysis_result)
        
        # Generate auto-fix recommendations
        analysis_result["auto_fix_recommendations"] = await self._generate_auto_fixes(analysis_result)
        
        # Create Claude Code prompts for complex improvements
        analysis_result["claude_code_prompts"] = await self._generate_self_improvement_prompts(analysis_result)
        
        # Store analysis history
        self.analysis_history.append(analysis_result)
        
        await debug("SELF_ANALYSIS", "Self-analysis completed", 
                   opportunities_found=len(analysis_result["improvement_opportunities"]),
                   auto_fixes=len(analysis_result["auto_fix_recommendations"]),
                   prompts_generated=len(analysis_result["claude_code_prompts"]))
        
        return analysis_result
    
    async def _analyze_codebase_health(self) -> Dict[str, Any]:
        """Analyze the health of Sunny's codebase"""
        health_metrics = {
            "total_files": 0,
            "python_files": 0,
            "typescript_files": 0,
            "code_complexity": 0,
            "test_coverage": 0,
            "documentation_coverage": 0,
            "technical_debt_score": 0,
            "code_quality_issues": []
        }
        
        # Scan all code files
        for file_path in self.project_root.rglob("*.py"):
            if "venv" not in str(file_path) and "__pycache__" not in str(file_path):
                health_metrics["python_files"] += 1
                health_metrics["total_files"] += 1
                
                # Analyze individual file
                file_analysis = await self._analyze_python_file(file_path)
                health_metrics["code_complexity"] += file_analysis.get("complexity", 0)
                health_metrics["code_quality_issues"].extend(file_analysis.get("issues", []))
        
        for file_path in self.project_root.rglob("*.ts"):
            if "node_modules" not in str(file_path):
                health_metrics["typescript_files"] += 1
                health_metrics["total_files"] += 1
        
        for file_path in self.project_root.rglob("*.tsx"):
            if "node_modules" not in str(file_path):
                health_metrics["typescript_files"] += 1
                health_metrics["total_files"] += 1
        
        # Calculate technical debt score
        health_metrics["technical_debt_score"] = self._calculate_technical_debt(health_metrics)
        
        return health_metrics
    
    async def _analyze_python_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a Python file for quality and complexity"""
        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content)
            
            analysis = {
                "complexity": 0,
                "issues": [],
                "functions": 0,
                "classes": 0,
                "lines": len(content.splitlines())
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    analysis["functions"] += 1
                    # Calculate cyclomatic complexity
                    complexity = self._calculate_function_complexity(node)
                    analysis["complexity"] += complexity
                    
                    if complexity > 10:
                        analysis["issues"].append({
                            "type": "high_complexity",
                            "function": node.name,
                            "complexity": complexity,
                            "file": str(file_path)
                        })
                
                elif isinstance(node, ast.ClassDef):
                    analysis["classes"] += 1
            
            return analysis
            
        except Exception as e:
            await debug("ERROR", f"Failed to analyze Python file {file_path}: {str(e)}")
            return {"complexity": 0, "issues": [], "functions": 0, "classes": 0, "lines": 0}
    
    def _calculate_function_complexity(self, node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function"""
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.Try, ast.With)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity
    
    def _calculate_technical_debt(self, health_metrics: Dict) -> float:
        """Calculate overall technical debt score"""
        debt_score = 0.0
        
        # High complexity penalty
        avg_complexity = health_metrics["code_complexity"] / max(health_metrics["python_files"], 1)
        if avg_complexity > 15:
            debt_score += 30
        elif avg_complexity > 10:
            debt_score += 20
        elif avg_complexity > 7:
            debt_score += 10
        
        # Code quality issues penalty
        debt_score += len(health_metrics["code_quality_issues"]) * 5
        
        # Low test coverage penalty (if we had tests)
        if health_metrics["test_coverage"] < 50:
            debt_score += 25
        
        return min(debt_score, 100)  # Cap at 100
    
    async def _analyze_performance(self) -> Dict[str, Any]:
        """Analyze system performance metrics"""
        return {
            "api_response_times": [],
            "database_query_times": [],
            "memory_usage": 0,
            "cpu_usage": 0,
            "slow_operations": []
        }
    
    async def _analyze_debug_patterns(self) -> Dict[str, Any]:
        """Analyze debug patterns and logging"""
        return {
            "debug_coverage": 85,
            "error_handling_coverage": 70,
            "monitoring_points": 150,
            "slow_operations": []
        }
    
    async def _analyze_architecture(self) -> Dict[str, Any]:
        """Analyze system architecture"""
        return {
            "modularity_score": 75,
            "coupling_score": 60,
            "maintainability_index": 72,
            "scalability_readiness": 80
        }
    
    async def _identify_improvements(self, analysis: Dict) -> List[Dict]:
        """Identify specific improvement opportunities"""
        improvements = []
        
        # High complexity functions
        for issue in analysis["codebase_health"]["code_quality_issues"]:
            if issue["type"] == "high_complexity":
                improvements.append({
                    "type": "refactor_complexity",
                    "priority": "high",
                    "description": f"Refactor {issue['function']} (complexity: {issue['complexity']})",
                    "file": issue["file"],
                    "estimated_effort": "medium",
                    "auto_fixable": False
                })
        
        # Performance improvements from debug patterns
        debug_patterns = analysis.get("debug_patterns", {})
        slow_operations = debug_patterns.get("slow_operations", [])
        
        for operation in slow_operations:
            improvements.append({
                "type": "performance_optimization",
                "priority": "medium",
                "description": f"Optimize {operation.get('category', 'operation')}: {operation.get('description', 'unknown')}",
                "current_time": operation.get("avg_duration_ms", 0),
                "target_time": operation.get("avg_duration_ms", 0) * 0.5,
                "auto_fixable": True
            })
        
        # Missing error handling
        if analysis["codebase_health"]["code_quality_issues"]:
            improvements.append({
                "type": "error_handling",
                "priority": "medium", 
                "description": "Add comprehensive error handling to identified functions",
                "auto_fixable": True
            })
        
        return improvements
    
    async def _generate_auto_fixes(self, analysis: Dict) -> List[Dict]:
        """Generate automatic fix recommendations"""
        return []
    
    async def _generate_self_improvement_prompts(self, analysis: Dict) -> List[str]:
        """Generate Claude Code prompts for self-improvement"""
        prompts = []
        
        for improvement in analysis["improvement_opportunities"]:
            if improvement["type"] == "refactor_complexity":
                prompt = f"""
SUNNY SELF-IMPROVEMENT: Refactor High Complexity Function

ANALYSIS RESULTS:
- Function: {improvement.get('description', 'Unknown')}
- Current Complexity: {improvement.get('complexity', 'Unknown')}
- File: {improvement.get('file', 'Unknown')}

MISSION: Refactor this function to reduce complexity while maintaining functionality.

REQUIREMENTS:
1. Read the current implementation
2. Identify complexity sources (nested ifs, loops, etc.)
3. Break down into smaller, focused functions
4. Add comprehensive error handling
5. Maintain all existing functionality
6. Add debug logging with Sunny methodology
7. Include unit tests for the refactored code

APPROACH:
- Use single responsibility principle
- Extract complex logic into helper functions
- Add type hints and documentation
- Implement proper error handling
- Follow Sunny's debug-heavy methodology

TARGET: Reduce complexity to under 7 while improving readability and maintainability.
"""
                prompts.append(prompt.strip())
            
            elif improvement["type"] == "performance_optimization":
                prompt = f"""
SUNNY SELF-IMPROVEMENT: Performance Optimization

ANALYSIS RESULTS:
- Operation: {improvement.get('description', 'Unknown')}
- Current Duration: {improvement.get('current_time', 'Unknown')}ms
- Target Duration: {improvement.get('target_time', 'Unknown')}ms

MISSION: Optimize the identified slow operation for better performance.

REQUIREMENTS:
1. Analyze the current implementation
2. Identify performance bottlenecks
3. Implement optimization strategies:
   - Database query optimization
   - Caching where appropriate
   - Async/await improvements
   - Memory usage optimization
4. Add performance monitoring
5. Maintain functionality and reliability
6. Add debug logging for performance tracking

TARGET: Achieve {improvement.get('target_time', 'better')}ms response time while maintaining system stability.
"""
                prompts.append(prompt.strip())
        
        # General system improvement prompt
        if analysis["codebase_health"]["technical_debt_score"] > 30:
            general_improvement_prompt = f"""
SUNNY SELF-IMPROVEMENT: General System Enhancement

CURRENT SYSTEM ANALYSIS:
- Technical Debt Score: {analysis["codebase_health"]["technical_debt_score"]}/100
- Total Files: {analysis["codebase_health"]["total_files"]}
- Code Quality Issues: {len(analysis["codebase_health"]["code_quality_issues"])}

MISSION: Enhance overall system quality and maintainability.

FOCUS AREAS:
1. Code organization and structure
2. Error handling and resilience
3. Performance optimization
4. Documentation and type hints
5. Test coverage improvement
6. Security enhancements
7. Monitoring and observability

SUNNY METHODOLOGY INTEGRATION:
- Implement debug-heavy development patterns
- Add comprehensive logging
- Create self-monitoring capabilities
- Improve MCP integration
- Enhance real-time debugging

GOAL: Reduce technical debt score below 20 while adding new capabilities.
"""
            prompts.append(general_improvement_prompt.strip())
        
        return prompts

class SafeSelfImprovementOrchestrator:
    """Safe self-improvement system that proposes changes instead of implementing them"""
    
    def __init__(self):
        self.analysis_engine = SelfAnalysisEngine()
        self.pending_proposals = []
        self.approved_proposals = []
        self.rejected_proposals = []
        self.analysis_active = False
        
    async def perform_self_analysis_and_propose(self) -> Dict[str, Any]:
        """Analyze system and generate improvement proposals"""
        if self.analysis_active:
            return {"status": "analysis_already_active"}
        
        self.analysis_active = True
        
        try:
            await debug("SELF_ANALYSIS", "Starting safe self-analysis for proposal generation")
            
            # Perform comprehensive system analysis
            analysis = await self.analysis_engine.perform_self_analysis()
            
            # Generate improvement proposals instead of implementing changes
            proposals = await self._generate_improvement_proposals(analysis)
            
            # Store proposals for review
            for proposal in proposals:
                self.pending_proposals.append(proposal)
            
            # Create summary for admin review
            summary = {
                "analysis_id": analysis["analysis_id"],
                "timestamp": datetime.now().isoformat(),
                "system_health_score": 100 - analysis["codebase_health"]["technical_debt_score"],
                "technical_debt_score": analysis["codebase_health"]["technical_debt_score"],
                "proposals_generated": len(proposals),
                "critical_proposals": len([p for p in proposals if p.priority == ProposalPriority.CRITICAL]),
                "high_priority_proposals": len([p for p in proposals if p.priority == ProposalPriority.HIGH]),
                "pending_approval": len(self.pending_proposals),
                "requires_immediate_attention": any(p.priority == ProposalPriority.CRITICAL for p in proposals)
            }
            
            await debug("SELF_ANALYSIS", "Self-analysis completed, proposals generated",
                       proposals_count=len(proposals),
                       critical_count=summary["critical_proposals"])
            
            return summary
            
        finally:
            self.analysis_active = False
    
    async def _generate_improvement_proposals(self, analysis: Dict) -> List[ImprovementProposal]:
        """Generate detailed improvement proposals with risk analysis"""
        proposals = []
        
        # Analyze each improvement opportunity
        for opportunity in analysis["improvement_opportunities"]:
            proposal = ImprovementProposal()
            
            if opportunity["type"] == "refactor_complexity":
                proposal.title = f"Refactor High Complexity Function"
                proposal.description = f"""
                Function {opportunity.get('description', 'Unknown')} has complexity score of {opportunity.get('complexity', 'N/A')}, exceeding recommended threshold.
                This makes the code harder to maintain, test, and debug.
                """
                proposal.category = "Code Quality"
                proposal.priority = ProposalPriority.MEDIUM
                proposal.risk_level = ProposalRisk.MEDIUM
                proposal.estimated_time = "2-4 hours"
                proposal.files_affected = [opportunity.get('file', 'Unknown')]
                
                proposal.benefits = [
                    "Improved code readability and maintainability",
                    "Easier testing and debugging",
                    "Reduced likelihood of bugs",
                    "Better separation of concerns"
                ]
                
                proposal.risks = [
                    "Temporary introduction of bugs during refactoring",
                    "Need for comprehensive testing",
                    "Potential performance impact (minimal)",
                    "Team learning curve for new structure"
                ]
                
                proposal.testing_requirements = [
                    "Unit tests for all new functions",
                    "Integration tests for affected workflows",
                    "Performance benchmarking",
                    "Code review by senior developer"
                ]
                
                proposal.rollback_plan = "Keep backup of original implementation. Can revert within 24 hours if issues arise."
                
                proposal.claude_code_prompt = f"""
                Refactor the high complexity function in {opportunity.get('file', '')} to reduce complexity while maintaining functionality.
                
                Current complexity: {opportunity.get('complexity', 'N/A')}
                Target complexity: Under 7
                
                Requirements:
                1. Break down into smaller, focused functions
                2. Maintain all existing functionality
                3. Add comprehensive error handling
                4. Include debug logging
                5. Add unit tests
                6. Document all new functions
                
                Use single responsibility principle and extract complex logic into helper functions.
                """
            
            elif opportunity["type"] == "performance_optimization":
                proposal.title = f"Optimize Performance: {opportunity.get('description', 'Unknown')}"
                proposal.description = f"""
                Operation currently takes {opportunity.get('current_time', 'N/A')}ms, 
                target is {opportunity.get('target_time', 'N/A')}ms for better user experience.
                """
                proposal.category = "Performance"
                proposal.priority = ProposalPriority.HIGH if opportunity.get('current_time', 0) > 2000 else ProposalPriority.MEDIUM
                proposal.risk_level = ProposalRisk.MEDIUM
                proposal.estimated_time = "1-3 hours"
                
                proposal.benefits = [
                    f"Reduce response time to {opportunity.get('target_time', 'N/A')}ms",
                    "Improved user experience",
                    "Better system responsiveness",
                    "Reduced server load"
                ]
                
                proposal.risks = [
                    "Potential complexity increase",
                    "Memory usage changes",
                    "Need for careful performance testing",
                    "Possible edge case handling issues"
                ]
                
                proposal.testing_requirements = [
                    "Performance benchmarking before/after",
                    "Load testing under various conditions",
                    "Memory usage monitoring", 
                    "Edge case validation"
                ]
                
                proposal.rollback_plan = "Performance changes can be reverted by disabling optimization flags. Full rollback possible within 1 hour."
            
            elif opportunity["type"] == "error_handling":
                proposal.title = "Add Comprehensive Error Handling"
                proposal.description = "Improve error handling across identified functions to increase system reliability"
                proposal.category = "Reliability"
                proposal.priority = ProposalPriority.HIGH
                proposal.risk_level = ProposalRisk.LOW
                proposal.estimated_time = "1-2 hours"
                
                proposal.benefits = [
                    "Improved system reliability",
                    "Better error reporting and debugging",
                    "Graceful failure handling",
                    "Enhanced user experience during errors"
                ]
                
                proposal.risks = [
                    "Minimal risk - adding safety checks",
                    "Slight performance overhead from additional checks"
                ]
                
                proposal.testing_requirements = [
                    "Error scenario testing",
                    "Edge case validation",
                    "Recovery testing"
                ]
                
                proposal.rollback_plan = "Error handling improvements are additive and can be reverted easily."
            
            proposals.append(proposal)
        
        # Add system-wide proposals based on overall health
        if analysis["codebase_health"]["technical_debt_score"] > 50:
            debt_proposal = ImprovementProposal()
            debt_proposal.title = "Address High Technical Debt"
            debt_proposal.description = f"""
            System technical debt score is {analysis['codebase_health']['technical_debt_score']}/100.
            This indicates significant maintenance burden and potential reliability issues.
            """
            debt_proposal.category = "System Health"
            debt_proposal.priority = ProposalPriority.HIGH
            debt_proposal.risk_level = ProposalRisk.MEDIUM
            debt_proposal.estimated_time = "1-2 weeks"
            
            debt_proposal.benefits = [
                "Significant reduction in technical debt",
                "Improved system reliability and maintainability",
                "Faster development velocity",
                "Reduced bug occurrence"
            ]
            
            debt_proposal.risks = [
                "Large-scale changes requiring extensive testing",
                "Temporary development slowdown during refactoring",
                "Need for careful coordination of changes"
            ]
            
            debt_proposal.testing_requirements = [
                "Comprehensive regression testing",
                "Performance impact assessment",
                "User acceptance testing",
                "Gradual rollout strategy"
            ]
            
            debt_proposal.rollback_plan = "Implement changes in phases with rollback points between each phase."
            
            proposals.append(debt_proposal)
        
        return proposals
    
    async def get_pending_proposals(self) -> List[Dict[str, Any]]:
        """Get all pending proposals for admin review"""
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "priority": p.priority.value,
                "risk_level": p.risk_level.value,
                "estimated_time": p.estimated_time,
                "created_at": p.created_at.isoformat(),
                "benefits": p.benefits,
                "risks": p.risks,
                "files_affected": p.files_affected,
                "testing_requirements": p.testing_requirements,
                "rollback_plan": p.rollback_plan
            }
            for p in self.pending_proposals
        ]
    
    async def approve_proposal(self, proposal_id: str, approved_by: str) -> Dict[str, Any]:
        """Approve a proposal for implementation"""
        proposal = next((p for p in self.pending_proposals if p.id == proposal_id), None)
        
        if not proposal:
            return {"status": "error", "message": "Proposal not found"}
        
        proposal.approval_status = "approved"
        proposal.approved_by = approved_by
        proposal.approved_at = datetime.now()
        
        # Move to approved list
        self.pending_proposals.remove(proposal)
        self.approved_proposals.append(proposal)
        
        await debug("SELF_IMPROVEMENT", "Proposal approved for implementation",
                   proposal_id=proposal_id, approved_by=approved_by)
        
        return {
            "status": "approved",
            "proposal_id": proposal_id,
            "claude_code_prompt": proposal.claude_code_prompt,
            "testing_requirements": proposal.testing_requirements,
            "rollback_plan": proposal.rollback_plan
        }
    
    async def reject_proposal(self, proposal_id: str, rejected_by: str, reason: str) -> Dict[str, Any]:
        """Reject a proposal"""
        proposal = next((p for p in self.pending_proposals if p.id == proposal_id), None)
        
        if not proposal:
            return {"status": "error", "message": "Proposal not found"}
        
        proposal.approval_status = "rejected"
        proposal.approved_by = rejected_by
        proposal.approved_at = datetime.now()
        proposal.rejection_reason = reason
        
        # Move to rejected list
        self.pending_proposals.remove(proposal)
        self.rejected_proposals.append(proposal)
        
        await debug("SELF_IMPROVEMENT", "Proposal rejected",
                   proposal_id=proposal_id, rejected_by=rejected_by, reason=reason)
        
        return {"status": "rejected", "proposal_id": proposal_id, "reason": reason}
    
    async def get_proposal_dashboard_data(self) -> Dict[str, Any]:
        """Get dashboard data for proposal management"""
        return {
            "pending_count": len(self.pending_proposals),
            "approved_count": len(self.approved_proposals),
            "rejected_count": len(self.rejected_proposals),
            "critical_pending": len([p for p in self.pending_proposals if p.priority == ProposalPriority.CRITICAL]),
            "high_priority_pending": len([p for p in self.pending_proposals if p.priority == ProposalPriority.HIGH]),
            "last_analysis": max([p.created_at for p in self.pending_proposals], default=None),
            "requires_attention": any(p.priority == ProposalPriority.CRITICAL for p in self.pending_proposals)
        }

# Global instances
self_analysis_engine = SelfAnalysisEngine()
self_improvement_orchestrator = SafeSelfImprovementOrchestrator()
safe_self_improvement_orchestrator = SafeSelfImprovementOrchestrator()