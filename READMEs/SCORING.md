## Call Scoring
### Background
Call scoring has been designed to be easy to configure while producing complex, meaningful results. It consists of 3 configurable scoring schemes that are combined in a weighted manner.

1. positive-words
2. negative-words
3. required-words-and-phases

Each org/agency uses a scoring model that is a mathematical combination of these three schemes, each of which has first been parametized internally. To illustrate we will show a full definition of a scoring setup. In order to store the definition in the database we define it in JSON.
~~~
{
  positiveWords: {
    weight: 40,
    words: [
      {
        weight: 30,
        word: "Thank you"
      },
    ]
  },
  negativeWords: {

  },
  requiredWordsAndPhrases: {

  }
}
~~~
