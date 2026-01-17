import BrandCard from "./card"

export default function BrandGrid({
  brands = [],
  onOpenBrand,
  onDeleteBrand,
}) {
  if (brands.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          No brands created yet
        </p>
      </div>
    )
  }
  //console.log(brands);
  
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-6
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          name={brand}
          onOpen={onOpenBrand}
          onDelete={onDeleteBrand}
        />
      ))}
    </div>
  )
}
