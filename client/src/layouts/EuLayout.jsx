import { NavLink, Outlet } from "react-router-dom";
import "../eu.css";

const navigation = [
	{ to: "/eu/dashboard", label: "Overview" },
	{ to: "/eu/weekly-allocation-stream", label: "Weekly allocation" },
	{ to: "/eu/sector-report", label: "Sector report" },
	{ to: "/eu/region-report", label: "Region report" },
	{ to: "/eu/orders", label: "Orders" },
	{ to: "/eu/vouchers", label: "Vouchers" },
	{ to: "/eu/escrow-transactions", label: "Escrow transactions" },
];

export default function EuLayout() {
	return (
		<div className="eu-shell">
			<header className="eu-topbar">
				<NavLink className="eu-brand" to="/eu/dashboard">
					<span className="eu-brand-mark" aria-hidden="true">N</span>
					<span>NIB Connect <small>EU COMPLIANCE</small></span>
				</NavLink>
				<nav className="eu-navigation" aria-label="EU compliance navigation">
					{navigation.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) => `eu-nav-link${isActive ? " is-active" : ""}`}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</header>

			<main className="eu-main">
				<Outlet />
			</main>
		</div>
	);
}
