"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Accordion } from "flowbite-react";

// ResultsFiltering provides filtering of the results records for the org.
// It is displayed above the results table in explore-scoring.

export default function TestingComponent(props) {

  let {
    allResultsForOrg,
    filters,
    setFilters,
    initialFilters,
    captionNoteCountRef,
    agenciesInOrg,
  } = props;

  if (!filters) {
    filters = {...initialFilters}
  }

  const [opened, setOpened] = useState(true);

  //////////////////////////////////////////////////////////////////////////////
  // Sections for each of the 8 filters.
  //////////////////////////////////////////////////////////////////////////////

  // agencies by name
  //////////////////////////////////////////////////////////////////////////////
  const agencyNamesSetRef = useRef([]);
  // const resetAgencies = useCallback(() => {
  //   setFilters({
  //     ...filters,
  //     agencies: {
  //       all: [...Array.from(agencyNamesSetRef.current)],
  //       sel: new Array([...Array.from(agencyNamesSetRef.current)].length).fill(
  //         false
  //       ),
  //     },
  //   });
  //   captionNoteCountRef.current = 0;
  // }, [captionNoteCountRef, filters, setFilters]);
  const resetAgencies = () => {
    setFilters({
      ...filters,
      agencies: {
        all: [...Array.from(agencyNamesSetRef.current)],
        sel: new Array([...Array.from(agencyNamesSetRef.current)].length).fill(
          false
        ),
      },
    });
    captionNoteCountRef.current = 0;
  };
  const isAgenciesDisabled = () => {
    // Since we're talking about whether the Reset button is disabled,
    // we will return true (reset is disabled) if every item in filters.agencies.sel
    // is false. Any true, returns false (button isn't disabled).
    let sometest = filters.agencies.sel.some((item) => item);
    return !sometest;
  };
  const acbToggleChange = (position) => {
    const updatedCheckedState = filters.agencies.sel.map((item, index) =>
      index === position ? !item : item
    );
    setFilters({
      ...filters,
      agencies: {
        all: [...filters.agencies.all],
        sel: [...updatedCheckedState],
      },
    });
  };

  // from/thru dates
  //////////////////////////////////////////////////////////////////////////////
  const resetDates = () => {
    setFilters({
      ...filters,
      dates: { ...initialFilters.dates },
    });
    captionNoteCountRef.current = 0;
  };
  const handleFromDateChange = (e) => {
    setFilters({
      ...filters,
      dates: {
        from: e.target.value,
        thru: filters.dates.thru,
      },
    });
  };
  const handleThruDateChange = (e) => {
    setFilters({
      ...filters,
      dates: {
        from: filters.dates.from,
        thru: e.target.value,
      },
    });
  };
  const isDatesDisabled = () => {
    // The dates Reset button is disabled if both dates are set = ''.
    if (filters.dates?.from.length === 0 && filters.dates?.thru.length === 0) {
      return true;
    }
    return false;
  };

  // models by name
  //////////////////////////////////////////////////////////////////////////////
  const modelNamesSetRef = useRef([]);
  // const resetModels = useCallback(() => {
  //   setFilters({
  //     ...filters,
  //     models: {
  //       all: [...Array.from(modelNamesSetRef.current)],
  //       sel: new Array([...Array.from(modelNamesSetRef.current)].length).fill(false)
  //     },
  //   });
  //   captionNoteCountRef.current = 0;
  // }, [captionNoteCountRef, filters, setFilters]);
  const resetModels = () => {
    setFilters({
      ...filters,
      models: {
        all: [...Array.from(modelNamesSetRef.current)],
        sel: new Array([...Array.from(modelNamesSetRef.current)].length).fill(
          false
        ),
      },
    });
    captionNoteCountRef.current = 0;
  };
  const isModelsDisabled = () => {
    // Since we're talking about whether the Reset button is disabled,
    // we will return true (reset is disabled) if every item in filters.models.sel
    // is false. Any true, returns false (button isn't disabled).
    let sometest = filters.models?.sel.some((item) => item);
    return !sometest;
  };
  const mcbToggleChange = (position) => {
    const updatedCheckedState = filters.models.sel.map((item, index) =>
      index === position ? !item : item
    );
    setFilters({
      ...filters,
      models: {
        all: [...filters.models.all],
        sel: [...updatedCheckedState],
      },
    });
  };

  // quintiles/grades
  //////////////////////////////////////////////////////////////////////////////
  const resetQuintiles = () => {
    setFilters({
      ...filters,
      quintiles: [...initialFilters.quintiles],
    });
    captionNoteCountRef.current = 0;
  };
  const isQuintilesDisabled = () => {
    // return !(
    //   filters.quintiles[0] ||
    //   filters.quintiles[1] ||
    //   filters.quintiles[2] ||
    //   filters.quintiles[3] ||
    //   filters.quintiles[4]
    // );
    let sometest = filters.quintiles?.some((item) => item);
    return !sometest;
  };
  const qcbToggleChange = (position) => {
    const updatedCheckedState = filters.quintiles.map((item, index) =>
      index === position ? !item : item
    );
    setFilters({
      ...filters,
      quintiles: [...updatedCheckedState],
    });
  };

  // word score - positive
  //////////////////////////////////////////////////////////////////////////////
  const [positiveMin, setPositiveMin] = useState(0);
  const [positiveMax, setPositiveMax] = useState(9999);
  const [positiveVal, setPositiveVal] = useState(null);
  const [posRadioChecked, setPosRadioChecked] = useState("");
  const onPosRadioChange = (e) => {
    let radioValue = e.target.value;
    setPosRadioChecked(radioValue);
    setFilters({
      ...filters,
      positive: { operator: radioValue, operand: positiveVal },
    });
  };
  const resetPositive = () => {
    setFilters({
      ...filters,
      positive: { ...initialFilters.positive },
    });
    setPositiveVal(((positiveMax + positiveMin) / 2).toFixed(2));
    setPosRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isPositiveDisabled = () => {
    return filters.positive?.operator.length === 0;
  };

  // word score - negative
  //////////////////////////////////////////////////////////////////////////////
  const [negativeMin, setNegativeMin] = useState(0);
  const [negativeMax, setNegativeMax] = useState(9999);
  const [negativeVal, setNegativeVal] = useState(null);
  const [negRadioChecked, setNegRadioChecked] = useState("");
  const onNegRadioChange = (e) => {
    let radioValue = e.target.value;
    setNegRadioChecked(radioValue);
    setFilters({
      ...filters,
      negative: { operator: radioValue, operand: negativeVal },
    });
  };
  const resetNegative = () => {
    setFilters({
      ...filters,
      negative: { ...initialFilters.negative },
    });
    setNegativeVal(((negativeMax + negativeMin) / 2).toFixed(2));
    setNegRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isNegativeDisabled = () => {
    return filters.negative?.operator.length === 0;
  };

  // word score - required
  //////////////////////////////////////////////////////////////////////////////
  const [requiredMin, setRequiredMin] = useState(0);
  const [requiredMax, setRequiredMax] = useState(9999);
  const [requiredVal, setRequiredVal] = useState(null);
  const [reqRadioChecked, setReqRadioChecked] = useState("");
  const onReqRadioChange = (e) => {
    let radioValue = e.target.value;
    setReqRadioChecked(radioValue);
    setFilters({
      ...filters,
      required: { operator: radioValue, operand: requiredVal },
    });
  };
  const resetRequired = () => {
    setFilters({
      ...filters,
      required: { ...initialFilters.required },
    });
    setRequiredVal(((requiredMax + requiredMin) / 2).toFixed(2));
    setReqRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isRequiredDisabled = () => {
    return filters.required?.operator.length === 0;
  };

  // word score - combined
  //////////////////////////////////////////////////////////////////////////////
  const [combinedMin, setCombinedMin] = useState(0);
  const [combinedMax, setCombinedMax] = useState(9999);
  const [combinedVal, setCombinedVal] = useState(null);
  const [comRadioChecked, setComRadioChecked] = useState("");
  const onComRadioChange = (e) => {
    let radioValue = e.target.value;
    setComRadioChecked(radioValue);
    setFilters({
      ...filters,
      combined: { operator: radioValue, operand: combinedVal },
    });
  };
  const resetCombined = () => {
    setFilters({
      ...filters,
      combined: { ...initialFilters.combined },
    });
    setCombinedVal(((combinedMax + combinedMin) / 2).toFixed(2));
    setComRadioChecked("");
    captionNoteCountRef.current = 0;
  };
  const isCombinedDisabled = () => {
    return filters.combined?.operator.length === 0;
  };

  //////////////////////////////////////////////////////////////////////////////
  //    End of declarations for 8 filters
  //////////////////////////////////////////////////////////////////////////////
  const clearAllFilters = useCallback(() => {
    setValuesAreSet(false);

    setPosRadioChecked("");
    setNegRadioChecked("");
    setReqRadioChecked("");
    setComRadioChecked("");

    setFilters({
      dates: { ...initialFilters.dates },
      agencies: {
        all: [...Array.from(agencyNamesSetRef.current)],
        sel: new Array(agencyNamesSetRef.current.length).fill(false),
      },
      models: {
        all: [...Array.from(modelNamesSetRef.current)],
        sel: new Array(modelNamesSetRef.current.length).fill(false),
      },
      quintiles: [...initialFilters.quintiles],
      positive: { ...initialFilters.positive },
      negative: { ...initialFilters.negative },
      required: { ...initialFilters.required },
      combined: { ...initialFilters.combined },
    });
  }, [
    initialFilters.combined,
    initialFilters.dates,
    initialFilters.negative,
    initialFilters.positive,
    initialFilters.quintiles,
    initialFilters.required,
    setFilters,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Initial filter settings based on complete set of Org's results
  //////////////////////////////////////////////////////////////////////////////

  // results are in allResultsForOrg.rslts.
  // These are all results for the org and all its agencies, pre-filtering. We use this to set up the
  // various filters that get passed back to parent (explore-scoring dialog) for actual row filtering.

  const [valuesAreSet, setValuesAreSet] = useState(false);
  useEffect(() => {
    if (!valuesAreSet) {
      let posMin = 9999;
      let negMin = 9999;
      let reqMin = 9999;
      let comMin = 9999;
      let posMax = 0;
      let negMax = 0;
      let reqMax = 0;
      let comMax = 0;

      modelNamesSetRef.current = new Set();

      allResultsForOrg.rslts.forEach((cols) => {
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

      agencyNamesSetRef.current = new Set();
      agenciesInOrg.forEach((a) => {
        agencyNamesSetRef.current.add(a.name);
      });

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

      resetAgencies();
      resetModels();

      setValuesAreSet(true);
      clearAllFilters();
    }
  }, [agenciesInOrg, allResultsForOrg.rslts, clearAllFilters, resetAgencies, resetModels, valuesAreSet]);

  const isAnyFilterSet = () => {
    // if (Object.keys(filters).length === 0) return false;

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

  return (
    <>
      {opened === true && ( // && Object.keys(filters).length > 0
        <div>
          <div className="flex justify-between items-center">
            <span
              className="font-bold cursor-pointer mb-2"
              onClick={() => {
                setOpened(false);
              }}
            >
              - FILTERING
            </span>
            <span className="text-sm">
              [Filters are applied to Scoring Results as you configure them.]
            </span>
            {isAnyFilterSet() === true && (
              <Button className="h-5 mb-2" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>

          {/* <Accordion className="w-[1166px]" collapseAll>
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
                        {filters.agencies?.all.map((an, index) => {
                          return (
                            <div key={index}>
                              <input
                                type="checkbox"
                                className="mr-2"
                                id={`agency-checkbox-${index}`}
                                name={an}
                                value={an}
                                checked={filters.agencies.sel[index]}
                                onChange={() => acbToggleChange(index)}
                              />
                              <label
                                htmlFor={`agency-checkbox-${index}`}
                                className="mr-2"
                              >{`${an}`}</label>
                            </div>
                          );
                        })}
                      </div>

                      <div>(Selecting none is the same as selecting all.)</div>
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
                          value={filters.dates?.from}
                        />
                        <span>&nbsp;-&nbsp;</span>
                        <input
                          type="date"
                          onChange={handleThruDateChange}
                          value={filters.dates?.thru}
                        />
                      </div>
                      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        (Use either date to match a single date. Use both for a
                        date range.)
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
                    <div className="flex flex-col justify-between">
                      <div className="flex flex-col items-center justify-between">
                        <ul className="border list-none min-h-4 max-h-32 overflow-auto">
                          {filters.models?.all.map((mn, index) => {
                            return (
                              <li key={index}>
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  id={`model-checkbox-${index}`}
                                  name={mn}
                                  value={mn}
                                  checked={filters.models.sel[index]}
                                  onChange={() => mcbToggleChange(index)}
                                />
                                <label
                                  htmlFor={`model-checkbox-${index}`}
                                  className="mr-2"
                                >{`${mn}`}</label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <label
                        htmlFor="model-select"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        (Selecting none is the same as selecting all.)
                      </label>
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
                            <>
                              <input
                                type="checkbox"
                                className="ml-3 mr-1"
                                id={`qcb-${index}`}
                                checked={filters.quintiles?.index} // {filters.quintiles[index]}
                                onChange={() => {
                                  qcbToggleChange(index);
                                }}
                              />
                              <label className="-mt-1" htmlFor={`qcb-${index}`}>
                                {grade}
                              </label>
                            </>
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
                          let x = parseFloat(e.currentTarget.value).toFixed(2);
                          setPositiveVal(x);
                          setFilters({
                            ...filters,
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
                          let x = parseFloat(e.currentTarget.value).toFixed(2);
                          setNegativeVal(x);
                          setFilters({
                            ...filters,
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
                          let x = parseFloat(e.currentTarget.value).toFixed(2);
                          setRequiredVal(x);
                          setFilters({
                            ...filters,
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
                          let x = parseFloat(e.currentTarget.value).toFixed(2);
                          setCombinedVal(x);
                          setFilters({
                            ...filters,
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
          </Accordion> */}
        </div>
      )}
      {opened === false && (
        <div>
          <div className="flex justify-between items-center h-2">
            <span
              className="font-bold cursor-pointer mt-4 mb-2"
              onClick={() => {
                setOpened(true);
              }}
            >
              + FILTERING
            </span>
            {isAnyFilterSet() === true && (
              <Button className="h-5 mt-4 mb-2" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
