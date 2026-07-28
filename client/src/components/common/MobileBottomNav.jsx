export default function MobileBottomNav({ items, currentTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-surface-border flex items-center justify-around z-30 md:hidden px-2 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition text-[10px] font-semibold cursor-pointer ${
              isActive
                ? 'text-brand font-bold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 stroke-[1.8]" />
              {Boolean(item.badge) && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-status-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="truncate max-w-[64px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
