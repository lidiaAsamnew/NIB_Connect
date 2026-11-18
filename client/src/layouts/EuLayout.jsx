import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import DateRangeFilter from "../components/eu/DateRangeFilter.jsx";
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
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [sector, setSector] = useState("");
	const [region, setRegion] = useState("");

	const handleStartDateChange = (event) => {
		const nextStartDate = event.target.value;

		if (nextStartDate && endDate && nextStartDate > endDate) {
			setEndDate("");
		}

		setStartDate(nextStartDate);
	};

	const handleEndDateChange = (event) => {
		const nextEndDate = event.target.value;

		if (!nextEndDate || !startDate || nextEndDate >= startDate) {
			setEndDate(nextEndDate);
		}
	};

	const clearFilters = () => {
		setStartDate("");
		setEndDate("");
		setSector("");
		setRegion("");
	};

	return (
		<div className="eu-shell">
			<nav className="eu-topbar" aria-label="Primary navigation">
				<NavLink className="eu-brand" to="/eu/dashboard">
					<span className="eu-brand-mark" aria-hidden="true">N</span>
					<span>NIB Connect <small>EU COMPLIANCE</small></span>
				</NavLink>
				<div className="eu-topbar-actions">
					<span
						className="eu-role-badge"
						style={{
							padding: "7px 10px",
							color: "#173a42",
							background: "#b7dc84",
							border: "1px solid #cfe6a8",
							borderRadius: "999px",
							fontSize: "12px",
							fontWeight: 700,
							whiteSpace: "nowrap",
						}}
					>
						EU Compliance Officer
					</span>
					<span className="eu-topbar-context">Compliance reporting</span>
				</div>
			</nav>

			<div className="eu-workspace">
				<aside className="eu-sidebar">
					<p className="eu-sidebar-label">Reports</p>
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
				</aside>

				<main className="eu-main">
					<DateRangeFilter
						startDate={startDate}
						endDate={endDate}
						sector={sector}
						region={region}
						onStartDateChange={handleStartDateChange}
						onEndDateChange={handleEndDateChange}
						setSector={setSector}
						setRegion={setRegion}
						onClear={clearFilters}
					/>
					<Outlet
						context={{
							startDate,
							endDate,
							sector: sector.trim(),
							region: region.trim(),
							setStartDate,
							setEndDate,
							setSector,
							setRegion,
						}}
					/>
				</main>
			</div>
		</div>
	);
}
