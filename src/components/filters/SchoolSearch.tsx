'use client'

interface SchoolSearchProps {
  value: string
  onChange: (value: string) => void
}

export default function SchoolSearch({ value, onChange }: SchoolSearchProps) {
  return (
    <input
      type="search"
      placeholder="Search school…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 min-w-40 xl:min-w-64 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  )
}
