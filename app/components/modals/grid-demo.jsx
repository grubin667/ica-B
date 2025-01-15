"use strict";

import { Button, Modal } from "flowbite-react"
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  StrictMode,
} from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { LicenseManager } from "ag-grid-enterprise";
const lk = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY;
LicenseManager.setLicenseKey(lk);

export default function GridDemoModal(props) {

  const DetailCellRenderer = () => <h1 style={{ padding: '20px' }}>My Custom Detail</h1>;

  const GridExample = () => {
    const containerStyle = useMemo(() => ({ width: 1000, height: 610 }), []);
    const gridStyle = useMemo(() => ({ height: 1000, width: 610 }), []);
    const [rowData, setRowData] = useState([]);
    const detailCellRenderer = useCallback(DetailCellRenderer, []);
    const [columnDefs, setColumnDefs] = useState([
      // group cell renderer needed for expand / collapse icons
      { field: "name", cellRenderer: "agGroupCellRenderer" },
      { field: "account" },
      { field: "calls" },
      { field: "minutes", valueFormatter: "x.toLocaleString() + 'm'" },
    ]);
    const defaultColDef = useMemo(() => {
      return {
        flex: 1,
      };
    }, []);

    const onGridReady = useCallback((params) => {
      fetch("https://www.ag-grid.com/example-assets/master-detail-data.json")
        .then((resp) => resp.json())
        .then((data) => {
          console.log(`Setting ${data.length} rows`);
          setRowData(data);
        });
    }, []);

    const onFirstDataRendered = useCallback((params) => {
      params.api.forEachNode(function (node) {
        node.setExpanded(node.id === "1");
      });
    }, []);

    return (
      <div style={containerStyle}>
        <div
          style={gridStyle}
          className={
            "ag-theme-quartz"
          }
        >
          <AgGridReact
            rowData={rowData}
            masterDetail={true}
            detailCellRenderer={detailCellRenderer}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
          />
        </div>
      </div>
    );
  };

  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined)
  }

  return (
    <>
      {/* GRID DEMO */}
      <Modal
        dismissible
        show={props?.openModal?.modalId === "grid-demo"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body>
          <StrictMode>
            <GridExample />
          </StrictMode>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </>
  )
}
