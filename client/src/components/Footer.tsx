export function Footer() {
  return (
    <footer className="border-t border-[#DDD6C8] bg-[#EFEAE0]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-[#57534E] sm:flex-row sm:px-6 lg:px-8">
        <p className="font-medium text-[#1C1917]">
          ChoiceCLASH &mdash; 2D Online Multiplayer Chess
        </p>
        <p>&copy; {new Date().getFullYear()} ChoiceCLASH. All rights reserved.</p>
      </div>
    </footer>
  );
}
