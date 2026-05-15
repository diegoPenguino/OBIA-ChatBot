"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMe,
  getAdminUsers,
  getAdminLogs,
  toggleUser,
  createAdminUser,
  updateUserRequests,
  clearToken,
  isAuthenticated,
  UserMe,
  AdminUser,
  AdminLog,
} from "@/lib/api";

type Tab = "users" | "logs";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [tab, setTab] = useState<Tab>("users");

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Logs tab state
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filterUserId, setFilterUserId] = useState<number | undefined>();
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editMaxRequests, setEditMaxRequests] = useState(100);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    max_requests: 100,
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
      return;
    }
    getMe()
      .then((u) => {
        if (!u.is_admin) {
          router.replace("/assistant");
          return;
        }
        setUser(u);
      })
      .catch(() => {
        clearToken();
        router.replace("/");
      });
  }, [router]);

  // Load users
  useEffect(() => {
    if (!user) return;
    loadUsers();
  }, [user]);

  // Load logs when tab changes
  useEffect(() => {
    if (tab === "logs" && user) {
      loadLogs();
    }
  }, [tab, filterUserId, user]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getAdminLogs(200, 0, filterUserId);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleToggleUser = async (userId: number, currentActive: boolean) => {
    try {
      await toggleUser(userId, !currentActive);
      await loadUsers();
    } catch (err) {
      console.error("Failed to toggle user:", err);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await createAdminUser(newUser);
      setShowCreateModal(false);
      setNewUser({
        username: "",
        first_name: "",
        last_name: "",
        password: "",
        max_requests: 100,
      });
      loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRequests = async (userId: number) => {
    try {
      await updateUserRequests(userId, editMaxRequests);
      setEditingUserId(null);
      loadUsers();
    } catch (err) {
      console.error("Failed to update requests:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
          <div className="w-2 h-2 bg-brand-400 rounded-full loading-dot" />
        </div>
      </div>
    );
  }

  const totalRequests = users.reduce((s, u) => s + u.requests_used, 0);
  const totalTokensIn = logs.reduce((s, l) => s + l.input_tokens, 0);
  const totalTokensOut = logs.reduce((s, l) => s + l.output_tokens, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-icon.png" 
              alt="OBIA Admin" 
              className="w-10 h-10 object-contain" 
            />
            <span className="font-bold text-white tracking-tight">Admin Panel</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user.username}</span>
            <button onClick={handleLogout} className="btn-ghost text-sm">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={users.filter((u) => !u.is_admin).length} />
          <StatCard label="Total Requests" value={totalRequests} />
          <StatCard
            label="Active Users"
            value={users.filter((u) => u.is_active && !u.is_admin).length}
          />
          <StatCard
            label="Total Tokens"
            value={totalTokensIn + totalTokensOut}
            subtitle={`In: ${totalTokensIn} / Out: ${totalTokensOut}`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/60 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("users")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "users"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "logs"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Logs
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {tab === "users" ? "Contest Participants" : "Interaction Logs"}
          </h2>
          {tab === "users" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Student</span>
            </button>
          )}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="card overflow-hidden">
            {usersLoading ? (
              <div className="p-8 text-center text-gray-400">Loading users…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-400 text-left">
                      <th className="px-6 py-4 font-medium">Student / Username</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Used</th>
                      <th className="px-6 py-4 font-medium">Remaining</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-medium text-brand-300">
                              {(u.first_name || u.username).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {u.first_name} {u.last_name}
                              </div>
                              <div className="text-xs text-gray-500">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              u.is_admin
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-gray-700/50 text-gray-300"
                            }`}
                          >
                            {u.is_admin ? "Admin" : "Student"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {u.requests_used}
                        </td>
                        <td className="px-6 py-4">
                          {editingUserId === u.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editMaxRequests}
                                onChange={(e) => setEditMaxRequests(parseInt(e.target.value))}
                                className="bg-gray-800 border border-brand-500/50 rounded px-2 py-1 w-20 text-white text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateRequests(u.id)}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="text-gray-500 hover:text-gray-400"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span
                                className={`font-medium ${
                                  u.max_requests - u.requests_used <= 10
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {u.max_requests - u.requests_used}
                              </span>
                              {!u.is_admin && (
                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setEditMaxRequests(u.max_requests);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-brand-400 p-1.5 rounded-lg hover:bg-white/10"
                                  title="Edit max requests"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                              u.is_active
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                            {u.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!u.is_admin && (
                            <button
                              onClick={() => handleToggleUser(u.id, u.is_active)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                                u.is_active
                                  ? "text-red-400 hover:bg-red-500/10"
                                  : "text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {u.is_active ? "Disable" : "Enable"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {tab === "logs" && (
          <div>
            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-400">Filter by user:</label>
              <select
                value={filterUserId ?? ""}
                onChange={(e) =>
                  setFilterUserId(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="input-field w-auto text-sm py-2"
              >
                <option value="">All users</option>
                {users
                  .filter((u) => !u.is_admin)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
              </select>
              <button onClick={loadLogs} className="btn-ghost text-sm">
                Refresh
              </button>
            </div>

            <div className="card overflow-hidden">
              {logsLoading ? (
                <div className="p-8 text-center text-gray-400">Loading logs…</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No logs found</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                    >
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-medium text-brand-300 flex-shrink-0">
                            {log.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {log.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {log.created_at
                                  ? new Date(log.created_at).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate max-w-xl mt-0.5">
                              {log.prompt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <div className="text-xs text-gray-500 hidden sm:block">
                            <span>In: {log.input_tokens}</span>
                            <span className="mx-1.5">·</span>
                            <span>Out: {log.output_tokens}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedLog === log.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </div>
                      </div>

                      {expandedLog === log.id && (
                        <div className="px-6 pb-6 space-y-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                              Prompt
                            </h4>
                            <div className="bg-gray-800/50 rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap">
                              {log.prompt}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                              Response
                            </h4>
                            <div className="bg-gray-800/50 rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap">
                              {log.response}
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Input tokens: {log.input_tokens}</span>
                            <span>Output tokens: {log.output_tokens}</span>
                            <span>
                              Total: {log.input_tokens + log.output_tokens}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="card w-full max-w-md shadow-2xl border-brand-500/20">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add New Student</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="input-field py-2 text-sm"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="input-field py-2 text-sm"
                    placeholder="Perez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="input-field py-2 text-sm"
                  placeholder="student_handle"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input-field py-2 text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Max Requests</label>
                <input
                  type="number"
                  required
                  value={newUser.max_requests}
                  onChange={(e) => setNewUser({...newUser, max_requests: parseInt(e.target.value)})}
                  className="input-field py-2 text-sm"
                />
              </div>

              {createError && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost flex-1 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 text-sm"
                >
                  {creating ? "Creating..." : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card Component ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
