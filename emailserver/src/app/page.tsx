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
  const agencyId = searchParams.get('agencyId')
  const date = searchParams.get('date')
  console.log(`${orgId} ${agencyId} ${date}`)
  return { orgId, agencyId, date }
}

const Home = () => {

  const lk = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY;
  LicenseManager.setLicenseKey(lk || '');

  const containerStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const detailCellRenderer = useCallback(DetailCellRenderer, []);
  const [rowData, setRowData] = useState([]);
  let gridApiRef = useRef(null);
  const gridRef = useRef();

  const searchParams = initialize()
  const pString = `${searchParams.orgId} ${searchParams.agencyId} ${searchParams.date}`
  console.log(pString)

  const {
    data: allResultsForOrg,
    error: allResultsForOrgError,
    isLoading: allResultsForOrgIsLoading,
  } = useSWR(`/api/results?orgId=${searchParams.orgId}`);
  if (!data) {
    return { isLoading: true }
  }

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
    // and it's child are fully visible on the screen.
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
      <section className="mt-48 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold">Welcome to NextJS Starter Jerry2</h1>
        <p>We will be processing {pString}</p>
      </section>

      <section>
        <div className="overflow-y-auto h-full">
          <>
            {/* <div className="flex flex-row justify-between">
                      <span className="ml-4 font-bold">
                        {numResultsFilteredOutRef.current > 0
                          ? `Viewing: ${allResultsForOrg.rslts.length -
                          numResultsFilteredOutRef.current
                          } transaction(s); not showing due to filtering: ${numResultsFilteredOutRef.current
                          }`
                          : `Viewing: ${allResultsForOrg.rslts.length} transaction(s); not showing due to filtering: 0`
                        }
                      </span>
                    </div> */}
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
