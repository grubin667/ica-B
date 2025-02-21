"use client";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  StrictMode,
} from "react";
import { Modal, Button, Accordion } from "flowbite-react";
import useSWR from "swr";
import {
  endOfDay,
  format,
  formatISO,
  interval,
  isBefore,
  isWithinInterval,
  parse,
  parseISO,
  startOfDay,
  toDate,
} from "date-fns";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme

import { LicenseManager } from "ag-grid-enterprise";
const lk = process.env.NEXT_PUBLIC_AGGRID_LICENSE_KEY;
LicenseManager.setLicenseKey(lk);

import DetailCellRenderer from "../aggrids/results/detailCellRenderer";

// ExploreScoringModal is triggered when the user clicks the Explore scoring results button beneath the Agencies Used by Org
// grid (called AgGridAgenciesUsedByOrg) in OrgCommon.
// explore-scoring fetches all results for role.orgId across all its agencies into allResultsForOrg,
// and it holds that unfiltered array.
export default function ExploreScoringModal(props) {
  const containerStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: 610 }), []);
  const detailCellRenderer = useCallback(DetailCellRenderer, []);
  const [rowData, setRowData] = useState([]);
  let gridApiRef = useRef(null);

  const initialFiltersRef = useRef({
    agencies: { all: new Array(), sel: new Array() },
    dates: { from: "", thru: "" },
    models: { all: new Array(), sel: new Array() },
    quintiles: [false, false, false, false, false],
    positive: { operator: "", operand: null },
    negative: { operator: "", operand: null },
    required: { operator: "", operand: null },
    combined: { operator: "", operand: null },
  });

  const allResultsForOrgFilteredRef = useRef([]);

  // The following is to avoid causing an exception when using xxx = useRef(null);
  // We declare currentFiltersRef the normal way (... = useRef(null)), but we call
  // getCurrentFilters() before using currentFiltersRef.current. getCurrentFilters()
  // returns currentFiltersRef
  const currentFiltersRef = useRef(null);
  const getCurrentFilters = () => {
    if (currentFiltersRef.current !== null) {
      return currentFiltersRef.current;
    }
    const currentFilters = initialFiltersRef.current;
    currentFiltersRef.current = currentFilters;
    return currentFilters;
  }
  const setCurrentFilters = (newFilters) => {
    currentFiltersRef.current = newFilters;
  }

  const numResultsFilteredOutRef = useRef(0);
  const agencyNamesSetRef = useRef(null);
  const modelNamesSetRef = useRef(null);

  const gridRef = useRef();
  const role = props.role;

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
      getDetailRowData: (params) => {
        params.successCallback(params.data.callRecords);
      },
    };
  }, []);

  const onGridReady = useCallback((params) => {
    if (!gridApiRef.current) {
      gridApiRef.current = params.api;
    }
  }, []);

  const onRowGroupOpened = (params) => {
    // It's possible, sometime in the future, that we'll want to ensure the just-expanded node
    // and it's child are fully visible in the browser.
    // See https://www.ag-grid.com/javascript-grid-tree-data/#expand-collapse-groups-via-api.
    if (params.node.expanded) {
      if (!gridApiRef.current) {
        gridApiRef.current = params.api;
      }
      gridApiRef.current.forEachNode(
        (node) => {
          if (node.expanded && node.id !== params.node.id && node.uiLevel === params.node.uiLevel) {
            node.setExpanded(false);
          }
        }
      )
    }
  }

  /////////////////////////////////////////////////////////////////////
  // init methods that need to be declared before their use
  /////////////////////////////////////////////////////////////////////

  const {
    data: allResultsForOrg,
    error: allResultsForOrgError,
    isLoading: allResultsForOrgIsLoading,
  } = useSWR(role.orgId.length > 0 ? `/api/results?orgId=${role.orgId}` : []);
  
  const {
    data: agenciesInOrg,
    error: agenciesInOrgError,
    isLoading: agenciesInOrgIsLoading,
  } = useSWR(`/api/agencies?oid=${role.orgId}`);

  const setUpAgencyNamesSetRef = () => {
    if (agencyNamesSetRef.current === null) {
      // Loop through agenciesInOrg and set agencyNamesSetRef.current.
      agencyNamesSetRef.current = new Set();
      agenciesInOrg?.agencies?.forEach((a) => {
        agencyNamesSetRef.current.add(a.name);
      });
    }
  };

  const [positiveMin, setPositiveMin] = useState(0);
  const [positiveMax, setPositiveMax] = useState(9999);
  const [positiveVal, setPositiveVal] = useState(null);
  const [posRadioChecked, setPosRadioChecked] = useState("");
  const [negativeMin, setNegativeMin] = useState(0);
  const [negativeMax, setNegativeMax] = useState(9999);
  const [negativeVal, setNegativeVal] = useState(null);
  const [negRadioChecked, setNegRadioChecked] = useState("");
  const [requiredMin, setRequiredMin] = useState(0);
  const [requiredMax, setRequiredMax] = useState(9999);
  const [requiredVal, setRequiredVal] = useState(null);
  const [reqRadioChecked, setReqRadioChecked] = useState("");
  const [combinedMin, setCombinedMin] = useState(0);
  const [combinedMax, setCombinedMax] = useState(9999);
  const [combinedVal, setCombinedVal] = useState(null);
  const [comRadioChecked, setComRadioChecked] = useState("");

  // To force a rerender do this:
  //    setStateToForceRerender({ ...stateToForceRerender })
  // Why? We use refs all over the place. This means it doesn't always rerender
  // when you need it to.
  const [stateToForceRerender, setStateToForceRerender] = useState({
    setting: 1,
  });

  const filterRowInOrOut = (cols) => {

    const currentFiltersHoldingVariable = getCurrentFilters();



    // if (
    //   (currentFiltersRef.current === null) || (typeof currentFiltersRef.current === "undefined")
    // ) {
    //   currentFiltersRef.current = initialFiltersRef.current;
    // }


    // If currentFiltersRef.current is not null or undefined,




    // don't stay if not ready - tests may not be needed
    // if (Object.keys(currentFiltersRef.current).length === 0) return false
    
    // Check all 8 props of currentFiltersRef against initialFiltersRef. If all 8 are the same,
    // return false. If any one has changed from initial..., we'll continue on to the tests.
    // if (all of currentFiltersRef.current still look like initialFiltersRef.current) return false
    // and skip testing.
    // if (currentFiltersRef.current.agencies.all.length() > 0)

    // currentFiltersRef is an object with filtering conditions set for up to 8 different tests.
    // We will look at each, in turn. If it's not set, we move on to the next.
    // If we get through them all, we return true - display result cols in the grid.
    // If any fails, we return false--right there--and the row is excluded.

    // dates

    // transcriptionDatetime is kept in the DB as a text string. We inserted a text representation
    // of an ISO 8601 datetime. parseISO will.... Result may be in UTC or in local time. We don't care.
    const tdate = parseISO(cols.transcriptionDatetime);

    let numDatesSet =
      (currentFiltersHoldingVariable.dates.from.length > 0 ? 1 : 0) +
      (currentFiltersHoldingVariable.dates.thru.length > 0 ? 1 : 0);

    let interval;
    let intervalIsEmpty = true;
    let from = currentFiltersHoldingVariable.dates?.from;
    let thru = currentFiltersHoldingVariable.dates?.thru;

    if (numDatesSet === 1) {
      let d, d1, d2;
      if (from.length > 0) {
        d = parseISO(from);
      } else {
        d = parseISO(thru);
      }
      d1 = startOfDay(d);
      d2 = endOfDay(d);
      interval = { start: d1, end: d2 };
      intervalIsEmpty = false;
    } else if (numDatesSet === 2) {
      let d, d1, d2;
      d1 = parseISO(from);
      d2 = parseISO(thru);
      if (isBefore(d2, d1)) {
        d = d1;
        d1 = d2;
        d2 = d;
      }
      d1 = startOfDay(d1);
      d2 = endOfDay(d2);
      interval = { start: d1, end: d2 };
      intervalIsEmpty = false;
    }
    // 0 falls thru leaving intervalIsEmpty set to true

    if (!intervalIsEmpty) {
      if (!isWithinInterval(tdate, interval)) {
        return false;
      }
    }

    // agencies
    if (currentFiltersHoldingVariable.agencies?.all.length > 0) {
      // we want to disqualify result in cols if:
      //   - the sel corresponding to the all item that = cols.agencyName.name is false and
      //     at least 1 of the sels is true

      const anySelsTrue = currentFiltersHoldingVariable.agencies.sel.some((b) => b);
      const agIndex = currentFiltersHoldingVariable.agencies.all.indexOf(
        cols.agencyName.name
      );
      if (anySelsTrue && !currentFiltersHoldingVariable.agencies.sel[agIndex]) {
        return false;
      }
    }

    // models
    if (currentFiltersHoldingVariable.models?.all.length > 0) {
      // we want to disqualify result in cols if:
      //   - the sel corresponding to the all item that = cols.model.name is false and
      //     at least 1 of the sels is true

      const anySelsTrue = currentFiltersHoldingVariable.models.sel.some((b) => b);
      const moIndex = currentFiltersHoldingVariable.models.all.indexOf(
        cols.model.name
      );
      if (anySelsTrue && !currentFiltersHoldingVariable.models.sel[moIndex]) {
        return false;
      }
    }

    // quintiles
    let sometest = currentFiltersHoldingVariable.quintiles?.some((q) => q);
    if (sometest) {
      let lookfor = [];
      for (let i = 0; i < 5; i++) {
        if (currentFiltersHoldingVariable.quintiles[i]) {
          lookfor.push("ABCDE".substring(i, i + 1));
        }
      }
      if (!lookfor.includes(cols.letterGrade)) {
        return false;
      }
    }

    // positive
    let ret = true;
    if (
      currentFiltersHoldingVariable.positive?.operator.length > 0 &&
      currentFiltersHoldingVariable.positive.operand !== null
    ) {
      // compare against cols.norm.positive
      switch (currentFiltersHoldingVariable.positive.operator) {
        case "<":
          if (
            cols.norm.positive >
            parseFloat(currentFiltersHoldingVariable.positive.operand)
          ) {
            ret = false;
          }
          break;
        case ">":
          if (
            cols.norm.positive <
            parseFloat(currentFiltersHoldingVariable.positive.operand)
          ) {
            ret = false;
          }
          break;
      }
      if (ret === false) {
        return false;
      }
    }

    // negative
    if (
      currentFiltersHoldingVariable.negative?.operator.length > 0 &&
      currentFiltersHoldingVariable.negative.operand !== null
    ) {
      // compare against cols.norm.negative
      switch (currentFiltersHoldingVariable.negative.operator) {
        case "<":
          if (
            cols.norm.negative >
            parseFloat(currentFiltersHoldingVariable.negative.operand)
          ) {
            ret = false;
          }
          break;
        case ">":
          if (
            cols.norm.negative <
            parseFloat(currentFiltersHoldingVariable.negative.operand)
          ) {
            ret = false;
          }
          break;
      }
      if (ret === false) {
        return false;
      }
    }

    // required
    if (
      currentFiltersHoldingVariable.required?.operator.length > 0 &&
      currentFiltersHoldingVariable.required.operand !== null
    ) {
      // compare against cols.norm.required
      switch (currentFiltersHoldingVariable.required.operator) {
        case "<":
          if (
            cols.norm.required >
            parseFloat(currentFiltersHoldingVariable.required.operand)
          ) {
            ret = false;
          }
          break;
        case ">":
          if (
            cols.norm.required <
            parseFloat(currentFiltersHoldingVariable.required.operand)
          ) {
            ret = false;
          }
          break;
      }
      if (ret === false) {
        return false;
      }
    }

    // combined
    if (
      currentFiltersHoldingVariable.combined?.operator.length > 0 &&
      currentFiltersHoldingVariable.combined.operand !== null
    ) {
      // compare against cols.normCombined
      switch (currentFiltersHoldingVariable.combined.operator) {
        case "<":
          if (
            cols.normCombined >
            parseFloat(currentFiltersHoldingVariable.combined.operand)
          ) {
            ret = false;
          }
          break;
        case ">":
          if (
            cols.normCombined <
            parseFloat(currentFiltersHoldingVariable.combined.operand)
          ) {
            ret = false;
          }
          break;
      }
    }
    if (ret === false) {
      return false;
    }
    return true;
  };

  const setFilters = useCallback(
    (newFilters) => {
      // console.log(
      //   `top of setFilters - setting currentFiltersHoldingVariable = ${JSON.stringify(
      //     newFilters
      //   )}`
      // );
      // currentFiltersHoldingVariable = newFilters;
      setCurrentFilters(newFilters);

      // if (Object.keys(newFilters).length === 0) return

      // setFilters does most of the heavy lifting in explore-scoring.
      // It is called first time through with newFilters param set to initialFiltersRef.current.
      // Then it is called whenever the user makes a change to one of the 8 filters in component ResultsFiltering.
      // Here's what setFilters does:
      // 1. We replace currentFiltersHoldingVariable with newFilters.
      // 2. Refilter allResultsForOrg into allResultsForOrgFilteredRef.current to be passed into AgGridFilteredResults
      //    for rendering.

      const shittilyRemoveTheT = (dt) => {
        return dt.replace("T", " ").replace("Z", "").substring(0, 16);
      };
      const formatBetter = (item) => {
        const t = typeof item;
        if (t === "string") {
          return shittilyRemoveTheT(item);
        } else if (t === "number") {
          return item.toFixed(3);
        }
      };

      // Now filter the full set of results for the org based on currentFiltersRef.current by
      // calling filterRowInOrOut for each result row.

      if (allResultsForOrg?.rslts.length > 0) {
        const holdFilteredRows = [];

        allResultsForOrg.rslts.flatMap((re, index) => {
          if (index === 0) {
            numResultsFilteredOutRef.current = 0;
          }
          const rp = JSON.parse(re.otherScoreInfo);
          const inOrOut = filterRowInOrOut({ ...re, ...rp }); // false means out (i.e., skip)

          if (!inOrOut) {
            numResultsFilteredOutRef.current++;
            return [];
          }

          let scores = JSON.parse(re.otherScoreInfo);
          holdFilteredRows.push({
            ...re,
            agency: {
              id: re.agencyId,
              name: re.agencyName.name,
            },
            date: formatBetter(re.transcriptionDatetime),
            transcription: re.transcription,
            model: re.model.name,
            grade: re.letterGrade,
            positive: formatBetter(scores.norm.positive),
            negative: formatBetter(scores.norm.negative),
            required: formatBetter(scores.norm.required),
            combined: formatBetter(scores.normCombined),
            id: re.id,
            // getRowHeight: Math.random() * 100 + 20,
          });
        });
        // allResultsForOrgFilteredRef.current = [...holdFilteredRows];
        setRowData(holdFilteredRows);

        // all the refs actually inhibit rerendering so we...
        setStateToForceRerender({ ...stateToForceRerender });
      }
    },
    [allResultsForOrg?.rslts, stateToForceRerender]
  );

  const captionNoteCountRef = useRef(null);

  const resetAgencies = () => {
    setUpAgencyNamesSetRef();
    setFilters({
      ...getCurrentFilters(),
      agencies: {
        all: Array.from(agencyNamesSetRef.current),
        sel: Array.from(agencyNamesSetRef.current).fill(false),
      },
    });
    captionNoteCountRef.current = 0;
  };

  const resetModels = () => {
    setFilters({
      ...getCurrentFilters(),
      models: {
        all: Array.from(modelNamesSetRef.current),
        sel: Array.from(modelNamesSetRef.current).fill(false),
      },
    });
    captionNoteCountRef.current = 0;
  };

  const resetQuintiles = () => {
    setFilters({
      ...getCurrentFilters(),
      quintiles: [false, false, false, false, false],
    });
    captionNoteCountRef.current = 0;
    setStateToForceRerender({ ...stateToForceRerender });
  };

  const clearAllFilters = () => {
    setPosRadioChecked("");
    setNegRadioChecked("");
    setReqRadioChecked("");
    setComRadioChecked("");

    setFilters({
      dates: { ...initialFiltersRef.current.dates },
      agencies: {
        all: Array.from(agencyNamesSetRef.current),
        sel: Array.from(agencyNamesSetRef.current).fill(false),
      },
      models: {
        all: Array.from(modelNamesSetRef.current),
        sel: Array.from(modelNamesSetRef.current).fill(false),
      },
      quintiles: [...initialFiltersRef.current.quintiles],
      positive: { ...initialFiltersRef.current.positive },
      negative: { ...initialFiltersRef.current.negative },
      required: { ...initialFiltersRef.current.required },
      combined: { ...initialFiltersRef.current.combined },
    });
  };

  const initializeFiltersFromOrgRslts = () => {
    let posMin = 9999;
    let negMin = 9999;
    let reqMin = 9999;
    let comMin = 9999;
    let posMax = 0;
    let negMax = 0;
    let reqMax = 0;
    let comMax = 0;

    modelNamesSetRef.current = new Set();
    modelNamesSetRef.current.add("[default]");
    // modelNamesSetRef.current.add("Dummy2");
    // modelNamesSetRef.current.add("Dummy3");

    allResultsForOrg?.rslts.forEach((cols) => {
      const osi = JSON.parse(cols.otherScoreInfo);
      posMin = Math.min(posMin, osi.norm.positive);
      posMax = Math.max(posMax, osi.norm.positive);
      negMin = Math.min(negMin, osi.norm.negative);
      negMax = Math.max(negMax, osi.norm.negative);
      reqMin = Math.min(reqMin, osi.norm.required);
      reqMax = Math.max(reqMax, osi.norm.required);
      comMin = Math.min(comMin, osi.normCombined);
      comMax = Math.max(comMax, osi.normCombined);
      modelNamesSetRef.current.add(cols.model.name);
    });

    setUpAgencyNamesSetRef();

    // Use collected mins and maxes and set them into state.
    setPositiveMin(posMin);
    setPositiveMax(posMax);
    setPositiveVal(parseFloat((posMax + posMin) / 2).toFixed(2));

    setNegativeMin(negMin);
    setNegativeMax(negMax);
    setNegativeVal(parseFloat((negMax + negMin) / 2).toFixed(2));

    setRequiredMin(reqMin);
    setRequiredMax(reqMax);
    setRequiredVal(parseFloat((reqMax + reqMin) / 2).toFixed(2));

    setCombinedMin(comMin);
    setCombinedMax(comMax);
    setCombinedVal(parseFloat((comMax + comMin) / 2).toFixed(2));

    // Reset agencies and models. This will take agencyNamesSetRef.current and  modelNamesSetRef.current
    // and call setFilters in explore-scoring to save to currentFiltersRef.current and to refilter into allResultsForOrgFilteredRef.current.
    resetAgencies();
    resetModels();

    //
    clearAllFilters();
  };

  const doFullInitialization = () => {
    setUpAgencyNamesSetRef();
    initializeFiltersFromOrgRslts();
  };

  const initializedRef = useRef(false);
  if (
    initializedRef.current === false &&
    props.openModal?.modalId === "explore-scoring"
  ) {
    initializedRef.current = true;
    doFullInitialization();
  }

  // useEffect(() => {
  //   setFilters(initialFiltersRef.current);
  // }, [setFilters]);

  /* #region filter handling */

  // agencies by name
  //////////////////////////////////////////////////////////////////////////////
  const isAgenciesDisabled = () => {
    // Since we're talking about whether the Reset button is disabled,
    // we will return true (reset is disabled) if every item in currentFiltersRef.current.agencies.sel
    // is false. Any true, returns false (button isn't disabled).
    let sometest = getCurrentFilters().agencies?.sel.some((item) => item);
    return !sometest;
  };
  const acbToggleChange = (position) => {
    const updatedSels = getCurrentFilters().agencies.sel.map(
      (item, index) => (index === position ? !item : item)
    );
    setFilters({
      ...getCurrentFilters(),
      agencies: {
        all: [...getCurrentFilters().agencies.all],
        sel: [...updatedSels],
      },
    });
  };

  // from/thru dates
  //////////////////////////////////////////////////////////////////////////////
  const resetDates = () => {
    setFilters({
      ...getCurrentFilters(),
      dates: { ...initialFiltersRef.current.dates },
    });
    captionNoteCountRef.current = 0;
  };
  const handleFromDateChange = (e) => {
    setFilters({
      ...getCurrentFilters(),
      dates: {
        from: e.target.value,
        thru: getCurrentFilters().dates.thru,
      },
    });
  };
  const handleThruDateChange = (e) => {
    setFilters({
      ...getCurrentFilters(),
      dates: {
        from: getCurrentFilters().dates.from,
        thru: e.target.value,
      },
    });
  };
  const isDatesDisabled = () => {
    // The dates Reset button is disabled if both dates are set = ''.
    if (
      getCurrentFilters().dates?.from.length === 0 &&
      getCurrentFilters().dates?.thru.length === 0
    ) {
      return true;
    }
    return false;
  };

  // models by name
  //////////////////////////////////////////////////////////////////////////////
  const isModelsDisabled = () => {
    // Since we're talking about whether the Reset button is disabled,
    // we will return true (reset is disabled) if every item in getCurrentFilters().models.sel
    // is false. Any true, returns false (button isn't disabled).
    let sometest = getCurrentFilters().models?.sel.some((item) => item);
    return !sometest;
  };
  const mcbToggleChange = (position) => {
    const updatedSels = getCurrentFilters().models.sel.map(
      (item, index) => (index === position ? !item : item)
    );
    setFilters({
      ...getCurrentFilters(),
      models: {
        all: [...getCurrentFilters().models.all],
        sel: [...updatedSels],
      },
    });
  };

  // quintiles/grades
  //////////////////////////////////////////////////////////////////////////////
  const isQuintilesDisabled = () => {
    let sometest = getCurrentFilters().quintiles?.some((q) => q);
    return !sometest;
  };
  const qcbToggleChange = (position) => {
    const updatedCheckedState = getCurrentFilters().quintiles.map(
      (item, index) => (index === position ? !item : item)
    );
    setFilters({
      ...getCurrentFilters(),
      quintiles: [...updatedCheckedState],
    });
  };

  // word score - positive
  //////////////////////////////////////////////////////////////////////////////
  const onPosRadioChange = (e) => {
    let radioValue = e.target.value;
    setPosRadioChecked(radioValue);
    setFilters({
      ...getCurrentFilters(),
      positive: { operator: radioValue, operand: positiveVal },
    });
  };
  const resetPositive = () => {
    setFilters({
      ...getCurrentFilters(),
      positive: { ...initialFiltersRef.current.positive },
    });
    setPositiveVal(((positiveMax + positiveMin) / 2).toFixed(2));
    setPosRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isPositiveDisabled = () => {
    return getCurrentFilters().positive?.operator.length === 0;
  };

  // word score - negative
  //////////////////////////////////////////////////////////////////////////////
  const onNegRadioChange = (e) => {
    let radioValue = e.target.value;
    setNegRadioChecked(radioValue);
    setFilters({
      ...getCurrentFilters(),
      negative: { operator: radioValue, operand: negativeVal },
    });
  };
  const resetNegative = () => {
    setFilters({
      ...getCurrentFilters(),
      negative: { ...initialFiltersRef.current.negative },
    });
    setNegativeVal(((negativeMax + negativeMin) / 2).toFixed(2));
    setNegRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isNegativeDisabled = () => {
    return getCurrentFilters().negative?.operator.length === 0;
  };

  // word score - required
  //////////////////////////////////////////////////////////////////////////////
  const onReqRadioChange = (e) => {
    let radioValue = e.target.value;
    setReqRadioChecked(radioValue);
    setFilters({
      ...getCurrentFilters(),
      required: { operator: radioValue, operand: requiredVal },
    });
  };
  const resetRequired = () => {
    setFilters({
      ...getCurrentFilters(),
      required: { ...initialFiltersRef.current.required },
    });
    setRequiredVal(((requiredMax + requiredMin) / 2).toFixed(2));
    setReqRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isRequiredDisabled = () => {
    return getCurrentFilters().required?.operator.length === 0;
  };

  // word score - combined
  //////////////////////////////////////////////////////////////////////////////
  const onComRadioChange = (e) => {
    let radioValue = e.target.value;
    setComRadioChecked(radioValue);
    setFilters({
      ...getCurrentFilters(),
      combined: { operator: radioValue, operand: combinedVal },
    });
  };
  const resetCombined = () => {
    setFilters({
      ...getCurrentFilters(),
      combined: { ...initialFiltersRef.current.combined },
    });
    setCombinedVal(((combinedMax + combinedMin) / 2).toFixed(2));
    setComRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isCombinedDisabled = () => {
    return getCurrentFilters().combined?.operator.length === 0;
  };

  /* #endregion */

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined);
  };

  // const sendAudioEleToParent = (audioEle) => {
  //   // setAudioEle(audioEle)
  // };

  const isAnyFilterSet = () => {
    // if (
    //   typeof currentFiltersRef === "undefined" ||
    //   Object.keys(currentFiltersRef.current).length === 0
    // )
    //   return false;

    // Being "set" is the same as asking if a filter's Reset button is enabled (or rather
    // is not disabled). So we ask if any of the Reset buttons is not disabled.
    if (
      !isDatesDisabled() ||
      !isAgenciesDisabled() ||
      !isModelsDisabled() ||
      !isQuintilesDisabled() ||
      !isPositiveDisabled() ||
      !isNegativeDisabled() ||
      !isRequiredDisabled() ||
      !isCombinedDisabled()
    ) {
      return true;
    }
    return false;
  };

  if (allResultsForOrgError || agenciesInOrgError) {
    return <div>Error occurred fetching data Y</div>;
  }
  if (allResultsForOrgIsLoading || agenciesInOrgIsLoading) {
    return <div>Loading</div>;
  }

  if (typeof props === "undefined") return <></>;
  if (typeof props.openModal === "undefined") return <></>;
  if (props.openModal.modalId !== "explore-scoring") return <></>;

  return (
    <>
      <StrictMode>
        {/* EXPLORE SCORING */}
        <Modal
          // root={document.body}
          dismissible
          size={"7xl"}
          show={props?.openModal?.modalId === "explore-scoring"}
          onClose={handleCloseModal}
        >
          <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
          <Modal.Body className="text-black">
            <div className="border-2 border-black mt-1 p-2 shadow-xl">
              <div className="flex justify-between items-center">
                <span
                  className="font-bold cursor-pointer mb-2"
                // onClick={() => {
                //   setOpened(false);
                // }}
                >
                  FILTERING
                </span>
                <span className="text-sm">
                  [Filters are applied to Scoring Results as you configure
                  them.]
                </span>
                {isAnyFilterSet() === true && (
                  <Button className="h-5 mb-2" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <Accordion className="w-[1166px]" collapseAll>
                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Agencies
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div className="flex flex-col justify-between items-center">
                            <div className="flex flex-wrap space-x-8">
                              {getCurrentFilters().agencies?.all.map(
                                (an, index) => {
                                  return (
                                    <div key={index}>
                                      <input
                                        type="checkbox"
                                        className="mr-2"
                                        id={`agency-checkbox-${index}`}
                                        name={an}
                                        value={an}
                                        checked={
                                          getCurrentFilters().agencies
                                            .sel[index]
                                        }
                                        onChange={() => acbToggleChange(index)}
                                      />
                                      <label
                                        htmlFor={`agency-checkbox-${index}`}
                                        className="mr-2"
                                      >{`${an}`}</label>
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            <div>
                              (Selecting none is the same as selecting all.)
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isAgenciesDisabled()}
                              onClick={resetAgencies}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      From - Thru
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div className="flex flex-col justify-between">
                            <div className="flex justify-evenly items-center">
                              <input
                                type="date"
                                onChange={handleFromDateChange}
                                value={getCurrentFilters().dates?.from}
                              />
                              <span>&nbsp;-&nbsp;</span>
                              <input
                                type="date"
                                onChange={handleThruDateChange}
                                value={getCurrentFilters().dates?.thru}
                              />
                            </div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              (Use either date to match a single date. Use both
                              for a date range.)
                            </label>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isDatesDisabled()}
                              onClick={resetDates}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Model(s)
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div className="flex flex-col justify-between items-center">
                            <div className="flex flex-wrap space-x-8">
                              {getCurrentFilters().models?.all.map(
                                (an, index) => {
                                  return (
                                    <div key={index}>
                                      <input
                                        type="checkbox"
                                        className="mr-2"
                                        id={`model-checkbox-${index}`}
                                        name={an}
                                        value={an}
                                        checked={
                                          getCurrentFilters().models.sel[
                                          index
                                          ]
                                        }
                                        onChange={() => mcbToggleChange(index)}
                                      />
                                      <label
                                        htmlFor={`model-checkbox-${index}`}
                                        className="mr-2"
                                      >{`${an}`}</label>
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            <div>
                              (Selecting none is the same as selecting all.)
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isModelsDisabled()}
                              onClick={resetModels}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Quintiles
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div className="flex flex-col justify-between">
                            <div className="flex flex-row justify-evenly">
                              {["A", "B", "C", "D", "E"].map((grade, index) => {
                                return (
                                  <div key={index}>
                                    <input
                                      // key={index}
                                      type="checkbox"
                                      className="ml-3 mr-1"
                                      id={`qcb-${index}`}
                                      checked={
                                        getCurrentFilters().quintiles[
                                        index
                                        ]
                                      }
                                      onChange={() => {
                                        qcbToggleChange(index);
                                      }}
                                    />
                                    <label
                                      className="-mt-1"
                                      htmlFor={`qcb-${index}`}
                                    >
                                      {grade}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                              (Selecting none is the same as selecting all.)
                            </label>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isQuintilesDisabled()}
                              onClick={resetQuintiles}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Positive
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div>
                            <div className="flex justify-around">
                              <ul className="items-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-license"
                                      type="radio"
                                      value="<"
                                      name="list-pos"
                                      onChange={onPosRadioChange}
                                      checked={posRadioChecked === "<"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-license"
                                      className="font-extrabold ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &lt;{" "}
                                    </label>
                                  </div>
                                </li>
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-id"
                                      type="radio"
                                      value=">"
                                      name="list-pos"
                                      onChange={onPosRadioChange}
                                      checked={posRadioChecked === ">"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-id"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &gt;{" "}
                                    </label>
                                  </div>
                                </li>
                              </ul>
                              <span className="self-center bg-teal-500 text-white font-bold p-1 ml-4">
                                {positiveVal}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={positiveMin}
                              max={positiveMax}
                              step="0.01"
                              value={positiveVal}
                              onChange={(e) => {
                                let x = parseFloat(
                                  e.currentTarget.value
                                ).toFixed(2);
                                setPositiveVal(x);
                                setFilters({
                                  ...getCurrentFilters(),
                                  positive: {
                                    operator: posRadioChecked,
                                    operand: x,
                                  },
                                });
                              }}
                              className="self-center mt-8 transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                            />
                            <div className="self-center mt-2 flex flex-row justify-between">
                              <div>{positiveMin.toFixed(2)}</div>
                              <div>{positiveMax.toFixed(2)}</div>
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isPositiveDisabled()}
                              onClick={resetPositive}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Negative
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div>
                            <div className="flex justify-around">
                              <ul className="items-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-license"
                                      type="radio"
                                      value="<"
                                      name="list-neg"
                                      onChange={onNegRadioChange}
                                      checked={negRadioChecked === "<"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-license"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &lt;{" "}
                                    </label>
                                  </div>
                                </li>
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-id"
                                      type="radio"
                                      value=">"
                                      name="list-neg"
                                      onChange={onNegRadioChange}
                                      checked={negRadioChecked === ">"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-id"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &gt;{" "}
                                    </label>
                                  </div>
                                </li>
                              </ul>
                              <span className="self-center bg-teal-500 text-white font-bold p-1 ml-4">
                                {negativeVal}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={negativeMin}
                              max={negativeMax}
                              step="0.01"
                              value={negativeVal}
                              onChange={(e) => {
                                let x = parseFloat(
                                  e.currentTarget.value
                                ).toFixed(2);
                                setNegativeVal(x);
                                setFilters({
                                  ...getCurrentFilters(),
                                  negative: {
                                    operator: negRadioChecked,
                                    operand: x,
                                  },
                                });
                              }}
                              className="self-center mt-8 transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                            />
                            <div className="self-center mt-2 flex flex-row justify-between">
                              <div>{negativeMin.toFixed(2)}</div>
                              <div>{negativeMax.toFixed(2)}</div>
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isNegativeDisabled()}
                              onClick={resetNegative}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Required
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div>
                            <div className="flex justify-around">
                              <ul className="items-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-license"
                                      type="radio"
                                      value="<"
                                      name="list-req"
                                      onChange={onReqRadioChange}
                                      checked={reqRadioChecked === "<"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-license"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &lt;{" "}
                                    </label>
                                  </div>
                                </li>
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-id"
                                      type="radio"
                                      value=">"
                                      name="list-req"
                                      onChange={onReqRadioChange}
                                      checked={reqRadioChecked === ">"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-id"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &gt;{" "}
                                    </label>
                                  </div>
                                </li>
                              </ul>
                              <span className="self-center bg-teal-500 text-white font-bold p-1 ml-4">
                                {requiredVal}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={requiredMin}
                              max={requiredMax}
                              step="0.01"
                              value={requiredVal}
                              onChange={(e) => {
                                let x = parseFloat(
                                  e.currentTarget.value
                                ).toFixed(2);
                                setRequiredVal(x);
                                setFilters({
                                  ...getCurrentFilters(),
                                  required: {
                                    operator: reqRadioChecked,
                                    operand: x,
                                  },
                                });
                              }}
                              className="self-center mt-8 transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                            />
                            <div className="self-center mt-2 flex flex-row justify-between">
                              <div>{requiredMin.toFixed(2)}</div>
                              <div>{requiredMax.toFixed(2)}</div>
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isRequiredDisabled()}
                              onClick={resetRequired}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>

                  <Accordion.Panel>
                    <Accordion.Title className="py-0 mb-1 bg-slate-200">
                      Combined
                    </Accordion.Title>
                    <Accordion.Content>
                      <div className="border-4 rounded">
                        <div className="grid grid-rows-[30px_80px_65px] justify-items-center">
                          <div></div>
                          <div>
                            <div className="flex justify-around">
                              <ul className="items-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-license"
                                      type="radio"
                                      value="<"
                                      name="list-com"
                                      onChange={onComRadioChange}
                                      checked={comRadioChecked === "<"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-license"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &lt;{" "}
                                    </label>
                                  </div>
                                </li>
                                <li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                                  <div className="flex items-center pl-3">
                                    <input
                                      id="horizontal-list-radio-id"
                                      type="radio"
                                      value=">"
                                      name="list-com"
                                      onChange={onComRadioChange}
                                      checked={comRadioChecked === ">"}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <label
                                      htmlFor="horizontal-list-radio-id"
                                      className="font-extrabold py-2 ml-2 mr-2 text-sm text-gray-900 dark:text-gray-300"
                                    >
                                      &gt;{" "}
                                    </label>
                                  </div>
                                </li>
                              </ul>
                              <span className="self-center bg-teal-500 text-white font-bold p-1 ml-4">
                                {combinedVal}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={combinedMin}
                              max={combinedMax}
                              step="0.01"
                              value={combinedVal}
                              onChange={(e) => {
                                let x = parseFloat(
                                  e.currentTarget.value
                                ).toFixed(2);
                                setCombinedVal(x);
                                setFilters({
                                  ...getCurrentFilters(),
                                  combined: {
                                    operator: comRadioChecked,
                                    operand: x,
                                  },
                                });
                              }}
                              className="self-center mt-8 transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-neutral-200 dark:bg-neutral-600"
                            />
                            <div className="self-center mt-2 flex flex-row justify-between">
                              <div>{combinedMin.toFixed(2)}</div>
                              <div>{combinedMax.toFixed(2)}</div>
                            </div>
                          </div>

                          <div>
                            <Button
                              className="w-fit self-center mt-4"
                              disabled={isCombinedDisabled()}
                              onClick={resetCombined}
                            >
                              Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>

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
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer></Modal.Footer>
        </Modal>
      </StrictMode>
    </>
  );
}
