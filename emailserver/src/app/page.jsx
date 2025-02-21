"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import useSWR from "swr";
import { useSearchParams } from 'next/navigation'
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { LicenseManager } from "ag-grid-enterprise";
import DetailCellRenderer from "../fromapp/detailCellRenderer";

// At midnight every night breejob sends emails to each admin user of each active org.
// The emails display a table of the org's agencies. Each row displays the agency name along with
// the number of call recordings processed by the agency on behalf of the org during that day.
// Each table row also contains a clickable hyperlink to open the emailserver web site, passing in
// these search parameters: orgId, agencyId and date.
// One click opens this site with a grid of all calls on date that were uploaded by
// that agency on behalf of the email receiver's org.
const Home = () => {

  useEffect(() => {

  }, [])

  let searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')
  if (!orgId) {
    return <>No params</>
  }
  const orgName = searchParams.get('orgName')
  const agencyId = searchParams.get('agencyId') // a single agencyId
  const agencyName = searchParams.get('agencyName')
  const date = searchParams.get('date')
  const urlParams = { orgId, orgName, agencyId, agencyName, date }

  const lk = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY;
  LicenseManager.setLicenseKey(lk || '');

  const containerStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const detailCellRenderer = useCallback(DetailCellRenderer, []);
  const [rowData, setRowData] = useState([]);
  const initialRef = null;
  let gridApiRef = useRef(initialRef);
  const gridRef = useRef();

  // Call API to retrieve ALL results for org (orgId) by agency (agencyId) on date.
  // (If we add more calls to useSWR, give data, error and isLoading aliases, e.g., data: allResultsForOrg, ....)
  const { data, error, isLoading } = useSWR( `/api/results?orgId=${urlParams.orgId}&date=${urlParams.date}&agencyIds=${urlParams.agencyId}` );
  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>

  // const data: any[] = []
  // data has the pertinent results for the date requested
  //
  // THE STATEMENT ON THE NEXT LINE CAUSES AN INFINITE LOOP
  //
  if (typeof data === "undefined") return <>bah</>
  return <>no bah</>
  if (data.length !== rowData.length) 
    setRowData(data);

  const [columnDefs, setColumnDefs] = useState([
    { field: "date", cellRenderer: "agGroupCellRenderer" },
    {
      field: "transcription",
      width: 430,
      flex: 1,
      resizable: true,
      sortable: false,
      cellStyle: {
        wordBreak: "normal",
        // lineHeight: "unset",
      },
    },
    { field: "model", width: 140 },
    { field: "grade", width: 80 },
    { field: "positive", width: 80 },
    { field: "negative", width: 80 },
    { field: "required", width: 80 },
    { field: "combined", width: 80 },
  ]);
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
    };
  }, []);

  const detailCellRendererParams = useMemo(() => {
    return {
      detailGridOptions: {
        myOwnParam: 1,
        columnDefs: [
          { field: "callId" },
          { field: "direction" },
          { field: "number", minWidth: 150 },
          { field: "duration", valueFormatter: "x.toLocaleString() + 's'" },
          { field: "switchCode", minWidth: 150 },
        ],
        defaultColDef: {
          flex: 1,
        },
      },
      getDetailRowData: params => {
        params.successCallback(params.data.callRecords);
      },
    };
  }, []);

  const onGridReady = useCallback((params) => {

    if (!gridApiRef.current) {
      gridApiRef.current = params.api;
    }
  }, []);

  const onRowGroupOpened = (params ) => {

    // It's possible, sometime in the future, that we'll want to ensure the just-expanded node
    // and it's child are scrolled into position to be fully visible on the screen.
    // See https://www.ag-grid.com/javascript-grid-tree-data/#expand-collapse-groups-via-api.
    if (params.node.expanded) {
      if (!gridApiRef.current) {
        gridApiRef.current = params.api;
      }
      if (gridApiRef.current !== null) {
        gridApiRef.current.forEachNode(
          (node) => {
            if (node.expanded && node.id !== params.node.id && node.uiLevel === params.node.uiLevel) {
              node.setExpanded(false);
            }
          }
        )
      }
    }
  }

  return (
    <>
      <section className="mt-2 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold mb-2">Jerry&apos;s Next Big Thing</h1>
        <p>Results from {urlParams.date} from Agency {urlParams.agencyName} for Org {urlParams.orgName} </p>
      </section>

      <section>
        <div className="overflow-y-auto h-full mt-1">
          <>
            <div style={containerStyle}>
              <div style={gridStyle} className={"ag-theme-quartz"}>
                <AgGridReact
                  ref={gridRef}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  masterDetail={true}
                  detailCellRenderer={detailCellRenderer}
                  detailCellRendererParams={detailCellRendererParams}
                  detailRowHeight={220}
                  onGridReady={onGridReady}
                  onRowGroupOpened={onRowGroupOpened}
                  reactiveCustomComponents={true}
                />
              </div>
            </div>
          </>
        </div>

      </section>
    </>
  );
};

export default Home;
