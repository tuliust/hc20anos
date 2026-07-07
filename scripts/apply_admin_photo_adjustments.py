from pathlib import Path
import re

app_path = Path("src/app/App.tsx")
app = app_path.read_text(encoding="utf-8")
original = app


def replace_once(pattern: str, replacement: str, label: str, flags: int = re.S) -> None:
    global app
    next_app, count = re.subn(pattern, replacement, app, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"Pattern not found or not unique enough: {label}")
    app = next_app


# 1) Admin top tabs: replace horizontal scroll with responsive grid.
admin_tabs_pattern = r'''<div className="flex gap-1 overflow-x-auto border-b border-\[#2d6a4f\]/20 px-2 \[scrollbar-width:none\] \[&::-webkit-scrollbar\]:hidden">\s*\{tabs\.map\(t => \(\s*<button key=\{t\.id\} disabled=\{t\.disabled\} onClick=\{\(\) => !t\.disabled && setTab\(t\.id\)\}\s*className=\{"shrink-0 flex items-center gap-1\.5 px-3 md:px-4 py-4 text-\[10px\] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors disabled:opacity-30 " \+ \(tab === t\.id \? "border-\[#c9a84c\] text-\[#c9a84c\]" : "border-transparent text-\[#7a9a7a\] hover:text-\[#f0ebe0\]"\)\}>\s*\{t\.icon\}\{t\.label\}\s*</button>\s*\)\)\}\s*</div>'''

admin_tabs_replacement = '''<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 border-b border-[#2d6a4f]/20 px-2">
        {tabs.map(t => (
          <button key={t.id} disabled={t.disabled} onClick={() => !t.disabled && setTab(t.id)}
            className={"flex items-center justify-center gap-1.5 px-2 md:px-3 py-3 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors disabled:opacity-30 " + (tab === t.id ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[#7a9a7a] hover:text-[#f0ebe0]")}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>'''

if 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 border-b border-[#2d6a4f]/20 px-2' not in app:
    replace_once(admin_tabs_pattern, admin_tabs_replacement, "admin tabs")


# 2) Photo wall: state for multi-person dropdown filter.
old_state = 'const [personFilter, setPersonFilter] = useState("all");'
new_state = 'const [selectedPersonFilters, setSelectedPersonFilters] = useState<string[]>([]);\n  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);'
if old_state in app:
    app = app.replace(old_state, new_state, 1)
elif 'selectedPersonFilters' not in app:
    raise RuntimeError("Photo person filter state not found")


# 3) Photo wall: filter accepts one or more selected tagged names.
filter_logic_pattern = r'''  const filteredPhotos = photos\.filter\(p => \{\s*const matchesYear = filter === "all" \|\| String\(p\.year_approx\) === filter;\s*const tags = \(\(p as DbPhoto & \{ photo_tags\?: \{ tagged_name_snapshot\?: string \| null; status\?: string \| null \}\[\] \}\)\.photo_tags \?\? \[\]\);\s*const matchesPerson = personFilter === "all" \|\| tags\.some\(tag => \(!tag\.status \|\| tag\.status === "approved"\) && tag\.tagged_name_snapshot === personFilter\);\s*return matchesYear && matchesPerson;\s*\}\);'''

filter_logic_replacement = '''  const filteredPhotos = photos.filter(p => {
    const matchesYear = filter === "all" || String(p.year_approx) === filter;
    const tags = ((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? []);
    const approvedTagNames = tags
      .filter(tag => !tag.status || tag.status === "approved")
      .map(tag => tag.tagged_name_snapshot)
      .filter(Boolean) as string[];
    const matchesPerson = selectedPersonFilters.length === 0 || approvedTagNames.some(name => selectedPersonFilters.includes(name));
    return matchesYear && matchesPerson;
  });'''

if 'const matchesPerson = selectedPersonFilters.length === 0' not in app:
    replace_once(filter_logic_pattern, filter_logic_replacement, "photo multi-person filter logic")


# 4) Photo wall: helper to toggle selected names.
if 'function togglePersonFilter(name: string)' not in app:
    toggle_like_pattern = r'''(  async function toggleLike\(photoId: string\) \{.*?\n  \}\n\n)  return \('''
    toggle_person_replacement = r'''\1  function togglePersonFilter(name: string) {
    setSelectedPersonFilters(current =>
      current.includes(name)
        ? current.filter(item => item !== name)
        : [...current, name]
    );
  }

  return ('''
    replace_once(toggle_like_pattern, toggle_person_replacement, "togglePersonFilter insertion")


# 5) Photo wall: replace individual person buttons with one reset button + dropdown multi-select.
person_filter_block_pattern = r'''            <div>\s*<p className="text-\[#7a9a7a\] font-mono text-\[10px\] uppercase tracking-wider mb-2">Filtrar por pessoa marcada</p>\s*<div className="flex gap-2 overflow-x-auto pb-1">\s*<button onClick=\{\(\) => setPersonFilter\("all"\)\}\s*className=\{`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap \$\{personFilter === "all" \? "bg-\[#c9a84c\] text-\[#0d1a0f\] border-\[#c9a84c\]" : "border-\[#2d6a4f\]/30 text-\[#7a9a7a\] hover:border-\[#2d6a4f\]/60"\}`\}>\s*Todas as pessoas\s*</button>\s*\{taggedNames\.map\(name => \(\s*<button key=\{name\} onClick=\{\(\) => setPersonFilter\(name\)\}\s*className=\{`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap \$\{personFilter === name \? "bg-\[#c9a84c\] text-\[#0d1a0f\] border-\[#c9a84c\]" : "border-\[#2d6a4f\]/30 text-\[#7a9a7a\] hover:border-\[#2d6a4f\]/60"\}`\}>\s*\{name\}\s*</button>\s*\)\)\}\s*</div>\s*</div>'''

person_filter_block_replacement = '''            <div>
              <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Filtrar por pessoa marcada</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => { setSelectedPersonFilters([]); setPersonDropdownOpen(false); }}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${selectedPersonFilters.length === 0 ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  Todas as pessoas
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPersonDropdownOpen(open => !open)}
                    className={`w-full sm:w-72 flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${selectedPersonFilters.length > 0 ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                  >
                    <span>
                      {selectedPersonFilters.length === 0
                        ? "Selecionar pessoas"
                        : selectedPersonFilters.length === 1
                          ? "1 pessoa selecionada"
                          : `${selectedPersonFilters.length} pessoas selecionadas`}
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  {personDropdownOpen && (
                    <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 z-30 bg-[#0a120a] border border-[#2d6a4f]/40 shadow-2xl max-h-72 overflow-y-auto">
                      {taggedNames.length === 0 ? (
                        <p className="px-4 py-3 text-[#7a9a7a] text-xs font-mono">Nenhuma pessoa marcada.</p>
                      ) : (
                        taggedNames.map(name => {
                          const selected = selectedPersonFilters.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => togglePersonFilter(name)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#2d6a4f]/10 last:border-b-0 transition-colors ${selected ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14] hover:text-[#f0ebe0]"}`}
                            >
                              <span className="text-xs font-mono uppercase tracking-wider">{name}</span>
                              <span className={`w-4 h-4 border flex items-center justify-center ${selected ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/50"}`}>
                                {selected && <Check size={11} />}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>'''

if 'Selecionar pessoas' not in app:
    replace_once(person_filter_block_pattern, person_filter_block_replacement, "photo person dropdown UI")

if app == original:
    print("No changes needed; App.tsx already contained the requested adjustments.")
else:
    app_path.write_text(app, encoding="utf-8")
    print("Updated src/app/App.tsx")
