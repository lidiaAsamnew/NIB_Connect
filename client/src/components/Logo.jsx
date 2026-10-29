import { logoMark, logoMarkWhite } from "../assets";

export default function Logo({ light = false, subtitle = true, size = 40 }) {
  return (
    <div className="flex items-center gap-2">
      <img src={light ? logoMarkWhite : logoMark} alt="" width={size} height={size} />
      <div className={`leading-tight ${light ? "text-white" : "text-forest"}`}>
        <div className="text-lg font-bold">NIB-Connect</div>
        {subtitle && <div className="text-xs font-medium">Beneficiary Gateway</div>}
      </div>
    </div>
  );
}
