export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8 px-4 font-sans text-sm text-gray-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="font-playfair text-xl font-bold text-white tracking-widest">THE ULTRON</span>
          <p>© 2025 The Ultron. Automating the Future of Tourism.</p>
        </div>
        
        <div className="flex gap-6">
          <span className="cursor-default">Privacy Policy</span>
          <a href="#journey" className="hover:text-accent transition-colors">How It Works</a>
          <span className="cursor-default">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};
