export type Role = 'engineering' | 'traction' | 'signal' | 'control' | 'admin';

export interface User {
  id: string;
  name: string;
  department: string; // e.g. "TMS", "SMMS", "TDMS", "Control Office", "Admin"
  role: Role; // 'engineering' | 'traction' | 'signal' | 'control' | 'admin'
  username: string;
}

export type Department = 'Engineering' | 'Traction' | 'Signal & Telecom' | 'Cross-Department';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In-Review' | 'Scheduled';

export type UrgencyLevel = 'Emergency' | 'High' | 'Medium' | 'Routine';

export type TrainType = 'Vande Bharat' | 'Premium Passenger' | 'Express' | 'Freight' | 'Suburban';

export interface PriorityBreakdown {
  trackGeometryRisk: number; // 0-100
  trafficVolumeIndex: number; // 0-100
  defectSeverity: number; // 0-100
  weatherVulnerability: number; // 0-100
  assetAgingIndex: number; // 0-100
}

export interface BlockConstraints {
  ohePowerCutRequired: boolean;
  speedRestrictionTsr: string; // e.g., "30 km/h" or "None"
  specialMachine: string; // e.g., "09-3X Dynamic Tamper", "BCM-350", "Tower Wagon", "None"
  crewRequired: number;
  interlockingIsolation: boolean;
}

export interface SuggestedSlot {
  date: string;
  startTime: string; // "02:30"
  endTime: string;   // "05:00"
  startHour: number; // 2.5
  endHour: number;   // 5.0
  corridor: string;
  shadowBlockWithTrain?: string;
  trainDelayMinutes: number;
  punctualityScore: number;
  confidenceScore: number;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  department: Department;
  corridor: string;
  trackKm: string;
  durationHours: number;
  deadline: string;
  urgency: UrgencyLevel;
  blockType: string;
  priorityScore: number; // 0-100 (Red >80, Yellow 50-80, Green <50)
  priorityBreakdown: PriorityBreakdown;
  status: RequestStatus;
  createdAt: string;
  submittedBy: string;
  constraints: BlockConstraints;
  aiReasoning: string;
  suggestedSlot: SuggestedSlot;
  isSimulated: boolean;
  approvalNotes?: string;
}

export interface GanttBlock {
  id: string;
  requestId: string;
  title: string;
  department: Department;
  startHour: number; // 0 - 24
  endHour: number;
  trackKm: string;
  corridorId: string;
  hasConflict: boolean;
  conflictDetails?: string;
  status: 'Approved' | 'Proposed' | 'In-Progress';
  oheCut: boolean;
  speedRestriction: string;
  isSimulated: boolean;
}

export interface TrainSchedule {
  id: string;
  trainNo: string;
  trainName: string;
  type: TrainType;
  corridorId: string;
  startHour: number; // 0 - 24
  endHour: number;
  direction: 'UP' | 'DOWN';
  priorityLevel: 'High-Speed' | 'Passenger' | 'Freight';
  status: 'On-Time' | 'Rescheduled' | 'Conflict';
  conflictWithBlockId?: string;
}

export interface Corridor {
  id: string;
  name: string;
  code: string;
  sectionLengthKm: number;
  maxSpeedKmph: number;
  dailyTrainDensity: number;
  status: 'Normal' | 'Congested' | 'Maintenance Active';
  route?: [number, number][];
}

export interface PipelineStage {
  id: number;
  name: string;
  subtitle: string;
  status: 'idle' | 'processing' | 'completed' | 'active';
  metrics: { [key: string]: string | number };
  description: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  trafficMultiplier: number;
  riskFactor: number;
  activeConflictsCount: number;
}
