import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  Role, 
  MaintenanceRequest, 
  GanttBlock, 
  TrainSchedule, 
  Corridor, 
  ScenarioPreset,
  RequestStatus,
  Department
} from '../types';
import { 
  INITIAL_CORRIDORS, 
  INITIAL_REQUESTS, 
  INITIAL_GANTT_BLOCKS, 
  INITIAL_TRAIN_SCHEDULES,
  SCENARIO_PRESETS 
} from '../data/mockData';
import { ToastItem } from '../components/common/Toast';
import { useAuth } from './AuthContext';

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  role: Role;
  activeView: string;
  setActiveView: (view: string) => void;
  requests: MaintenanceRequest[];
  setRequests: React.Dispatch<React.SetStateAction<MaintenanceRequest[]>>;
  ganttBlocks: GanttBlock[];
  setGanttBlocks: React.Dispatch<React.SetStateAction<GanttBlock[]>>;
  trainSchedules: TrainSchedule[];
  corridors: Corridor[];
  selectedScenario: ScenarioPreset;
  setSelectedScenario: (scenario: ScenarioPreset) => void;
  isAutoResolving: boolean;
  autoResolveConflicts: () => void;
  addRequest: (newReq: Partial<MaintenanceRequest>) => void;
  deleteRequest: (id: string) => void;
  approveRequest: (id: string, notes?: string) => void;
  rejectRequest: (id: string, notes?: string) => void;
  modifyRequestSlot: (id: string, startHour: number, endHour: number) => void;
  aiWeights: {
    punctuality: number;
    trackSafety: number;
    weather: number;
    synergy: number;
  };
  setAiWeights: React.Dispatch<React.SetStateAction<{
    punctuality: number;
    trackSafety: number;
    weather: number;
    synergy: number;
  }>>;
  stats: {
    pendingCount: number;
    highRiskCount: number;
    approvedTodayCount: number;
    corridorUtilization: number;
    conflictCount: number;
  };
  filterDept: string;
  setFilterDept: (dept: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isNewRequestModalOpen: boolean;
  setIsNewRequestModalOpen: (open: boolean) => void;
  notifications: Array<{ id: string; title: string; time: string; type: 'alert' | 'success' | 'info' }>;
  dismissNotification: (id: string) => void;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const role: Role = currentUser?.role || 'control';
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('rail-block-theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [requests, setRequests] = useState<MaintenanceRequest[]>(INITIAL_REQUESTS);
  const [ganttBlocks, setGanttBlocks] = useState<GanttBlock[]>(INITIAL_GANTT_BLOCKS);
  const [trainSchedules, setTrainSchedules] = useState<TrainSchedule[]>(INITIAL_TRAIN_SCHEDULES);
  const [corridors] = useState<Corridor[]>(INITIAL_CORRIDORS);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset>(SCENARIO_PRESETS[0]);
  const [isAutoResolving, setIsAutoResolving] = useState<boolean>(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState<boolean>(false);
  const [filterDept, setFilterDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('rail-block-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(currentTheme => currentTheme === 'dark' ? 'light' : 'dark');

  const [aiWeights, setAiWeights] = useState({
    punctuality: 40,
    trackSafety: 35,
    weather: 15,
    synergy: 10
  });

  interface NotificationItem {
    id: string;
    title: string;
    time: string;
    type: 'alert' | 'success' | 'info';
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: '🚨 Conflict Detected: USFD Block (BLK-01) overlaps Vande Bharat #22436 at KM 143.2',
      time: '2 mins ago',
      type: 'alert'
    },
    {
      id: 'notif-2',
      title: '⚡ High Risk Priority: Neutral Section Insulator #4 requires emergency isolation',
      time: '14 mins ago',
      type: 'alert'
    },
    {
      id: 'notif-3',
      title: '✅ AI Optimization Engine generated 3 optimal shadow block slots for BSP-DURG UP',
      time: '28 mins ago',
      type: 'success'
    }
  ]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts(prev => [...prev.slice(-3), newToast]);

    const duration = toast.duration ?? 3500;
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  };

  // Helper for computing dynamic stats
  const pendingCount = requests.filter(r => r.status === 'Pending' || r.status === 'In-Review').length;
  const highRiskCount = requests.filter(r => r.priorityScore >= 80).length;
  const approvedTodayCount = requests.filter(r => r.status === 'Approved').length;
  const conflictCount = ganttBlocks.filter(b => b.hasConflict).length;
  const corridorUtilization = 86.4; // Simulated percentage

  // 1-Click AI Auto-Resolve Conflicts
  const autoResolveConflicts = () => {
    setIsAutoResolving(true);
    setTimeout(() => {
      // Shift BLK-01 into the natural shadow window (01:30 to 04:30) before Vande Bharat
      setGanttBlocks(prev =>
        prev.map(block => {
          if (block.id === 'BLK-01') {
            return {
              ...block,
              startHour: 1.5,
              endHour: 4.5,
              hasConflict: false,
              conflictDetails: undefined,
              status: 'Approved'
            };
          }
          return { ...block, hasConflict: false, conflictDetails: undefined };
        })
      );

      // Set train status to On-Time
      setTrainSchedules(prev =>
        prev.map(train => ({
          ...train,
          status: 'On-Time',
          conflictWithBlockId: undefined
        }))
      );

      // Update request status
      setRequests(prev =>
        prev.map(req => {
          if (req.id === 'REQ-2026-ENG-101') {
            return {
              ...req,
              status: 'Approved',
              approvalNotes: 'Auto-resolved via AI MILP Constraint Solver into Shadow Window 01:30-04:30'
            };
          }
          return req;
        })
      );

      setIsAutoResolving(false);

      // Show professional toast notification instead of festive confetti
      showToast({
        type: 'success',
        title: 'Conflicts Resolved',
        message: '1 Schedule conflict shifted to optimal shadow window (01:30 - 04:30).'
      });

      // Add success notification
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: '✨ AI Conflict Auto-Resolution Successful: 100% Conflict-Free Corridor Schedule Achieved!',
          time: 'Just now',
          type: 'success'
        },
        ...prev
      ]);
    }, 1200);
  };

  const addRequest = (newReq: Partial<MaintenanceRequest>) => {
    const id = `REQ-2026-${(newReq.department || 'ENG').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullRequest: MaintenanceRequest = {
      id,
      title: newReq.title || 'Track Maintenance Block Request',
      department: (newReq.department as Department) || 'Engineering',
      corridor: newReq.corridor || 'BSP-DURG Main Line (UP)',
      trackKm: newReq.trackKm || 'KM 150.0 - 153.0',
      durationHours: newReq.durationHours || 2.5,
      deadline: newReq.deadline || '2026-09-05',
      urgency: newReq.urgency || 'High',
      blockType: newReq.blockType || 'Mechanized Tamping',
      priorityScore: newReq.priorityScore || 78,
      priorityBreakdown: newReq.priorityBreakdown || {
        trackGeometryRisk: 75,
        trafficVolumeIndex: 85,
        defectSeverity: 80,
        weatherVulnerability: 60,
        assetAgingIndex: 70
      },
      status: 'Pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      submittedBy: newReq.submittedBy || 'Field Maintenance Supervisor',
      constraints: newReq.constraints || {
        ohePowerCutRequired: false,
        speedRestrictionTsr: '30 km/h',
        specialMachine: 'Standard Tamper',
        crewRequired: 12,
        interlockingIsolation: false
      },
      aiReasoning: newReq.aiReasoning || 'AI Risk Engine estimated moderate-to-high urgency based on section axle density and scheduled maintenance intervals.',
      suggestedSlot: newReq.suggestedSlot || {
        date: '2026-09-02',
        startTime: '02:00',
        endTime: '04:30',
        startHour: 2.0,
        endHour: 4.5,
        corridor: newReq.corridor || 'BSP-DURG Main Line (UP)',
        shadowBlockWithTrain: 'Night Layover Window',
        trainDelayMinutes: 0,
        punctualityScore: 98.0,
        confidenceScore: 92.0
      },
      isSimulated: true
    };

    setRequests(prev => [fullRequest, ...prev]);

    // Also propose a block in Gantt if applicable
    const matchedCorridor = corridors.find(c => c.name === fullRequest.corridor);
    const newGanttBlock: GanttBlock = {
      id: `BLK-${Math.floor(10 + Math.random() * 90)}`,
      requestId: id,
      title: `${fullRequest.department.substring(0, 3)}: ${fullRequest.blockType}`,
      department: fullRequest.department,
      startHour: fullRequest.suggestedSlot.startHour,
      endHour: fullRequest.suggestedSlot.endHour,
      trackKm: fullRequest.trackKm,
      corridorId: matchedCorridor?.id || 'COR-01',
      hasConflict: false,
      status: 'Proposed',
      oheCut: fullRequest.constraints.ohePowerCutRequired,
      speedRestriction: fullRequest.constraints.speedRestrictionTsr,
      isSimulated: true
    };

    setGanttBlocks(prev => [newGanttBlock, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `📝 New Request Submitted: ${fullRequest.id} (${fullRequest.department}) with AI Priority Score ${fullRequest.priorityScore}`,
        time: 'Just now',
        type: 'info'
      },
      ...prev
    ]);
  };

  const approveRequest = (id: string, notes?: string) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Approved' as RequestStatus, approvalNotes: notes || 'Approved by Control Office' } : r))
    );
    setGanttBlocks(prev =>
      prev.map(b => (b.requestId === id ? { ...b, status: 'Approved' } : b))
    );
    showToast({
      type: 'success',
      title: 'Requisition Approved',
      message: `Maintenance block ${id} approved for execution.`
    });
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setGanttBlocks(prev => prev.filter(b => b.requestId !== id));
    showToast({
      type: 'info',
      title: 'Requisition Removed',
      message: `Maintenance block ${id} deleted.`
    });
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `🗑️ Maintenance Block Requisition ${id} Deleted`,
        time: 'Just now',
        type: 'info'
      },
      ...prev
    ]);
  };

  const rejectRequest = (id: string, notes?: string) => {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Rejected' as RequestStatus, approvalNotes: notes || 'Rejected due to high traffic density' } : r))
    );
    setGanttBlocks(prev => prev.filter(b => b.requestId !== id));
    showToast({
      type: 'warning',
      title: 'Requisition Rejected',
      message: `Maintenance block ${id} rejected: ${notes || 'Slot conflict'}`
    });
  };

  const modifyRequestSlot = (id: string, startHour: number, endHour: number) => {
    setRequests(prev =>
      prev.map(r => {
        if (r.id === id) {
          const formatTime = (h: number) => {
            const hrs = Math.floor(h);
            const mins = Math.round((h - hrs) * 60);
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          };
          return {
            ...r,
            suggestedSlot: {
              ...r.suggestedSlot,
              startHour,
              endHour,
              startTime: formatTime(startHour),
              endTime: formatTime(endHour)
            }
          };
        }
        return r;
      })
    );
    setGanttBlocks(prev =>
      prev.map(b => (b.requestId === id ? { ...b, startHour, endHour, hasConflict: false } : b))
    );
    showToast({
      type: 'info',
      title: 'Slot Modified',
      message: `Schedule slot updated for block ${id}.`
    });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        role,
        activeView,
        setActiveView,
        requests,
        setRequests,
        ganttBlocks,
        setGanttBlocks,
        trainSchedules,
        corridors,
        selectedScenario,
        setSelectedScenario,
        isAutoResolving,
        autoResolveConflicts,
        addRequest,
        deleteRequest,
        approveRequest,
        rejectRequest,
        modifyRequestSlot,
        aiWeights,
        setAiWeights,
        stats: {
          pendingCount,
          highRiskCount,
          approvedTodayCount,
          corridorUtilization,
          conflictCount
        },
        filterDept,
        setFilterDept,
        searchQuery,
        setSearchQuery,
        isNewRequestModalOpen,
        setIsNewRequestModalOpen,
        notifications,
        dismissNotification,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
