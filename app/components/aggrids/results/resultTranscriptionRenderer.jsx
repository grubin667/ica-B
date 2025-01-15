
import Transcription from "../../transcription";

export default function ResultTranscriptionRenderer (props) {

  const resultsId = props.data.id

  return (
    <Transcription resultsId={resultsId} />
  )
}
