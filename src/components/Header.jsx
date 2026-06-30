export default function Header({ title, sub, right }) {
  return (
    <header className="px-5 pt-6 pb-3 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink leading-tight">{title}</h1>
        {sub && <p className="text-sm text-sub mt-1">{sub}</p>}
      </div>
      {right}
    </header>
  );
}
