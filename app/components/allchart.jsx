"use client"

import useSWR from "swr"
import { Fragment } from "react"

// AllChart displays a chart of all orgs, their agencies, etc.

export default function AllChart() {
  const {
    data: orgResponse,
    error: orgResponseError,
    isLoading: orgResponseIsLoading
  } = useSWR(`/api/orgs`) // contains agencies and users

  if (orgResponseError) {
    return <div>Error occurred loading data</div>
  }
  if (orgResponseIsLoading) {
    return <div>Loading</div>
  }

  return (
    <ul className="p-2">
      {orgResponse?.orgs.map((o, oindex) => {
        return (
          <Fragment key={o.id + oindex.toString()}>
            <li className="text-black font-bold bg-white">{o.name}</li>
            {o.agencies.map((a, aindex) => {
              return (
                <Fragment
                  key={o.id + oindex.toString() + a.id + aindex.toString()}
                >
                  <li className="text-black bg-white">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    {`${a.agency.name}`}
                  </li>
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </ul>
  )
}
