"use client";

import { useState, useEffect, useRef } from "react";

const ColorKey = () => {
  return (
    <>
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
    </>
  );
};

export default function AudioPlayerHold({ resultId }) {

  const [allset, setAllset] = useState(false);

  useEffect(() => {

    const fetchAudioFile = async (id) => {

      const response = await fetch(`/api/audio?id=${id}`);
      if (!response.ok) {
        return "noaudiofile"; // not used yet
      }
      const obj = await response.json();
      let base64;
      let ind = obj.data.indexOf(";base64,");
      if (ind > -1) {
        base64 = obj.data.substring(ind);
      } else {
        base64 = obj.data;
      }
      const raw = atob(base64);
      let rawLength = raw.length;
      let array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([array], { type: "audio/mpeg" });
      const ourUrl = URL.createObjectURL(blob);
      const audioEle = document.getElementById("audioPlayer");
      if (audioEle) {
        audioEle.setAttribute("src", ourUrl);
      }
      setAllset(true);
    }
    fetchAudioFile(resultId);
  }, [resultId]);

  return (
    <div className="grid grid-rows-1 grid-flow-col gap-4">
      {allset &&
        <audio id="audioPlayer" controls src="" className="scale-[0.8]" />
      }
      <ColorKey />
    </div>
  );
}
