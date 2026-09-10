import { Corridor, MaintenanceRequest, GanttBlock, TrainSchedule, ScenarioPreset, User } from '../types';

export const INITIAL_CORRIDORS: Corridor[] = [
  {
    id: 'COR-01',
    name: 'BSP-DURG Main Line (UP)',
    code: 'BSP-DURG-UP',
    sectionLengthKm: 148,
    maxSpeedKmph: 130,
    dailyTrainDensity: 126,
    status: 'Maintenance Active',
    route: [
      [22.0797, 82.1409], // BSP (Bilaspur Jn)
      [21.7371, 81.9360], // BYT (Bhatapara)
      [21.2514, 81.6296], // R (Raipur Jn)
      [21.2137, 81.3824], // BPHB (Bhilai Power House)
      [21.1904, 81.2849]  // DURG (Durg Jn)
    ]
  },
  {
    id: 'COR-02',
    name: 'BSP-DURG Main Line (DOWN)',
    code: 'BSP-DURG-DN',
    sectionLengthKm: 148,
    maxSpeedKmph: 130,
    dailyTrainDensity: 122,
    status: 'Normal',
    route: [
      [21.1984, 81.2849], // DURG (Durg Jn, offset +0.008 lat)
      [21.2217, 81.3824], // BPHB (Bhilai Power House)
      [21.2594, 81.6296], // R (Raipur Jn)
      [21.7451, 81.9360], // BYT (Bhatapara)
      [22.0877, 82.1409]  // BSP (Bilaspur Jn)
    ]
  },
  {
    id: 'COR-03',
    name: 'RAIPUR-MANDIR HASAUD Line',
    code: 'R-MNDH',
    sectionLengthKm: 17,
    maxSpeedKmph: 100,
    dailyTrainDensity: 48,
    status: 'Normal',
    route: [
      [21.2514, 81.6296], // R (Raipur Jn)
      [21.2227, 81.7766]  // MNDH (Mandir Hasaud)
    ]
  },
  {
    id: 'COR-04',
    name: 'RAIPUR-LAKHOLI Line',
    code: 'R-LAE',
    sectionLengthKm: 28,
    maxSpeedKmph: 110,
    dailyTrainDensity: 52,
    status: 'Congested',
    route: [
      [21.2514, 81.6296], // R (Raipur Jn)
      [21.2227, 81.7766], // MNDH (Mandir Hasaud)
      [21.1610, 81.8210]  // LAE (Lakholi)
    ]
  },
  {
    id: 'COR-05',
    name: 'RAIPUR-ABHANPUR Branch Line',
    code: 'R-AVP',
    sectionLengthKm: 28,
    maxSpeedKmph: 90,
    dailyTrainDensity: 36,
    status: 'Normal',
    route: [
      [21.2514, 81.6296], // R (Raipur Jn)
      [21.1250, 81.6850], // KDRI (Kendri)
      [21.0535, 81.7180]  // AVP (Abhanpur Jn)
    ]
  },
  {
    id: 'COR-06',
    name: 'ABHANPUR-RAJIM Branch Line',
    code: 'AVP-RIM',
    sectionLengthKm: 17,
    maxSpeedKmph: 75,
    dailyTrainDensity: 24,
    status: 'Normal',
    route: [
      [21.0535, 81.7180], // AVP (Abhanpur Jn)
      [20.9634, 81.8797]  // RIM (Rajim)
    ]
  }
];

export const INITIAL_REQUESTS: MaintenanceRequest[] = [
  {
    id: 'REQ-2026-ENG-101',
    title: 'Ultrasonic Flaw (USFD) Rail Defect Rectification',
    department: 'Engineering',
    corridor: 'BSP-DURG Main Line (UP)',
    trackKm: 'KM 142.4 - 144.0',
    durationHours: 3.0,
    deadline: '2026-09-02',
    urgency: 'Emergency',
    blockType: 'Turnout & Weld Replacement',
    priorityScore: 94,
    priorityBreakdown: {
      trackGeometryRisk: 98,
      trafficVolumeIndex: 92,
      defectSeverity: 96,
      weatherVulnerability: 82,
      assetAgingIndex: 88
    },
    status: 'Pending',
    createdAt: '2026-08-31 06:30',
    submittedBy: 'Er. Rajesh Sharma (Sr. DEN / Track)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: '30 km/h for 48h post-weld',
      specialMachine: 'AFTD Rail Tensor + Mobile Flash Butt Welding Plant',
      crewRequired: 22,
      interlockingIsolation: true
    },
    aiReasoning: 'Critical IMR (Immediate Measurement Required) internal flaw detected on high-speed 130 km/h corridor. Delaying past 48 hours escalates fracture risk probability to 78.4% under high-axle load.',
    suggestedSlot: {
      date: '2026-09-01',
      startTime: '01:30',
      endTime: '04:30',
      startHour: 1.5,
      endHour: 4.5,
      corridor: 'BSP-DURG Main Line (UP)',
      shadowBlockWithTrain: 'Freight Rake #BOXN-4482',
      trainDelayMinutes: 0,
      punctualityScore: 99.2,
      confidenceScore: 97.4
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-TRC-084',
    title: '25kV Catenary Dropper & Neutral Section Overhaul',
    department: 'Traction',
    corridor: 'BSP-DURG Main Line (UP)',
    trackKm: 'KM 188.0 - 192.5',
    durationHours: 2.5,
    deadline: '2026-09-03',
    urgency: 'High',
    blockType: 'OHE Neutral Section Inspection',
    priorityScore: 83,
    priorityBreakdown: {
      trackGeometryRisk: 42,
      trafficVolumeIndex: 88,
      defectSeverity: 89,
      weatherVulnerability: 94,
      assetAgingIndex: 79
    },
    status: 'In-Review',
    createdAt: '2026-08-31 08:15',
    submittedBy: 'Er. Amit Verma (DEE / TRD)',
    constraints: {
      ohePowerCutRequired: true,
      speedRestrictionTsr: 'None (Coasting allowed during isolation)',
      specialMachine: 'Self-Propelled 8-Wheeler Tower Wagon',
      crewRequired: 14,
      interlockingIsolation: false
    },
    aiReasoning: 'Thermal imaging camera flagged hot-spot at Neutral Section Insulator #4. High monsoon humidity increases flashover tripping risk by 64%. Can be co-scheduled as an integrated shadow block with Track Tamping.',
    suggestedSlot: {
      date: '2026-09-01',
      startTime: '02:00',
      endTime: '04:30',
      startHour: 2.0,
      endHour: 4.5,
      corridor: 'BSP-DURG Main Line (UP)',
      shadowBlockWithTrain: 'Integrated with REQ-2026-ENG-101',
      trainDelayMinutes: 0,
      punctualityScore: 98.6,
      confidenceScore: 94.8
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-SIG-052',
    title: 'Dual Axle Counter (DAC) Sensor Recalibration & Point Testing',
    department: 'Signal & Telecom',
    corridor: 'RAIPUR-MANDIR HASAUD Line',
    trackKm: 'KM 45.2 - 48.0',
    durationHours: 2.0,
    deadline: '2026-09-04',
    urgency: 'High',
    blockType: 'Point Machine & Interlocking Overhaul',
    priorityScore: 76,
    priorityBreakdown: {
      trackGeometryRisk: 30,
      trafficVolumeIndex: 94,
      defectSeverity: 82,
      weatherVulnerability: 65,
      assetAgingIndex: 84
    },
    status: 'Pending',
    createdAt: '2026-08-31 09:40',
    submittedBy: 'Er. S. Nambiar (DSTE / West)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: '15 km/h over facing points',
      specialMachine: 'Electronic Interlocking Diagnostic Kit',
      crewRequired: 8,
      interlockingIsolation: true
    },
    aiReasoning: 'Point machine 24B showed erratic detection time (+1.8s) during morning peak suburban traffic. Pre-emptive overhaul prevents potential signal failure and cascading delay of 18 suburban rakes.',
    suggestedSlot: {
      date: '2026-09-02',
      startTime: '01:00',
      endTime: '03:00',
      startHour: 1.0,
      endHour: 3.0,
      corridor: 'RAIPUR-MANDIR HASAUD Line',
      shadowBlockWithTrain: 'Post-Suburban Night Layover',
      trainDelayMinutes: 0,
      punctualityScore: 100.0,
      confidenceScore: 96.1
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-ENG-108',
    title: 'High-Speed Track Tamping with 09-3X Dynamic Stabilizer',
    department: 'Engineering',
    corridor: 'BSP-DURG Main Line (DOWN)',
    trackKm: 'KM 210.0 - 216.5',
    durationHours: 3.5,
    deadline: '2026-09-05',
    urgency: 'Medium',
    blockType: 'Mechanized Track Tamping (CSM)',
    priorityScore: 68,
    priorityBreakdown: {
      trackGeometryRisk: 72,
      trafficVolumeIndex: 85,
      defectSeverity: 58,
      weatherVulnerability: 45,
      assetAgingIndex: 66
    },
    status: 'Approved',
    createdAt: '2026-08-30 14:20',
    submittedBy: 'Er. K. Murthy (DEN / Track)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: '45 km/h for 24 hours',
      specialMachine: 'Plasser 09-3X Dynamic Tamper + DGS',
      crewRequired: 18,
      interlockingIsolation: false
    },
    aiReasoning: 'Track Quality Index (TQI) degraded to 42.1 (Threshold 45). AI recommends scheduled night window to restore 130 km/h fit certification prior to festival rush.',
    suggestedSlot: {
      date: '2026-09-01',
      startTime: '02:30',
      endTime: '06:00',
      startHour: 2.5,
      endHour: 6.0,
      corridor: 'BSP-DURG Main Line (DOWN)',
      shadowBlockWithTrain: 'Freight Chord Window',
      trainDelayMinutes: 0,
      punctualityScore: 97.8,
      confidenceScore: 92.3
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-TRC-091',
    title: 'Substation Feeder Circuit Breaker Replacement',
    department: 'Traction',
    corridor: 'RAIPUR-LAKHOLI Line',
    trackKm: 'KM 84.0 - 85.2',
    durationHours: 4.0,
    deadline: '2026-09-06',
    urgency: 'Medium',
    blockType: 'Traction Substation Maintenance',
    priorityScore: 61,
    priorityBreakdown: {
      trackGeometryRisk: 15,
      trafficVolumeIndex: 60,
      defectSeverity: 68,
      weatherVulnerability: 70,
      assetAgingIndex: 90
    },
    status: 'Pending',
    createdAt: '2026-08-31 11:10',
    submittedBy: 'Er. Priya Das (Sr. DEE / G)',
    constraints: {
      ohePowerCutRequired: true,
      speedRestrictionTsr: 'Diesel-only traction or Coasting',
      specialMachine: 'Mobile Heavy Transformer Crane',
      crewRequired: 16,
      interlockingIsolation: false
    },
    aiReasoning: 'SF6 gas pressure decline on Bay #2 breaker. Low passenger impact corridor allows daytime or night freight re-routing without schedule disruption.',
    suggestedSlot: {
      date: '2026-09-02',
      startTime: '10:00',
      endTime: '14:00',
      startHour: 10.0,
      endHour: 14.0,
      corridor: 'RAIPUR-LAKHOLI Line',
      shadowBlockWithTrain: 'Low Traffic Freight Gap',
      trainDelayMinutes: 5,
      punctualityScore: 94.0,
      confidenceScore: 89.5
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-SIG-059',
    title: 'Routine Track Circuit Bonding & Signal Head LED Refurbishment',
    department: 'Signal & Telecom',
    corridor: 'RAIPUR-ABHANPUR Branch Line',
    trackKm: 'KM 110.0 - 112.0',
    durationHours: 1.5,
    deadline: '2026-09-08',
    urgency: 'Routine',
    blockType: 'Signal Circuit Routine Maintenance',
    priorityScore: 42,
    priorityBreakdown: {
      trackGeometryRisk: 20,
      trafficVolumeIndex: 85,
      defectSeverity: 32,
      weatherVulnerability: 38,
      assetAgingIndex: 52
    },
    status: 'Approved',
    createdAt: '2026-08-30 16:45',
    submittedBy: 'Er. R. K. Saxena (SSE / Signal)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: 'Caution Order 50 km/h',
      specialMachine: 'None',
      crewRequired: 6,
      interlockingIsolation: false
    },
    aiReasoning: 'Routine preventive maintenance schedule. Can be performed under running traffic with standard signal lookout.',
    suggestedSlot: {
      date: '2026-09-01',
      startTime: '11:00',
      endTime: '12:30',
      startHour: 11.0,
      endHour: 12.5,
      corridor: 'RAIPUR-ABHANPUR Branch Line',
      shadowBlockWithTrain: 'Mid-Day Passenger Gap',
      trainDelayMinutes: 0,
      punctualityScore: 99.5,
      confidenceScore: 98.2
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-ENG-115',
    title: 'Ballast Shoulder Cleaning Machine (BCM) Deep Screening',
    department: 'Engineering',
    corridor: 'ABHANPUR-RAJIM Branch Line',
    trackKm: 'KM 102.0 - 106.0',
    durationHours: 4.5,
    deadline: '2026-09-07',
    urgency: 'Medium',
    blockType: 'Ballast Shoulder Screening (BCM)',
    priorityScore: 54,
    priorityBreakdown: {
      trackGeometryRisk: 58,
      trafficVolumeIndex: 78,
      defectSeverity: 46,
      weatherVulnerability: 62,
      assetAgingIndex: 55
    },
    status: 'In-Review',
    createdAt: '2026-08-31 12:05',
    submittedBy: 'Er. Deepak Solanki (AEN / Track)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: '45 km/h with ballast consolidation',
      specialMachine: 'BCM-350 High-Capacity Ballast Cleaner',
      crewRequired: 26,
      interlockingIsolation: false
    },
    aiReasoning: 'Ballast cushion caking at 44% level. Deep screening scheduled before heavy coastal rain cycle to ensure free drainage.',
    suggestedSlot: {
      date: '2026-09-02',
      startTime: '01:30',
      endTime: '06:00',
      startHour: 1.5,
      endHour: 6.0,
      corridor: 'ABHANPUR-RAJIM Branch Line',
      shadowBlockWithTrain: 'Night Non-Peak Block',
      trainDelayMinutes: 0,
      punctualityScore: 98.0,
      confidenceScore: 91.0
    },
    isSimulated: true
  },
  {
    id: 'REQ-2026-ENG-120',
    title: 'Rail Grinding Train (RGT) Longitudinal Profile Smoothing',
    department: 'Engineering',
    corridor: 'BSP-DURG Main Line (DOWN)',
    trackKm: 'KM 170.0 - 185.0',
    durationHours: 3.5,
    deadline: '2026-09-04',
    urgency: 'High',
    blockType: 'Rail Grinding Train (RGT)',
    priorityScore: 79,
    priorityBreakdown: {
      trackGeometryRisk: 84,
      trafficVolumeIndex: 90,
      defectSeverity: 74,
      weatherVulnerability: 50,
      assetAgingIndex: 82
    },
    status: 'Pending',
    createdAt: '2026-08-31 13:30',
    submittedBy: 'Er. Manoj Bajpai (Sr. DEN / HQ)',
    constraints: {
      ohePowerCutRequired: false,
      speedRestrictionTsr: 'None',
      specialMachine: 'Loram 72-Stone Rail Grinder RGT-04',
      crewRequired: 15,
      interlockingIsolation: false
    },
    aiReasoning: 'Micro-corrugation exceeding 0.3mm on outer rail curves. Periodic grinding extends rail life by 3.2 years and prevents rolling contact fatigue (RCF).',
    suggestedSlot: {
      date: '2026-09-02',
      startTime: '02:00',
      endTime: '05:30',
      startHour: 2.0,
      endHour: 5.5,
      corridor: 'BSP-DURG Main Line (DOWN)',
      shadowBlockWithTrain: 'Post-Rajdhani Clear Corridor',
      trainDelayMinutes: 0,
      punctualityScore: 98.4,
      confidenceScore: 95.0
    },
    isSimulated: true
  }
];

export const INITIAL_GANTT_BLOCKS: GanttBlock[] = [
  {
    id: 'BLK-01',
    requestId: 'REQ-2026-ENG-101',
    title: 'Civil: USFD Weld Replacement (KM 142)',
    department: 'Engineering',
    startHour: 3.5, // 03:30 AM
    endHour: 6.5,   // 06:30 AM (Simulated initial conflict with Vande Bharat at 05:45!)
    trackKm: 'KM 142.4 - 144.0',
    corridorId: 'COR-01',
    hasConflict: true, // Will show red warning badge!
    conflictDetails: '⚠️ Train Conflict: #22436 Vande Bharat Express path overlaps at 05:45 (KM 143.2)',
    status: 'Proposed',
    oheCut: false,
    speedRestriction: '30 km/h',
    isSimulated: true
  },
  {
    id: 'BLK-02',
    requestId: 'REQ-2026-TRC-084',
    title: 'Traction: OHE Neutral Section (KM 188)',
    department: 'Traction',
    startHour: 1.5, // 01:30 AM
    endHour: 4.0,   // 04:00 AM
    trackKm: 'KM 188.0 - 192.5',
    corridorId: 'COR-01',
    hasConflict: false,
    status: 'Approved',
    oheCut: true,
    speedRestriction: 'Coasting',
    isSimulated: true
  },
  {
    id: 'BLK-03',
    requestId: 'REQ-2026-ENG-108',
    title: 'Civil: Track Tamping 09-3X (KM 210)',
    department: 'Engineering',
    startHour: 2.0,
    endHour: 5.5,
    trackKm: 'KM 210.0 - 216.5',
    corridorId: 'COR-02',
    hasConflict: false,
    status: 'Approved',
    oheCut: false,
    speedRestriction: '45 km/h',
    isSimulated: true
  },
  {
    id: 'BLK-04',
    requestId: 'REQ-2026-SIG-052',
    title: 'S&T: Dual Axle Counter Overhaul',
    department: 'Signal & Telecom',
    startHour: 1.0,
    endHour: 3.0,
    trackKm: 'KM 45.2 - 48.0',
    corridorId: 'COR-03',
    hasConflict: false,
    status: 'Approved',
    oheCut: false,
    speedRestriction: '15 km/h',
    isSimulated: true
  },
  {
    id: 'BLK-05',
    requestId: 'REQ-2026-TRC-091',
    title: 'Traction: Substation Breaker Overhaul',
    department: 'Traction',
    startHour: 10.0,
    endHour: 14.0,
    trackKm: 'KM 84.0 - 85.2',
    corridorId: 'COR-04',
    hasConflict: false,
    status: 'In-Progress',
    oheCut: true,
    speedRestriction: 'Diesel Only',
    isSimulated: true
  },
  {
    id: 'BLK-06',
    requestId: 'REQ-2026-SIG-059',
    title: 'S&T: LED Signal Head & Bonding',
    department: 'Signal & Telecom',
    startHour: 11.0,
    endHour: 12.5,
    trackKm: 'KM 110.0 - 112.0',
    corridorId: 'COR-05',
    hasConflict: false,
    status: 'Approved',
    oheCut: false,
    speedRestriction: 'Caution 50 km/h',
    isSimulated: true
  }
];

export const INITIAL_TRAIN_SCHEDULES: TrainSchedule[] = [
  {
    id: 'TRN-12002',
    trainNo: '12002',
    trainName: 'Shatabdi Express (Superfast)',
    type: 'Premium Passenger',
    corridorId: 'COR-01',
    startHour: 6.0,
    endHour: 8.5,
    direction: 'UP',
    priorityLevel: 'High-Speed',
    status: 'On-Time'
  },
  {
    id: 'TRN-22436',
    trainNo: '22436',
    trainName: 'Vande Bharat Express (Semi-High Speed)',
    type: 'Vande Bharat',
    corridorId: 'COR-01',
    startHour: 5.5,
    endHour: 7.8,
    direction: 'UP',
    priorityLevel: 'High-Speed',
    status: 'Conflict',
    conflictWithBlockId: 'BLK-01'
  },
  {
    id: 'TRN-12952',
    trainNo: '12952',
    trainName: 'Rajdhani Express',
    type: 'Premium Passenger',
    corridorId: 'COR-01',
    startHour: 0.2,
    endHour: 2.8,
    direction: 'UP',
    priorityLevel: 'High-Speed',
    status: 'On-Time'
  },
  {
    id: 'TRN-BOXN-402',
    trainNo: 'B/BOXN-402',
    trainName: 'Heavy Haul Coal Container Rake',
    type: 'Freight',
    corridorId: 'COR-01',
    startHour: 2.8,
    endHour: 4.8,
    direction: 'UP',
    priorityLevel: 'Freight',
    status: 'On-Time'
  },
  {
    id: 'TRN-12301',
    trainNo: '12301',
    trainName: 'Bilaspur Rajdhani Express',
    type: 'Premium Passenger',
    corridorId: 'COR-02',
    startHour: 0.5,
    endHour: 3.2,
    direction: 'DOWN',
    priorityLevel: 'High-Speed',
    status: 'On-Time'
  },
  {
    id: 'TRN-12423',
    trainNo: '12423',
    trainName: 'Dibrugarh Rajdhani Express',
    type: 'Express',
    corridorId: 'COR-02',
    startHour: 6.2,
    endHour: 9.0,
    direction: 'DOWN',
    priorityLevel: 'Passenger',
    status: 'On-Time'
  },
  {
    id: 'TRN-EMU-8820',
    trainNo: 'EMU-8820',
    trainName: 'Raipur - Mandir Hasaud MEMU #42',
    type: 'Suburban',
    corridorId: 'COR-03',
    startHour: 6.5,
    endHour: 8.0,
    direction: 'UP',
    priorityLevel: 'Passenger',
    status: 'On-Time'
  },
  {
    id: 'TRN-FRT-9901',
    trainNo: 'DFC-9901',
    trainName: 'Raipur - Lakholi BTPN Freight',
    type: 'Freight',
    corridorId: 'COR-04',
    startHour: 4.0,
    endHour: 7.5,
    direction: 'UP',
    priorityLevel: 'Freight',
    status: 'On-Time'
  }
];

export const DEPARTMENT_UTILIZATION_DATA = [
  {
    department: 'Engineering (Civil)',
    requestedHours: 142,
    allocatedHours: 128,
    efficiencyPct: 90.1,
    savedConflicts: 14
  },
  {
    department: 'Traction (OHE/TRD)',
    requestedHours: 98,
    allocatedHours: 92,
    efficiencyPct: 93.8,
    savedConflicts: 9
  },
  {
    department: 'Signal & Telecom (S&T)',
    requestedHours: 64,
    allocatedHours: 61,
    efficiencyPct: 95.3,
    savedConflicts: 12
  },
  {
    department: 'Integrated (Combined)',
    requestedHours: 85,
    allocatedHours: 85,
    efficiencyPct: 100.0,
    savedConflicts: 23
  }
];

export const STATUS_DONUT_DATA = [
  { name: 'Approved', value: 34, color: 'var(--accent-green)' },
  { name: 'Pending', value: 18, color: 'var(--accent-yellow)' },
  { name: 'In-Review', value: 12, color: 'var(--accent-blue-light)' },
  { name: 'Rejected', value: 4, color: 'var(--accent-red)' }
];

export const CORRIDOR_HEATMAP_DATA = [
  { timeSlot: '00:00 - 04:00', BSP_DURG_UP: 88, BSP_DURG_DN: 75, R_MNDH: 45, R_LAE: 55, R_AVP: 20, AVP_RIM: 15 },
  { timeSlot: '04:00 - 08:00', BSP_DURG_UP: 24, BSP_DURG_DN: 30, R_MNDH: 60, R_LAE: 50, R_AVP: 40, AVP_RIM: 25 },
  { timeSlot: '08:00 - 12:00', BSP_DURG_UP: 10, BSP_DURG_DN: 12, R_MNDH: 75, R_LAE: 65, R_AVP: 55, AVP_RIM: 35 },
  { timeSlot: '12:00 - 16:00', BSP_DURG_UP: 42, BSP_DURG_DN: 38, R_MNDH: 40, R_LAE: 45, R_AVP: 30, AVP_RIM: 20 },
  { timeSlot: '16:00 - 20:00', BSP_DURG_UP: 15, BSP_DURG_DN: 18, R_MNDH: 80, R_LAE: 70, R_AVP: 60, AVP_RIM: 45 },
  { timeSlot: '20:00 - 24:00', BSP_DURG_UP: 65, BSP_DURG_DN: 58, R_MNDH: 50, R_LAE: 55, R_AVP: 25, AVP_RIM: 20 },
];

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'normal',
    name: 'Standard Operational Flow (Prototype Baseline)',
    description: 'Normal traffic density with scheduled shadow windows and low weather vulnerability.',
    trafficMultiplier: 1.0,
    riskFactor: 1.0,
    activeConflictsCount: 1
  },
  {
    id: 'high-congestion',
    name: 'Festival Peak / High-Congestion Rush',
    description: '140% passenger train frequency with compressed headway and strict zero-delay penalties.',
    trafficMultiplier: 1.4,
    riskFactor: 1.25,
    activeConflictsCount: 3
  },
  {
    id: 'monsoon-emergency',
    name: 'Monsoon High-Risk & Drainage Contingency',
    description: 'Heavy precipitation risk factor boosting priority on USFD, track geometry, and OHE droppers.',
    trafficMultiplier: 0.9,
    riskFactor: 1.6,
    activeConflictsCount: 2
  }
];

/**
 * DEMO CREDENTIALS
 * NOTE: These credentials are for client-side prototype and hackathon demonstration purposes only.
 * Not for production use.
 */
export interface DemoUser extends User {
  password: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'usr-1', name: 'R. Sharma', department: 'TMS', role: 'engineering', username: 'tms_engineer', password: 'demo123' },
  { id: 'usr-2', name: 'A. Verma', department: 'TDMS', role: 'traction', username: 'tdms_traction', password: 'demo123' },
  { id: 'usr-3', name: 'S. Rao', department: 'SMMS', role: 'signal', username: 'smms_signal', password: 'demo123' },
  { id: 'usr-4', name: 'K. Iyer', department: 'Control Office', role: 'control', username: 'control_officer', password: 'demo123' },
  { id: 'usr-5', name: 'Admin', department: 'Admin', role: 'admin', username: 'admin', password: 'demo123' }
];
