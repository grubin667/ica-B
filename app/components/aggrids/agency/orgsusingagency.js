"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridOrgsUsingAgency(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1050 }}>
      <AgGridReact rowData={props.rowDataOrgsUsingAgency} columnDefs={props.colDefsOrgsUsingAgency}
      />
    </div>
  );
}
