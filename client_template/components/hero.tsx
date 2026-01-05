export function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
        <div className="md:col-span-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.85] uppercase">
            The Art of <br /> Living Well
          </h1>
        </div>
        <div className="md:col-span-4 pb-4">
          <p className="text-lg text-muted-foreground max-w-xs uppercase tracking-tight leading-snug">
            A curated selection of home essentials designed for longevity, utility, and aesthetic permanence.
          </p>
        </div>
      </div>
      <div className="mt-12 h-[60vh] w-full bg-secondary overflow-hidden relative group">
        <img
          src="https://image.hm.com/assets/hm/1a/3c/1a3c77208f05c2cf02bbdd5d0d71016abcd23548.jpg?imwidth=2160"
          alt="Featured Collection"
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        <div className="absolute bottom-8 left-8">
          <button className="bg-background text-foreground px-8 py-4 text-sm font-bold uppercase tracking-widest hover:invert transition-all duration-300">
            View Collection — 2026
          </button>
        </div>
      </div>
    </section>
  )
}
