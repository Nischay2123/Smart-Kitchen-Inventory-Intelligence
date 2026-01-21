import React from "react"
import { XCircle } from "lucide-react"

export function MultiUnitPicker({
  units = [],
  value = [],
  onChange,
}) {

  // Find selected baseUnit
  const selectedBaseUnit = React.useMemo(() => {

    if (value.length === 0) return null

    const first = units.find(u => u._id === value[0])
    return first?.baseUnit || null

  }, [value, units])

  // Filter allowed units
  const filtered = React.useMemo(() => {

    if (!selectedBaseUnit) return units

    return units.filter(
      u => u.baseUnit === selectedBaseUnit
    )

  }, [units, selectedBaseUnit])

  // Group by baseUnit
  const grouped = React.useMemo(() => {

    return filtered.reduce((acc, u) => {

      acc[u.baseUnit] = acc[u.baseUnit] || []
      acc[u.baseUnit].push(u)

      return acc

    }, {})

  }, [filtered])

  const toggle = (id) => {

    const exists = value.includes(id)

    const newArr = exists
      ? value.filter(x => x !== id)
      : [...value, id]

    onChange(newArr)
  }

  return (
    <div className="space-y-3">

      {selectedBaseUnit && (
        <div className="text-xs text-muted-foreground">
          Base Unit Locked: {selectedBaseUnit}
        </div>
      )}

      {/* GROUPED LIST */}
      {Object.entries(grouped).map(
        ([base, list]) => (

        <div key={base} className="space-y-1">

          <p className="text-sm font-medium">
            {base}
          </p>

          <div className="flex flex-wrap gap-2">

            {list.map(unit => {

              const selected =
                value.includes(unit._id)

              return (
                <button
                  type="button"
                  key={unit._id}
                  onClick={() => toggle(unit._id)}
                  className={`
                    px-3 py-1 rounded-md text-sm border transition
                    ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-background hover:bg-accent"
                    }
                  `}
                >
                  {unit.unit}
                </button>
              )
            })}

          </div>

        </div>
      ))}

      {/* SELECTED CHIPS */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">

          {value.map(id => {

            const u = units.find(x => x._id === id)

            return (
              <div
                key={id}
                className="
                  flex items-center gap-1
                  bg-accent px-2 py-1 rounded text-xs
                "
              >
                {u?.unit}

                <XCircle
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggle(id)}
                />
              </div>
            )
          })}

        </div>
      )}

    </div>
  )
}
