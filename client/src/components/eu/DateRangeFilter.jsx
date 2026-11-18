export default function DateRangeFilter({
	startDate,
	endDate,
	sector,
	region,
	onStartDateChange,
	onEndDateChange,
	setSector,
	setRegion,
	onClear,
}) {
	return (
		<section className="eu-date-filter" aria-label="Report date range">
			<div className="eu-date-filter-fields">
				<div className="eu-date-filter-field">
					<label htmlFor="eu-start-date">Start Date</label>
					<input
						id="eu-start-date"
						type="date"
						value={startDate}
						onChange={onStartDateChange}
					/>
				</div>
				<div className="eu-date-filter-field">
					<label htmlFor="eu-end-date">End Date</label>
					<input
						id="eu-end-date"
						type="date"
						value={endDate}
						min={startDate || undefined}
						onChange={onEndDateChange}
					/>
				</div>
				<div className="eu-date-filter-field">
					<label htmlFor="eu-sector-filter">Sector</label>
					<input
						id="eu-sector-filter"
						type="text"
						value={sector}
						onChange={(event) => setSector(event.target.value)}
					/>
				</div>
				<div className="eu-date-filter-field">
					<label htmlFor="eu-region-filter">Region</label>
					<input
						id="eu-region-filter"
						type="text"
						value={region}
						onChange={(event) => setRegion(event.target.value)}
					/>
				</div>
			</div>
			<button className="eu-date-filter-clear" type="button" onClick={onClear}>
				Clear Filters
			</button>
		</section>
	);
}
