# time-schedule

Time Schedule - A NodeJS module for scheduling working/non-working time intervals

## Install ##

```
$ npm install node-time-schedule
```

## Example ##
```javascript
const ts  = require('node-time-schedule');

// get schedule
let data = ts('17:30-19:00');  
// return {
//   check: function (){},
//   timetable: array [
//     ...
//     {
//       "work_range": [
//         [ 63000000, 68400000 ]
//       ],
//       "work_range_string": "17:30:00-19:00:00",
//       "not_work_range": [
//         [ 0, 63000000 ],
//         [ 68400000, 86400000 ]
//       ],
//       "not_work_range_string": "00:00:00-17:30:00, 19:00:00-00:00:00"
//     },
//     ...
//   ]
// }

// get now(15:00) work
data.check();
// return {
//   timeout: 9000000,
//   until_time: "17:30:00"
// }
```
