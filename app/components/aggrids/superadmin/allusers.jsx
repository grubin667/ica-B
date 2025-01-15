"use client";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridAllUsers(props) {

  return (

    <div className="ag-theme-quartz" style={{ height: 300, width: 1012 }}>
      <AgGridReact rowData={props.rowDataAllUsers} columnDefs={props.colDefsAllUsers}
      />
    </div>
  );
}
