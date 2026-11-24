interface DccMcpBrandProps {
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export default function DccMcpBrand({ size = 20, className = '', showLabel = true }: DccMcpBrandProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/branding/dcc-mcp-desktop-mark.svg"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      {showLabel && <span className="font-semibold tracking-wide">dcc-mcp</span>}
    </div>
  );
}
