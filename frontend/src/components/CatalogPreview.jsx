export default function CatalogPreview() {
  return (
    <section className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary mb-4">Product Catalog Preview</h2>
          <p className="text-neutral-700 mb-6">Quickly browse and search your catalog with AI-enriched metadata and recommendations. This preview shows a snapshot of how items appear in the product explorer.</p>
          <button className="btn-primary">Open Catalog</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <div className="h-40 bg-neutral-100 rounded-md flex items-center justify-center">Image</div>
              <h3 className="mt-4 font-medium text-lg">Sample Product</h3>
              <p className="text-sm text-neutral-600 mt-1">Short description of the product goes here to illustrate the catalog item layout.</p>
            </div>
            <div className="col-span-1">
              <div className="h-40 bg-neutral-100 rounded-md flex items-center justify-center">Image</div>
              <h3 className="mt-4 font-medium text-lg">Another Item</h3>
              <p className="text-sm text-neutral-600 mt-1">A small description to show how the card looks.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
