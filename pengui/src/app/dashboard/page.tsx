'use client'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-4xl font-bold text-white">Welcome back</h1>
        <p className="text-sm lg:text-base text-gray-400">
          Here's what's happening with your projects today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[
          {
            label: 'Total Revenue',
            value: '$45,231',
            change: '+20.1%',
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Active Users',
            value: '12,543',
            change: '+12.5%',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Conversion',
            value: '24.8%',
            change: '+4.3%',
            color: 'from-green-500 to-emerald-500',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <span className="text-gray-400 text-xs lg:text-sm">{stat.label}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 space-y-4">
          <h3 className="text-lg lg:text-xl font-semibold text-white">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">New user registration</p>
                  <p className="text-gray-400 text-xs">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 lg:p-6 rounded-xl lg:rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/10">
          <h3 className="text-lg lg:text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Create Project', 'Invite Team', 'View Reports', 'Settings'].map((action) => (
              <button
                key={action}
                className="p-3 lg:p-4 rounded-lg lg:rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white text-xs lg:text-sm font-medium"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
