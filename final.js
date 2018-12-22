const TOPHAT_RESULT = 'tophat.final.out'
const UBLEARNS_RESULT = 'ublearns.final.out'
const ABSENCE_THRESHOLD = 3
const TOTAL_LECTURES = 25
const cutoff = { // below
  'F' : 50,
  'D' : 58,
  'D+': 62,
  'C-': 66,
  'C' : 72,
  'C+': 76,
  'B-': 80,
  'B' : 84,
  'B+': 88,
  'A-': 92,
  'A' : 101,
}

function getOutput(type) {
  let output = {}
  let file = ''
  if (type == 'tophat') {
    file = TOPHAT_RESULT
  } else if (type == 'ublearns') {
    file = UBLEARNS_RESULT
  } else {
    return output
  }

  const fs = require('fs')
  let input = fs.readFileSync(process.cwd() + '/' + file, { encoding: 'utf8' })
  input = input.split('\n')

  for (let rowIndex in input) {
    if (input[rowIndex] == '') continue
    let row = input[rowIndex].split(',')
    let row1 = row[1]
    if (type == 'tophat') {
      let entries = row.splice(4, 3).concat(row[0])
      if (output[row1] === undefined) {
        output[row1] = entries
      } else {
        console.error('Duplicate entry from TopHat for ' + row1)
        let existingRow = output[row1]
        let newRow = entries
        // Combine duplicate entries. The last undefined indicates that it is a
        // duplicate.
        // This will return all possible maxes for duplicate sections, and
        // undefined for the tophat section entry:
        // [tophat absences, tophat grade, tophat max dictionary, tophat section]
        // Later, a correct max should be chosen based on the real section
        // reported from UBlearns.
        //
        // This assumes that only there are maximum two sections where a student
        // can appear.
        let newAbsences = parseFloat(existingRow[0]) + parseFloat(newRow[0]) - TOTAL_LECTURES 
        let newGrade = parseFloat(existingRow[1]) + parseFloat(newRow[1])
        let newMax = {}
        newMax[existingRow[3]] = existingRow[2]
        newMax[newRow[3]] = newRow[2]
        let newSection = undefined
        output[row1] = [newAbsences.toString(), newGrade.toString(), newMax, newSection]
      }
    } else if (type == 'ublearns') {
      if (output[row1] === undefined) {
        output[row1] = (row.splice(0, 1) + ',' + row.splice(1, 5)).split(',')
      } else {
        console.error('Duplicate entry from UBlearns for ' + row1)
      }
    } else {
      console.error('Wrong gradebook type')
      return output
    }
  }

  return output
}

function getInitialGrade(grade) {
  if (grade < cutoff['F']) {
    return 'F'
  } else if (grade < cutoff['D']) {
    return 'D'
  } else if (grade < cutoff['D+']) {
    return 'D+'
  } else if (grade < cutoff['C-']) {
    return 'C-'
  } else if (grade < cutoff['C']) {
    return 'C'
  } else if (grade < cutoff['C+']) {
    return 'C+'
  } else if (grade < cutoff['B-']) {
    return 'B-'
  } else if (grade < cutoff['B']) {
    return 'B'
  } else if (grade < cutoff['B+']) {
    return 'B+'
  } else if (grade < cutoff['A-']) {
    return 'A-'
  } else if (grade < cutoff['A']) {
    return 'A'
  } else {
    return undefined
  }
}

function getLetter(grade, absences) {
  let initialGrade = getInitialGrade(grade)

  let iteration = Math.floor(absences / ABSENCE_THRESHOLD)

  let realGrade = initialGrade
  for (let i = 0; i < iteration; ++i) {
    realGrade = downGrade(realGrade)
  }

  return [initialGrade, realGrade]
}

function downGrade(letter) {
  if (letter == 'A') {
    return 'A-'
  } else if (letter == 'A-') {
    return 'B+'
  } else if (letter == 'B+') {
    return 'B'
  } else if (letter == 'B') {
    return 'B-'
  } else if (letter == 'B-') {
    return 'C+'
  } else if (letter == 'C+') {
    return 'C'
  } else if (letter == 'C') {
    return 'C-'
  } else if (letter == 'C-') {
    return 'D+'
  } else if (letter == 'D+') {
    return 'D'
  } else if (letter == 'D') {
    return 'F'
  } else if (letter == 'F') {
    return 'F'
  } else {
    return undefined
  }
}

async function main() {
  /*
   * {
   *   email: [
   *     0 section,
   *     1 id,
   *     2 first name,
   *     3 last name,
   *     4 ublearns grade,
   *     5 ublearns max,
   *     6 tophat absences,
   *     7 tophat grade,
   *     8 tophat max,
   *     9 grade,
   *     10 initial letter grade,
   *     11 real letter grade,
   *   ]
   * }
   */
  let gradebook = {}
  let tophat = await getOutput('tophat')
  let ublearns = await getOutput('ublearns')

  for (let email in ublearns) {
    // Need to clean up the tophat output due to potential duplicates.
    // getOutput for tophat returns the following.
    // [tophat absences, tophat grade, tophat max, tophat section]
    // If tophat section is undefined, it is a duplicate.
    // In a duplicate, tophat max is a dictionary containing all possible maxes
    // based on the (duplicate) sections.
    // First, get tophat section to identify duplicates.
    // Second, remove tophat section from the array, since it's not necessary
    // at this point.
    // Third, if it is a duplicate, choose the correct tophat max based on the
    // real section reported by UBlearns.

    tophatSection = tophat[email][3]
    tophat[email] = tophat[email].splice(0, 3)
    if (tophatSection == undefined) {
      // this is a duplicate
      // [tophat absences, tophat grade, tophat max dict]
      let realSection = ublearns[email][0]
      tophat[email][2] = tophat[email][2][realSection]
    }
    gradebook[email] = ublearns[email].concat(tophat[email])
  }

  for (let email in gradebook) {
    let row = gradebook[email]
    let grade = parseFloat(row[4]) + parseFloat(row[7])
    let max = parseFloat(row[5]) + parseFloat(row[8])
    grade = grade / max * 100.0
    row.push(grade)
    row = row.concat(getLetter(grade, row[6]))
    gradebook[email] = row
  }

  for (let email in gradebook) {
    let row = gradebook[email]
    //console.log('section: ' + row[0] + ', id: ' + row[1] + ', name: ' + row[2] + ' ' + row[3] + ', absences: ' + row[6] + ', grade: ' + row[9] + ', letter: ' + row[11])
    //if (row[11] == 'F' || row[11] == 'D' || row[11] == 'D+' || row[11] == undefined) {
    //  console.log(row[1] + ',' + 'MU')
    //} else {
    //  console.log(row[1] + ',' + 'MS')
    //}
    //if (row[11] == 'F' || row[11] == undefined) {
    //  console.log(row[1] + ',' + 'MU')
    //}
    console.log(row[0] + ',' + row[1] + ',' + row[11])
  }
}

main()
