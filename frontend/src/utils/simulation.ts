import { GanttBlock, TrainSchedule, Corridor, Department } from '../types';

export type EmergencySeverity = 'Critical' | 'High' | 'Medium';

export type EmergencyFailureType = 
  | 'Rail Fracture' 
  | 'Signal Failure' 
  | 'OHE Snap' 
  | 'Track Washout' 
  | 'Other';

export interface AffectedTrainDetail {
  train: TrainSchedule;
  estimatedDelayMinutes: number;
  plainEnglishImpact: string;
  recommendedAction: string;
}

export interface ResourceAllocationSummary {
  crewsAssigned: { department: Department; teamName: string; count: number }[];
  machinesDispatched: string[];
  safetyMarshals: number;
  estimatedRecoveryTimeMinutes: number;
}

export interface EmergencyPlanResult {
  updatedGanttBlocks: GanttBlock[];
  emergencyBlock: GanttBlock;
  rescheduledCount: number;
  delaysBeforeMinutes: number;
  delaysAfterMinutes: number;
  conflictsBefore: number;
  conflictsAfter: number;
  resourceSummary: ResourceAllocationSummary;
  recommendation: {
    immediateAction: string;
    suggestedWindow: string;
    requiredTeams: string;
    recoveryTime: string;
    safetyWarning: string;
  };
}

/**
 * Calculates a composite risk score (0 - 100) combining failure severity,
 * corridor daily train density, and sectional maximum speed.
 */
export function calculateRiskScore(
  severity: EmergencySeverity,
  dailyTrainDensity: number,
  maxSpeedKmph: number,
  failureType: EmergencyFailureType
): number {
  // SIMULATED — replace with real XGBoost Risk Prediction Model API call in production

  // Base weight by severity
  let baseScore = 50;
  if (severity === 'Critical') baseScore = 62;
  else if (severity === 'High') baseScore = 48;
  else baseScore = 32;

  // Failure type hazard factor
  let failureTypeFactor = 0;
  if (failureType === 'Rail Fracture') failureTypeFactor = 16;
  else if (failureType === 'OHE Snap') failureTypeFactor = 14;
  else if (failureType === 'Track Washout') failureTypeFactor = 15;
  else if (failureType === 'Signal Failure') failureTypeFactor = 10;
  else failureTypeFactor = 8;

  // Traffic volume factor (max 15 pts normalized to 150 trains/day)
  const densityFactor = Math.min(15, (dailyTrainDensity / 150) * 15);

  // Speed factor (max 10 pts normalized to 130 km/h)
  const speedFactor = Math.min(10, (maxSpeedKmph / 140) * 10);

  const rawScore = Math.round(baseScore + failureTypeFactor + densityFactor + speedFactor);
  return Math.min(99, Math.max(25, rawScore));
}

/**
 * Maps calculated risk score to priority bucket (P1–P4).
 * Thresholds: >85 = P1, >65 = P2, >40 = P3, else P4.
 */
export function calculatePriorityBucket(riskScore: number): {
  bucket: 'P1' | 'P2' | 'P3' | 'P4';
  label: string;
  badgeClass: string;
  borderClass: string;
} {
  // SIMULATED — replace with real Random Forest Priority Classification Model API call in production

  if (riskScore > 85) {
    return {
      bucket: 'P1',
      label: 'P1 — Emergency Operational Priority (Immediate Block Dispatch)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      borderClass: 'border-rose-500'
    };
  }
  if (riskScore > 65) {
    return {
      bucket: 'P2',
      label: 'P2 — High Urgency (Immediate Traffic Diversion & Power Cut)',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      borderClass: 'border-orange-500'
    };
  }
  if (riskScore > 40) {
    return {
      bucket: 'P3',
      label: 'P3 — Moderate Urgency (Impose Caution Order 20 km/h & Regulate)',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      borderClass: 'border-amber-500'
    };
  }
  return {
    bucket: 'P4',
    label: 'P4 — Monitored Deferrable (Planned Window Attention)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    borderClass: 'border-emerald-500'
  };
}

/**
 * Filters train schedules on the affected corridor and predicts real-time operational impact.
 */
export function getTrainImpact(
  trainSchedules: TrainSchedule[],
  corridorId: string,
  startHour: number,
  endHour: number,
  failureType: EmergencyFailureType
): AffectedTrainDetail[] {
  // SIMULATED — replace with real Train Timetable Delay Prediction API call in production

  // Real data filter: trains operating on the affected corridor
  const corridorTrains = trainSchedules.filter((train) => train.corridorId === corridorId);

  return corridorTrains.map((train) => {
    // Check if train timing falls close to or inside the incident window
    const overlaps = !(train.endHour < startHour || train.startHour > endHour + 2.0);
    
    let estimatedDelay = 0;
    let plainEnglishImpact = '';
    let recommendedAction = '';

    if (train.type === 'Vande Bharat' || train.priorityLevel === 'High-Speed') {
      estimatedDelay = overlaps ? (failureType === 'Rail Fracture' ? 45 : 30) : 15;
      plainEnglishImpact = overlaps
        ? `Semi-high-speed path directly obstructed. Held at upstream junction; requires expedited single-line bypass.`
        : `Secondary speed restriction imposed (30 km/h TSR). Expected minor arrival setback.`;
      recommendedAction = overlaps
        ? `Regulate at previous junction station; give absolute green wave priority once restoration block clears.`
        : `Issue Caution Order #TSR-42 at home signal; monitor axle box telemetry.`;
    } else if (train.type === 'Premium Passenger' || train.type === 'Express') {
      estimatedDelay = overlaps ? (failureType === 'OHE Snap' ? 60 : 40) : 20;
      plainEnglishImpact = overlaps
        ? `Path blocked in sector. Held at outer loop line with passenger air conditioning backup active.`
        : `Held on intermediate loop line; passenger announcements triggered.`;
      recommendedAction = overlaps
        ? `Divert via parallel DOWN line if available, or hold with platform water/power provisions.`
        : `Maintain 15-minute headway behind preceding express vector.`;
    } else {
      // Freight
      estimatedDelay = overlaps ? 90 : 45;
      plainEnglishImpact = overlaps
        ? `Heavy freight movement suspended in corridor block section to conserve electrical line capacity.`
        : `Stabled at yard loop; zero passenger impact.`;
      recommendedAction = overlaps
        ? `Stance in siding loop; release crew hours for rest roster compliance.`
        : `Run at economy coasting speed (35 km/h) to maintain braking distance.`;
    }

    return {
      train,
      estimatedDelayMinutes: estimatedDelay,
      plainEnglishImpact,
      recommendedAction
    };
  });
}

/**
 * Re-optimizes scheduled Gantt blocks on the affected corridor:
 * Displaces or shifts conflicting scheduled maintenance, resolves overlaps,
 * and generates a dedicated emergency restoration block.
 */
export function simulateShift(
  currentBlocks: GanttBlock[],
  corridor: Corridor,
  failureStartHour: number,
  failureDurationHours: number,
  failureType: EmergencyFailureType,
  location: string,
  severity: EmergencySeverity
): EmergencyPlanResult {
  // SIMULATED — replace with real OR-Tools / MILP Solver API call in production

  const corridorId = corridor.id;
  const failureEndHour = Math.min(23.5, failureStartHour + failureDurationHours);

  // Identify department responsible based on failure type
  let department: Department = 'Engineering';
  if (failureType === 'OHE Snap') department = 'Traction';
  else if (failureType === 'Signal Failure') department = 'Signal & Telecom';
  else if (failureType === 'Track Washout') department = 'Cross-Department';

  // Build the new Emergency restoration block
  const emergencyBlockId = `EMG-${Date.now().toString().slice(-4)}`;
  const emergencyBlock: GanttBlock = {
    id: emergencyBlockId,
    requestId: `REQ-EMG-${Date.now().toString().slice(-4)}`,
    title: `🚨 EMERGENCY: ${failureType} Restoration`,
    department,
    startHour: failureStartHour,
    endHour: failureEndHour,
    trackKm: location,
    corridorId,
    hasConflict: false,
    status: 'In-Progress',
    oheCut: failureType === 'OHE Snap' || failureType === 'Rail Fracture',
    speedRestriction: severity === 'Critical' ? 'Stop Dead (0 km/h)' : 'Caution Order (15 km/h)',
    isSimulated: true
  };

  let rescheduledCount = 0;
  let delaysBefore = 0;
  let conflictsBefore = 0;

  // Process existing blocks: shift conflicting ones away from the emergency window
  const updatedGanttBlocks = currentBlocks.map((block) => {
    if (block.corridorId !== corridorId) {
      return block;
    }

    // Check overlap with the emergency restoration window
    const hasOverlap = (block.startHour < failureEndHour && block.endHour > failureStartHour);

    if (block.hasConflict) {
      conflictsBefore += 1;
      delaysBefore += 45;
    }

    if (hasOverlap) {
      rescheduledCount += 1;
      conflictsBefore += 1;
      delaysBefore += 60;

      // Reschedule into post-emergency or safe late-night shadow window
      const duration = block.endHour - block.startHour;
      let newStart = failureEndHour + 0.5;
      if (newStart + duration > 23.5) {
        newStart = Math.max(0.5, failureStartHour - duration - 0.5);
      }
      const newEnd = Math.min(24, newStart + duration);

      return {
        ...block,
        startHour: Math.round(newStart * 10) / 10,
        endHour: Math.round(newEnd * 10) / 10,
        hasConflict: false,
        conflictDetails: undefined,
        status: 'Approved' as const
      };
    }

    return block;
  });

  // Prepend the emergency block so it's prioritized
  const finalBlocks = [emergencyBlock, ...updatedGanttBlocks];

  // Resource Allocation Breakdown
  const resourceSummary: ResourceAllocationSummary = {
    crewsAssigned: [
      {
        department,
        teamName: `${department} Emergency Rapid Response Gang #01`,
        count: severity === 'Critical' ? 18 : 12
      },
      {
        department: 'Engineering',
        teamName: 'Permanent Way Welding & USFD Inspection Unit',
        count: 8
      }
    ],
    machinesDispatched: [
      failureType === 'OHE Snap' ? 'Tower Wagon 8-Wheeler (TW-104)' : 'AFTD Rail Tensor & Flash Butt Welder',
      'Ultrasonic Flaw Detector (USFD Double-Rail Trolley)',
      'Track Geometry Measurement Trolley'
    ],
    safetyMarshals: 4,
    estimatedRecoveryTimeMinutes: Math.round(failureDurationHours * 60)
  };

  const delaysAfter = Math.max(10, Math.round(delaysBefore * 0.18));

  const formatHourString = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const recommendation = {
    immediateAction: 
      failureType === 'Rail Fracture'
        ? 'Impose Stop Dead order; clamp fractured rail with emergency fishplates and 1-meter joggled fishplates.'
        : failureType === 'OHE Snap'
        ? 'Isolate 25kV feeder breaker immediately; earth both ends of the catenary wire with discharge rods.'
        : failureType === 'Signal Failure'
        ? 'Clamp & padlock points at facing direction; issue Form T/369(3b) for manual pilot movement.'
        : 'Halt approaching rakes; deploy ballast consolidation and drainage clearing teams.',
    suggestedWindow: `${formatHourString(failureStartHour)} – ${formatHourString(failureEndHour)} hrs (${Math.round(failureDurationHours * 60)} min Emergency Block)`,
    requiredTeams: `${department} Quick Response Unit + 2 Safety Lookout Marshals + ${resourceSummary.machinesDispatched[0]}`,
    recoveryTime: `Estimated full restoration in ${Math.round(failureDurationHours * 60)} mins (Track handover at ${formatHourString(failureEndHour)} hrs)`,
    safetyWarning:
      failureType === 'OHE Snap' || failureType === 'Rail Fracture'
        ? 'CRITICAL: Traction Power Cut (25kV) mandatory. No personnel within 2.0 meters of overhead wire until discharged.'
        : 'CAUTION: Ensure audible detonator warning protection placed 600m and 1200m ahead of work zone.'
  };

  return {
    updatedGanttBlocks: finalBlocks,
    emergencyBlock,
    rescheduledCount,
    delaysBeforeMinutes: Math.max(120, delaysBefore),
    delaysAfterMinutes: delaysAfter,
    conflictsBefore: Math.max(2, conflictsBefore),
    conflictsAfter: 0,
    resourceSummary,
    recommendation
  };
}
