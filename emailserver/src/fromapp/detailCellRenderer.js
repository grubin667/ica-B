import React from 'react';
import AudioPlayer from "./audioplayer";

const DetailCellRenderer = ({ data }) => {

  const { norm, normCombined, scoredWords } = JSON.parse(data.otherScoreInfo);

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
      return <span key={index}>{`${sw.punctuated_word} `}</span>;
    }
    if (sw.match_info.p && !sw.match_info.n && !sw.match_info.r) {
      // positive word match - green bg
      return (
        <span
          key={index}
          className="bg-green-400"
        >{`${sw.punctuated_word} `}</span>
      );
    }
    if (!sw.match_info.p && sw.match_info.n && !sw.match_info.r) {
      // negative word matched - red bg
      return (
        <span
          key={index}
          className="bg-red-400"
        >{`${sw.punctuated_word} `}</span>
      );
    }
    if (!sw.match_info.p && !sw.match_info.n && sw.match_info.r) {
      // required word matched - blue bg
      return (
        <span
          key={index}
          className="bg-blue-400"
        >{`${sw.punctuated_word} `}</span>
      );
    }
    // matches in more than 1 list - yellow bg
    return (
      <span
        key={index}
        className="bg-yellow-400"
      >{`${sw.punctuated_word} `}</span>
    );
  };

  return (
    <div className='border-2 border-black'>
      <AudioPlayer resultId={data.id} />
      <div className="overflow-y-scroll text-wrap h-[130px] m-4">
        {scoredWords.map((sw, index) => getWordHtml(sw, index))}
      </div>
    </div>
  )
};

export default DetailCellRenderer;
