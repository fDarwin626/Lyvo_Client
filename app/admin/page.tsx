'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getAdminStats, AdminStats, removeToken, getAllPaymentsAdmin } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  useEffect(() => {
    loadStats();
  }, []);

const loadStats = async () => {
  try {
    const data = await getAdminStats();
    setStats(data);
    
    // ✅ Fetch real revenue from payments
    const paymentsData = await getAllPaymentsAdmin();
    setTotalRevenue(paymentsData.total_spent);
  } catch (err: any) {
    // If unauthorized, silently redirect to home (NO error messages)
    if (err.statusCode === 401 || err.statusCode === 403) {
      router.push('/');
      return;
    }
    // For other errors, also redirect silently
    router.push('/');
  } finally {
    setLoading(false);
  }
};
  const handleLogout = () => {
    removeToken();
    router.push('/signin');
  };

  // Generate realistic chart data
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => ({
      month,
      users: 200 + Math.sin(i / 2) * 100 + Math.random() * 50,
      voices: 50 + Math.cos(i / 3) * 30 + Math.random() * 20,
      generations: 300 + Math.sin(i / 1.5) * 150 + Math.random() * 80
    }));
  };

  const chartData = generateMonthlyData();
  const maxValue = Math.max(...chartData.map(d => Math.max(d.users, d.voices, d.generations)));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-300 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Top Bar */}
      <div className="bg-[#0d1230] border-b border-gray-800/50 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#43C6AC] to-[#191654] rounded">
                <div className="flex items-center justify-center">
                <Icon icon="mdi:alphabet-l" width="50" height="50"  className="text-gray-300" />
                </div>
            </div>
            <span className="text-white text-2xl font-semibold font-amiamie">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search here"
              className="bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Link
              href="/dashboard"
              className="px-4 py-2 font-amiamie bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 border border-purple-500/30 transition"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 font-amiamie text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Top Stats Row */}
        <div className=" font-amiamie grid grid-cols-4 gap-6 mb-6">
          <TopStatCard
          label="Total Sales"
          value={`$${(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`+${stats?.total_users || 0} users`}
          trend="up"
          color="green"
        />
          <TopStatCard
            label="Total Users"
            value={(stats?.total_users || 0).toLocaleString()}
            change="+132%"
            trend="up"
            color="purple"
          />
          <TopStatCard
            label="Total Voices"
            value={(stats?.total_voices || 0).toLocaleString()}
            change="+16%"
            trend="up"
            color="blue"
          />
          <TopStatCard
            label="Active Users"
            value={(stats?.active_users || 0).toLocaleString()}
            change="+72%"
            trend="up"
            color="cyan"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Chart */}
          <div className="col-span-8 font-amiamie bg-[#0d1230] rounded-2xl p-6 border border-gray-800/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-lg font-semibold mb-1">Activity Overview</h2>
                <p className="text-gray-500 text-sm">Monthly statistics and trends</p>
              </div>
              <select className="bg-[#1a1f3a] text-gray-300 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none">
                <option>Yearly</option>
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>
            
            {/* Multi-line Wave Chart */}
            <div className="relative h-64 mb-4">
              <svg className="w-full h-full" viewBox="0 0 1000 250">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <line key={i} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#1a1f3a" strokeWidth="1" />
                ))}
                
                {/* Users line */}
                <path
                  d={`M 0 ${250 - (chartData[0].users / maxValue) * 200} ${chartData.map((d, i) => 
                    `L ${(i * 1000) / 11} ${250 - (d.users / maxValue) * 200}`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                />
                
                {/* Voices line */}
                <path
                  d={`M 0 ${250 - (chartData[0].voices / maxValue) * 200} ${chartData.map((d, i) => 
                    `L ${(i * 1000) / 11} ${250 - (d.voices / maxValue) * 200}`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="3"
                />
                
                {/* Generations line */}
                <path
                  d={`M 0 ${250 - (chartData[0].generations / maxValue) * 200} ${chartData.map((d, i) => 
                    `L ${(i * 1000) / 11} ${250 - (d.generations / maxValue) * 200}`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                />
              </svg>
              
              {/* Month labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                {chartData.map((d, i) => (
                  <span key={i}>{d.month}</span>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-400">Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-gray-400">Voices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                <span className="text-gray-400">Generations</span>
              </div>
            </div>
          </div>

          {/* Right Column - Risk Score & Donut */}
          <div className="col-span-4 space-y-6">
            {/* Risk Score Card */}
            <div className="bg-[#0d1230] rounded-2xl p-6 border border-gray-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold">System Health</h3>
                <button className="text-gray-500">
                  <Icon icon="mdi:dots-vertical" width="20" />
                </button>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1f3a" strokeWidth="12" />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      fill="none" 
                      stroke="url(#gaugeGradient)" 
                      strokeWidth="4"
                      strokeDasharray={`${((stats?.active_users || 0) / (stats?.total_users || 1) * 100) * 4.4} 440`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500 mb-1">Score</div>
                    <div className="text-3xl font-bold text-white">
                      {Math.round(((stats?.active_users || 0) / (stats?.total_users || 1)) * 1000)}
                    </div>
                    <div className="px-3 py-1 bg-green-200/20 text-yellow-400 text-xs rounded-full mt-1">
                      Medium
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-gray-400 text-sm">
                <div className="flex justify-between items-center">
                  <span>0</span>
                  <span className="text-white font-medium">System Performance</span>
                  <span>1000</span>
                </div>
              </div>
            </div>

            {/* Distribution Donut */}
            <div className="bg-[#0d1230] rounded-2xl p-6 border border-gray-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold">Distribution</h3>
                <button className="text-gray-500">
                  <Icon icon="mdi:dots-vertical" width="20" />
                </button>
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="60" fill="none" stroke="#1a1f3a" strokeWidth="7" />
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="#8b5cf6" strokeWidth="4"
                      strokeDasharray="150 377"
                      strokeLinecap="round"
                    />
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="#ec4899" strokeWidth="4"
                      strokeDasharray="100 377"
                      strokeDashoffset="-150"
                      strokeLinecap="round"
                    />
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="#06b6d4" strokeWidth="4"
                      strokeDasharray="127 377"
                      strokeDashoffset="-250"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500 mb-1">Total</div>
                    <div className="text-2xl font-bold text-white">100%</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Users</span>
                  </div>
                  <span className="text-white font-medium">{stats?.total_users || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Voices</span>
                  </div>
                  <span className="text-white font-medium">{stats?.total_voices || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                    <span className="text-gray-400 text-sm">Generations</span>
                  </div>
                  <span className="text-white font-medium">{stats?.total_generations || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Grid */}
        <div className="grid grid-cols-6 gap-6 mt-6">
          <BottomStatCard
            icon={<Icon icon="mynaui:music-waves" width="32" className="text-cyan-400" />}
            label="Generations"
            value={(stats?.total_generations || 0).toLocaleString()}
            bgColor="bg-cyan-500/10"
          />
          <BottomStatCard
            icon={<Icon icon="material-symbols:bolt" width="32" className="text-orange-400" />}
            label="Admin Actions"
            value={(stats?.admin_actions_today || 0).toLocaleString()}
            bgColor="bg-orange-500/10"
          />


        <BottomStatCard
        icon={<Icon icon="mdi:bug" width="32" className="text-red-400" />}
        label="Bug Reports"
        value={(stats?.total_bugs || 0).toLocaleString()}
        bgColor="bg-red-500/10"
      />
      <BottomStatCard
        icon={<Icon icon="mdi:alert-circle" width="32" className="text-orange-400" />}
        label="New Bugs"
        value={(stats?.new_bugs || 0).toLocaleString()}
        bgColor="bg-orange-500/10"
      />
      <BottomStatCard
        icon={<Icon icon="mdi:ticket" width="32" className="text-yellow-400" />}
        label="Open Tickets"
        value={(stats?.open_tickets || 0).toLocaleString()}
        bgColor="bg-yellow-500/10"
      />
      <BottomStatCard
        icon={<Icon icon="mdi:alert" width="32" className="text-red-500" />}
        label="High Priority"
        value={(stats?.high_priority_tickets || 0).toLocaleString()}
        bgColor="bg-red-600/10"
      />
        </div>


        {/* Quick Actions */}
        <div className="mt-10 mb-4 font-amiamie text-3xl">
          <h2 className="text-white text-lg font-semibold font-amiamie">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-5 gap-6 mt-6">
          <ActionCard
            href="/admin/users"
            icon={<Icon icon="mdi:account-group" width="28" />}
            title="Manage Users"
            description="View, disable, or delete accounts"
            color="purple"
          />
          <ActionCard
            href="/admin/voices"
            icon={<Icon icon="mdi:microphone" width="28" />}
            title="Manage Voices"
            description="Edit, delete, or add voices"
            color="pink"
          />
          <ActionCard
            href="/admin/clone-voice"
            icon={<Icon icon="mdi:plus-circle" width="28" />}
            title="Clone New Voice"
            description="Upload and clone voice"
            color="cyan"
          />

          <ActionCard
            href="/admin/bugs"
            icon={<Icon icon="mdi:bug" width="28" />}
            title="Bug Reports"
            description="Manage bug reports and comments"
            color="red"
          />
          <ActionCard
            href="/admin/payments"
            icon={<Icon icon="mdi:cash" width="28" />}
            title="Transactions"
            description="View payment history"
            color="green"
          />

        </div>
      </div>
    </div>
  );
}



function TopStatCard({ label, value, change, trend, color }: {
  label: string;
  value: string;
  change: string;
  trend: string;
  color: 'green' | 'purple' | 'blue' | 'cyan';
}) {
  const colors: Record<string, string> = {
    green: 'text-green-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400'
  };

  return (
    <div className="bg-[#0d1230] rounded-xl p-5 border border-gray-800/50">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-3xl font-bold ${colors[color]}`}>{value}</div>
        <div className={`text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
          <Icon icon={trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'} width="16" />
          {change}
        </div>
      </div>
    </div>
  );
}

function BottomStatCard({ icon, label, value, bgColor }: {
  icon: ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) {
  return (
    <div className="bg-[#0d1230] rounded-xl p-5 border border-gray-800/50">
      <div className={`${bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );
}

function ActionCard({ href, icon, title, description, color }: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: 'purple' | 'pink' | 'cyan' | 'green' | 'red' | 'yellow' | 'blue';
}) {
  const colors: Record<string, string> = {
    purple: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    pink: 'hover:border-pink-500/50 hover:bg-pink-500/5',
    cyan: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
    green: 'hover:border-green-500/50 hover:bg-green-500/5',
    red: 'hover:border-red-500/50 hover:bg-red-500/5',  
    yellow: 'hover:border-yellow-500/50 hover:bg-yellow-500/5',
    blue: 'hover:border-blue-500/50 hover:bg-blue-500/5',  
  };

  return (
    <Link
      href={href}
      className={`bg-[#0d1230] rounded-xl p-6 border border-gray-800/50 ${colors[color]} transition-all cursor-pointer group block`}
    >
      <div className="text-purple-400 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </Link>
  );
}