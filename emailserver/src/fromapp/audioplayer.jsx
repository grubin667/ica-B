"use client";

import { useState, useEffect, useRef } from "react";

const colorKey = (
  <div className="flex flex-row gap-4 mt-4">
    <span className="font-bold">Color key:</span>
    <div className="h-fit w-fit outline bg-green-400">
      <div className="font-semibold px-1.5">Positive</div>
    </div>
    <div className="h-fit w-fit outline bg-red-400">
      <div className="font-semibold px-1.5">Negative</div>
    </div>
    <div className="h-fit w-fit outline bg-blue-400">
      <div className="font-semibold px-1.5">Required</div>
    </div>
    <div className="h-fit w-fit outline bg-yellow-400">
      <div className="font-semibold px-1.5">{"Multiple"}</div>
    </div>
  </div>
);

export default function AudioPlayer({ resultId }) {

  const [audioControl, setAudioControl] = useState(<></>);

  useEffect(() => {

    const fetchAudioUrl = async (id) => {

      const response = await fetch(`/api/audio?id=${id}`);
      if (!response.ok) {
        setAudioControl(<span>no audio file</span>);
        return;
      }

      // Now we get a time-limited URL of the audio file while it's in S3.
      let ourUrl = "";
      const obj = await response.json();
      ourUrl = obj.audioFileUrl;
      setAudioControl(<audio controls src={ourUrl} className="scale-[0.8]" />);
    }
    fetchAudioUrl(resultId);
  }, [resultId]);

  return (
    <div className="grid grid-rows-1 grid-flow-col gap-4">
      {audioControl}
      {colorKey}
    </div>
  );
}
