"use client"

// import { useState, useEffect, useRef } from 'react';
// import { Button, Checkbox, Label, Modal, TextInput, Dropdown } from 'flowbite-react';
import useSWR from 'swr';

export default function Transcription(props) {

  const id = props.resultsId;
  const { data: thisResult, error, isLoading } = useSWR(`/api/results/${id}`)
  if (error) return (<div>Error loading data</div>);
  if (isLoading) return (<div>loading...</div>);

  const resultsRow = thisResult.data.result;

  // resultsRow is the full row from the results table, including a complete model object
  // and the scoring-enhanced words array.
  const { norm, normCombined, scoredWords } = JSON.parse(resultsRow.otherScoreInfo)

  // const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  //   var words = text.split(' ');
  //   var line = '';

  //   for(var n = 0; n < words.length; n++) {
  //     var testLine = line + words[n] + ' ';
  //     var metrics = context.measureText(testLine);
  //     var testWidth = metrics.width;
  //     if (testWidth > maxWidth && n > 0) {
  //       context.fillText(line, x, y);
  //       line = words[n] + ' ';
  //       y += lineHeight;
  //     }
  //     else {
  //       line = testLine;
  //     }
  //   }
  //   context.fillText(line, x, y);
  // }


  // return (
  //   // <canvas id="myCanvas" width="578" height="200"></canvas>
  //   <span>image goes here</span>
  // )

  const getWordHtml = (sw, index) => {

    // sw is this object {confidence, end, start, word, punctuated_word, match_info}
    // match_info was added during scoring when the audio file was first processed.
    // match_info is an object with 3 bools: {p, n, r}. Remember that a single word
    // could have matched against 0, 1, 2, or 3 lists. We will return sw.punctuated_word
    // wrapped in a <span></span> with suitable background coloring.
    // This is how we'll color the background:
    //       p     n     r       bg-color
    //       false false false   none
    //       true  false false   blue
    //       false true  false   red
    //       false false true    green
    //       any other mix       yellow
    if (!sw.match_info.p && !sw.match_info.n && !sw.match_info.r) {
      // no match - no bg color
      return <span key={index}>{`${sw.punctuated_word} `}</span>
    }
    if (sw.match_info.p && !sw.match_info.n && !sw.match_info.r) {
      // positive word match - green bg
      return <span key={index} className='bg-green-400'>{`${sw.punctuated_word} `}</span>
    }
    if (!sw.match_info.p && sw.match_info.n && !sw.match_info.r) {
      // negative word matched - red bg
      return <span key={index} className='bg-red-400'>{`${sw.punctuated_word} `}</span>
    }
    if (!sw.match_info.p && !sw.match_info.n && sw.match_info.r) {
      // required word matched - blue bg
      return <span key={index} className='bg-blue-400'>{`${sw.punctuated_word} `}</span>
    }
    // matches in more than 1 list - yellow bg
    return <span key={index} className='bg-yellow-400'>{`${sw.punctuated_word} `}</span>
  }

  return (
    <div className="w-11/12">
      {scoredWords.map((sw, index) => getWordHtml(sw, index))}
    </div>
  )

}
