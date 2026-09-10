import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { MaintenanceRequest, Department, RequestStatus } from '../../types';
import { PriorityBadge, DepartmentBadge, StatusBadge, SimulatedBadge } from '../common/Badge';
import { RequestDetailModal } from './RequestDetailModal';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2,
  SlidersHorizontal, 
  Clock, 
  MapPin,
  Calendar,
  Sparkles,
  Layers
} from 'lucide-react';

export const MaintenanceRequestsTable: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    role,
    requests, 
    filterDept, 
    setFilterDept, 
    searchQuery, 
    setSearchQuery, 
    setIsNewRequestModalOpen, 
    approveRequest, 
    rejectRequest,
    deleteRequest
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityTierFilter, setPriorityTierFilter] = useState<string>('All');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // Search query filter
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.trackKm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.corridor.toLowerCase().includes(searchQuery.toLowerCase());

    // Department filter
    const matchesDept = filterDept === 'All' || req.department === filterDept;

    // Status filter
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

    // Priority filter
    let matchesPriority = true;
    if (priorityTierFilter === 'High') matchesPriority = req.priorityScore >= 80;
    else if (priorityTierFilter === 'Medium') matchesPriority = req.priorityScore >= 50 && req.priorityScore < 80;
    else if (priorityTierFilter === 'Low') matchesPriority = req.priorityScore < 50;

    return matchesSearch && matchesDept && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-railway-border/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Request ID, Defect, KM Marker, or Corridor..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-railway-surface/90 border border-railway-border text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-railway-orange"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Right: Filters & New Request Button */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Department Filter */}
          <div className="flex items-center gap-1 bg-railway-surface px-2.5 py-1 rounded-xl border border-railway-border text-xs">
            <span className="text-slate-400 text-[11px]">Dept:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-railway-card">All Departments</option>
              <option value="Engineering" className="bg-railway-card">Engineering</option>
              <option value="Traction" className="bg-railway-card">Traction</option>
              <option value="Signal & Telecom" className="bg-railway-card">Signal & Telecom</option>
            </select>
          </div>

          {/* Priority Tier Filter */}
          <div className="flex items-center gap-1 bg-railway-surface px-2.5 py-1 rounded-xl border border-railway-border text-xs">
            <span className="text-slate-400 text-[11px]">Risk:</span>
            <select
              value={priorityTierFilter}
              onChange={(e) => setPriorityTierFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-railway-card">All Tiers</option>
              <option value="High" className="bg-railway-card">High Risk (&gt;80)</option>
              <option value="Medium" className="bg-railway-card">Medium (50-80)</option>
              <option value="Low" className="bg-railway-card">Low Risk (&lt;50)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-railway-surface px-2.5 py-1 rounded-xl border border-railway-border text-xs">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-railway-card">All Status</option>
              <option value="Pending" className="bg-railway-card">Pending</option>
              <option value="Approved" className="bg-railway-card">Approved</option>
              <option value="In-Review" className="bg-railway-card">In-Review</option>
              <option value="Rejected" className="bg-railway-card">Rejected</option>
            </select>
          </div>

          {/* New Request Button */}
          {can(role, 'canCreateRequest') && (
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orangeLight hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Request</span>
            </button>
          )}

        </div>

      </div>

      {/* Requests Table */}
      <div className="glass-panel rounded-2xl border border-railway-border/80 overflow-hidden shadow-2xl">
        <div className="p-4 bg-railway-card/90 border-b border-railway-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Maintenance Block Requisitions Repository
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-railway-surface text-cyan-400 border border-railway-border">
              {filteredRequests.length} of {requests.length} records
            </span>
          </div>

          <SimulatedBadge text="Synthetic Operational Log" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-railway-surface/90 border-b border-railway-border text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Defect & Work Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Location / Corridor</th>
                <th className="py-3 px-4 text-center">AI Priority Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railway-border/50 text-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No maintenance block requests match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-railway-cardHover/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* Request ID */}
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300 whitespace-nowrap">
                      {req.id}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DepartmentBadge department={req.department} />
                    </td>

                    {/* Defect Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{req.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{req.blockType}</div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.durationHours} hrs</span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req.deadline}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        <span>{req.trackKm}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {req.corridor}
                      </div>
                    </td>

                    {/* AI Priority Score */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <PriorityBadge score={req.priorityScore} />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-lg bg-railway-surface hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Inspect AI Reasoning & Defect Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {can(role, 'canApprove') && req.status !== 'Approved' && (
                          <button
                            onClick={() => approveRequest(req.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                            title="Approve Slot"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {can(role, 'canApprove') && req.status !== 'Rejected' && (
                          <button
                            onClick={() => rejectRequest(req.id)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {can(role, 'canDeleteRequest') && 
                          (role === 'control' || 
                           role === 'admin' || 
                           (currentUser && (req.submittedBy === currentUser.name || req.submittedBy.includes(currentUser.name)))) && (
                          <button
                            onClick={() => deleteRequest(req.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 border border-rose-500/20 transition cursor-pointer"
                            title="Delete Requisition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Modal Drawer */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={approveRequest}
        onReject={rejectRequest}
      />

    </div>
  );
};
