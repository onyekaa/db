import React, {useState, useCallback, useRef } from 'react';
import './App.css';
import {
	ColDef,
	ColGroupDef,
	FirstDataRenderedEvent,
	GridReadyEvent,
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
	const [summary, setSummary] = useState({});
	const [likeCount, setLikeCount] = useState(0);

	// Column Definitions
	const [colDefs, setColumnDefs] =  useState<
			(ColDef<any, any> | ColGroupDef<any>)[]
		>([
			{
				field: "flag",
				width: 70,
				sortable: false,
				headerName: '',
				cellStyle: {fontSize: '20px'},
				checkboxSelection: true,
			},
			{
				field: "name",
				sort: "asc",
				cellRenderer: "agGroupCellRenderer",
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

	const getSelectedRowData =  useCallback((event) => {
		let selectedData = event.data;

		if (event.type === 'cellDoubleClicked') { // display more info about the row if it was double clicked
			setSummary(selectedData);
		}

		let length = gridRef.current!.api.getSelectedRows().length;
		setLikeCount(length);
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
			})
			.catch(response => console.log(response));
	}, []);

	const onFirstDataRendered = useCallback(
		(params: FirstDataRenderedEvent) => {
			const nodesToSelect = [];
			let existing = localStorage.getItem('ag-cache');

			if (existing !== "undefined" && existing?.length) {
				let parsed = JSON.parse(existing);

				params.api.forEachNode((node) => {
					parsed.forEach(item => {
						if ( item.name === node.data.name) {
							// @ts-ignore
							nodesToSelect.push(node);
						}
					})
				});
			}
			setLikeCount(nodesToSelect.length);
			params.api.setNodesSelected({ nodes: nodesToSelect, newValue: true });
		},
		[],
	  );

	const savetoLocalStorage = () => {
		let selectedData = gridRef.current!.api.getSelectedRows();
		let cacheStringified = JSON.stringify(selectedData);
		localStorage.setItem("ag-cache", cacheStringified);
	}


	return (
		<div className="App" style={{ width: "100%", height: "100%" }}>
			<div
				style={{ width: "100%", height: "70vh", padding: "20px"}}
				className="ag-theme-custom"
			>
				<h1>Country Information</h1>
				<h3>For viewing and sorting country info.</h3>
				<p>
					<a href="http://github.com/onyekaa/db">View source on Github</a>
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
					<button className="save-faves" onClick={savetoLocalStorage}>
						❤️ Add {likeCount} Selected to Favourites
					</button>
				</div>

				{ (Object.keys(summary).length) ?
					<div className="selected">
						You selected:
						<p>
							<strong>{summary['name']} </strong> {summary['flag']}, with a population of <strong>{summary['population']?.toLocaleString()}</strong> that speak the following language(s): {summary['languages']} and use the following currencies: {summary['currency']}.
						</p>
					</div>: ''}
				<AgGridReact
					ref={gridRef}
					pagination={true}
					paginationPageSize={20}
					onFirstDataRendered={onFirstDataRendered}
					rowSelection="multiple"
					suppressCellFocus={true}
					suppressRowClickSelection={true}
					onCellClicked={getSelectedRowData}
					onSelectionChanged={getSelectedRowData}
					onCellDoubleClicked={getSelectedRowData}
					rowData={rowData} columnDefs={colDefs} onGridReady={ready}/>
			</div>
		</div>
	);
}

export default App;
