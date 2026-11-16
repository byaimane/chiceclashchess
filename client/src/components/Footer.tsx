export function Footer() {
  return (
    <footer className="border-t border-[#2A313F] bg-[#11141B]/95">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-[#9CA3AF] sm:flex-row sm:px-6 lg:px-8">
        <p className="font-medium text-[#F5F0E6]">
          &#9818; Choice<span className="text-[#D4AF37]">CLASH</span> &mdash; Grandmaster 2D &amp; 3D Multiplayer Chess
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/downloads/ChoiceCLASH.apk"
            download="ChoiceCLASH.apk"
            className="font-medium text-[#D4AF37] underline decoration-[#D4AF37]/50 underline-offset-4 hover:text-[#E5C158]"
          >
            Download Android APK
          </a>
          <a
            href="/downloads/ChoiceCLASH.aab"
            download="ChoiceCLASH.aab"
            className="text-[#9CA3AF] underline decoration-[#2A313F] underline-offset-4 hover:text-[#F5F0E6]"
          >
            AAB Bundle
          </a>
          <p>&copy; {new Date().getFullYear()} ChoiceCLASH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
