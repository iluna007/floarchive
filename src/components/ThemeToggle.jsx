export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  // CP437: ☺ U+263A (white smiling face) = light, ☻ U+263B (black smiling face) = dark
  const icon = isDark ? '\u263A' : '\u263B'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-icon" aria-hidden>{icon}</span>
    </button>
  )
}
