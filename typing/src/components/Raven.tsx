type RavenProps = {
  className?: string
  stare?: boolean
  label?: string
}

export function Raven({ className = '', stare = false, label }: RavenProps) {
  return (
    <svg
      className={`raven ${stare ? 'is-staring' : ''} ${className}`}
      viewBox="0 0 120 120"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="raven-body">
        <path className="raven-tail" d="M43 91 25 114 53 103 62 118 70 96Z" />
        <ellipse cx="60" cy="76" rx="30" ry="33" />
        <path className="raven-wing" d="M57 55Q19 66 40 98q19-5 31-31Z" />
      </g>
      <g className="raven-head">
        <circle cx="73" cy="40" r="24" />
        <path className="raven-brow" d="M68 28q14-7 23 3-13-3-22 3Z" />
        <path className="raven-beak" d="m91 38 28 9-29 7Z" />
        <circle className="raven-eye" cx="82" cy="38" r="3.6" />
      </g>
      <path className="raven-legs" d="M51 99v11m21-13v13m-29 1h18m2 0h19" />
    </svg>
  )
}
