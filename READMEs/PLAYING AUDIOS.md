## Background
This is a description of the aspects of exploring scoring. It focuses on the complications involved in playing audio files for the user.

A media file (image, audio, video) is usually thought of as an addressable static resource. ***addressible*** means that a URL can exactly call for the resource By this we mean that media files in the /public directory can be accessed by abridged URL by using something like ... src={"/image.jpg"} or ... src={"/public/dir-struct/image.jpg"}.


**results-modal.tsx** is called from the **orgadmin-modals.tsx** ***Explore Scoring*** dialog when the user clicks anywhere on the table row displaying a transcription-scoring result record. We display results-modal in a layer above the Explore Scoring dialog. another modal dialog (this one, results-modal) above the Explore Scoring dialog. It renders two side-by-side vertical panes, one containing the transcription with "found" words highlighted and the second to display scoring stats along with an <audio></audio> player to let the user listen to the call IF IT'S ACCESSIBLE to the server.

Although we just had the whole result row (it's what was clicked in the table), this dialog was called with the result's id, and it refetches the result row using useSWR. It's cached, so this happens without cost. Now, in addition to the id we have the transcription, scoring and the directory address of the audio file (if it's still on server).

We'll now discuss the thorny part of this process: serving up the audio file. The right pane contains an HTML <audio /> element. Its <source /> sub-element has a src prop (just like an <img /> does). Its value is a URL. For static resources we'd keep data files in /public in the project, and the URL would be "/fn.ext". Address decoding is handled by the browser and Webpack. fn.ext had to be there at build time (for production, at least).

But the audio files are kept elsewhere. They are dynamic static files. We don't and can't set up access to them until the user requests it by clicking the row in the table. Here's how we handle that:



The HTML page contains an <audio> tag with an embedded <source> item. <source> has a src property containing the URL of a fetch-and-deliver endpoint. (Usually, for example when serving static imasges, fetching is not done, since the image file lives in /public.) In our case, however, the audio file we want to play lives someplace else on our server (or it could even be out in the cloud). That someplace else address is found in the file's results record in the diskFilename column. Our get handler makes like the audio file in question was sitting in /public and was accessible from the start.

We pass the result id to the endpoint. It reads the file content and returns it in a status(200) response. The file itself never moves. It is never in our project-internal directory structure. It just looks like it is.

So src in <source> inside <audio> is set to `/api/audiofile/${result.id}`.