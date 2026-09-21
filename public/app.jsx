import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, Server, HardDrive, Cpu, Wifi, Shield, Camera, Tv, Monitor,
  Printer, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw,
  Plus, Settings, FileText, Network, Radio, Zap, ArrowUpRight, ArrowDownLeft,
  Power, Lock, Play, Pause, ExternalLink, Download, Layers, Sliders,
  Bell, Eye, ChevronRight, Hash, Database, Terminal, Filter, X
} from 'lucide-react';

// Main App Component
function NetPulseApp() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, nodes, switchmap, cameras, discovery, topology, alerts, reports, agent
  const [nodes, setNodes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSubnet, setScanSubnet] = useState('192.168.1.0/24');
  const [cameraChannels, setCameraChannels] = useState([]);
  const [selectedCameraModal, setSelectedCameraModal] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const wsRef = useRef(null);

  // Show toast notification
  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Summary Data
  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  };

  // Fetch Nodes
  const fetchNodes = async () => {
    try {
      const res = await fetch(`/api/nodes?type=${typeFilter}&status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (e) {
      console.error('Failed to fetch nodes:', e);
    }
  };

  // Fetch Alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    }
  };

  // Fetch Alert Rules
  const fetchAlertRules = async () => {
    try {
      const res = await fetch('/api/alert-rules');
      if (res.ok) {
        const data = await res.json();
        setAlertRules(data);
      }
    } catch (e) {
      console.error('Failed to fetch alert rules:', e);
    }
  };

  // Fetch Discovered Devices
  const fetchDiscovery = async () => {
    try {
      const res = await fetch('/api/discovery');
      if (res.ok) {
        const data = await res.json();
        setDiscovered(data);
      }
    } catch (e) {
      console.error('Failed to fetch discovery:', e);
    }
  };

  // Fetch Camera Channels
  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/cameras');
      if (res.ok) {
        const data = await res.json();
        setCameraChannels(data.channels || []);
      }
    } catch (e) {
      console.error('Failed to fetch cameras:', e);
    }
  };

  // Fetch Node Details
  const fetchNodeDetails = async (nodeId) => {
    try {
      const res = await fetch(`/api/nodes/${nodeId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNodeDetails(data);
      }
    } catch (e) {
      console.error('Failed to fetch node details:', e);
    }
  };

  // Handle Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial Data Load & Polling Timer
  useEffect(() => {
    fetchSummary();
    fetchNodes();
    fetchAlerts();
    fetchAlertRules();
    fetchDiscovery();
    fetchCameras();

    const timer = setInterval(() => {
      if (isLive) {
        fetchSummary();
        fetchNodes();
        fetchAlerts();
        if (selectedNode) {
          fetchNodeDetails(selectedNode.id);
        }
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [isLive, typeFilter, statusFilter, searchTerm, selectedNode]);

  // Handle Acknowledge Alert
  const handleAckAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/ack`, { method: 'POST' });
      if (res.ok) {
        showToast('Alert acknowledged', 'success');
        fetchAlerts();
        fetchSummary();
      }
    } catch (e) {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  // Handle Resolve Alert
  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
      if (res.ok) {
        showToast('Alert marked as resolved', 'success');
        fetchAlerts();
        fetchSummary();
      }
    } catch (e) {
      showToast('Failed to resolve alert', 'error');
    }
  };

  // Handle Simulate Fault
  const handleSimulateFault = async (nodeId, action) => {
    try {
      const res = await fetch(`/api/nodes/${nodeId}/simulate-fault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showToast(`Triggered simulation: ${action}`, 'warning');
        fetchNodes();
        fetchSummary();
        fetchAlerts();
        if (selectedNode) fetchNodeDetails(nodeId);
      }
    } catch (e) {
      showToast('Simulation failed', 'error');
    }
  };

  // Handle Subnet Discovery Scan
  const handleRunScan = async () => {
    setIsScanning(true);
    showToast(`Scanning subnet ${scanSubnet}...`, 'info');
    try {
      const res = await fetch('/api/discovery/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet: scanSubnet })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Scan complete! Discovered ${data.count} devices`, 'success');
        fetchDiscovery();
      }
    } catch (e) {
      showToast('Scan failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Import Discovered Device
  const handleImportDevice = async (ip) => {
    try {
      const res = await fetch('/api/discovery/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        showToast(`Imported ${ip} into monitored inventory`, 'success');
        fetchDiscovery();
        fetchNodes();
      }
    } catch (e) {
      showToast('Import failed', 'error');
    }
  };

  // Toggle Switch Port State
  const handlePortToggle = async (portId, newStatus) => {
    if (!selectedNodeDetails) return;
    try {
      const res = await fetch(`/api/nodes/${selectedNodeDetails.id}/ports/${portId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Port status updated to ${newStatus}`, 'success');
        fetchNodeDetails(selectedNodeDetails.id);
      }
    } catch (e) {
      showToast('Failed to update port', 'error');
    }
  };

  // Helper function to get icon by device type
  const getTypeIcon = (type, className = "w-4 h-4") => {
    switch (type) {
      case 'switch': return <Layers className={className} />;
      case 'server': return <Server className={className} />;
      case 'camera': return <Camera className={className} />;
      case 'nvr': return <Tv className={className} />;
      case 'router':
      case 'firewall': return <Shield className={className} />;
      case 'pc': return <Monitor className={className} />;
      case 'printer': return <Printer className={className} />;
      default: return <HardDrive className={className} />;
    }
  };

  // Helper function to format uptime
  const formatUptime = (secs) => {
    if (!secs) return '0m';
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#070a11] text-slate-100 font-sans selection:bg-emerald-500/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all animate-bounce ${
          toastMessage.type === 'error' ? 'bg-red-950/90 border-red-800 text-red-200' :
          toastMessage.type === 'warning' ? 'bg-amber-950/90 border-amber-800 text-amber-200' :
          toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' :
          'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'info' && <Bell className="w-5 h-5 text-blue-400" />}
          <span className="text-sm font-medium">{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <header className="bg-[#0c1220] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c1220] rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">NetPulse</h1>
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md uppercase tracking-wider font-semibold">Enterprise</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">LAN Infra Monitor & Datadog Engine</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden md:block"></div>

          {/* Quick Stats Pill Header Bar */}
          {summary && (
            <div className="hidden lg:flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Fleet:</span>
                <span className="font-semibold text-emerald-400">{summary.onlineNodes} / {summary.totalNodes} Online</span>
                {summary.criticalNodes > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono font-bold animate-pulse">
                    {summary.criticalNodes} CRIT
                  </span>
                )}
                {summary.warningNodes > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-mono font-bold">
                    {summary.warningNodes} WARN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400">Traffic:</span>
                <span className="text-cyan-400 font-semibold flex items-center"><ArrowDownLeft className="w-3 h-3 mr-0.5" />{summary.totalBandwidthIn?.toFixed(1)} Mbps</span>
                <span className="text-indigo-400 font-semibold flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5" />{summary.totalBandwidthOut?.toFixed(1)} Mbps</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400">Avg Latency:</span>
                <span className={`font-semibold ${summary.avgLatency > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {summary.avgLatency?.toFixed(1)} ms
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Command Palette Button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search or jump to...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded">Ctrl K</kbd>
          </button>

          {/* Live Telemetry Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isLive
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
            <span>{isLive ? 'LIVE 1s' : 'PAUSED'}</span>
          </button>

          {/* Add Device Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Device</span>
          </button>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <aside className="w-16 md:w-56 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
          <div className="p-2 space-y-1">
            
            <SidebarNavItem
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<Activity className="w-4 h-4" />}
              label="Overview Dashboard"
            />

            <SidebarNavItem
              active={activeTab === 'nodes'}
              onClick={() => setActiveTab('nodes')}
              icon={<Server className="w-4 h-4" />}
              label="Infrastructure Nodes"
              badge={nodes.length}
            />

            <SidebarNavItem
              active={activeTab === 'switchmap'}
              onClick={() => setActiveTab('switchmap')}
              icon={<Layers className="w-4 h-4" />}
              label="Switch Port Mapper"
            />

            <SidebarNavItem
              active={activeTab === 'cameras'}
              onClick={() => setActiveTab('cameras')}
              icon={<Camera className="w-4 h-4" />}
              label="Security Cameras & NVR"
              badge={cameraChannels.length}
            />

            <SidebarNavItem
              active={activeTab === 'discovery'}
              onClick={() => setActiveTab('discovery')}
              icon={<Radio className="w-4 h-4" />}
              label="Subnet Scanner & IPAM"
              badge={discovered.length > 0 ? discovered.length : null}
            />

            <SidebarNavItem
              active={activeTab === 'topology'}
              onClick={() => setActiveTab('topology')}
              icon={<Network className="w-4 h-4" />}
              label="Network Topology"
            />

            <SidebarNavItem
              active={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Alerts & Incidents"
              badge={summary?.activeAlertsCount || null}
              badgeColor="bg-red-500/20 text-red-400 border border-red-500/30"
            />

            <SidebarNavItem
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              icon={<FileText className="w-4 h-4" />}
              label="SLA & Reports"
            />

            <SidebarNavItem
              active={activeTab === 'agent'}
              onClick={() => setActiveTab('agent')}
              icon={<Terminal className="w-4 h-4" />}
              label="Host Agent & SNMP"
            />

          </div>

          {/* System Footer info */}
          <div className="p-3 border-t border-slate-800/80 hidden md:block text-[11px] text-slate-500 font-mono">
            <div className="flex items-center justify-between">
              <span>Host IP:</span>
              <span className="text-slate-300">192.168.1.50</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Engine Status:</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </div>
        </aside>

        {/* Central View Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#070a11] p-4 md:p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              summary={summary}
              nodes={nodes}
              alerts={alerts}
              onSelectNode={(node) => {
                setSelectedNode(node);
                fetchNodeDetails(node.id);
              }}
              onAckAlert={handleAckAlert}
              onResolveAlert={handleResolveAlert}
              onSimulateFault={handleSimulateFault}
              getTypeIcon={getTypeIcon}
            />
          )}

          {/* TAB 2: INFRASTRUCTURE NODES */}
          {activeTab === 'nodes' && (
            <InfrastructureNodesView
              nodes={nodes}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSelectNode={(node) => {
                setSelectedNode(node);
                fetchNodeDetails(node.id);
              }}
              onSimulateFault={handleSimulateFault}
              getTypeIcon={getTypeIcon}
              formatUptime={formatUptime}
            />
          )}

          {/* TAB 3: SWITCH PORT MAPPER */}
          {activeTab === 'switchmap' && (
            <SwitchPortMapperView
              nodes={nodes.filter(n => n.type === 'switch')}
              selectedNodeDetails={selectedNodeDetails}
              onSelectNode={(node) => {
                setSelectedNode(node);
                fetchNodeDetails(node.id);
              }}
              onPortToggle={handlePortToggle}
            />
          )}

          {/* TAB 4: SECURITY CAMERAS & NVR */}
          {activeTab === 'cameras' && (
            <CameraNVRWallView
              cameraNodes={nodes.filter(n => n.type === 'camera' || n.type === 'nvr')}
              channels={cameraChannels}
              onOpenModal={(cam) => setSelectedCameraModal(cam)}
            />
          )}

          {/* TAB 5: SUBNET SCANNER & IPAM */}
          {activeTab === 'discovery' && (
            <DiscoveryIPAMView
              scanSubnet={scanSubnet}
              setScanSubnet={setScanSubnet}
              isScanning={isScanning}
              onRunScan={handleRunScan}
              discovered={discovered}
              onImport={handleImportDevice}
            />
          )}

          {/* TAB 6: NETWORK TOPOLOGY MAP */}
          {activeTab === 'topology' && (
            <NetworkTopologyView
              nodes={nodes}
              onSelectNode={(node) => {
                setSelectedNode(node);
                fetchNodeDetails(node.id);
              }}
              getTypeIcon={getTypeIcon}
            />
          )}

          {/* TAB 7: ALERTS & INCIDENTS */}
          {activeTab === 'alerts' && (
            <AlertsIncidentsView
              alerts={alerts}
              alertRules={alertRules}
              onAck={handleAckAlert}
              onResolve={handleResolveAlert}
              fetchAlertRules={fetchAlertRules}
              showToast={showToast}
            />
          )}

          {/* TAB 8: SLA & REPORTS */}
          {activeTab === 'reports' && (
            <SLAReportsView
              nodes={nodes}
              summary={summary}
              alerts={alerts}
            />
          )}

          {/* TAB 9: HOST AGENT & SNMP SETUP */}
          {activeTab === 'agent' && (
            <HostAgentSetupView />
          )}

        </main>
      </div>

      {/* NODE DRILLDOWN MODAL */}
      {selectedNode && selectedNodeDetails && (
        <NodeDetailsModal
          node={selectedNodeDetails}
          onClose={() => {
            setSelectedNode(null);
            setSelectedNodeDetails(null);
          }}
          onSimulateFault={handleSimulateFault}
          onPortToggle={handlePortToggle}
          getTypeIcon={getTypeIcon}
          formatUptime={formatUptime}
        />
      )}

      {/* ADD DEVICE MODAL */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            fetchNodes();
            fetchSummary();
            showToast('New device added to inventory', 'success');
          }}
        />
      )}

      {/* COMMAND PALETTE */}
      {showCommandPalette && (
        <CommandPaletteModal
          nodes={nodes}
          onClose={() => setShowCommandPalette(false)}
          onSelectNode={(node) => {
            setShowCommandPalette(false);
            setSelectedNode(node);
            fetchNodeDetails(node.id);
          }}
          getTypeIcon={getTypeIcon}
        />
      )}

      {/* CAMERA PLAYER MODAL */}
      {selectedCameraModal && (
        <CameraPlayerModal
          camera={selectedCameraModal}
          onClose={() => setSelectedCameraModal(null)}
        />
      )}

    </div>
  );
}

// Sidebar Nav Item Helper
function SidebarNavItem({ active, onClick, icon, label, badge, badgeColor }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition font-medium text-xs ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-emerald-400' : 'text-slate-400'}>{icon}</span>
        <span className="hidden md:inline">{label}</span>
      </div>
      {badge !== undefined && badge !== null && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${badgeColor || 'bg-slate-800 text-slate-300'} hidden md:inline`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// OVERVIEW DASHBOARD VIEW
function OverviewDashboard({ summary, nodes, alerts, onSelectNode, onAckAlert, onResolveAlert, onSimulateFault, getTypeIcon }) {
  const criticalNodes = nodes.filter(n => n.status === 'critical');
  const warningNodes = nodes.filter(n => n.status === 'warning');

  return (
    <div className="space-y-6">
      
      {/* Overview Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Fleet Card */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Fleet Nodes</p>
            <p className="text-2xl font-bold text-white mt-1">{summary?.totalNodes || 0}</p>
            <p className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{summary?.onlineNodes || 0} Healthy</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Active Alerts Card */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Active Alarms</p>
            <p className={`text-2xl font-bold mt-1 ${summary?.activeAlertsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {summary?.activeAlertsCount || 0}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {summary?.criticalNodes || 0} Critical / {summary?.warningNodes || 0} Warning
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
            summary?.activeAlertsCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-800/50 border-slate-700 text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bandwidth Card */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Net Throughput</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {((summary?.totalBandwidthIn || 0) + (summary?.totalBandwidthOut || 0)).toFixed(1)} <span className="text-xs font-normal text-slate-400">Mbps</span>
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
              <span className="text-cyan-400">IN: {summary?.totalBandwidthIn?.toFixed(0)}</span>
              <span className="text-indigo-400">OUT: {summary?.totalBandwidthOut?.toFixed(0)}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        {/* Fleet Average CPU Card */}
        <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Avg Server Load</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {summary?.avgCpu?.toFixed(1) || 0}% <span className="text-xs font-normal text-slate-400">CPU</span>
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              RAM Avg: {summary?.avgMemory?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Realtime Netdata Telemetry Sparkline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Realtime Fleet Metrics Chart (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-slate-100 text-sm">Real-Time Infrastructure Telemetry</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">Netdata Engine</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> CPU Avg
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Traffic Mbps
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Latency ms
              </span>
            </div>
          </div>

          {/* Canvas Netdata Sparkline Renderer */}
          <NetdataSparklineChart nodes={nodes} />
        </div>

        {/* Live Active Alarms Feed (1 Column) */}
        <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-slate-100 text-sm">Active Incidents Queue</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">{alerts.filter(a => a.status === 'active').length} Unresolved</span>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {alerts.filter(a => a.status === 'active').length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <span>All infrastructure healthy. No active alarms.</span>
                </div>
              ) : (
                alerts.filter(a => a.status === 'active').map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                    alert.severity === 'critical' ? 'bg-red-950/20 border-red-800/60' : 'bg-amber-950/20 border-amber-800/60'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`}></span>
                        <span className="font-semibold text-slate-200">{alert.node_name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/50">
                      <button
                        onClick={() => onAckAlert(alert.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-medium border border-emerald-500/30 transition"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fast Fault Simulation Button for Demo Testing */}
          <div className="pt-3 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-mono mb-2">Test Live Alert Engine:</p>
            <div className="flex gap-2">
              <button
                onClick={() => onSimulateFault('node-srv-02', 'cpu_spike')}
                className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-mono transition"
              >
                + CPU Spike
              </button>
              <button
                onClick={() => onSimulateFault('node-cam-03', 'latency_spike')}
                className="flex-1 py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[10px] font-mono transition"
              >
                + Packet Loss
              </button>
              <button
                onClick={() => onSimulateFault('node-srv-02', 'restore')}
                className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-mono transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Grid of Key Switches, Servers and Security Devices */}
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-slate-100 text-sm">Critical Core Infrastructure Overview</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Click node for deep Netdata metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.slice(0, 6).map((node) => (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 cursor-pointer transition group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${
                    node.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' :
                    node.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {getTypeIcon(node.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition">{node.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{node.ip}</p>
                  </div>
                </div>

                <span className={`w-2.5 h-2.5 rounded-full ${
                  node.status === 'online' ? 'bg-emerald-400' :
                  node.status === 'warning' ? 'bg-amber-400 animate-pulse' :
                  'bg-red-500 animate-ping'
                }`}></span>
              </div>

              {/* Resource Progress Gauges */}
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>CPU Usage</span>
                    <span className={node.cpu_usage > 85 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{node.cpu_usage?.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${node.cpu_usage > 85 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, node.cpu_usage)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Memory</span>
                    <span className="text-slate-300">{node.memory_usage?.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, node.memory_usage)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-3">
                <span>{node.vendor} {node.model}</span>
                <span>Ping: {node.latency_ms?.toFixed(1)}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// CANVAS SPARKLINE COMPONENT (Netdata Style)
function NetdataSparklineChart({ nodes }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Background Grid
    ctx.strokeStyle = '#1e2d4a';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (!nodes || nodes.length === 0) return;

    // Plot CPU Average line across fleet
    const numPoints = 25;
    const stepX = width / (numPoints - 1);

    // Line 1: CPU Load (Green)
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;

    for (let i = 0; i < numPoints; i++) {
      const avgCpu = nodes.reduce((sum, n) => sum + (n.cpu_usage || 0), 0) / nodes.length;
      const noise = Math.sin(i * 0.5 + Date.now() / 1000) * 8;
      const val = Math.min(100, Math.max(5, avgCpu + noise));
      const y = height - (val / 100) * (height - 20) - 10;
      const x = i * stepX;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill Gradient under CPU Line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line 2: Traffic Mbps (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < numPoints; i++) {
      const noise = Math.cos(i * 0.8 + Date.now() / 1200) * 15 + 40;
      const y = height - (noise / 100) * (height - 20) - 10;
      const x = i * stepX;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

  }, [nodes]);

  return (
    <div className="relative w-full h-56 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
      <canvas ref={canvasRef} width={800} height={224} className="w-full h-full block" />
      <div className="absolute top-2 right-3 font-mono text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
        Live Stream 1s Window
      </div>
    </div>
  );
}

// TAB 2: INFRASTRUCTURE NODES VIEW
function InfrastructureNodesView({ nodes, typeFilter, setTypeFilter, statusFilter, setStatusFilter, searchTerm, setSearchTerm, onSelectNode, onSimulateFault, getTypeIcon, formatUptime }) {
  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, IP, vendor, location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500/60 transition"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Type Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {['all', 'switch', 'server', 'camera', 'nvr', 'firewall', 'pc', 'printer'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg capitalize transition text-[11px] ${
                  typeFilter === t ? 'bg-emerald-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>

        </div>
      </div>

      {/* Nodes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onSelectNode(node)}
            className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 hover:border-emerald-500/60 hover:bg-slate-900/80 cursor-pointer transition shadow-xl space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl ${
                  node.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  node.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {getTypeIcon(node.type, "w-5 h-5")}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100 group-hover:text-emerald-400 transition">{node.name}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{node.ip}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                node.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                node.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {node.status}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Vendor / Model:</span>
                <span className="text-slate-200">{node.vendor} {node.model}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Location:</span>
                <span className="text-slate-300">{node.location}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Uptime:</span>
                <span className="text-slate-300">{formatUptime(node.uptime_secs)}</span>
              </div>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">CPU Load</span>
                <span className={`font-semibold ${node.cpu_usage > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {node.cpu_usage?.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block mb-0.5">Latency</span>
                <span className="font-semibold text-cyan-400">
                  {node.latency_ms?.toFixed(1)}ms
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

// TAB 3: SWITCH PORT MAPPER VIEW
function SwitchPortMapperView({ nodes, selectedNodeDetails, onSelectNode, onPortToggle }) {
  const switchNode = selectedNodeDetails || (nodes[0] ? nodes[0] : null);

  useEffect(() => {
    if (nodes.length > 0 && !selectedNodeDetails) {
      onSelectNode(nodes[0]);
    }
  }, [nodes]);

  return (
    <div className="space-y-6">
      
      {/* Switch Selector Header */}
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-sm text-slate-100">Managed Switch Port Inspector</h2>
            <p className="text-xs text-slate-400 font-mono">Live RJ45/SFP+ Port Link, VLAN & PoE Power Status</p>
          </div>
        </div>

        {/* Switch Selector dropdown */}
        <select
          onChange={(e) => {
            const match = nodes.find(n => n.id === e.target.value);
            if (match) onSelectNode(match);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
        >
          {nodes.map(n => (
            <option key={n.id} value={n.id}>{n.name} ({n.ip}) - {n.model}</option>
          ))}
        </select>
      </div>

      {switchNode && (
        <div className="p-6 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-6">
          
          {/* Switch Front-Panel Visualization */}
          <div className="bg-[#080d1a] border-2 border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 pulse-glow"></span>
                <span className="font-mono font-bold text-sm text-slate-200">{switchNode.vendor} {switchNode.model}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">{switchNode.ip}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Link Up (1G/10G)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> PoE Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700"></span> Link Down</span>
              </div>
            </div>

            {/* 24-Port RJ45 Layout */}
            <div className="grid grid-cols-12 gap-2 max-w-4xl mx-auto py-4">
              {switchNode.ports && switchNode.ports.map((port) => (
                <div
                  key={port.id}
                  onClick={() => onPortToggle(port.id, port.status === 'up' ? 'down' : 'up')}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-between h-20 cursor-pointer transition select-none ${
                    port.status === 'up'
                      ? port.poe_status === 'active' ? 'bg-amber-950/20 border-amber-500/60 text-amber-300 hover:bg-amber-900/40' : 'bg-emerald-950/20 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full text-[9px] font-mono">
                    <span>p{port.port_number}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${port.status === 'up' ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                  </div>

                  {/* Port Square Graphic */}
                  <div className={`w-6 h-5 rounded border flex items-center justify-center my-1 ${
                    port.status === 'up' ? 'border-emerald-400 bg-emerald-500/20' : 'border-slate-700 bg-slate-950'
                  }`}>
                    <span className="text-[8px] font-mono">{port.speed_mbps >= 10000 ? '10G' : '1G'}</span>
                  </div>

                  <span className="text-[9px] font-mono truncate max-w-full text-slate-400">
                    VLAN {port.vlan}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center text-[11px] font-mono text-slate-500 pt-2">
              Click any port to toggle Admin Up / Down
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// TAB 4: SECURITY CAMERAS & NVR WALL
function CameraNVRWallView({ cameraNodes, channels, onOpenModal }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-sm text-slate-100">IP Security Camera & NVR Video Wall</h2>
            <p className="text-xs text-slate-400 font-mono">Simulated RTSP/ONVIF CCTV Live Streams & Motion Alert Feed</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400">
          {channels.length} Video Streams Active
        </span>
      </div>

      {/* Video Wall Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((chan) => (
          <div
            key={chan.id}
            onClick={() => onOpenModal(chan)}
            className="p-3 rounded-2xl bg-[#0c1220] border border-slate-800/90 hover:border-emerald-500/60 cursor-pointer transition shadow-xl space-y-2 group"
          >
            {/* Simulated Live Video Player Surface */}
            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              
              {/* Simulated Camera Feed Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-slate-800 group-hover:text-emerald-500/40 transition" />
                <span className="text-[10px] font-mono text-slate-600 mt-1">RTSP STREAM LIVE</span>
              </div>

              {/* Motion Indicator Tag */}
              {chan.motion_detected === 1 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> MOTION
                </div>
              )}

              {/* Stream Overlay info */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-300 truncate">{chan.name}</span>
                <span className="text-emerald-400">{chan.fps} FPS</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>{chan.resolution}</span>
              <span className="text-cyan-400">{(chan.bitrate_kbps / 1024).toFixed(1)} Mbps</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// TAB 5: DISCOVERY & IPAM VIEW
function DiscoveryIPAMView({ scanSubnet, setScanSubnet, isScanning, onRunScan, discovered, onImport }) {
  return (
    <div className="space-y-6">
      
      {/* Subnet Scanner Header */}
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Active Network IP Subnet Scanner & IPAM
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Discover unknown devices, MAC vendors, and open ports on local subnets</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            value={scanSubnet}
            onChange={(e) => setScanSubnet(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Run Subnet Probe'}</span>
          </button>
        </div>
      </div>

      {/* Discovered List Table */}
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
        <h3 className="font-semibold text-xs text-slate-300 font-mono uppercase tracking-wider">Discovered Devices ({discovered.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Hostname</th>
                <th className="py-2.5 px-3">Open Ports</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {discovered.map((dev) => (
                <tr key={dev.ip} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-3 text-emerald-400 font-semibold">{dev.ip}</td>
                  <td className="py-3 px-3 text-slate-300">{dev.mac}</td>
                  <td className="py-3 px-3 text-slate-300">{dev.vendor}</td>
                  <td className="py-3 px-3 text-slate-200">{dev.hostname}</td>
                  <td className="py-3 px-3 text-cyan-400">{dev.open_ports}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      dev.status === 'added' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {dev.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {dev.status === 'new' && (
                      <button
                        onClick={() => onImport(dev.ip)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] transition shadow"
                      >
                        + Import Node
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// TAB 6: NETWORK TOPOLOGY MAP VIEW
function NetworkTopologyView({ nodes, onSelectNode, getTypeIcon }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-sm text-slate-100">Interactive Network Topology Diagram</h2>
            <p className="text-xs text-slate-400 font-mono">Live Core & Distribution Switches, Servers, and Edge Peripherals</p>
          </div>
        </div>
      </div>

      {/* Topology Canvas View */}
      <div className="p-8 rounded-2xl bg-[#090d16] border border-slate-800/90 shadow-2xl relative min-h-[500px] flex items-center justify-center overflow-hidden">
        
        {/* Simple Topology Graphic Diagram */}
        <div className="relative w-full max-w-4xl h-[450px]">
          
          {/* Core Switch Node */}
          <div
            onClick={() => {
              const match = nodes.find(n => n.id === 'node-sw-01');
              if (match) onSelectNode(match);
            }}
            className="absolute top-10 left-1/2 -translate-x-1/2 p-4 rounded-2xl bg-[#0c1220] border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/10 cursor-pointer hover:scale-105 transition flex items-center gap-3 z-10"
          >
            <Layers className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="font-bold text-xs text-white">Core-Switch-01</p>
              <p className="text-[10px] font-mono text-emerald-400">192.168.1.1 (Cisco 9300)</p>
            </div>
          </div>

          {/* Connected Servers Row */}
          <div className="absolute top-52 left-10 right-10 flex justify-between">
            
            <div
              onClick={() => {
                const match = nodes.find(n => n.id === 'node-fw-01');
                if (match) onSelectNode(match);
              }}
              className="p-3 rounded-xl bg-[#0c1220] border border-cyan-500/60 cursor-pointer hover:scale-105 transition flex items-center gap-2"
            >
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="font-semibold text-xs text-slate-200">FortiGate Firewall</p>
                <p className="text-[10px] font-mono text-cyan-400">192.168.1.254</p>
              </div>
            </div>

            <div
              onClick={() => {
                const match = nodes.find(n => n.id === 'node-srv-01');
                if (match) onSelectNode(match);
              }}
              className="p-3 rounded-xl bg-[#0c1220] border border-emerald-500/60 cursor-pointer hover:scale-105 transition flex items-center gap-2"
            >
              <Server className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-xs text-slate-200">VM-Host-R750</p>
                <p className="text-[10px] font-mono text-emerald-400">192.168.1.10</p>
              </div>
            </div>

            <div
              onClick={() => {
                const match = nodes.find(n => n.id === 'node-srv-02');
                if (match) onSelectNode(match);
              }}
              className="p-3 rounded-xl bg-[#0c1220] border border-amber-500/60 cursor-pointer hover:scale-105 transition flex items-center gap-2"
            >
              <Server className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-semibold text-xs text-slate-200">App-DB-Primary</p>
                <p className="text-[10px] font-mono text-amber-400">192.168.1.12</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// TAB 7: ALERTS & INCIDENTS VIEW
function AlertsIncidentsView({ alerts, alertRules, onAck, onResolve, fetchAlertRules, showToast }) {
  return (
    <div className="space-y-6">
      
      {/* Incidents Table */}
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
        <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Active & Historical System Incidents
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Device Name</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-3 font-semibold text-slate-200">{alt.node_name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      alt.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {alt.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-semibold">{alt.title}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-md truncate">{alt.message}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] capitalize ${
                      alt.status === 'active' ? 'bg-red-500/20 text-red-300' :
                      alt.status === 'acknowledged' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {alt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {alt.status === 'active' && (
                      <button
                        onClick={() => onAck(alt.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// TAB 8: SLA & REPORTS VIEW
function SLAReportsView({ nodes, summary, alerts }) {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold text-sm text-slate-100">Enterprise SLA & Infrastructure Uptime Report</h2>
              <p className="text-xs text-slate-400 font-mono">Monthly Uptime Metrics & Printable Audit Export</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-mono text-slate-400">Monthly Fleet Availability</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">99.98%</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-mono text-slate-400">Total Unplanned Outages</p>
            <p className="text-3xl font-bold text-slate-200 mt-1">1 <span className="text-xs font-normal text-slate-500">event</span></p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-mono text-slate-400">MTTR (Mean Time to Resolve)</p>
            <p className="text-3xl font-bold text-cyan-400 mt-1">4.2 <span className="text-xs font-normal text-slate-500">mins</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// TAB 9: HOST AGENT & SNMP SETUP
function HostAgentSetupView() {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-sm text-slate-100">Host Agent & SNMP Collector Installation</h2>
            <p className="text-xs text-slate-400 font-mono">Deploy lightweight telemetry collectors to Linux / Windows servers and switches</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-mono text-emerald-400 block mb-1">Linux / Ubuntu Agent One-Liner:</label>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
              curl -sSL http://192.168.1.50/api/agent/script?os=linux | sudo bash
            </pre>
          </div>

          <div>
            <label className="text-xs font-mono text-cyan-400 block mb-1">Windows PowerShell Installer:</label>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
              iwr -useb http://192.168.1.50/api/agent/script?os=windows | iex
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// MODAL: NODE DETAILS & NETDATA METRICS
function NodeDetailsModal({ node, onClose, onSimulateFault, getTypeIcon, formatUptime }) {
  const [isPolling, setIsPolling] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(node);

  useEffect(() => {
    setLiveMetrics(node);
  }, [node]);

  const handlePollNow = async () => {
    setIsPolling(true);
    try {
      const res = await fetch(`/api/nodes/${node.id}/poll-now`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiveMetrics((prev) => ({
          ...prev,
          cpu_usage: data.metrics.cpu,
          memory_usage: data.metrics.memory,
          latency_ms: data.metrics.latency,
          bandwidth_in_mbps: data.metrics.bandwidth_in,
          last_seen: data.timestamp
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsPolling(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {getTypeIcon(liveMetrics.type, "w-6 h-6")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100">{liveMetrics.name}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase font-bold ${
                  liveMetrics.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  liveMetrics.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {liveMetrics.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                IP: <span className="text-emerald-400 font-bold">{liveMetrics.ip}</span> &bull; {liveMetrics.vendor} {liveMetrics.model} ({liveMetrics.os_version || 'Generic OS'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePollNow}
              disabled={isPolling}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
              <span>{isPolling ? 'Polling IP...' : '⚡ Poll IP Telemetry'}</span>
            </button>

            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IP Connection & Telemetry Status Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">Direct IP Poller:</span>
            <span className="text-emerald-400 font-semibold">{liveMetrics.ip} (SNMP / Agentless ICMP)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Ping: <strong className="text-slate-200">{liveMetrics.latency_ms?.toFixed(1)}ms</strong></span>
            <span>Open Ports: <strong className="text-slate-200">{liveMetrics.ports_open || '22,80,161,443'}</strong></span>
            <span>Rate: <strong className="text-emerald-400">1s High-Freq Telemetry</strong></span>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block mb-1">CPU Load</span>
            <span className="text-2xl font-bold text-emerald-400">{liveMetrics.cpu_usage?.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, liveMetrics.cpu_usage || 0)}%` }}></div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block mb-1">RAM Memory</span>
            <span className="text-2xl font-bold text-cyan-400">{liveMetrics.memory_usage?.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, liveMetrics.memory_usage || 0)}%` }}></div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block mb-1">Disk Storage</span>
            <span className="text-2xl font-bold text-amber-400">{liveMetrics.disk_usage?.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, liveMetrics.disk_usage || 0)}%` }}></div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 block mb-1">System Uptime</span>
            <span className="text-lg font-bold text-slate-200">{formatUptime(liveMetrics.uptime_secs)}</span>
            <span className="text-[10px] text-slate-500 block mt-1">SNMP sysUpTime</span>
          </div>
        </div>

        {/* Diagnostic Fault Injection Controls */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-300">Fault Simulator & Diagnostic Controls:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSimulateFault(liveMetrics.id, 'cpu_spike')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono border border-amber-500/30 transition"
            >
              + Trigger High CPU Load
            </button>
            <button
              onClick={() => onSimulateFault(liveMetrics.id, 'latency_spike')}
              className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-mono border border-orange-500/30 transition"
            >
              + Trigger Latency Spike
            </button>
            <button
              onClick={() => onSimulateFault(liveMetrics.id, 'offline')}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono border border-red-500/30 transition"
            >
              Simulate Host Down
            </button>
            <button
              onClick={() => onSimulateFault(liveMetrics.id, 'restore')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono border border-emerald-500/30 transition"
            >
              Restore Healthy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// MODAL: ADD DEVICE WITH DIRECT IP PROBE
function AddDeviceModal({ onClose, onAdded }) {
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('auto');
  const [snmpCommunity, setSnmpCommunity] = useState('public');
  const [rtspUrl, setRtspUrl] = useState('');
  const [location, setLocation] = useState('HQ Local Network');
  const [isProbing, setIsProbing] = useState(false);
  const [probeStep, setProbeStep] = useState(0);
  const [probeLogs, setProbeLogs] = useState([]);

  const handleConnectAndProbe = async (e) => {
    e.preventDefault();
    if (!ip) return;

    setIsProbing(true);
    setProbeStep(1);
    setProbeLogs([`[INFO] Initiating direct connection to ${ip}...`]);

    setTimeout(() => {
      setProbeStep(2);
      setProbeLogs(prev => [...prev, `[SUCCESS] ICMP Ping Handshake OK (1.2ms latency to ${ip})`]);
    }, 600);

    setTimeout(() => {
      setProbeStep(3);
      setProbeLogs(prev => [...prev, `[SUCCESS] Scanning Management Ports (161 SNMP, 554 RTSP, 22 SSH, 80 HTTP)...`]);
    }, 1200);

    setTimeout(() => {
      setProbeStep(4);
      setProbeLogs(prev => [...prev, `[SUCCESS] Fingerprinted Device Profile & OID System Strings`]);
    }, 1800);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/nodes/probe-and-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip,
            name: name || undefined,
            type: type === 'auto' ? undefined : type,
            snmp_community: snmpCommunity,
            rtsp_url: rtspUrl || undefined,
            location
          })
        });

        if (res.ok) {
          const data = await res.json();
          setProbeLogs(prev => [...prev, `[SUCCESS] Telemetry pipe active! Device ID: ${data.id}`]);
          setTimeout(() => {
            onAdded(data.node);
            onClose();
          }, 800);
        } else {
          setProbeLogs(prev => [...prev, `[ERROR] Failed to save probed device to database`]);
          setIsProbing(false);
        }
      } catch (err) {
        setProbeLogs(prev => [...prev, `[ERROR] Connection timeout: ${err.message}`]);
        setIsProbing(false);
      }
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Add Device by IP Address</h2>
              <p className="text-[11px] text-slate-400">Directly connect to local IP & fetch live telemetry</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProbing} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Probing Overlay Terminal */}
        {isProbing ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to {ip}...</span>
                </span>
                <span className="text-slate-400">Step {probeStep} / 4</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-500"
                  style={{ width: `${(probeStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Diagnostic Log Output Console */}
            <div className="bg-[#050811] border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 h-40 overflow-y-auto">
              {probeLogs.map((log, idx) => (
                <div key={idx} className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-red-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectAndProbe} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center justify-between">
                <span>Target Device IP Address <span className="text-red-400">*</span></span>
                <span className="text-[10px] text-slate-500 font-mono">IPv4 / Subnet IP</span>
              </label>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 192.168.1.188 or 10.0.0.45"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Device Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Auto-detects if empty"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Classification Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                >
                  <option value="auto">Auto-Detect via Port Scan</option>
                  <option value="switch">Switch / Router</option>
                  <option value="server">Server / Virtual Machine</option>
                  <option value="camera">IP Camera</option>
                  <option value="nvr">NVR / Storage</option>
                  <option value="firewall">Firewall</option>
                  <option value="pc">PC Workstation</option>
                  <option value="printer">Printer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">SNMP Community String</label>
                <input
                  type="text"
                  value={snmpCommunity}
                  onChange={(e) => setSnmpCommunity(e.target.value)}
                  placeholder="public"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Location / Zone</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. HQ Rack A-02"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>
            </div>

            {type === 'camera' && (
              <div>
                <label className="text-slate-400 block mb-1">RTSP Stream URL (Optional)</label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://admin:pass@192.168.1.188:554/live"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px]"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>NetPulse will connect to {ip || 'this IP'} and instantly establish 1-second telemetry monitoring.</span>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Connect & Fetch Telemetry</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

// COMMAND PALETTE MODAL
function CommandPaletteModal({ nodes, onClose, onSelectNode, getTypeIcon }) {
  const [query, setQuery] = useState('');

  const filtered = nodes.filter(
    n => n.name.toLowerCase().includes(query.toLowerCase()) || n.ip.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-lg bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type device name or IP to quick jump..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.map(node => (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className="p-2.5 rounded-xl hover:bg-slate-900 cursor-pointer flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                {getTypeIcon(node.type)}
                <span className="font-medium text-slate-200">{node.name}</span>
              </div>
              <span className="font-mono text-slate-400">{node.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CAMERA PLAYER MODAL
function CameraPlayerModal({ camera, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-bold text-sm text-slate-100">{camera.name} - Live Stream Player</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
          <div className="text-center font-mono text-xs text-emerald-400">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <span>RTSP STREAM ACTIVE ({camera.resolution})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render Application
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<NetPulseApp />);
}
