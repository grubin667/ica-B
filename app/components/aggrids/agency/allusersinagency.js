"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridAllUsersInAgency(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1010 }}>
      <AgGridReact rowData={props.rowDataAllUsersInAgency} columnDefs={props.colDefsAllUsersInAgency}
      />
    </div>
  );
}
