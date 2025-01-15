## The "csv" npm package
The csv project provides CSV generation, parsing, transformation and serialization for Node.js.

It has been tested and used by a large community over the years and should be considered reliable. It provides every option you would expect from an advanced CSV parser and stringifier.

The package exposes 4 subpackages:

1. csv-generate, a flexible generator of CSV string and Javascript objects. The csv-generate package provides a flexible generator of random CSV strings and Javascript objects implementing the Node.js stream.Readable API.

2. csv-parse, a parser converting CSV text into arrays or objects. The csv-parse package is a parser converting CSV text input into arrays or objects. It implements the Node.js stream.Transform API. It also provides a simple callback-based API for convenience. It is both extremely easy to use and powerful. It was first released in 2010 and is used against big data sets by a large community.

3. csv-stringify, a stringifier converting records (array objects) into a CSV text. The csv-stringify package is a stringifier converting records into a CSV text and implementing the Node.js stream.Transform API. It also provides the easier synchronous and callback-based APIs for conveniency. It is both extremely easy to use and powerful. It was first released in 2010 and is tested against big data sets by a large community.

4. stream-transform, a transformation framework. The stream-transform project is a simple object transformation framework. The Node.js stream.Transform API is implemented for scalability. The callback-based and sync APIs are also available for convenience. It is both easy to use and powerful.

### Usage of "cvs" in ICA

We won't use csv-generate or stream-transform, not directly.

We use stringify in the Download .csv files for editing tab in edit-models.jsx.

We use parse in the "models" case in /api/upload/route.js.

