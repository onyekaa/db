import React, {useState, useCallback, useRef } from 'react';
import './App.css';
import {
	ColDef,
	ColGroupDef,
	GridReadyEvent,
	RowSelectedEvent,
	ValueFormatterParams,
} from "ag-grid-community";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "./ony-theme.css";

const App = () => {

	const apiURL = 'https://restcountries.com/v3.1/all?fields=name,flag,population,languages,currencies';
	const gridRef = useRef<AgGridReact>(null);

	// Row Data: The data to be displayed.
	const [rowData, setRowData] = useState<any[]>([]);
	// let selectedNodes = gridRef?..getSelectedNodes();
	const [summary, setSummary] = useState({})
	// Column Definitions
	const [colDefs, setColumnDefs] =  useState<
			(ColDef<any, any> | ColGroupDef<any>)[]
		>([
			{
				field: "flag",
				width: 50,
				sortable: false,
				headerName: '',
				cellStyle: {fontSize: '20px'}
			},
			{
				field: "name",
				sort: "asc",
				cellRenderer: "agGroupCellRenderer"
			},
			{
				field: "population",
				valueFormatter: (p:ValueFormatterParams) => p.value.toLocaleString(),
			},
			{
				field: "languages",
				flex: 1
			},
			{
				field: "currencies",
				flex: 1,
				valueFormatter: (p: ValueFormatterParams) => {
					let currencies = Object.values(p.node?.data?.currency);
					// @ts-ignore
					return currencies.map(c => c.name).join(', ')
				}
			}
		]);

	const getSelectedRowData =  useCallback((event: RowSelectedEvent) => {
		let selectedData = gridRef.current!.api.getSelectedRows();
		setSummary(selectedData[0]);
	}, []);

	const onFilterTextBoxChanged = useCallback(() => {
		gridRef.current!.api.setGridOption(
		  "quickFilterText",
		  (document.getElementById("filter-text-box") as HTMLInputElement).value,
		);
	  }, []);


	const ready = useCallback((params: GridReadyEvent) => {
		fetch(apiURL)
			.then((resp) => resp.json())
			.then((data) => {
				setRowData(data.map(
					country => ({
						'name': country.name.common,
						'flag': country.flag,
						'languages': Object.values(country.languages).join(', '),
						'population': country.population,
						'currency': Object.values(country.currencies),
					})
				));
			});
	}, []);


	return (
		<div style={{ width: "100%", height: "100%" }}>
			<div
				style={{ width: "100%", height: "70vh", padding: "20px"}}
				className="ag-theme-custom"
			>
				<h1>Country Information</h1>
				<h3>For viewing and sorting country info.</h3>
				<p>
					<a href="http://github.com/onyekaa/countries-grid">View source on Github</a>
				</p>
				<hr className="divider"/>
				<div className="search">
					<label htmlFor='filter-text-box'>Search
						<input
							type="text"
							id="filter-text-box"
							placeholder="Start typing..."
							onInput={onFilterTextBoxChanged}
							className='search-box'
						/>
					</label>
				</div>

				{ (Object.keys(summary).length) ?
					<div className="selected">
						You selected:
						<p>
							<strong>{summary['name']} </strong> {summary['flag']}, with a population of <strong>{summary['population']?.toLocaleString()}</strong> that speak the following language(s): {summary['languages']}.
						</p>
					</div>: ''}
				<AgGridReact
					ref={gridRef}
					pagination={true}
					paginationPageSize={15}
					rowSelection="single"
					enableCellTextSelection={true}
					onRowSelected={getSelectedRowData}
					onSelectionChanged={getSelectedRowData}
					rowData={rowData} columnDefs={colDefs} onGridReady={ready}/>
			</div>
		</div>
	);
}

export default App;
