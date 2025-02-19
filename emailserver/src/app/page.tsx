"use client"

import { useState, useRef, useMemo, useCallback } from 'react';
import useSWR from "swr";
import { useSearchParams } from 'next/navigation'
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { LicenseManager } from "ag-grid-enterprise";

import DetailCellRenderer from "../fromapp/detailCellRenderer";

const initialize = () => {

  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')
  const orgName = searchParams.get('orgName')
  const agencyId = searchParams.get('agencyId') // a single agencyId
  const agencyName = searchParams.get('agencyName')
  const date = searchParams.get('date')
  return { orgId, orgName, agencyId, agencyName, date }
}

// At midnight every night breejob sends emails to each admin user of each active org.
// The emails display a table of the org's agencies. Each row displays the agency name along with
// the number of call recordings processed by the agency on behalf of the org during that day's.
// Each table row also contains a clickable hyperlink to open emailserver's web site, passing in
// these search parameters: orgId, agencyId and date.
// One click opens this site with a grid of all calls processed on date that were uploaded by
// the row's agency on behalf of the email receiver's org.
const Home = () => {

  const searchParams = initialize()
  if (!searchParams.orgId) {
    return <>No params</>
  }

  const lk = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY;
  LicenseManager.setLicenseKey(lk || '');

  const containerStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const detailCellRenderer = useCallback(DetailCellRenderer, []);
  const [rowData, setRowData] = useState([]);
  const initialRef: any = null;
  let gridApiRef = useRef(initialRef);
  const gridRef = useRef();

  // Call API to retrieve ALL results for org (orgId) by agency (agencyId) on date.
  // (If we add more calls to useSWR, give data, error and isLoading aliases, e.g., data: allResultsForOrg, ....)
  const { data, error, isLoading } = useSWR(
    `/api/results?orgId=${searchParams.orgId}&date=${searchParams.date}&agencyIds=${searchParams.agencyId}`
  );
  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>

  // data has the pertinent results for the date requested
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
      getDetailRowData: (params: { successCallback: (arg0: any) => void; data: { callRecords: any; }; }) => {
        params.successCallback(params.data.callRecords);
      },
    };
  }, []);

  const onGridReady = useCallback((params: { api: null; }) => {
    if (!gridApiRef.current) {
      gridApiRef.current = params.api;
    }
  }, []);

  const onRowGroupOpened = (params: { node: { expanded: any; id: any; uiLevel: any; }; api: null; }) => {

    // It's possible, sometime in the future, that we'll want to ensure the just-expanded node
    // and it's child are scrolled into position to be fully visible on the screen.
    // See https://www.ag-grid.com/javascript-grid-tree-data/#expand-collapse-groups-via-api.
    if (params.node.expanded) {
      if (!gridApiRef.current) {
        gridApiRef.current = params.api;
      }
      if (gridApiRef.current !== null) {
        gridApiRef.current.forEachNode(
          (node: { expanded: any; id: any; uiLevel: any; setExpanded: (arg0: boolean) => void; }) => {
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
        <p>Results from {searchParams.date} from Agency {searchParams.agencyName} for Org {searchParams.orgName} </p>
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
