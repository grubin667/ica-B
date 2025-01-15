
import { format, formatISO } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';
import { createClient } from '@deepgram/sdk'
import { parentPort } from 'node:worker_threads';
import process from 'node:process';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mariadb } from '../getMaria.cjs';
import { Cabin } from '../getCabin.cjs';
import pMap from 'p-map';
import * as fs from "node:fs";


// find-work is a Bree job that runs on an interval.
// It queries the results table of the DB for new reults records (restatus === 'NEW').
// Then it loops through the records, processes each one, and updates the record in the results table.
// Processing consists of these steps:
// - read audio file from S3;
// - call Deepgram with the audio content for transcription;
// - score it;
// - run query to update record in results table, changing its restatus and
//   storing transcription and scoring info.

// TODO need to resolve a couple questions:
// - IIFE
// - setup steps - do I want to declare any of them inside the IIFE?

const cabin = new Cabin();
const getFTime = () => format(new Date(), 'yyyy-MM-dd hh:mm:ss: ');
const now = () => formatISO(new Date());
const s3 = new S3Client({});
const bName = process.env.AWS_BUCKET_NAME

// Initialize the Deepgram client.
const deepgramapikey = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(deepgramapikey);

// Initialize MariaDB Pool
const cxnString = process.env.DB_URL;
const pool = mariadb.createPool(cxnString);

// We are able to shut off DB use when checking agency and org names if it proves troublesome.
// let disableDbAccess = false

// const checkedAgencyNames = []
// const checkedOrgNames = []
// note: we're not using checkAndCheck for now
// const checkAndCheck = async (agencyName, orgName) => {

//   // cabin.info(`Entered checkAndCheck with "${agencyName}" and "${orgName}"`)
//   // if (disableDbAccess) { return true }

//   let ret = true

//   if (checkedAgencyNames.indexOf(agencyName) === -1) {

//     const query = {
//       text: "select * from agencies where name = $1",
//       values: [agencyName],
//     }

//     const res = await pool.query(query)
//     if (res.rowCount === 0) {
//       cabin.info(`got a miss on ${agencyName} when selecting from agencies`)
//       ret = false
//     } else {
//       // note: row is an object with property names corresponding to column names of the result set
//       cabin.info(`agency with name ${agencyName} was found`)
//       checkedAgencyNames.push(agencyName)
//     }

//     db.get(sql, [agencyName], function (err, row) {
//       if (err) {
//         cabin.info(`error rec'd selecting ${agencyName} from agencies - but we're approving and continuing: ${err.message}`)
//         checkedAgencyNames.push(agencyName)
//       }
//       if (typeof row === 'undefined') {
//         cabin.info(`got a miss on ${agencyName} when selecting from agencies`)
//         ret = false
//       }
//       // note: row is an object with property names corresponding to column names of the result set
//       cabin.info(`agency with name ${agencyName} was found`)
//       checkedAgencyNames.push(agencyName)
//     })
//   }

//   if (checkedOrgNames.indexOf(name) === -1) {

//     let sql = "select * from orgs where name = ?";
//     db.get(sql, [orgName], function (err, row) {
//       if (err) {
//         cabin.info(`error rec'd selecting ${orgName} from orgs - but we're approving and continuing: ${err.message}`)
//         checkedOrgNames.push(orgName)
//         return ret & true
//       }
//       if (typeof row === 'undefined') {
//         cabin.info(`got a miss on ${orgName} when selecting from orgs`)
//         return ret & false
//       }
//       // note: row is an object with property names corresponding to column names of the result set
//       cabin.info(`org with name ${orgName} was found`)
//       checkedOrgNames.push(orgName)
//       return ret & true
//     })
//   }

//   return ret
// }


// const getMimeType = (ext) => {
//   // '.mp3', '.mp4', ".mpeg", ".mpga", ".m4a", '.wav', '.webm'
//   switch (ext) {
//     case '.mp3':
//       return 'audio/mpeg'
//     case '.mp4':
//     case '.m4a':
//       return 'audio/mp4'
//     case '.mpeg':
//       return 'audio/mpeg'
//     case '.mpga':
//       return 'application/octet-stream'
//     case '.wav':
//       return 'audio/wav'
//     case '.webm':
//       return 'audio/webm'
//     default:
//       return 'audio/'
//   }
// }

const getDefaultParams = () => {
  // Each of the word objects in these 3 words arrays has a new 3rd property, wc.
  // It holds the count of the number of actual words to match against.
  return {
    positive: {
      weight: 1,
      words: [
        { w: 'brilliant', wt: 2, wc: 1 },
        { w: 'beautiful', wt: 1, wc: 1 },
        { w: 'certainly', wt: 2, wc: 1 },
        { w: 'completely', wt: 1, wc: 1 },
        { w: 'customer', wt: 2, wc: 1 },
        { w: 'definitely', wt: 1, wc: 1 },
        { w: 'enjoy', wt: 5, wc: 1 },
        { w: 'enjoyable', wt: 5, wc: 1 },
        { w: 'exactly', wt: 1, wc: 1 },
        { w: 'excellent', wt: 5, wc: 1 },
        { w: 'exciting', wt: 2, wc: 1 },
        { w: 'fantastic', wt: 2, wc: 1 },
        { w: 'fascinating', wt: 2, wc: 1 },
        { w: 'favorite', wt: 2, wc: 1 },
        { w: 'friendly', wt: 2, wc: 1 },
        { w: 'generous', wt: 5, wc: 1 },
        { w: 'good', wt: 5, wc: 1 },
        { w: 'great', wt: 5, wc: 1 },
        { w: 'ideal', wt: 2, wc: 1 },
        { w: 'impressive', wt: 2, wc: 1 },
        { w: 'interesting', wt: 2, wc: 1 },
        { w: 'kindly', wt: 2, wc: 1 },
        { w: 'marvellous', wt: 5, wc: 1 },
        { w: 'please', wt: 4, wc: 1 },
        { w: 'quickly', wt: 4, wc: 1 },
        { w: 'recommend', wt: 2, wc: 1 },
        { w: 'serve', wt: 2, wc: 1 },
        { w: 'serving', wt: 2, wc: 1 },
        { w: 'splendid', wt: 1, wc: 1 },
        { w: 'terrific', wt: 2, wc: 1 },
        { w: 'thank you', wt: 2, wc: 2 },
        { w: 'trust', wt: 1, wc: 1 },
        { w: 'trusting', wt: 2, wc: 1 },
        { w: 'welcome', wt: 2, wc: 1 },
        { w: 'wonderful', wt: 2, wc: 1 },
        { w: 'you are welcome', wt: 5, wc: 3 },
        { w: 'grocery store', wt: 5, wc: 2 },
        // { w: 'you're welcome', wt: 5, wc: 2 },
      ]
    },
    negative: {
      weight: 1,
      words: [
        { w: 'cost', wt: 2, wc: 1 },
        { w: 'price', wt: 2, wc: 1 },
        { w: 'costs', wt: 2, wc: 1 },
        { w: 'leakage', wt: 2, wc: 1 },
        { w: 'charge', wt: 2, wc: 1 },
        { w: 'analannie', wt: 2, wc: 1 },
        { w: 'analprobe', wt: 2, wc: 1 },
        { w: 'analsex', wt: 2, wc: 1 },
        { w: 'anus', wt: 2, wc: 1 },
        { w: 'apeshit', wt: 2, wc: 1 },
        { w: 'ass', wt: 2, wc: 1 },
        { w: 'asshole', wt: 7, wc: 1 },
        { w: 'assholes', wt: 2, wc: 1 },
        { w: 'bang', wt: 2, wc: 1 },
        { w: 'bastard', wt: 2, wc: 1 },
        { w: 'bastards', wt: 2, wc: 1 },
        { w: 'beaner', wt: 2, wc: 1 },
        { w: 'beaners', wt: 2, wc: 1 },
        { w: 'bigtits', wt: 2, wc: 1 },
        { w: 'bimbo', wt: 2, wc: 1 },
        { w: 'bimbos', wt: 2, wc: 1 },
        { w: 'bitch', wt: 2, wc: 1 },
        { w: 'bitchass', wt: 2, wc: 1 },
        { w: 'bitched', wt: 2, wc: 1 },
        { w: 'blow', wt: 2, wc: 1 },
        { w: 'blow job', wt: 2, wc: 2 },
        { w: 'blow me', wt: 2, wc: 2 },
        { w: 'blowjob', wt: 2, wc: 1 },
        { w: 'blowjobs', wt: 2, wc: 1 },
        { w: 'boner', wt: 2, wc: 1 },
        { w: 'boners', wt: 2, wc: 1 },
        { w: 'bong', wt: 2, wc: 1 },
        { w: 'boob', wt: 2, wc: 1 },
        { w: 'boobies', wt: 2, wc: 1 },
        { w: 'boobs', wt: 2, wc: 1 },
        { w: 'booby', wt: 2, wc: 1 },
        { w: 'bootee', wt: 2, wc: 1 },
        { w: 'bootie', wt: 2, wc: 1 },
        { w: 'booty', wt: 2, wc: 1 },
        { w: 'booty call', wt: 2, wc: 2 },
        { w: 'booze', wt: 2, wc: 1 },
        { w: 'bull shit', wt: 2, wc: 2 },
        { w: 'bull crap', wt: 2, wc: 2 },
        { w: 'bumblefuck', wt: 2, wc: 1 },
        { w: 'butt fuck', wt: 2, wc: 2 },
        { w: 'butt hole', wt: 2, wc: 2 },
        { w: 'butt plug', wt: 2, wc: 2 },
        { w: 'circlejerk', wt: 2, wc: 1 },
        { w: 'clusterfuck', wt: 2, wc: 1 },
        { w: 'cock', wt: 2, wc: 1 },
        { w: 'cock sucker', wt: 20, wc: 2 },
        { w: 'cocks', wt: 2, wc: 1 },
        { w: 'cock shit', wt: 2, wc: 2 },
        { w: 'crappy', wt: 10, wc: 1 },
        { w: 'cunt', wt: 2, wc: 1 },
        { w: 'cunts', wt: 2, wc: 1 },
        { w: 'cyber fuck', wt: 2, wc: 2 },
        { w: 'cyber fucked', wt: 2, wc: 2 },
        { w: 'cyber fucker', wt: 2, wc: 2 },
        { w: 'cyber sex', wt: 2, wc: 2 },
        { w: 'damn', wt: 2, wc: 1 },
        { w: 'damned', wt: 2, wc: 1 },
        { w: 'damnit', wt: 2, wc: 1 },
        { w: 'doggie style', wt: 2, wc: 2 },
        { w: 'dick head', wt: 2, wc: 2 },
        { w: 'dick face', wt: 2, wc: 2 },
        { w: 'dip shit', wt: 2, wc: 2 },
        { w: 'douche bag', wt: 2, wc: 2 },
        { w: 'dumb ass', wt: 2, wc: 2 },
        { w: 'dumb fuck', wt: 2, wc: 2 },
        { w: 'dumb shit', wt: 2, wc: 2 },
        { w: 'fag', wt: 2, wc: 1 },
        { w: 'faggot', wt: 2, wc: 1 },
        { w: 'fat ass', wt: 2, wc: 2 },
        { w: 'fat fuck', wt: 2, wc: 2 },
        { w: 'finger fuck', wt: 2, wc: 2 },
        { w: 'fuck off', wt: 2, wc: 2 },
        { w: 'gender bender', wt: 2, wc: 2 },
        { w: 'god damn', wt: 2, wc: 2 },
        { w: 'goddam', wt: 2, wc: 1 },
        { w: 'holy shit', wt: 2, wc: 2 },
        { w: 'hussy', wt: 2, wc: 1 },
        { w: 'jerk off', wt: 2, wc: 2 },
        { w: 'masturbate', wt: 2, wc: 1 },
        { w: 'masturbating', wt: 2, wc: 1 },
        { w: 'nimrod', wt: 2, wc: 1 },
        { w: 'octopussy', wt: 2, wc: 1 },
        { w: 'orgasm', wt: 2, wc: 1 },
        { w: 'pecker', wt: 2, wc: 1 },
        { w: 'pecker head', wt: 2, wc: 2 },
        { w: 'piece of shit', wt: 2, wc: 3 },
        { w: 'piss', wt: 2, wc: 1 },
        { w: 'piss off', wt: 2, wc: 2 },
        { w: 'pissed', wt: 10, wc: 1 },
        { w: 'pissed off', wt: 2, wc: 2 },
        { w: 'prick', wt: 2, wc: 1 },
        { w: 'pricks', wt: 2, wc: 1 },
        { w: 'prostitute', wt: 2, wc: 1 },
        { w: 'pubic', wt: 2, wc: 1 },
        { w: 'punkass', wt: 2, wc: 1 },
        { w: 'pussy', wt: 2, wc: 1 },
        { w: 'queer', wt: 2, wc: 1 },
        { w: 'queer bait', wt: 2, wc: 2 },
        { w: 'rape', wt: 2, wc: 1 },
        { w: 'raped', wt: 2, wc: 1 },
        { w: 'rapist', wt: 2, wc: 1 },
        { w: 'rectum', wt: 2, wc: 1 },
        { w: 'retarded', wt: 2, wc: 1 },
        { w: 'rubbish', wt: 2, wc: 1 },
        { w: 'sadism', wt: 2, wc: 1 },
        { w: 'sadist', wt: 2, wc: 1 },
        { w: 'screw', wt: 2, wc: 1 },
        { w: 'screwed', wt: 2, wc: 1 },
        { w: 'scum', wt: 2, wc: 1 },
        { w: 'shit ass', wt: 2, wc: 2 },
        { w: 'shit bag', wt: 2, wc: 2 },
        { w: 'shit fucker', wt: 2, wc: 2 },
        { w: 'shit for brains', wt: 2, wc: 3 },
        { w: 'sleaze', wt: 10, wc: 1 },
        { w: 'sleazy', wt: 2, wc: 1 },
        { w: 'slope', wt: 2, wc: 1 },
        { w: 'slut', wt: 2, wc: 1 },
        { w: 'slut bucket', wt: 2, wc: 2 },
        { w: 'smart ass', wt: 2, wc: 2 },
        { w: 'smart asses', wt: 2, wc: 2 },
        { w: 'sob', wt: 2, wc: 1 },
        { w: 'son of a bitch', wt: 2, wc: 4 },
        { w: 'stupid', wt: 10, wc: 1 },
        { w: 'suck', wt: 2, wc: 1 },
        { w: 'suck ass', wt: 2, wc: 2 },
        { w: 'sucked', wt: 2, wc: 1 },
        { w: 'sucking', wt: 2, wc: 1 },
        { w: 'sucks', wt: 2, wc: 1 },
        { w: 'titties', wt: 2, wc: 1 },
        { w: 'titty', wt: 2, wc: 1 },
        { w: 'turd', wt: 2, wc: 1 },
        { w: 'weenie', wt: 2, wc: 1 },
        { w: 'whore', wt: 2, wc: 1 },
        { w: 'whore bag', wt: 2, wc: 2 },
        { w: 'whored', wt: 2, wc: 1 },
        { w: 'whore face', wt: 2, wc: 2 },
        { w: 'whore house', wt: 2, wc: 2 },
        { w: 'whores', wt: 2, wc: 1 },
      ]
    },
    required: {
      weight: 1,
      words: [
        { w: 'and', wt: 12, wc: 1 },
        { w: 'discrete', wt: 2, wc: 1 },
        { w: 'time', wt: 2, wc: 1 },
        { w: 'wipes', wt: 2, wc: 1 },
        { w: 'freedom', wt: 2, wc: 1 },
        { w: 'leakage', wt: 2, wc: 1 },
        { w: 'how are you today', wt: 5, wc: 4 },
        { w: 'thank you for trusting', wt: 5, wc: 4 },
        { w: 'my name is', wt: 5, wc: 3 },
        { w: 'estimated charges', wt: 3, wc: 2 },
        { w: 'visa mastercard or american express', wt: 10, wc: 5 },
        { w: 'payment plan', wt: 5, wc: 2 },
        { w: 'charity care', wt: 2, wc: 2 },
      ]
    }
  }
}

const checkWord = (wordArray, paramsSubset) => {

  // wordArray is an array of up to 7 words to match. It is in reverse order. So
  // wordArray[0] is the current word. wordArray[1] is the previous word. Etc.

  let wordToCheck

  // wordToCheck holds the next word in the transcription. It's just the word with no case nor punc.
  // look it up in paramsSubset, comparing wordToCheck against paramsSubset.words.w.
  // return wt if matched, 0 if not.

  for (let i = 0; i < paramsSubset.words.length; i++) {

    let cnt = paramsSubset.words[i].wc // number of words to match against
    wordToCheck = wordArray[0]

    if (cnt > 1) {
      for (let j = 1; j < cnt; j++) {
        wordToCheck = wordArray[j] + " " + wordToCheck;
      }
    }

    if (wordToCheck === paramsSubset.words[i].w) {
      if (cnt > 1) {
        cabin.info(`got a ${cnt} match to ${paramsSubset.words[i].w}`)
      }
      return [paramsSubset.words[i].wt, cnt]
    }
  }
  return [0, 1]
}

const scoreThis = (responseWords, params) => {
  // responseWords is an array of all words in transcription (transcribed from audio file), just as
  // they came from DeepGram. Each word is this object:
  //    [{confidence, end, start, word, punctuated_word}].
  // params is a stringified representation of the model's parameters or '{}' to set to defaults.

  // We'll be computing a doubly-weighted average. Here's how:
  //   (1) Compute separate weighted average for positive, negative and required words.
  //       For each set, accumulate the sum of wt if the word w is in the responseWords array passed in; 0 if not.
  //       Divide by number of responseWords passed in. We then have three independent weighted average
  //       scores. Call them p, n and r.
  //   (2) Next we're going to combine p, n and r so that we end up with the doubly-weighted score.
  //       Each group (positive, negative and required) has its own weighting. Call these pw, nw and rw.
  //       Compute (p * pw - n * nw + r * rw) / (pw + nw + rw) The minus sign in fron of n * nw subtracts
  //       since those words are bad. It isn't decided if the operator in front of the nw term in the divisor
  //       should also be minus. Now we have a doubly-weighted normalised score. Call it norm.
  //  (3)  Use norm to assign a letter grade based on the distribution of all calls processed for this model.
  //       I don't know how to do this, so we'll be putting it off.

  let paramsObj = (params === '{}') ? getDefaultParams() : JSON.parse(params)
  let scoredWords = []
  let positive = 0, negative = 0, required = 0

  // loop through each word object in responseWords.
  // Check wordObj.word against, in turn, paramsObj.positive.words, .negative.words, .required.words.
  // Build match_info object with 3 match results. Add match_info to wordObj.
  // Push wordObj with its new match_info object onto scoredWords.
  responseWords.forEach((wordObj, index) => {

    // We used to pass only one word at a time to checkWord. In order to match multiple-word
    // phrases now allowed in models, we now pass as the first parameter to checkWord an
    // array of the current word and the previous 7 words (may be < 7 to handle txn start).
    // The array is built in reverse order ([i], [i-1], ..., [i-6]) so that the most frequent
    // case of a match phrase having only 1 word can just match against array[0].

    let wordArray = [wordObj.word]; // this word is at responseWords[index]
    // Get the previous 7, but stop if we reach the beginning.
    for (let i = index - 1; i > 0; i--) {
      wordArray.push(responseWords[i].word)
    }

    let p = checkWord(wordArray, paramsObj.positive)
    let n = checkWord(wordArray, paramsObj.negative)
    let r = checkWord(wordArray, paramsObj.required)

    // checkWord returned, for p, n and r, an array of 2 ints:
    //   [match_weight, word_count]
    positive += p[0]
    negative += n[0]
    required += r[0]

    const match_info = {
      p: (p[0] !== 0),
      n: (n[0] !== 0),
      r: (r[0] !== 0)
    }

    scoredWords.push({
      ...wordObj,
      match_info: { ...match_info }
    })

    // This is tricky. If p, n or r has a 2nd element > 1, we're going to back up and update
    // the prior n scoredWords to the same match_info. Then, if the user views the transciption,
    // adjacent matched words will run together with the same background color.
    let match_len = Math.max(p[1], n[1], r[1])
    if (match_len > 1) {
      cabin.info(`spreading back ${match_len - 1} times`)
      let x = scoredWords.length
      for (let k = x - 1; k >= x - match_len; k--) {
        scoredWords[k] = { ...scoredWords[k], match_info: { ...match_info } }
      }
    }
  })

  const nwords = scoredWords.length
  let norm = {
    positive: (positive / nwords) * 100,
    negative: (negative / nwords) * 100,
    required: (required / nwords) * 100,
  };

  let normCombined = (norm.positive * paramsObj.positive.weight - norm.negative * paramsObj.negative.weight + norm.required * paramsObj.required.weight) / (paramsObj.positive.weight + paramsObj.negative.weight + paramsObj.required.weight)

  return {
    norm, normCombined, scoredWords
  }
}

const getLetterGrade = (norm) => {
  // TODO
  return 'C'
}

(async () => {

  parentPort.postMessage(`into IIFE @ ${getFTime()}`);

  // Audio files that have just been uploaded to S3 but haven't been processed yet
  // have a restatus = 'NEW'. We'll select them all (maybe limit in the future to 100 or 1000?) and process
  // them in a loop.
  // On successful processing, we'll save results to DB with updated restatus 'SCORED'.
  // On failure, we'll update the record's restatus to 'REJECTED'. More?

  let conn;

  try {
    // get conn from pool
    conn = await fetchConn();

    // use connection to get all results needing processing
    const rows = await get_NEW_results(conn);
    parentPort.postMessage(`got ${rows.length} results to process back from SELECT NEW`);

    for (var i = 0, len = rows.length; i < len; i++) {
      const row = rows[i];
      let res = await process_row(row, conn);
      /* res is of the form 
        { 
          status: 'success' | 'failure',
          error: null | string,
          ...
        }
      */
      // parentPort.postMessage(`this is res: ${JSON.stringify(res)}`);
      if (res.status === 'success') {
        // parentPort.postMessage('success');
        // update results record with props from res
        const sql = `
          UPDATE results SET
            restatus = 'SCORED',
            transcription = ?,
            transcriptionDatetime = NOW(),
            letterGrade = ?,
            otherScoreInfo = ?,
            modelId = ?
            WHERE id = ?
            ;
        `;
        const values = [
          res.transcription,
          res.letterGrade,
          res.otherScoreInfo,
          res.modelId,
          row.id
        ]
        conn.query(sql, [...values]);
      } else if (res.status === 'failure') {
        parentPort.postMessage(`failure: ${res.error}`);
        // TODO Save res.error to DB after updating schema
        await conn.query("UPDATE results SET restatus = 'REJECTED' WHERE id = ?",
          [
            row.id
          ]
        );
      } else {
        parentPort.postMessage('not success and not failure??? Should be impossible.');
        await conn.query("UPDATE results SET restatus = 'REJECTED' WHERE id = ?",
          [
            row.id
          ]
        );
      }
    }
  } catch (error) {
    cabin.error(error);
    await conn.query("UPDATE results SET restatus = 'REJECTED' WHERE id = ?",
      [
        row.id
      ]
    );

  } finally {
    if (conn) conn.end();
    parentPort.postMessage('in IIFE finally clause');
    process.exit(10);
  }
})();

// Fetch Connection
async function fetchConn() {
  let conn = await pool.getConnection();
  return conn;
}

// Get array of NEW audio files
async function get_NEW_results(conn) {
  return await conn.query("SELECT * FROM results WHERE restatus = 'NEW'");
}

async function process_row(row, conn) {

  // get the audio file's url
  // call deepgram to transcribe it
  // score it
  // send back res = {all the stuff needed to go into results row in DB + 'success'/'failure'}
  try {
    const client = new S3Client({});
    const oKey = `${row.agencyName}/${row.orgName}/${row.objectName}`
    const bucketParams = {
      Bucket: bName,
      Key: oKey,
    }
    const command = new GetObjectCommand(bucketParams);
    const audioFileUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    parentPort.postMessage(`back from getSignedUrl: audioFileUrl ${audioFileUrl}`);
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      {url: audioFileUrl},
      {
        model: "nova-2",
        smart_format: true,
      }
    );
    if (error) {
      return { error: error.message, status: 'failure' };
    }
    parentPort.postMessage(`calling finish_result(conn, result, ${row.orgName}, ${row.agencyName})`);
    const result2 = await finish_result(conn, result, row.orgName, row.agencyName);
    parentPort.postMessage(`returning result2: ${JSON.stringify(result2)}`);
    return result2;
  } catch (error) {
    // parentPort.postMessage('returning failure - error.message: ' + error.message);
    return {
      error: error.message,
      status: 'failure'
    };
  }
}

const finish_result = async (conn, result, orgName, agencyName) => {

  // To access the full transcription:
  //   result.results.channels[0].alternatives[0].transcript)
  // or
  //   result.results.channels[0].alternatives[0].words.punctuated_word.join(' '))
  //
  // But, for matching against words in model (i.e., for scoring) use result.results.channels[0].alternatives[0].words.word
  // since those words have no caps or puncs.

  // Prepare to score the call by pulling out the words array from response into responseWords.
  // During scoring, matches info will be added to responseWords and that will be
  // saved, stringified, into the result table in the DB along with scoring result.
  // This info will be used in Explore Scoring, especially to backlight found words.

  const responseWords = [...result.results.channels[0].alternatives[0].words];
  if (responseWords.length > 0) { // 99) {

    let row;

    // Before scoring, responseWords is an array of word objects:
    //    [{confidence, end, start, word, punctuated_word}].
    // Scoring will add a new object called match_info to each word, indicating if anything matched.

    // Fetch the appicable scoring model's parameters. It's the "current" model for org and agency pair.
    // The current model is the one where activeThru IS NULL.
    try {
      const sqlString = `
                      select m.* from models m
                        inner join modelsonagenciesonorgs moa on m.id = moa.modelId
                        inner join orgs o on o.id = moa.orgId
                        inner join agencies a on a.id = moa.agencyId
                      where o.name = ? and
                        a.name = ? and
                        moa.activeThru is null
                        ;
                    `;
      const values = [orgName, agencyName];
      const rows = await conn.query(sqlString, [...values]);

      // result-set:
      //  const rows = await connection.query('select * from animals');
      // rows : [
      //    { id: 1, name: 'sea lions' }, 
      //    { id: 2, name: 'bird' }, 
      // ]
      // const meta = rows.meta;
      //    meta: [ ... ]

      row = rows[0];
      // parentPort.postMessage(`modelId fetched row: ${JSON.stringify(row)}`)
    } catch (error) {
      // handle error, whatever the type
      parentPort.postMessage(`*** Received error from model query: ${error.message} ***`)
      row = undefined;
    }

    let params, id
    if (typeof row === "undefined") {
      // TODO tell someone somehow
      params = "{}" // force scoreThis to use default model settings
      id = "[default]"
    } else {
      params = row.params
      id = row.id
    }

    // params holds the model's specific settings, words and weightings--unless it's empty in which case we use default.
    const { norm, normCombined, scoredWords } = scoreThis(responseWords, params)  // *** SCORING IS CALLED HERE: ***

    // scoredWords is the post-scoring augmented array as expanded from responseWords.

    let wearereturning = {
      status: 'success',
      transcription: result.results.channels[0].alternatives[0].transcript,
      letterGrade: getLetterGrade(norm),
      otherScoreInfo: JSON.stringify({ norm, normCombined, scoredWords }),
      modelId: id,
      error: null
    }

    parentPort.postMessage(`we are returning: ${JSON.stringify(wearereturning)}`)
    return wearereturning;
  } else {

    return {
      status: 'failure',
      error: `Only ${responseWords.length} words returned from transcription. We'll not be scoring this call.`
    }
  }
}
