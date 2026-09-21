import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, Server, HardDrive, Cpu, Wifi, Shield, Camera, Tv, Monitor,
  Printer, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw,
  Plus, Settings, FileText, Network, Radio, Zap, ArrowUpRight, ArrowDownLeft,
  Power, Lock, Play, Pause, ExternalLink, Download, Layers, Sliders,
  Bell, Eye, ChevronRight, Hash, Database, Terminal, Filter, X, User,
  LogOut, Key, ShieldCheck, Upload, HelpCircle, CornerDownRight, Check
} from 'lucide-react';

function NetPulseApp() {
  // Navigation & User Session
  const [activeTab, setActiveTab] = useState('overview'); // overview, nodes, switchmap, cameras, diagnostics, discovery, topology, alerts, audit, settings
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('netpulse_auth_token') || '');
  const [user, setUser] = useState(null);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [companyName, setCompanyName] = useState('Corporate HQ Network');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'password123' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });

  // Data States
  const [nodes, setNodes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [cameraChannels, setCameraChannels] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);

  // UI Control States
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSubnet, setScanSubnet] = useState('192.168.1.0/24');
  const [selectedCameraModal, setSelectedCameraModal] = useState(null);
  const [ptzState, setPtzState] = useState({ pan: 0, tilt: 0, zoom: 1 });
  const [toastMessage, setToastMessage] = useState(null);

  // Diagnostic Utility States
  const [diagTool, setDiagTool] = useState('ping'); // ping, portscan, traceroute
  const [diagTarget, setDiagTarget] = useState('192.168.1.1');
  const [diagOutput, setDiagOutput] = useState([]);
  const [isDiagRunning, setIsDiagRunning] = useState(false);

  // Helper for authenticated API requests
  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && authEnabled) {
      setUser(null);
    }
    return res;
  };

  // Toast Helper
  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check Auth Status & Profile
  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status', {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAuthEnabled(data.auth_enabled);
        if (data.company_name) setCompanyName(data.company_name);
        if (data.user) setUser(data.user);
      }
    } catch (e) {
      console.error('Failed to verify auth status:', e);
    }
  };

  // User Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
        localStorage.setItem('netpulse_auth_token', data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name || data.user.username}!`, 'success');
      } else {
        setLoginError(data.error || 'Login failed. Check credentials.');
      }
    } catch (err) {
      setLoginError('Network error connecting to NetPulse authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setAuthToken('');
    localStorage.removeItem('netpulse_auth_token');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        })
      });
      if (res.ok) {
        showToast('Password updated successfully', 'success');
        setShowPasswordModal(false);
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    }
  };

  // Fetch Dashboard Summary
  const fetchSummary = async () => {
    try {
      const res = await authFetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {}
  };

  // Fetch Monitored Nodes
  const fetchNodes = async () => {
    try {
      const res = await authFetch(`/api/nodes?type=${typeFilter}&status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (e) {}
  };

  // Fetch Active Alerts
  const fetchAlerts = async () => {
    try {
      const res = await authFetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {}
  };

  // Fetch Discovered Devices
  const fetchDiscovery = async () => {
    try {
      const res = await authFetch('/api/discovery');
      if (res.ok) {
        const data = await res.json();
        setDiscovered(data);
      }
    } catch (e) {}
  };

  // Fetch Cameras
  const fetchCameras = async () => {
    try {
      const res = await authFetch('/api/cameras');
      if (res.ok) {
        const data = await res.json();
        setCameraChannels(data.channels || []);
      }
    } catch (e) {}
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await authFetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {}
  };

  // Fetch Node Details
  const fetchNodeDetails = async (nodeId) => {
    try {
      const res = await authFetch(`/api/nodes/${nodeId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNodeDetails(data);
      }
    } catch (e) {}
  };

  // Keybindings (Ctrl + K)
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

  // Check auth and initial polling setup
  useEffect(() => {
    checkAuthStatus();
  }, [authToken]);

  useEffect(() => {
    if (authEnabled && !user) return;

    fetchSummary();
    fetchNodes();
    fetchAlerts();
    fetchDiscovery();
    fetchCameras();
    fetchAuditLogs();

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
  }, [authEnabled, user, isLive, typeFilter, statusFilter, searchTerm, selectedNode]);

  // Handle Diagnostic Ping / Port Scan / Traceroute
  const handleRunDiagnostic = async () => {
    setIsDiagRunning(true);
    setDiagOutput([`Executing ${diagTool.toUpperCase()} on target: ${diagTarget}...`]);
    try {
      let res;
      if (diagTool === 'ping') {
        res = await authFetch('/api/tools/ping', {
          method: 'POST',
          body: JSON.stringify({ target: diagTarget, count: 4 })
        });
        if (res.ok) {
          const data = await res.json();
          setDiagOutput(data.output);
        }
      } else if (diagTool === 'portscan') {
        res = await authFetch('/api/tools/port-scan', {
          method: 'POST',
          body: JSON.stringify({ target: diagTarget })
        });
        if (res.ok) {
          const data = await res.json();
          const lines = [
            `Port Scan Results for ${data.target}:`,
            `----------------------------------------`
          ];
          data.scanned_ports.forEach((p) => {
            lines.push(`PORT ${p.port}/tcp (${p.name}): ${p.state.toUpperCase()} ${p.latency_ms ? `[${p.latency_ms}ms]` : ''}`);
          });
          setDiagOutput(lines);
        }
      } else if (diagTool === 'traceroute') {
        res = await authFetch('/api/tools/traceroute', {
          method: 'POST',
          body: JSON.stringify({ target: diagTarget })
        });
        if (res.ok) {
          const data = await res.json();
          const lines = [`traceroute to ${data.target}, 30 hops max, 60 byte packets`];
          data.hops.forEach((h) => {
            lines.push(` ${h.hop}  ${h.name} (${h.ip})  ${h.rtt1}  ${h.rtt2}  ${h.rtt3}`);
          });
          setDiagOutput(lines);
        }
      }
    } catch (e) {
      setDiagOutput([`Error running diagnostic execution: ${e.message}`]);
    } finally {
      setIsDiagRunning(false);
    }
  };

  // Handle Acknowledge Alert
  const handleAckAlert = async (alertId) => {
    try {
      const res = await authFetch(`/api/alerts/${alertId}/ack`, { method: 'POST' });
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
      const res = await authFetch(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
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
      const res = await authFetch(`/api/nodes/${nodeId}/simulate-fault`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showToast(`Triggered simulation: ${action}`, 'warning');
        fetchNodes();
        fetchSummary();
        fetchAlerts();
        fetchAuditLogs();
        if (selectedNode) fetchNodeDetails(nodeId);
      }
    } catch (e) {
      showToast('Simulation failed', 'error');
    }
  };

  // Subnet Discovery Scan
  const handleRunScan = async () => {
    setIsScanning(true);
    showToast(`Scanning subnet ${scanSubnet}...`, 'info');
    try {
      const res = await authFetch('/api/discovery/scan', {
        method: 'POST',
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

  // Import Device
  const handleImportDevice = async (ip) => {
    try {
      const res = await authFetch('/api/discovery/import', {
        method: 'POST',
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        showToast(`Imported ${ip} into monitored inventory`, 'success');
        fetchDiscovery();
        fetchNodes();
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Import failed', 'error');
    }
  };

  // Toggle Switch Port State
  const handlePortToggle = async (portId, newStatus) => {
    if (!selectedNodeDetails) return;
    try {
      const res = await authFetch(`/api/nodes/${selectedNodeDetails.id}/ports/${portId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Port status updated to ${newStatus}`, 'success');
        fetchNodeDetails(selectedNodeDetails.id);
        fetchAuditLogs();
      }
    } catch (e) {
      showToast('Failed to update port', 'error');
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    try {
      const res = await authFetch('/api/system/export');
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NetPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        showToast('Exported NetPulse database snapshot', 'success');
      }
    } catch (e) {
      showToast('Export failed', 'error');
    }
  };

  // Import JSON Backup
  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const res = await authFetch('/api/system/import', {
          method: 'POST',
          body: JSON.stringify(parsed)
        });
        if (res.ok) {
          showToast('Database snapshot restored successfully!', 'success');
          fetchSummary();
          fetchNodes();
          fetchAlerts();
          fetchAuditLogs();
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Helper icons
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

  const formatUptime = (secs) => {
    if (!secs) return '0m';
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Login View when Auth Enabled and Not Logged In
  if (authEnabled && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070a11] text-slate-100 p-4 font-sans">
        <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
                <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">NetPulse Authentication</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">{companyName} - Infrastructure Monitor</p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2 font-mono">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to NetPulse'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400 font-mono">
              Default Admin Credentials:<br />
              <span className="text-emerald-400 font-bold">admin</span> / <span className="text-emerald-400 font-bold">password123</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Header Bar */}
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
              <p className="text-[11px] text-slate-400 font-mono">{companyName}</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden md:block"></div>

          {/* Quick Stats Pill */}
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

        {/* Right Controls & User Profile */}
        <div className="flex items-center gap-3">
          {/* Command Palette Button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search or jump...</span>
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

          {/* User Profile / Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-mono transition"
                title="Account Settings"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-medium">{user.username}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 hover:text-red-400 border border-slate-800 text-slate-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
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
              active={activeTab === 'diagnostics'}
              onClick={() => setActiveTab('diagnostics')}
              icon={<Terminal className="w-4 h-4" />}
              label="Network Diagnostics"
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
              active={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
              icon={<FileText className="w-4 h-4" />}
              label="Audit Logs"
            />
            <SidebarNavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-4 h-4" />}
              label="System Settings"
            />
          </div>

          <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono hidden md:block">
            <div className="flex justify-between items-center mb-1">
              <span>Status:</span>
              <span className="text-emerald-400 font-semibold">Online (DO SQL)</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>Port Poller:</span>
              <span>2.5s SNMP</span>
            </div>
          </div>
        </aside>

        {/* Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#070a11] p-4 lg:p-6">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Monitored Fleet"
                  value={summary?.totalNodes || 0}
                  subtext={`${summary?.onlineNodes || 0} Online • ${summary?.offlineNodes || 0} Offline`}
                  icon={<Server className="w-5 h-5 text-emerald-400" />}
                  trend="+12% vs last week"
                />
                <MetricCard
                  title="Average System Latency"
                  value={`${summary?.avgLatency?.toFixed(1) || '0.0'} ms`}
                  subtext="ICMP Ping Round-Trip Avg"
                  icon={<Wifi className="w-5 h-5 text-cyan-400" />}
                  color={summary?.avgLatency > 15 ? 'text-amber-400' : 'text-emerald-400'}
                />
                <MetricCard
                  title="Aggregated CPU Utilization"
                  value={`${summary?.avgCpu?.toFixed(1) || '0.0'}%`}
                  subtext="Across all servers & switches"
                  icon={<Cpu className="w-5 h-5 text-indigo-400" />}
                  progress={summary?.avgCpu || 0}
                />
                <MetricCard
                  title="Aggregated RAM Utilization"
                  value={`${summary?.avgMemory?.toFixed(1) || '0.0'}%`}
                  subtext="Across compute inventory"
                  icon={<HardDrive className="w-5 h-5 text-purple-400" />}
                  progress={summary?.avgMemory || 0}
                />
              </div>

              {/* Active Alerts Banner */}
              {alerts.filter(a => a.status === 'active').length > 0 && (
                <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                      <h2 className="font-bold text-sm uppercase tracking-wider text-red-200 font-mono">Active Incidents & Alerts</h2>
                    </div>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs text-red-300 hover:text-red-100 underline font-mono"
                    >
                      View All Alerts ({alerts.filter(a => a.status === 'active').length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {alerts.filter(a => a.status === 'active').slice(0, 3).map((alt) => (
                      <div key={alt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-red-900/20 border border-red-800/50 gap-2">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded mt-0.5 ${alt.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                            {alt.severity}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{alt.title} — <span className="text-red-300">{alt.node_name}</span></p>
                            <p className="text-xs text-slate-300">{alt.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAckAlert(alt.id)}
                            className="px-2.5 py-1 text-xs bg-red-800 hover:bg-red-700 text-white rounded-lg font-mono transition"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infrastructure Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Node Health Matrix */}
                <div className="lg:col-span-2 bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-slate-100 text-base">Infrastructure Devices Matrix</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('nodes')}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      Manage All Devices <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {nodes.slice(0, 6).map((node) => (
                      <div
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          fetchNodeDetails(node.id);
                        }}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 transition cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-emerald-400 transition">
                              {getTypeIcon(node.type)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition">{node.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{node.ip}</p>
                            </div>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full ${node.status === 'online' ? 'bg-emerald-400' : node.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/60 text-slate-400">
                          <div>
                            <span className="block text-slate-500 text-[9px] uppercase">CPU</span>
                            <span className={node.cpu_usage > 80 ? 'text-amber-400 font-bold' : 'text-slate-200'}>{node.cpu_usage?.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-[9px] uppercase">RAM</span>
                            <span className={node.memory_usage > 85 ? 'text-amber-400 font-bold' : 'text-slate-200'}>{node.memory_usage?.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-[9px] uppercase">Ping</span>
                            <span className="text-emerald-400">{node.latency_ms?.toFixed(1)} ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subnet Quick Scan Widget */}
                <div className="bg-[#0d1322] border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Radio className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-bold text-slate-100 text-base">Quick Subnet Scanner</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Scan local subnet range to discover unmanaged switches, servers, IP cameras, and workstations.</p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">Target Subnet / CIDR</label>
                        <input
                          type="text"
                          value={scanSubnet}
                          onChange={(e) => setScanSubnet(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <button
                        onClick={handleRunScan}
                        disabled={isScanning}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                      >
                        {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{isScanning ? 'Scanning Network...' : 'Execute Subnet Scan'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Unmonitored Discovered:</span>
                      <span className="text-cyan-400 font-bold">{discovered.filter(d => d.status === 'new').length} Devices</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('discovery')}
                      className="w-full mt-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 transition text-center"
                    >
                      Open Discovered IPAM List →
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: INFRASTRUCTURE NODES */}
          {activeTab === 'nodes' && (
            <div className="space-y-4">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0d1322] p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filter by name, IP, vendor, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Device Types</option>
                    <option value="switch">Switches & Routers</option>
                    <option value="server">Physical & Virtual Servers</option>
                    <option value="camera">IP Cameras & CCTV</option>
                    <option value="nvr">NVR & NAS Storage</option>
                    <option value="pc">Workstations / PCs</option>
                    <option value="printer">Network Printers</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="online">Online Only</option>
                    <option value="warning">Warning State</option>
                    <option value="critical">Critical State</option>
                    <option value="offline">Offline / Unreachable</option>
                  </select>

                  <button
                    onClick={fetchNodes}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-emerald-400 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Nodes Table */}
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Device & Hostname</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Vendor / Hardware</th>
                        <th className="px-4 py-3">CPU</th>
                        <th className="px-4 py-3">RAM</th>
                        <th className="px-4 py-3">Ping Latency</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {nodes.map((node) => (
                        <tr
                          key={node.id}
                          className="hover:bg-slate-900/60 transition cursor-pointer group"
                          onClick={() => {
                            setSelectedNode(node);
                            fetchNodeDetails(node.id);
                          }}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2.5">
                            <div className="p-1.5 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-400">
                              {getTypeIcon(node.type)}
                            </div>
                            <div>
                              <span>{node.name}</span>
                              <span className="block text-[10px] font-normal text-slate-400">{node.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-emerald-400 font-bold">{node.ip}</td>
                          <td className="px-4 py-3 uppercase text-slate-400 text-[10px]">{node.type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              node.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              node.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              node.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {node.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{node.vendor} {node.model}</td>
                          <td className="px-4 py-3">
                            <span className={node.cpu_usage > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                              {node.cpu_usage?.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={node.memory_usage > 85 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                              {node.memory_usage?.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-emerald-400">{node.latency_ms?.toFixed(1)} ms</td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSimulateFault(node.id, 'cpu_spike')}
                                className="px-2 py-1 text-[10px] bg-amber-950/60 border border-amber-800 text-amber-300 hover:bg-amber-900 rounded transition"
                                title="Trigger CPU Fault"
                              >
                                Spike
                              </button>
                              <button
                                onClick={() => handleSimulateFault(node.id, 'restore')}
                                className="px-2 py-1 text-[10px] bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 rounded transition"
                                title="Reset State"
                              >
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SWITCH PORT MAPPER */}
          {activeTab === 'switchmap' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      Core Switch Port Visualizer (24-Port Managed Switch)
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Core-Switch-01 (192.168.1.1) • Cisco Catalyst 9300 48P</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Link Up</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> Warning/Err</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700"></span> Port Down</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-500"></span> PoE Active</span>
                  </div>
                </div>

                {/* Switch Faceplate 24-Port Grid */}
                <div className="bg-[#070a11] border-2 border-slate-800 rounded-2xl p-6 shadow-inner">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const portNum = idx + 1;
                      const isUp = portNum % 4 !== 0;
                      const hasPoe = portNum <= 8;
                      return (
                        <div
                          key={portNum}
                          onClick={() => showToast(`Port ${portNum} selected for detailed diagnostics`, 'info')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-between transition cursor-pointer hover:scale-105 ${
                            isUp
                              ? 'bg-slate-900 border-slate-700 hover:border-emerald-500'
                              : 'bg-slate-950 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 mb-2">
                            <span>#{portNum}</span>
                            <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                          </div>

                          <div className={`w-full py-2 rounded-lg text-center font-mono font-bold text-xs ${
                            isUp ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-slate-900 text-slate-600'
                          }`}>
                            {isUp ? '1G' : 'OFF'}
                          </div>

                          <div className="mt-2 text-[9px] font-mono text-slate-400 text-center truncate w-full">
                            {hasPoe ? 'PoE 15.4W' : 'Data'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY CAMERAS & NVR */}
          {activeTab === 'cameras' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    IP Cameras & NVR CCTV Stream Wall
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Live H.265 / RTSP Stream Matrix & Motion Detector</p>
                </div>
                <button
                  onClick={fetchCameras}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono flex items-center gap-2 hover:text-cyan-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Wall
                </button>
              </div>

              {/* Camera Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameraChannels.map((cam) => (
                  <div key={cam.id} className="bg-[#0d1322] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
                    <div>
                      {/* Video Snapshot Header */}
                      <div className="relative aspect-video bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden group">
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono text-slate-200">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                          <span>{cam.name}</span>
                        </div>

                        <div className="absolute bottom-3 right-3 z-10 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-slate-800">
                          {cam.resolution} • {cam.fps} FPS
                        </div>

                        {/* Simulated CCTV Visual */}
                        <div className="text-center p-4">
                          <Camera className="w-12 h-12 text-slate-700 mx-auto mb-2 group-hover:text-cyan-400 transition" />
                          <p className="text-xs text-slate-500 font-mono">RTSP Live Stream Active</p>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Codec / Bitrate:</span>
                          <span className="text-slate-200">{cam.codec || 'H.265'} ({cam.bitrate_kbps} Kbps)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Motion Detection:</span>
                          <span className={cam.motion_detected ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
                            {cam.motion_detected ? 'MOTION DETECTED' : 'CLEAR'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => setSelectedCameraModal(cam)}
                        className="w-full py-2 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open PTZ Controls</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NETWORK DIAGNOSTICS SUITE */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-emerald-400" />
                      Interactive Network Diagnostic Console
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Execute ICMP Ping, Port Scans, and Traceroutes directly across local company subnets</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Diagnostic Tool</label>
                    <select
                      value={diagTool}
                      onChange={(e) => setDiagTool(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                    >
                      <option value="ping">ICMP Ping Probe</option>
                      <option value="portscan">TCP Common Port Scan</option>
                      <option value="traceroute">Subnet Traceroute</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Target Host / IP Address</label>
                    <input
                      type="text"
                      value={diagTarget}
                      onChange={(e) => setDiagTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                      placeholder="192.168.1.1"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleRunDiagnostic}
                      disabled={isDiagRunning}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {isDiagRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{isDiagRunning ? 'Executing Tool...' : 'Run Command'}</span>
                    </button>
                  </div>
                </div>

                {/* Terminal Window */}
                <div className="bg-[#05070d] border border-slate-800/80 rounded-2xl p-4 font-mono text-xs text-emerald-400 h-80 overflow-y-auto leading-relaxed shadow-inner">
                  {diagOutput.length === 0 ? (
                    <span className="text-slate-600">// Select a diagnostic tool and hit 'Run Command' to see output...</span>
                  ) : (
                    diagOutput.map((line, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">{line}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DISCOVERY & IPAM */}
          {activeTab === 'discovery' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Radio className="w-5 h-5 text-cyan-400" />
                      Subnet Scanner & IPAM Inventory
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">Discovered active hosts on local subnets awaiting inventory management</p>
                  </div>

                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
                  >
                    {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Run Subnet Scan</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Discovered IP</th>
                        <th className="px-4 py-3">MAC Address</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Hostname</th>
                        <th className="px-4 py-3">Detected Type</th>
                        <th className="px-4 py-3">Open Ports</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {discovered.map((dev) => (
                        <tr key={dev.ip} className="hover:bg-slate-900/60 transition">
                          <td className="px-4 py-3 font-bold text-cyan-400">{dev.ip}</td>
                          <td className="px-4 py-3 text-slate-300">{dev.mac}</td>
                          <td className="px-4 py-3 text-slate-200">{dev.vendor}</td>
                          <td className="px-4 py-3 text-slate-100">{dev.hostname}</td>
                          <td className="px-4 py-3 uppercase text-slate-400 text-[10px]">{dev.detected_type}</td>
                          <td className="px-4 py-3 text-emerald-400">{dev.open_ports}</td>
                          <td className="px-4 py-3 text-right">
                            {dev.status === 'added' ? (
                              <span className="text-emerald-400 text-[10px] font-bold">MONITORED</span>
                            ) : (
                              <button
                                onClick={() => handleImportDevice(dev.ip)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono transition"
                              >
                                + Import
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
          )}

          {/* TAB 7: NETWORK TOPOLOGY */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl text-center py-12">
                <Network className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
                <h2 className="text-xl font-bold text-white mb-2">Interactive Network Topology Map</h2>
                <p className="text-sm text-slate-400 font-mono max-w-lg mx-auto mb-6">
                  Core-Switch-01 (192.168.1.1) is interconnected with 10Gbps fiber links to FortiGate Edge FW (192.168.1.254), App-DB-Primary, and Floor1-Dist-Switch.
                </p>
                <div className="flex justify-center gap-4 text-xs font-mono text-slate-300">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">10G Fiber Uplinks: ACTIVE</span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">PoE Security Loop: ACTIVE</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ALERTS & INCIDENTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  System Incident Log & Active Alerts
                </h2>

                <div className="space-y-3">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded ${alt.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                            {alt.severity}
                          </span>
                          <span className="font-bold text-sm text-slate-100">{alt.title}</span>
                          <span className="text-xs text-slate-400 font-mono">({alt.node_name})</span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono">{alt.message}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {alt.status === 'active' && (
                          <button
                            onClick={() => handleAckAlert(alt.id)}
                            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-mono rounded-lg transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alt.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Administrator System Audit Trail
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#090d16] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/60 transition">
                          <td className="px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-emerald-400">{log.user}</td>
                          <td className="px-4 py-3 text-slate-200 font-semibold">{log.action}</td>
                          <td className="px-4 py-3 text-slate-300">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SYSTEM SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" />
                    System Configuration & Backup / Restore
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Manage local network hosting rules, authentication enforcement, and database snapshots</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">Authentication & Access Control</h3>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <p className="font-semibold text-sm text-slate-100">Enforce Local Network Password Authentication</p>
                      <p className="text-xs text-slate-400 font-mono">Require username/password login before accessing monitoring data on local network</p>
                    </div>
                    <button
                      onClick={async () => {
                        const newAuth = !authEnabled;
                        setAuthEnabled(newAuth);
                        await authFetch('/api/settings', {
                          method: 'POST',
                          body: JSON.stringify({ company_name: companyName, auth_enabled: newAuth ? 1 : 0 })
                        });
                        showToast(`Authentication requirement ${newAuth ? 'enabled' : 'disabled'}`, 'info');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                        authEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {authEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 font-mono uppercase tracking-wider">Database Backup & Restoration</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-100 mb-1">Export Full Database Backup</p>
                        <p className="text-xs text-slate-400 font-mono mb-4">Download complete JSON snapshot of all monitored nodes, switch ports, cameras, and alert rules.</p>
                      </div>
                      <button
                        onClick={handleExportBackup}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl font-mono transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Backup JSON</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-100 mb-1">Restore Database Snapshot</p>
                        <p className="text-xs text-slate-400 font-mono mb-4">Upload a previously saved NetPulse JSON configuration file to restore inventory.</p>
                      </div>
                      <label className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl font-mono transition flex items-center justify-center gap-2 cursor-pointer text-center">
                        <Upload className="w-4 h-4" />
                        <span>Upload & Restore JSON</span>
                        <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD DEVICE */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            fetchNodes();
            fetchSummary();
            fetchAuditLogs();
            showToast('Device added successfully', 'success');
          }}
          authFetch={authFetch}
        />
      )}

      {/* MODAL 2: CAMERA STREAM DETAILED CONTROLS */}
      {selectedCameraModal && (
        <CameraPTZModal
          camera={selectedCameraModal}
          ptzState={ptzState}
          setPtzState={setPtzState}
          onClose={() => setSelectedCameraModal(null)}
          showToast={showToast}
        />
      )}

      {/* MODAL 3: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" /> Change Administrator Password
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponents
function SidebarNavItem({ active, onClick, icon, label, badge, badgeColor }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
        active
          ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-800/80'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="hidden md:inline">{label}</span>
      </div>
      {badge !== undefined && badge !== null && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold hidden md:inline ${badgeColor || 'bg-slate-800 text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricCard({ title, value, subtext, icon, color = 'text-white', progress }) {
  return (
    <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800/80 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-mono">{title}</span>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">{icon}</div>
      </div>
      <div>
        <p className={`text-2xl font-bold font-mono tracking-tight ${color}`}>{value}</p>
        <p className="text-[11px] text-slate-500 font-mono mt-1">{subtext}</p>
      </div>
      {progress !== undefined && (
        <div className="w-full h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress > 85 ? 'bg-amber-500' : progress > 90 ? 'bg-red-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

function AddDeviceModal({ onClose, onAdded, authFetch }) {
  const [ip, setIp] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('auto');
  const [location, setLocation] = useState('HQ Server Room');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/nodes/probe-and-add', {
        method: 'POST',
        body: JSON.stringify({ ip, name, type, location })
      });
      if (res.ok) {
        onAdded();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" /> Probe & Add Network Device
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Device IP Address *</label>
            <input
              type="text"
              required
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.50"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Custom Display Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Core-Router-East"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Device Type Fingerprint</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
            >
              <option value="auto">Auto-Detect via SNMP & Port Fingerprint</option>
              <option value="switch">Managed Network Switch</option>
              <option value="server">Linux / Windows Server</option>
              <option value="camera">IP Security Camera</option>
              <option value="nvr">NVR / Storage Server</option>
              <option value="pc">PC / Workstation</option>
              <option value="printer">Network Printer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Physical Location Zone</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{isSubmitting ? 'Probing Device...' : 'Probe & Add Device'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function CameraPTZModal({ camera, ptzState, setPtzState, onClose, showToast }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" /> {camera.name} — PTZ Interactive Controls
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video bg-slate-950 rounded-xl mb-6 border border-slate-800 flex items-center justify-center text-center p-6">
          <div>
            <p className="text-cyan-400 font-mono text-sm font-bold mb-1">Simulated RTSP Live Feed</p>
            <p className="text-xs text-slate-500 font-mono">Pan: {ptzState.pan}° | Tilt: {ptzState.tilt}° | Zoom: {ptzState.zoom}x</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <p className="text-slate-400 mb-3 uppercase tracking-wider font-bold">Pan & Tilt Pad</p>
            <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto">
              <div></div>
              <button onClick={() => setPtzState({ ...ptzState, tilt: ptzState.tilt + 5 })} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">▲</button>
              <div></div>
              <button onClick={() => setPtzState({ ...ptzState, pan: ptzState.pan - 5 })} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">◄</button>
              <button onClick={() => setPtzState({ pan: 0, tilt: 0, zoom: 1 })} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-xs text-cyan-400">●</button>
              <button onClick={() => setPtzState({ ...ptzState, pan: ptzState.pan + 5 })} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">►</button>
              <div></div>
              <button onClick={() => setPtzState({ ...ptzState, tilt: ptzState.tilt - 5 })} className="p-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">▼</button>
              <div></div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center flex flex-col justify-between">
            <div>
              <p className="text-slate-400 mb-3 uppercase tracking-wider font-bold">Optical Zoom</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setPtzState({ ...ptzState, zoom: Math.max(1, ptzState.zoom - 0.5) })} className="px-4 py-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">- Zoom Out</button>
                <button onClick={() => setPtzState({ ...ptzState, zoom: Math.min(10, ptzState.zoom + 0.5) })} className="px-4 py-2 bg-slate-800 hover:bg-cyan-900 rounded-lg text-slate-200">+ Zoom In</button>
              </div>
            </div>
            <button
              onClick={() => showToast('Preset 1 applied (Main Entrance View)', 'success')}
              className="w-full py-2 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-lg font-bold"
            >
              Set Preset 1 Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mount Root
const root = createRoot(document.getElementById('root'));
root.render(<NetPulseApp />);
