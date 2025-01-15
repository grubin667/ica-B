"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridAllUsersInOrg(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1012 }}>
      <AgGridReact rowData={props.rowDataAllUsersInOrg} columnDefs={props.colDefsAllUsersInOrg}
      />
    </div>
  );
}
