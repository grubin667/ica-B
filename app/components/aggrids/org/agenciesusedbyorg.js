"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridAgenciesUsedByOrg(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1520 }}>
      <AgGridReact rowData={props.rowDataAgenciesUsedByOrg} columnDefs={props.colDefsAgenciesUsedByOrg}
      />
    </div>
  );
}
