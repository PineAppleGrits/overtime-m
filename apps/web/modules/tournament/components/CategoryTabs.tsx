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
    <div className="flex w-full h-[50px] bg-[#181525] items-center justify-center">
      {visibleTabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`h-full px-6 sm:px-10 uppercase font-din-display text-sm sm:text-base font-bold cursor-pointer pt-1 transition-colors ${
            activeTab === tab.key
              ? 'text-ot-orange'
              : 'text-[#aa2c28] hover:text-ot-orange'
          }`}
          style={
            activeTab === tab.key
              ? {
                  background:
                    'linear-gradient(180deg, rgba(59, 51, 106, 0) 0%, rgba(59, 51, 106, 0.2) 100%)',
                }
              : undefined
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
