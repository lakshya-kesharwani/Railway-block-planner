// src/utils/assistantContext.ts
//
// Builds a compact, up-to-date text summary of the live app state
// (requests, corridors, conflicts, stats) so the AI Assistant can ground
// its answers in real data instead of hallucinating. This is a lightweight
// stand-in for a proper RAG pipeline — enough for a hackathon demo to show
// the chatbot "knows" what's happening in the system right now.

import { MaintenanceRequest, GanttBlock, Corridor, TrainSchedule } from '../types';

interface StatsShape {
  pendingCount: number;
  highRiskCount: number;
  approvedTodayCount: number;
  corridorUtilization: number;
  conflictCount: number;
}

export function buildSystemPrompt(params: {
  role: string;
  requests: MaintenanceRequest[];
  ganttBlocks: GanttBlock[];
  corridors: Corridor[];
  trainSchedules: TrainSchedule[];
  stats: StatsShape;
}): string {
  const { role, requests, ganttBlocks, corridors, stats } = params;

  const topPriority = [...requests]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5)
    .map(
      (r) =>
        `- ${r.id} "${r.title}" [${r.department}] corridor=${r.corridor} priority=${r.priorityScore} urgency=${r.urgency} status=${r.status} suggestedSlot=${r.suggestedSlot?.date} ${r.suggestedSlot?.startTime}-${r.suggestedSlot?.endTime}`
    )
    .join('\n');

  const conflicts = ganttBlocks
    .filter((b) => b.hasConflict)
    .slice(0, 8)
    .map((b) => `- ${b.id} "${b.title}" [${b.department}] ${b.trackKm} : ${b.conflictDetails || 'conflict detected'}`)
    .join('\n');

  const corridorSummary = corridors
    .map((c) => `- ${c.name} (${c.code}): status=${c.status}, density=${c.dailyTrainDensity} trains/day, maxSpeed=${c.maxSpeedKmph}km/h`)
    .join('\n');

  return `You are the AI Assistant embedded in "RailBlock AI" — an Automatic Block Planning system for Indian Railways (Ministry of Railways PS #27). It integrates maintenance/defect data from TMS, SMMS and TDMS with corridor block availability from the Control Office Application (COA) to generate AI-optimized weekly/monthly maintenance block schedules across Engineering, Traction Distribution, and Signal & Telecommunication departments.

The scoring/scheduling pipeline the app simulates is:
Maintenance Request → XGBoost (Risk Score) → Random Forest (Priority: Low/Medium/High/Critical) → LSTM (Expected Train Delay) → OR-Tools (Optimized Block Schedule) → Final Recommendation, with Isolation Forest flagging sensor/asset anomalies.

You are talking to a user with role: "${role}".

Answer questions about the system (how the AI pipeline works, what a priority score or conflict means, how block scheduling is optimized) AND about the live data below. Be concise, use railway terminology correctly, and when asked for a recommendation, ground it in the data shown. If something isn't in the data below, say so rather than inventing numbers. Keep answers short (a few sentences or a short list) unless asked for detail.

=== LIVE SYSTEM SNAPSHOT ===
Pending requests: ${stats.pendingCount} | High-risk: ${stats.highRiskCount} | Approved today: ${stats.approvedTodayCount} | Corridor utilization: ${stats.corridorUtilization}% | Active conflicts: ${stats.conflictCount}

Top priority maintenance requests:
${topPriority || 'None currently.'}

Active schedule conflicts:
${conflicts || 'No conflicts detected right now.'}

Corridors:
${corridorSummary || 'No corridor data.'}
=== END SNAPSHOT ===`;
}
