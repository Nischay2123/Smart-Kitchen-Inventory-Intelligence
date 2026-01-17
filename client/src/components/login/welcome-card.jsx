
const WelcomeHeader = () => {
  return (
    <div className="w-full px-6 pt-12 pb-8 text-center">
      {/* Brand */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        Welcome to <span className="text-emerald-500">RestroWorks</span>
      </h1>

      {/* Tagline */}
      <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
        Smart Kitchen & Inventory Intelligence Software
      </p>

      {/* Accent */}
      <div className="mt-4 flex justify-center">
        <div className="w-12 h-0.5 bg-emerald-500 rounded-full" />
      </div>
    </div>
  );
};

export default WelcomeHeader;


