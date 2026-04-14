'use client'

type Tab = {
  key: string
  label: string
  hidden?: boolean
}

export function CategoryTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
}) {
  const visibleTabs = tabs.filter((t) => !t.hidden)

  return (
    <div className="border-b border-ot-light-blue/30 mb-6">
      <div className="overflow-x-auto flex gap-0">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.key
                ? 'text-ot-orange border-ot-orange'
                : 'text-white/50 hover:text-white/70 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
