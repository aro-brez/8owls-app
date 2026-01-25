"use client";

interface OwlAvatarProps {
  avatarId: number;
  name?: string;
  role?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const owlStyles = [
  { emoji: "🦉", bg: "from-violet-400 to-blue-400", style: "cosmic" },
  { emoji: "🦉", bg: "from-blue-400 to-teal-400", style: "ethereal" },
  { emoji: "🦉", bg: "from-teal-400 to-green-300", style: "nature" },
  { emoji: "🦉", bg: "from-pink-400 to-purple-500", style: "divine" },
  { emoji: "🦉", bg: "from-green-300 to-blue-400", style: "peaceful" },
  { emoji: "🦉", bg: "from-purple-500 to-pink-400", style: "mystical" },
  { emoji: "🦉", bg: "from-blue-400 to-pink-400", style: "dream" },
  { emoji: "🦉", bg: "from-teal-400 to-purple-500", style: "wisdom" },
  { emoji: "🦉", bg: "from-pink-400 to-green-300", style: "bloom" },
  { emoji: "🦉", bg: "from-green-300 to-purple-500", style: "forest" },
  { emoji: "🦉", bg: "from-blue-400 to-green-300", style: "ocean" },
  { emoji: "🦉", bg: "from-purple-500 to-teal-400", style: "galaxy" },
  { emoji: "🦉", bg: "from-amber-300 to-orange-400", style: "sunrise" },
  { emoji: "🦉", bg: "from-rose-400 to-red-400", style: "passion" },
  { emoji: "🦉", bg: "from-indigo-400 to-violet-500", style: "night" },
  { emoji: "🦉", bg: "from-cyan-400 to-blue-500", style: "sky" },
  { emoji: "🦉", bg: "from-lime-400 to-emerald-500", style: "spring" },
  { emoji: "🦉", bg: "from-fuchsia-400 to-pink-500", style: "magic" },
  { emoji: "🦉", bg: "from-yellow-300 to-amber-400", style: "golden" },
  { emoji: "🦉", bg: "from-slate-400 to-gray-500", style: "shadow" },
  { emoji: "🦉", bg: "from-purple-400 to-indigo-500", style: "twilight" },
  { emoji: "🦉", bg: "from-emerald-400 to-cyan-500", style: "aurora" },
  { emoji: "🦉", bg: "from-orange-400 to-rose-500", style: "ember" },
  { emoji: "🦉", bg: "from-violet-500 to-fuchsia-400", style: "nebula" },
  { emoji: "🦉", bg: "from-teal-500 to-lime-400", style: "zen" },
  { emoji: "🦉", bg: "from-blue-500 to-indigo-400", style: "depth" },
  { emoji: "🦉", bg: "from-pink-500 to-rose-400", style: "bloom2" },
  { emoji: "🦉", bg: "from-green-400 to-teal-500", style: "grove" },
  { emoji: "🦉", bg: "from-amber-400 to-yellow-300", style: "honey" },
  { emoji: "🦉", bg: "from-red-400 to-orange-400", style: "fire" },
  { emoji: "🦉", bg: "from-cyan-500 to-teal-400", style: "glacier" },
  { emoji: "🦉", bg: "from-violet-400 to-rose-400", style: "dusk" },
  { emoji: "🦉", bg: "from-emerald-500 to-green-400", style: "sage" },
];

const sizeClasses = {
  sm: "w-12 h-12 text-2xl",
  md: "w-16 h-16 text-3xl",
  lg: "w-24 h-24 text-5xl",
  xl: "w-32 h-32 text-6xl",
};

export default function OwlAvatar({
  avatarId,
  name,
  role,
  size = "lg",
  animated = true,
  selected = false,
  onClick,
}: OwlAvatarProps) {
  const style = owlStyles[avatarId % owlStyles.length];

  return (
    <div
      className={`flex flex-col items-center gap-2 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          bg-gradient-to-br ${style.bg}
          flex items-center justify-center
          ${animated ? "animate-float" : ""}
          ${selected ? "ring-4 ring-yellow-300 ring-offset-2" : ""}
          ${onClick ? "hover:scale-105 transition-transform" : ""}
          shadow-lg
        `}
      >
        <span className="filter drop-shadow-sm">{style.emoji}</span>
      </div>
      {name && (
        <div className="text-center">
          <p className="font-semibold text-gray-900">{name}</p>
          {role && <p className="text-sm text-gray-500">{role}</p>}
        </div>
      )}
    </div>
  );
}

export function OwlAvatarPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 p-4 max-h-64 overflow-y-auto">
      {owlStyles.slice(0, 12).map((_, index) => (
        <OwlAvatar
          key={index}
          avatarId={index}
          size="md"
          animated={false}
          selected={selectedId === index}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
