"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridAllOrgs(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1403 }}>
      <AgGridReact rowData={props.rowDataAllOrgs} columnDefs={props.colDefsAllOrgs}
      />
    </div>
  );
}
