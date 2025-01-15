"use client";

import { useState, useContext, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

export default function AgGridUploadsPreUpload(props) {

  const gridRef = useRef()

  return (

    <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={props.rowDataUploadsPreUpload}
        columnDefs={props.colDefsUploadsPreUpload}
        rowSelection={"multiple"}
        headerHeight={21}
        rowHeight={18}
      />
    </div>
  );
}
